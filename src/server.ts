import * as vscode from 'vscode'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { z } from 'zod'
import express from 'express'
import { randomUUID } from 'node:crypto'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { state } from './state'
import { findAvailablePort } from './utils/port'
import { addBreakpointToUri } from './commands'

const MCP_SERVER_PORT = 8890

/**
 * Initialize MCP server with resources and tools
 */
export function initializeMcpServer(): McpServer {
    const mcpServer = new McpServer({ name: 'dap-proxy', version: '1.0.0' })

    // Register DAP Log Resource
    mcpServer.registerResource(
        'dap-log',
        'dap-log://current',
        {
            title: 'DAP Log',
            description: 'Logs of Debug Adapter Protocol messages.',
            mimeType: 'application/json'
        },
        async (uri) => {
            return { contents: [{ uri: uri.href, text: JSON.stringify(state.dapMessages, null, 2) }] }
        }
    )

    // Register Add Breakpoint Tool
    mcpServer.registerTool(
        'add-breakpoint',
        {
            title: 'Add Breakpoint',
            description: 'Adds a breakpoint to a specified file and line number using relative path from workspace root.',
            inputSchema: {
                filePath: z.string()
                    .describe('Relative path to the file from workspace root (e.g., "src/main.js")'),
                lineNumber: z.number()
                    .int()
                    .min(1)
                    .describe('Line number to set the breakpoint on (1-based)')
            }
        },
        async ({ filePath, lineNumber }: { filePath: string, lineNumber: number }) => {
            try {
                await addBreakpointToUri(filePath, lineNumber)
                const successMessage = `Breakpoint added to ${filePath}:${lineNumber}`
                return { content: [{ type: 'text', text: successMessage }] }
            } catch (error: any) {
                const errorMessage = `Error adding breakpoint: ${error.message}`
                console.error(`❌ [MCP TOOL] ${errorMessage}`, error)
                return { content: [{ type: 'text', text: errorMessage }], isError: true }
            }
        }
    )

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
        const sessionId = req.headers['mcp-session-id'] as string | undefined
        let transport: StreamableHTTPServerTransport

        if (sessionId && state.getTransport(sessionId)) {
            transport = state.getTransport(sessionId)!
        } else if (!sessionId && isInitializeRequest(req.body)) {
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (id) => {
                    state.addTransport(id, transport)
                },
                // For local development, disable DNS rebinding protection
                enableDnsRebindingProtection: false,
            })
            transport.onclose = () => {
                if (transport.sessionId) {
                    state.removeTransport(transport.sessionId)
                }
            }
            await mcpServer.connect(transport)
        } else {
            res.status(400).json({ 
                jsonrpc: '2.0', 
                error: { code: -32000, message: 'Bad Request: No valid session ID provided' }, 
                id: null 
            })
            return
        }
        await transport.handleRequest(req, res, req.body)
    })

    // Reusable handler for GET and DELETE requests
    const handleSessionRequest = async (req: express.Request, res: express.Response) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined
        if (!sessionId || !state.getTransport(sessionId)) {
            res.status(400).send('Invalid or missing session ID')
            return
        }
        const transport = state.getTransport(sessionId)!
        await transport.handleRequest(req, res)
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
            
            console.log(`🚀 MCP Streamable HTTP Server is running!`)
            console.log(`📍 Server URL: http://localhost:${availablePort}`)
            console.log(`🔗 MCP Endpoint: http://localhost:${availablePort}/mcp`)
            console.log(`📊 Port: ${availablePort}`)
            console.log(`🌐 Domain: localhost`)
            if (availablePort !== MCP_SERVER_PORT) {
                console.log(`⚠️  Original port ${MCP_SERVER_PORT} was busy, using port ${availablePort} instead`)
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
                console.log('HTTP Server closed.')
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
