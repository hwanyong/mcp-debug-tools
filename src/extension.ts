import * as vscode from 'vscode'
import { state } from './state'
import { initializeMcpServer, createHttpApp, startHttpServer, stopHttpServer } from './server'
import { registerDapTracker } from './dap-tracker'
import { registerCommands, setStatusBarUpdater } from './commands'
import { updateAllPanels } from './monitor-panel'
import { ConfigManager } from './config-manager'
import { registryManager } from './registry-manager'

let statusBarItem: vscode.StatusBarItem
let configManager: ConfigManager | undefined

export async function activate(context: vscode.ExtensionContext) {
    try {
        // Create status bar item
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
        statusBarItem.command = 'dap-proxy.openMonitorPanel'
        statusBarItem.show()
        context.subscriptions.push(statusBarItem)
        
        // Update status bar to show initializing
        updateStatusBar('initializing')

        // Initialize MCP Server
        const mcpServer = initializeMcpServer()
        state.mcpServer = mcpServer

        // Create HTTP app
        const app = createHttpApp(mcpServer)

        // Start HTTP server with callback to update panels
        await startHttpServer(app, async () => {
            // 서버가 시작되면 설정 파일 생성
            try {
                // Workspace 폴더 가져오기
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
                if (workspaceFolder) {
                    // ConfigManager 초기화
                    configManager = new ConfigManager(workspaceFolder)
                    await configManager.initialize(state.currentPort || 3000)
                    
                    // 글로벌 레지스트리에 등록
                    await registryManager.initialize()
                    const config = await configManager.loadConfig()
                    if (config) {
                        const configPath = `${workspaceFolder.uri.fsPath}/.mcp-debug-tools/config.json`
                        await registryManager.registerInstance(config, configPath)
                    }
                    
                    console.log('Workspace config and registry initialized')
                }
            } catch (error) {
                console.error('Failed to initialize workspace config:', error)
            }
            
            // Update all active panels when server starts
            updateAllPanels()
            // Update status bar to show running
            updateStatusBar('running')
        })

        // Set status bar updater for commands
        setStatusBarUpdater(updateStatusBar)

        // Register extension commands
        registerCommands(context)

        // Register DAP tracker
        const dapTrackerDisposable = registerDapTracker(context)
        context.subscriptions.push(dapTrackerDisposable)

        console.log('DAP Proxy extension is now active and will log all DAP messages.')
    } catch (error) {
        console.error('Failed to activate DAP Proxy extension:', error)
        vscode.window.showErrorMessage(`Failed to activate DAP Proxy: ${error}`)
        updateStatusBar('error')
    }
}

export async function deactivate() {
    try {
        // Update status bar
        updateStatusBar('stopping')
        
        // 설정 파일 및 레지스트리 정리
        if (configManager) {
            const config = await configManager.loadConfig()
            if (config) {
                await registryManager.cleanup(config.vscodeInstanceId)
            }
            await configManager.cleanup()
            configManager = undefined
        }
        
        // Close MCP server
        if (state.mcpServer) {
            state.mcpServer.close()
            console.log('MCP Server deactivated.')
        }

        // Stop HTTP server
        await stopHttpServer()

        // Reset state
        state.reset()
        
        // Dispose status bar item
        if (statusBarItem) {
            statusBarItem.dispose()
        }

        console.log('DAP Proxy extension is now deactivated.')
    } catch (error) {
        console.error('Error during deactivation:', error)
    }
}

/**
 * Update status bar item based on server state
 */
function updateStatusBar(status: 'initializing' | 'running' | 'stopping' | 'error' | 'stopped') {
    if (!statusBarItem) return
    
    switch (status) {
        case 'initializing':
            statusBarItem.text = '$(sync~spin) MCP Server starting...'
            statusBarItem.tooltip = 'MCP Debug Server is starting'
            statusBarItem.backgroundColor = undefined
            break
        case 'running':
            const port = state.currentPort || '????'
            statusBarItem.text = `$(circle-filled) DAP-MCP:${port}`
            statusBarItem.tooltip = 'MCP Debug Server is running - Click to open monitor panel'
            statusBarItem.backgroundColor = undefined
            statusBarItem.color = new vscode.ThemeColor('terminal.ansiGreen')
            break
        case 'stopping':
            statusBarItem.text = '$(circle-slash) MCP Server stopping...'
            statusBarItem.tooltip = 'MCP Debug Server is stopping'
            statusBarItem.backgroundColor = undefined
            statusBarItem.color = new vscode.ThemeColor('terminal.ansiYellow')
            break
        case 'stopped':
            statusBarItem.text = '$(circle-slash) DAP-MCP:stopped'
            statusBarItem.tooltip = 'MCP Debug Server is stopped - Click to open monitor panel'
            statusBarItem.backgroundColor = undefined
            statusBarItem.color = new vscode.ThemeColor('terminal.ansiGray')
            break
        case 'error':
            statusBarItem.text = '$(error) MCP Server error'
            statusBarItem.tooltip = 'MCP Debug Server failed to start - Click to retry'
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground')
            statusBarItem.color = undefined
            break
    }
}
