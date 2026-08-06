import * as assert from 'assert'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { state } from '../state'

suite('MCP HTTP sessions', () => {
    test('supports concurrent MCP clients', async () => {
        const deadline = Date.now() + 10_000
        while (!state.currentPort && Date.now() < deadline) {
            await new Promise(resolve => setTimeout(resolve, 50))
        }

        assert.ok(state.currentPort, 'MCP HTTP server did not start')

        const createClient = () => {
            const client = new Client({
                name: 'mcp-session-test',
                version: '1.0.0'
            })
            const transport = new StreamableHTTPClientTransport(
                new URL(`http://localhost:${state.currentPort}/mcp`)
            )
            return { client, transport }
        }

        const first = createClient()
        const second = createClient()

        try {
            await Promise.all([
                first.client.connect(first.transport),
                second.client.connect(second.transport)
            ])

            const [firstTools, secondTools] = await Promise.all([
                first.client.listTools(),
                second.client.listTools()
            ])

            assert.ok(firstTools.tools.length > 0)
            assert.strictEqual(secondTools.tools.length, firstTools.tools.length)
            assert.strictEqual(state.getTransportCount(), 2)
        } finally {
            await Promise.allSettled([
                first.client.close(),
                second.client.close()
            ])
        }
    })
})
