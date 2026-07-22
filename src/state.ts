import * as vscode from 'vscode'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

export interface McpSession {
    server: McpServer
    transport: StreamableHTTPServerTransport
}

/**
 * Global state for the extension
 */
class ExtensionState {
    private _httpServer: any
    private _sessions: { [sessionId: string]: McpSession } = {}
    private _currentPort: number | undefined
    private _serverStartTime: Date | undefined
    private _activePanels: vscode.WebviewPanel[] = []

    // HTTP Server
    get httpServer(): any {
        return this._httpServer
    }

    set httpServer(server: any) {
        this._httpServer = server
    }

    // MCP sessions
    get sessions(): { [sessionId: string]: McpSession } {
        return this._sessions
    }

    addSession(sessionId: string, session: McpSession) {
        this._sessions[sessionId] = session
    }

    removeSession(sessionId: string) {
        if (this._sessions[sessionId]) {
            delete this._sessions[sessionId]
            console.log(`MCP session removed: ${sessionId}`)
        }
    }

    getSession(sessionId: string): McpSession | undefined {
        return this._sessions[sessionId]
    }

    async closeSession(sessionId: string): Promise<void> {
        const session = this._sessions[sessionId]
        if (!session) {
            return
        }

        delete this._sessions[sessionId]
        await session.server.close()
        console.log(`MCP session closed: ${sessionId}`)
    }

    async closeAllSessions(): Promise<void> {
        const sessions = Object.entries(this._sessions)
        this._sessions = {}

        await Promise.allSettled(sessions.map(async ([sessionId, session]) => {
            await session.server.close()
            console.log(`MCP session closed: ${sessionId}`)
        }))
    }

    getTransportCount(): number {
        return Object.keys(this._sessions).length
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
        this._httpServer = undefined
        this._sessions = {}
        this._currentPort = undefined
        this._serverStartTime = undefined
        this._activePanels = []
    }
}

// Export singleton instance
export const state = new ExtensionState()
