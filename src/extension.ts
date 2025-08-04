import * as vscode from 'vscode'
import { state } from './state'
import { initializeMcpServer, createHttpApp, startHttpServer, stopHttpServer } from './server'
import { registerDapTracker } from './dap-tracker'
import { registerCommands } from './commands'
import { updateAllPanels } from './monitor-panel'

export async function activate(context: vscode.ExtensionContext) {
    try {
        // Initialize MCP Server
        const mcpServer = initializeMcpServer()
        state.mcpServer = mcpServer

        // Create HTTP app
        const app = createHttpApp(mcpServer)

        // Start HTTP server with callback to update panels
        await startHttpServer(app, () => {
            // Update all active panels when server starts
            updateAllPanels()
        })

        // Register extension commands
        registerCommands(context)

        // Register DAP tracker
        const dapTrackerDisposable = registerDapTracker(context)
        context.subscriptions.push(dapTrackerDisposable)

        console.log('DAP Proxy extension is now active and will log all DAP messages.')
    } catch (error) {
        console.error('Failed to activate DAP Proxy extension:', error)
        vscode.window.showErrorMessage(`Failed to activate DAP Proxy: ${error}`)
    }
}

export async function deactivate() {
    try {
        // Close MCP server
        if (state.mcpServer) {
            state.mcpServer.close()
            console.log('MCP Server deactivated.')
        }

        // Stop HTTP server
        await stopHttpServer()

        // Reset state
        state.reset()

        console.log('DAP Proxy extension is now deactivated.')
    } catch (error) {
        console.error('Error during deactivation:', error)
    }
}
