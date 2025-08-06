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
        mcpServer.registerTool(tool.name, tool.config, tool.handler)
    }

    // 모든 리소스 등록
    for (const resource of allResources) {
        mcpServer.registerResource(
            resource.name, 
            resource.uri, 
            resource.config, 
            resource.handler
        )
    }

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
        console.info(`📨 MCP POST 요청 수신: ${req.headers['mcp-session-id'] || '새 세션'}`)
        console.info(`📋 요청 헤더:`, req.headers)
        console.info(`📄 요청 본문:`, JSON.stringify(req.body, null, 2))
        
        const sessionId = req.headers['mcp-session-id'] as string | undefined
        let transport: StreamableHTTPServerTransport

        if (sessionId && state.getTransport(sessionId)) {
            console.info(`🔄 기존 세션 재사용: ${sessionId}`)
            transport = state.getTransport(sessionId)!
        } else if (!sessionId && isInitializeRequest(req.body)) {
            console.info('🆕 새 MCP 세션 초기화...')
            console.info(`🔧 초기화 요청 내용:`, JSON.stringify(req.body, null, 2))
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (id) => {
                    state.addTransport(id, transport)
                    console.info(`✅ 세션 초기화 완료: ${id}`)
                },
                // For local development, disable DNS rebinding protection
                enableDnsRebindingProtection: false,
            })
            transport.onclose = () => {
                if (transport.sessionId) {
                    state.removeTransport(transport.sessionId)
                    console.info(`🔚 세션 종료: ${transport.sessionId}`)
                }
            }
            transport.onerror = (error) => {
                console.error(`❌ Transport 오류: ${error}`)
                if (transport.sessionId) {
                    state.removeTransport(transport.sessionId)
                }
            }
            await mcpServer.connect(transport)
            console.info('🔗 MCP 서버에 Transport 연결 완료')
        } else {
            console.info('❌ 잘못된 요청: 유효하지 않은 세션 ID')
            console.info(`🔍 요청 분석:`, {
                hasSessionId: !!sessionId,
                isInitializeRequest: isInitializeRequest(req.body),
                bodyType: typeof req.body,
                bodyKeys: req.body ? Object.keys(req.body) : []
            })
            res.status(400).json({ 
                jsonrpc: '2.0', 
                error: { code: -32000, message: 'Bad Request: No valid session ID provided' }, 
                id: null 
            })
            return
        }
        try {
            console.info(`🔄 Transport 요청 처리 중...`)
            console.info(`📤 응답 전송 전 상태:`, {
                sessionId,
                hasTransport: !!transport,
                transportType: transport.constructor.name
            })
            await transport.handleRequest(req, res, req.body)
            console.info(`✅ Transport 요청 처리 완료`)
        } catch (error) {
            console.error(`❌ Transport 요청 오류: ${error}`)
            console.error(`🔍 오류 상세:`, error)
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
        console.info(`📨 MCP ${req.method} 요청 수신: ${sessionId || '세션 ID 없음'}`)
        console.info(`📋 ${req.method} 요청 헤더:`, req.headers)
        
        if (!sessionId || !state.getTransport(sessionId)) {
            console.info('❌ 잘못된 세션 ID 또는 누락된 세션 ID')
            console.info(`🔍 세션 분석:`, {
                sessionId,
                hasTransport: sessionId ? !!state.getTransport(sessionId) : false,
                availableSessions: Object.keys(state.transports)
            })
            res.status(400).send('Invalid or missing session ID')
            return
        }
        const transport = state.getTransport(sessionId)!
        try {
            console.info(`🔄 세션 요청 처리 중: ${sessionId}`)
            console.info(`📤 ${req.method} 응답 전송 전 상태:`, {
                sessionId,
                hasTransport: !!transport,
                transportType: transport.constructor.name
            })
            await transport.handleRequest(req, res)
            console.info(`✅ 세션 요청 처리 완료: ${sessionId}`)
        } catch (error) {
            console.error(`❌ 세션 요청 오류: ${error}`)
            console.error(`🔍 세션 오류 상세:`, error)
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
            
            console.info(`🚀 MCP Streamable HTTP Server is running!`)
            console.info(`📍 Server URL: http://localhost:${availablePort}`)
            console.info(`🔗 MCP Endpoint: http://localhost:${availablePort}/mcp`)
            console.info(`📊 Port: ${availablePort}`)
            console.info(`🌐 Domain: localhost`)
            if (availablePort !== MCP_SERVER_PORT) {
                console.info(`⚠️  Original port ${MCP_SERVER_PORT} was busy, using port ${availablePort} instead`)
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
                console.info('🔚 HTTP Server closed.')
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
