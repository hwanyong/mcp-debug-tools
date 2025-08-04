import * as vscode from 'vscode'
import { state } from './state'
import { getRelativePath } from './utils/path'

// DAP 로그 (기존)
export const dapLogResource = {
    name: 'dap-log',
    uri: 'dap-log://current',
    config: {
        title: 'DAP Log',
        description: 'Debug Adapter Protocol messages log',
        mimeType: 'application/json'
    },
    handler: async (uri: URL) => {
        return { 
            contents: [{ 
                uri: uri.href, 
                text: JSON.stringify(state.dapMessages, null, 2) 
            }] 
        }
    }
}

// 브레이크포인트 목록
export const breakpointsResource = {
    name: 'breakpoints',
    uri: 'debug://breakpoints',
    config: {
        title: 'Current Breakpoints',
        description: 'List of all breakpoints',
        mimeType: 'application/json'
    },
    handler: async (uri: URL) => {
        const breakpoints = vscode.debug.breakpoints
            .filter(bp => bp instanceof vscode.SourceBreakpoint)
            .map(bp => {
                const sbp = bp as vscode.SourceBreakpoint
                return {
                    file: getRelativePath(sbp.location.uri.fsPath),
                    line: sbp.location.range.start.line + 1,
                    enabled: sbp.enabled,
                    condition: sbp.condition,
                    hitCondition: sbp.hitCondition,
                    logMessage: sbp.logMessage
                }
            })
        
        return { 
            contents: [{ 
                uri: uri.href,
                text: JSON.stringify(breakpoints, null, 2) 
            }] 
        }
    }
}

// 활성 디버그 세션
export const activeSessionResource = {
    name: 'active-session',
    uri: 'debug://active-session',
    config: {
        title: 'Active Debug Session',
        description: 'Information about the currently active debug session',
        mimeType: 'application/json'
    },
    handler: async (uri: URL) => {
        const session = vscode.debug.activeDebugSession
        
        if (!session) {
            return {
                contents: [{
                    uri: uri.href,
                    text: JSON.stringify({ message: 'No active debug session' }, null, 2)
                }]
            }
        }
        
        const sessionInfo = {
            id: session.id,
            name: session.name,
            type: session.type,
            workspaceFolder: session.workspaceFolder?.name,
            configuration: session.configuration
        }
        
        return { 
            contents: [{ 
                uri: uri.href,
                text: JSON.stringify(sessionInfo, null, 2) 
            }] 
        }
    }
}

// 디버그 콘솔 출력
export const debugConsoleResource = {
    name: 'debug-console',
    uri: 'debug://console',
    config: {
        title: 'Debug Console Output',
        description: 'Recent debug console output',
        mimeType: 'text/plain'
    },
    handler: async (uri: URL) => {
        // DAP 메시지에서 output 이벤트 필터링
        const outputMessages: string[] = []
        
        for (const msgStr of state.dapMessages) {
            try {
                // "Server -> Client: " 또는 "Client -> Server: " 프리픽스 제거
                const jsonStart = msgStr.indexOf('{')
                if (jsonStart === -1) continue
                
                const jsonStr = msgStr.substring(jsonStart)
                const msg = JSON.parse(jsonStr)
                
                if (msg.type === 'event' && msg.event === 'output' && msg.body?.output) {
                    outputMessages.push(msg.body.output)
                }
            } catch (e) {
                // JSON 파싱 실패 시 무시
            }
        }
        
        return { 
            contents: [{ 
                uri: uri.href,
                text: outputMessages.length > 0 ? outputMessages.join('\n') : 'No debug console output available' 
            }] 
        }
    }
}

// 모든 리소스 export
export const allResources = [
    dapLogResource,
    breakpointsResource,
    activeSessionResource,
    debugConsoleResource
]
