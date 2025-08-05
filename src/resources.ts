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

// 활성 스택 아이템 (스레드/스택 프레임)
export const activeStackItemResource = {
    name: 'active-stack-item',
    uri: 'debug://active-stack-item',
    config: {
        title: 'Active Stack Item',
        description: 'Currently focused thread or stack frame',
        mimeType: 'application/json'
    },
    handler: async (uri: URL) => {
        const activeStackItem = vscode.debug.activeStackItem
        
        if (!activeStackItem) {
            return {
                contents: [{
                    uri: uri.href,
                    text: JSON.stringify({ message: 'No focused thread or stack frame' }, null, 2)
                }]
            }
        }
        
        // VS Code Debug API의 activeStackItem은 내부 정보가 제한적이므로
        // 기본 정보만 반환
        const itemInfo: any = {
            type: 'frameId' in activeStackItem ? 'stackFrame' : 'thread',
            sessionId: activeStackItem.session.id,
            sessionName: activeStackItem.session.name,
            sessionType: activeStackItem.session.type
        }
        
        // 스택 프레임인 경우
        if ('frameId' in activeStackItem) {
            itemInfo.frameId = (activeStackItem as any).frameId
            itemInfo.threadId = activeStackItem.threadId
        } else {
            // 스레드인 경우
            itemInfo.threadId = activeStackItem.threadId
        }
        
        return {
            contents: [{
                uri: uri.href,
                text: JSON.stringify(itemInfo, null, 2)
            }]
        }
    }
}

// 콜스택 정보
export const callStackResource = {
    name: 'call-stack',
    uri: 'debug://call-stack',
    config: {
        title: 'Call Stack',
        description: 'Complete call stack information',
        mimeType: 'application/json'
    },
    handler: async (uri: URL) => {
        try {
            const session = vscode.debug.activeDebugSession
            if (!session) {
                return {
                    contents: [{
                        uri: uri.href,
                        text: JSON.stringify({ message: 'No active debug session' }, null, 2)
                    }]
                }
            }
            
            const activeStackItem = vscode.debug.activeStackItem
            if (!activeStackItem) {
                return {
                    contents: [{
                        uri: uri.href,
                        text: JSON.stringify({ message: 'No active stack frame' }, null, 2)
                    }]
                }
            }
            
            // DAP stackTrace 요청으로 콜스택 정보 가져오기
            try {
                const response = await session.customRequest('stackTrace', {
                    threadId: activeStackItem.threadId,
                    startFrame: 0,
                    levels: 100 // 충분한 수의 프레임 가져오기
                })
                
                if (response && response.stackFrames) {
                    const callStack = {
                        threadId: activeStackItem.threadId,
                        totalFrames: response.totalFrames,
                        stackFrames: response.stackFrames.map((frame: any) => ({
                            id: frame.id,
                            name: frame.name,
                            source: frame.source ? {
                                name: frame.source.name,
                                path: frame.source.path,
                                sourceReference: frame.source.sourceReference
                            } : null,
                            line: frame.line,
                            column: frame.column,
                            endLine: frame.endLine,
                            endColumn: frame.endColumn,
                            canRestart: frame.canRestart,
                            instructionPointerReference: frame.instructionPointerReference,
                            moduleId: frame.moduleId,
                            presentationHint: frame.presentationHint
                        }))
                    }
                    
                    return {
                        contents: [{
                            uri: uri.href,
                            text: JSON.stringify(callStack, null, 2)
                        }]
                    }
                }
            } catch (error) {
                console.log('Stack trace request failed:', error)
            }
            
            return {
                contents: [{
                    uri: uri.href,
                    text: JSON.stringify({ message: 'Failed to get call stack' }, null, 2)
                }]
            }
        } catch (error: any) {
            return {
                contents: [{
                    uri: uri.href,
                    text: JSON.stringify({ error: error.message }, null, 2)
                }]
            }
        }
    }
}

// 변수/스코프 정보
export const variablesScopeResource = {
    name: 'variables-scope',
    uri: 'debug://variables-scope',
    config: {
        title: 'Variables and Scopes',
        description: 'All variables in current scope',
        mimeType: 'application/json'
    },
    handler: async (uri: URL) => {
        try {
            const session = vscode.debug.activeDebugSession
            if (!session) {
                return {
                    contents: [{
                        uri: uri.href,
                        text: JSON.stringify({ message: 'No active debug session' }, null, 2)
                    }]
                }
            }
            
            const activeStackItem = vscode.debug.activeStackItem
            if (!activeStackItem) {
                return {
                    contents: [{
                        uri: uri.href,
                        text: JSON.stringify({ message: 'No active stack frame' }, null, 2)
                    }]
                }
            }
            
            // DAP scopes 요청으로 스코프 정보 가져오기
            try {
                const scopesResponse = await session.customRequest('scopes', {
                    frameId: 'frameId' in activeStackItem ? (activeStackItem as any).frameId : undefined
                })
                
                if (scopesResponse && scopesResponse.scopes) {
                    const allScopes = []
                    
                    // 각 스코프에서 variables 요청
                    for (const scope of scopesResponse.scopes) {
                        const variablesResponse = await session.customRequest('variables', {
                            variablesReference: scope.variablesReference
                        })
                        
                        const scopeInfo = {
                            name: scope.name,
                            variablesReference: scope.variablesReference,
                            expensive: scope.expensive,
                            source: scope.source,
                            line: scope.line,
                            column: scope.column,
                            endLine: scope.endLine,
                            endColumn: scope.endColumn,
                            variables: variablesResponse && variablesResponse.variables ? 
                                variablesResponse.variables.map((v: any) => ({
                                    name: v.name,
                                    value: v.value,
                                    type: v.type,
                                    variablesReference: v.variablesReference,
                                    presentationHint: v.presentationHint,
                                    evaluateName: v.evaluateName
                                })) : []
                        }
                        
                        allScopes.push(scopeInfo)
                    }
                    
                    const result = {
                        frameId: 'frameId' in activeStackItem ? (activeStackItem as any).frameId : undefined,
                        threadId: activeStackItem.threadId,
                        scopes: allScopes
                    }
                    
                    return {
                        contents: [{
                            uri: uri.href,
                            text: JSON.stringify(result, null, 2)
                        }]
                    }
                }
            } catch (error) {
                console.log('Variables and scopes request failed:', error)
            }
            
            return {
                contents: [{
                    uri: uri.href,
                    text: JSON.stringify({ message: 'Failed to get variables and scopes' }, null, 2)
                }]
            }
        } catch (error: any) {
            return {
                contents: [{
                    uri: uri.href,
                    text: JSON.stringify({ error: error.message }, null, 2)
                }]
            }
        }
    }
}

// 모든 리소스 export
export const allResources = [
    dapLogResource,
    breakpointsResource,
    activeSessionResource,
    debugConsoleResource,
    activeStackItemResource,
    callStackResource,
    variablesScopeResource
]
