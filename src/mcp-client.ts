import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { randomUUID } from 'node:crypto'

/**
 * Create MCP proxy that connects to DAP Proxy extension via HTTP
 * and exposes tools/resources via stdio
 */
export async function createMcpClient(serverUrl: string): Promise<McpServer> {
    console.log(`🔗 DAP Proxy에 연결 중: ${serverUrl}`)

    // DAP Proxy 확장에 HTTP 클라이언트로 연결
    const client = new Client({
        name: 'dap-proxy-client',
        version: '1.0.0'
    }, {
        capabilities: {
            tools: {}
        }
    })

    const transport = new StreamableHTTPClientTransport(new URL(serverUrl))
    await client.connect(transport)
    console.log('✅ DAP Proxy 서버에 연결됨')

    // Cursor 등에 제공할 MCP 서버 (프록시)
    const proxy = new McpServer({
        name: 'dap-proxy-client',
        version: '1.0.0'
    })

    // 확장의 도구들을 프록시로 전달
    console.log('🔧 도구 목록 가져오는 중...')
    const { tools } = await client.listTools()
    console.log(`📋 ${tools.length}개 도구 발견`)

    for (const tool of tools) {
        console.log(`  - ${tool.name}: ${tool.description}`)
        proxy.registerTool(
            tool.name,
            {
                title: tool.title,
                description: tool.description,
                inputSchema: tool.inputSchema as any
            },
            async (args: any) => {
                const result = await client.callTool({
                    name: tool.name,
                    arguments: args
                })

                return result as any
            }
        )
    }

    // 확장의 리소스들을 프록시로 전달
    console.log('📦 리소스 목록 가져오는 중...')
    const { resources } = await client.listResources()
    console.log(`📋 ${resources.length}개 리소스 발견`)

    for (const resource of resources) {
        console.log(`  - ${resource.name}: ${resource.description}`)
        proxy.registerResource(
            resource.name,
            resource.uri,
            {
                title: resource.name,
                description: resource.description || `${resource.name} resource`,
                mimeType: resource.mimeType || 'application/json'
            },
            async (uri) => {
                console.log(`📖 리소스 읽기: ${resource.name}`)
                return await client.readResource({ uri: uri.href })
            }
        )
    }

    console.log('🎯 MCP 프록시 준비 완료')
    return proxy
}
