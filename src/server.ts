import * as vscode from 'vscode'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import express from 'express'
import { randomUUID } from 'node:crypto'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { state } from './state'
import { findAvailablePort } from './utils/port'
import { allTools } from './tools'
import { allResources } from './resources'

const MCP_SERVER_PORT = 8890

/**
 * Initialize MCP server with resources and tools
 */
export function initializeMcpServer(): McpServer {
    const mcpServer = new McpServer({ name: 'dap-proxy', version: '1.0.0' })

    // 모든 도구 등록
    for (const tool of allTools) {
        console.info(`📝 등록 중인 도구: ${tool.name}`)
        mcpServer.registerTool(tool.name, tool.config, tool.handler)
    }

    // 모든 리소스 등록
    for (const resource of allResources) {
        console.info(`📚 등록 중인 리소스: ${resource.name}`)
        mcpServer.registerResource(
            resource.name,
            resource.uri,
            resource.config,
            resource.handler
        )
    }

    console.info(`✅ MCP 서버 초기화 완료: ${allTools.length}개 도구, ${allResources.length}개 리소스`)
    return mcpServer
}


/**
 * Create and configure Express HTTP server for MCP
 */
export function createHttpApp(mcpServer: McpServer): express.Application {
    const app = express()
    app.use(express.json())

    // Handle POST requests for client-to-server communication
    app.post('/mcp', async (req, res) => {
        // tools/call 요청을 직접 처리 (Transport 우회)
        if (req.body?.method === 'tools/call') {
            const { name: toolName, arguments: toolArgs } = req.body.params || {}
            
            console.info(`🛠️ [직접 처리] 도구 호출: ${toolName}`)
            
            // 도구 찾기
            const tool = allTools.find(t => t.name === toolName)
            
            if (!tool) {
                res.status(404).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32601,
                        message: `Tool not found: ${toolName}`
                    },
                    id: req.body.id
                })
                return
            }
            
            try {
                // 도구 핸들러 직접 실행
                const startTime = Date.now()
                const result = await tool.handler(toolArgs)
                const elapsed = Date.now() - startTime
                
                // JSON-RPC 응답 직접 전송
                res.json({
                    jsonrpc: '2.0',
                    result: result,
                    id: req.body.id
                })
                
                console.info(`✅ [직접 처리] 도구 실행 완료: ${toolName} (${elapsed}ms)`)
                return  // Transport 사용하지 않음
                
            } catch (error: any) {
                console.error(`❌ [직접 처리] 도구 실행 실패: ${toolName} - ${error.message}`)
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: error.message
                    },
                    id: req.body.id
                })
                return
            }
        }

        const sessionId = req.headers['mcp-session-id'] as string | undefined
        let transport: StreamableHTTPServerTransport

        // Stateless 구조: 매 initialize마다 새 세션 생성
        if (isInitializeRequest(req.body)) {
            // 기존 세션이 있으면 정리
            if (sessionId && state.getTransport(sessionId)) {
                console.info(`🔄 [정리] 기존 세션 ${sessionId} 정리`)
                state.removeTransport(sessionId)
            }
            
            // 새 Transport 생성
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (id) => {
                    state.addTransport(id, transport)
                    console.info(`✅ [초기화] 새 세션 생성: ${id}`)
                },
                // For local development, disable DNS rebinding protection
                enableDnsRebindingProtection: false,
            })
            transport.onclose = () => {
                if (transport.sessionId) {
                    state.removeTransport(transport.sessionId)
                    console.info(`🔚 [종료] 세션 종료: ${transport.sessionId}`)
                }
            }
            transport.onerror = (error) => {
                console.error(`❌ Transport 오류: ${error}`)
                if (transport.sessionId) {
                    state.removeTransport(transport.sessionId)
                }
            }
            await mcpServer.connect(transport)
        } else if (sessionId && state.getTransport(sessionId)) {
            // 기존 세션 사용 (재연결 시도하지 않음)
            transport = state.getTransport(sessionId)!
            console.info(`📡 [재사용] 기존 세션 사용: ${sessionId}`)
        } else {
            // 세션 ID가 없거나 유효하지 않은 경우
            res.status(400).json({
                jsonrpc: '2.0',
                error: { code: -32000, message: 'Bad Request: Invalid or missing session' },
                id: null
            })
            return
        }
        try {
            // Transport를 통해 처리 (initialize, notifications 등)
            await transport.handleRequest(req, res, req.body)
        } catch (error) {
            console.error(`❌ [오류] Transport 처리 실패: ${error}`)
            // 세션 에러 발생 시 세션 정리
            if (sessionId) {
                state.removeTransport(sessionId)
            }
            res.status(500).json({
                jsonrpc: '2.0',
                error: { code: -32603, message: 'Internal error' },
                id: null
            })
        }
    })

    // Reusable handler for GET and DELETE requests
    const handleSessionRequest = async (req: express.Request, res: express.Response) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined

        if (!sessionId || !state.getTransport(sessionId)) {
            res.status(400).send('Invalid or missing session ID')
            return
        }
        const transport = state.getTransport(sessionId)!
        try {
            await transport.handleRequest(req, res)
        } catch (error) {
            console.error(`❌ [오류] 세션 처리 실패 (${sessionId}): ${error}`)
            // 세션 에러 발생 시 세션 정리
            state.removeTransport(sessionId)
            res.status(500).send('Internal server error')
        }
    }

    // Handle GET requests for server-to-client notifications via SSE
    app.get('/mcp', handleSessionRequest)

    // Handle DELETE requests for session termination
    app.delete('/mcp', handleSessionRequest)

    return app
}

/**
 * Start HTTP server
 */
export async function startHttpServer(app: express.Application, onServerStarted?: () => void): Promise<void> {
    try {
        const availablePort = await findAvailablePort(MCP_SERVER_PORT)

        const httpServer = app.listen(availablePort, () => {
            // Store server information
            state.currentPort = availablePort
            state.serverStartTime = new Date()
            state.httpServer = httpServer

            console.error(`🚀 MCP Streamable HTTP Server is running!`)
            console.error(`📍 Server URL: http://localhost:${availablePort}`)
            console.error(`🔗 MCP Endpoint: http://localhost:${availablePort}/mcp`)
            console.error(`📊 Port: ${availablePort}`)
            console.error(`🌐 Domain: localhost`)
            if (availablePort !== MCP_SERVER_PORT) {
                console.error(`⚠️  Original port ${MCP_SERVER_PORT} was busy, using port ${availablePort} instead`)
            }

            // Call the callback if provided
            if (onServerStarted) {
                onServerStarted()
            }
        })
    } catch (error) {
        console.error('Failed to start HTTP server:', error)
        throw error
    }
}

/**
 * Stop HTTP server
 */
export function stopHttpServer(): Promise<void> {
    return new Promise((resolve) => {
        if (state.httpServer) {
            state.httpServer.close(() => {
                console.error('🔚 HTTP Server closed.')
                state.httpServer = undefined
                state.currentPort = undefined
                state.serverStartTime = undefined
                resolve()
            })
        } else {
            resolve()
        }
    })
}
