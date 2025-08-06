import * as vscode from 'vscode'
import { state } from './state'

/**
 * Create DAP tracker for a debug session
 */
export function createDebugAdapterTracker(session: vscode.DebugSession): vscode.DebugAdapterTracker {
    return {
        // Called before a message is sent from the client (VS Code) to the debug adapter.
        onWillReceiveMessage: (message: any) => {
            // DAP 메시지 누적 비활성화 - 메모리 누수 방지
            // state.addDapMessage(`Client -> Server: ${JSON.stringify(message, null, 2)}`)
        },
        // Called after a message is received from the debug adapter.
        onDidSendMessage: (message: any) => {
            // DAP 메시지 누적 비활성화 - 메모리 누수 방지
            // state.addDapMessage(`Server -> Client: ${JSON.stringify(message, null, 2)}`)
        },
        // You can also handle errors and the tracker's disposal.
        onError: (error: Error) => {
            // Handle DAP tracker errors if needed
        },
        onExit: (code: number | undefined, signal: string | undefined) => {
            // Handle DAP tracker exit if needed
        }
    }
}

/**
 * Register DAP tracker factory
 */
export function registerDapTracker(context: vscode.ExtensionContext): vscode.Disposable {
    // Register a DebugAdapterTrackerFactory for all debug types.
    // The '*' wildcard means this will be used for all debug sessions.
    return vscode.debug.registerDebugAdapterTrackerFactory('*', {
        createDebugAdapterTracker(session: vscode.DebugSession): vscode.ProviderResult<vscode.DebugAdapterTracker> {
            return createDebugAdapterTracker(session)
        }
    })
}
