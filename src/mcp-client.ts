import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { inputSchemas } from './tools-parameters'
/**
 * Create MCP proxy that connects to DAP Proxy extension via HTTP
 * and exposes tools/resources via stdio
 */
export async function createMcpClient(serverUrl: string): Promise<McpServer> {
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

    // Cursor 등에 제공할 MCP 서버 (프록시)
    const proxy = new McpServer({
        name: 'dap-proxy-client',
        version: '1.0.0'
    })

    // 확장의 도구들을 프록시로 전달
    const { tools } = await client.listTools()

    for (const tool of tools) {
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
                const result = await client.callTool({
                    name: tool.name,
                    arguments: args
                })

                return result as any
            }
        )
    }

    // 확장의 리소스들을 프록시로 전달
    const { resources } = await client.listResources()

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
                return await client.readResource({ uri: uri.href })
            }
        )
    }

    return proxy
}
