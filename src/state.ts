import * as vscode from 'vscode'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

/**
 * Global state for the extension
 */
class ExtensionState {
    private _mcpServer: McpServer | undefined
    private _httpServer: any
    private _dapMessages: string[] = []
    private _transports: { [sessionId: string]: StreamableHTTPServerTransport } = {}
    private _currentPort: number | undefined
    private _serverStartTime: Date | undefined
    private _activePanels: vscode.WebviewPanel[] = []

    // MCP Server
    get mcpServer(): McpServer | undefined {
        return this._mcpServer
    }

    set mcpServer(server: McpServer | undefined) {
        this._mcpServer = server
    }

    // HTTP Server
    get httpServer(): any {
        return this._httpServer
    }

    set httpServer(server: any) {
        this._httpServer = server
    }

    // DAP Messages
    get dapMessages(): string[] {
        return this._dapMessages
    }

    addDapMessage(message: string) {
        this._dapMessages.push(message)
    }

    clearDapMessages() {
        this._dapMessages = []
    }

    // Transports
    get transports(): { [sessionId: string]: StreamableHTTPServerTransport } {
        return this._transports
    }

    addTransport(sessionId: string, transport: StreamableHTTPServerTransport) {
        this._transports[sessionId] = transport
    }

    removeTransport(sessionId: string) {
        if (this._transports[sessionId]) {
            delete this._transports[sessionId]
            console.log(`Transport removed: ${sessionId}`)
        }
    }

    getTransport(sessionId: string): StreamableHTTPServerTransport | undefined {
        return this._transports[sessionId]
    }

    getTransportCount(): number {
        return Object.keys(this._transports).length
    }

    // Server Info
    get currentPort(): number | undefined {
        return this._currentPort
    }

    set currentPort(port: number | undefined) {
        this._currentPort = port
    }

    get serverStartTime(): Date | undefined {
        return this._serverStartTime
    }

    set serverStartTime(time: Date | undefined) {
        this._serverStartTime = time
    }

    // Active Panels
    get activePanels(): vscode.WebviewPanel[] {
        return this._activePanels
    }

    addPanel(panel: vscode.WebviewPanel) {
        this._activePanels.push(panel)
    }

    removePanel(panel: vscode.WebviewPanel) {
        const index = this._activePanels.indexOf(panel)
        if (index > -1) {
            this._activePanels.splice(index, 1)
        }
    }

    // Server Status
    isServerRunning(): boolean {
        return this._currentPort !== undefined && this._httpServer !== undefined
    }

    getUptime(): string {
        if (!this._serverStartTime) {
            return ''
        }
        
        const diff = Date.now() - this._serverStartTime.getTime()
        const minutes = Math.floor(diff / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        return `${minutes}분 ${seconds}초`
    }

    // Reset all state
    reset() {
        this._mcpServer = undefined
        this._httpServer = undefined
        this._dapMessages = []
        // 모든 세션 정리
        for (const sessionId in this._transports) {
            console.log(`Cleaning up session: ${sessionId}`)
            delete this._transports[sessionId]
        }
        this._currentPort = undefined
        this._serverStartTime = undefined
        this._activePanels = []
    }
}

// Export singleton instance
export const state = new ExtensionState()
