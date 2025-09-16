import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { inputSchemas } from './tools-parameters'

// 로그 함수 - stdio 통신에 영향을 주지 않도록 별도 처리
function logInfo(message: string) {
    // stderr로 출력하되, stdio 통신과 분리
    process.stderr.write(`[CLI] ${message}\n`)
}

/**
 * Create MCP proxy that connects to DAP Proxy extension via HTTP
 * and exposes tools/resources via stdio
 */
export async function createMcpClient(serverUrl: string): Promise<McpServer> {
    logInfo(`🔗 HTTP 클라이언트 생성: ${serverUrl}`)
    
    // DAP Proxy 확장에 HTTP 클라이언트로 연결
    const client = new Client({
        name: 'dap-proxy-client',
        version: '1.0.0'
    }, {
        capabilities: {
            tools: {}
        }
    })

    logInfo('📡 HTTP Transport 연결 시도...')
    const transport = new StreamableHTTPClientTransport(new URL(serverUrl))
    await client.connect(transport)
    logInfo('✅ HTTP Transport 연결 성공')

    // Cursor 등에 제공할 MCP 서버 (프록시)
    const proxy = new McpServer({
        name: 'dap-proxy-client',
        version: '1.0.0'
    })

    // 확장의 도구들을 프록시로 전달
    logInfo('🔧 도구 목록 가져오는 중...')
    const { tools } = await client.listTools()
    logInfo(`📋 발견된 도구: ${tools.length}개`)

    for (const tool of tools) {
        logInfo(`  - 도구 등록: ${tool.name}`)
        proxy.registerTool(
            tool.name,
            {
                title: tool.title,
                description: tool.description,
                inputSchema: inputSchemas[tool.name as keyof typeof inputSchemas],
                outputSchema: tool.outputSchema as any,
                annotations: tool.annotations as any
            },
            async (args: any) => {
                logInfo(`🛠️ 도구 호출: ${tool.name} - ${JSON.stringify(args)}`)
                const startTime = Date.now()
                
                try {
                    // 타임아웃 Promise 설정 (30초)
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => {
                            reject(new Error(`Tool ${tool.name} timed out after 30 seconds`))
                        }, 30000)
                    })
                    
                    // 실제 도구 호출
                    const toolPromise = client.callTool({
                        name: tool.name,
                        arguments: args
                    })
                    
                    // 타임아웃과 도구 호출 중 먼저 완료되는 것 반환
                    const result = await Promise.race([toolPromise, timeoutPromise])
                    
                    const duration = Date.now() - startTime
                    logInfo(`✅ 도구 호출 완료: ${tool.name} (${duration}ms)`)
                    return result as any
                } catch (error: any) {
                    const duration = Date.now() - startTime
                    logInfo(`❌ 도구 호출 실패: ${tool.name} - ${error.message} (${duration}ms)`)
                    throw error
                }
            }
        )
    }

    // 확장의 리소스들을 프록시로 전달
    logInfo('📚 리소스 목록 가져오는 중...')
    const { resources } = await client.listResources()
    logInfo(`📋 발견된 리소스: ${resources.length}개`)

    for (const resource of resources) {
        logInfo(`  - 리소스 등록: ${resource.name}: ${resource.description}`)
        proxy.registerResource(
            resource.name,
            resource.uri,
            {
                title: resource.name,
                description: resource.description || `${resource.name} resource`,
                mimeType: resource.mimeType || 'application/json'
            },
            async (uri) => {
                logInfo(`📖 리소스 읽기: ${resource.name}`)
                const result = await client.readResource({ uri: uri.href })
                logInfo(`✅ 리소스 읽기 완료: ${resource.name}`)
                return result
            }
        )
    }

    logInfo('🎯 MCP 프록시 서버 준비 완료')
    return proxy
}
