import * as vscode from 'vscode'
import { z } from 'zod'
import * as path from 'path'
import { getWorkspaceRoot, getRelativePath } from './utils/path'
import { inputSchemas } from './tools-parameters'

// 브레이크포인트 추가
export const addBreakpointTool = {
    name: 'add-breakpoint',
    config: {
        title: 'Add Breakpoint',
        description: 'Add a breakpoint to a file at specified line',
        inputSchema: inputSchemas['add-breakpoint']
    },
    handler: async (args: any) => {
        const { file, line } = args as { file: string, line: number }
        try {
            const uri = vscode.Uri.file(path.join(getWorkspaceRoot(), file))
            const location = new vscode.Location(uri, new vscode.Position(line - 1, 0))
            const breakpoint = new vscode.SourceBreakpoint(location)
            
            vscode.debug.addBreakpoints([breakpoint])
            return { content: [{ type: 'text' as const, text: `Breakpoint added at ${file}:${line}` }] }
        } catch (error: any) {
            return { 
                content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                isError: true 
            }
        }
    }
}

// 브레이크포인트 제거
export const removeBreakpointTool = {
    name: 'remove-breakpoint',
    config: {
        title: 'Remove Breakpoint',
        description: 'Remove breakpoint from a file at specified line',
        inputSchema: inputSchemas['remove-breakpoint']
    },
    handler: async (args: any) => {
        const { file, line } = args as { file: string, line: number }
        try {
            const uri = vscode.Uri.file(path.join(getWorkspaceRoot(), file))
            const breakpoints = vscode.debug.breakpoints.filter(bp => 
                bp instanceof vscode.SourceBreakpoint &&
                bp.location.uri.fsPath === uri.fsPath &&
                bp.location.range.start.line === line - 1
            )
            
            if (breakpoints.length > 0) {
                vscode.debug.removeBreakpoints(breakpoints)
                return { content: [{ type: 'text' as const, text: `Breakpoint removed from ${file}:${line}` }] }
            }
            return { content: [{ type: 'text' as const, text: `No breakpoint found at ${file}:${line}` }] }
        } catch (error: any) {
            return { 
                content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                isError: true 
            }
        }
    }
}

// 모든 브레이크포인트 목록
export const listBreakpointsTool = {
    name: 'list-breakpoints',
    config: {
        title: 'List Breakpoints',
        description: 'List all breakpoints in the workspace',
        inputSchema: {}
    },
    handler: async () => {
        try {
            const breakpoints = vscode.debug.breakpoints
                .filter(bp => bp instanceof vscode.SourceBreakpoint)
                .map(bp => {
                    const sbp = bp as vscode.SourceBreakpoint
                    return {
                        file: getRelativePath(sbp.location.uri.fsPath),
                        line: sbp.location.range.start.line + 1,
                        enabled: sbp.enabled
                    }
                })
            
            return { content: [{ type: 'text' as const, text: JSON.stringify(breakpoints, null, 2) }] }
        } catch (error: any) {
            return { 
                content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                isError: true 
            }
        }
    }
}

// 디버그 시작
export const startDebugTool = {
    name: 'start-debug',
    config: {
        title: 'Start Debug Session',
        description: 'Start a debug session with specified configuration',
        inputSchema: inputSchemas['start-debug']
    },
    handler: async (args: any) => {
        const { config } = args as { config: string }
        try {
            const folder = vscode.workspace.workspaceFolders?.[0]
            if (!folder) {
                return { content: [{ type: 'text' as const, text: 'No workspace folder open' }], isError: true }
            }
            
            const success = await vscode.debug.startDebugging(folder, config)
            return { content: [{ type: 'text' as const, text: success ? `Debug session '${config}' started` : 'Failed to start debug session' }] }
        } catch (error: any) {
            return { 
                content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                isError: true 
            }
        }
    }
}

// 디버그 중지
export const stopDebugTool = {
    name: 'stop-debug',
    config: {
        title: 'Stop Debug Session',
        description: 'Stop the active debug session',
        inputSchema: {}
    },
    handler: async () => {
        try {
            const session = vscode.debug.activeDebugSession
            if (!session) {
                return { content: [{ type: 'text' as const, text: 'No active debug session' }] }
            }
            
            await vscode.debug.stopDebugging(session)
            return { content: [{ type: 'text' as const, text: 'Debug session stopped' }] }
        } catch (error: any) {
            return { 
                content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                isError: true 
            }
        }
    }
}

// 실행 계속
export const continueTool = {
    name: 'continue',
    config: {
        title: 'Continue Execution',
        description: 'Continue execution in debug session',
        inputSchema: {}
    },
    handler: async () => {
        try {
            if (!vscode.debug.activeDebugSession) {
                return { content: [{ type: 'text' as const, text: 'No active debug session' }] }
            }
            
            await vscode.commands.executeCommand('workbench.action.debug.continue')
            return { content: [{ type: 'text' as const, text: 'Execution continued' }] }
        } catch (error: any) {
            return { 
                content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                isError: true 
            }
        }
    }
}

// 한 줄 실행 (함수 건너뛰기)
export const stepOverTool = {
    name: 'step-over',
    config: {
        title: 'Step Over',
        description: 'Step over the current line',
        inputSchema: {}
    },
    handler: async () => {
        try {
            if (!vscode.debug.activeDebugSession) {
                return { content: [{ type: 'text' as const, text: 'No active debug session' }] }
            }
            
            await vscode.commands.executeCommand('workbench.action.debug.stepOver')
            return { content: [{ type: 'text' as const, text: 'Stepped over' }] }
        } catch (error: any) {
            return { 
                content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                isError: true 
            }
        }
    }
}

// 함수 안으로 들어가기
export const stepIntoTool = {
    name: 'step-into',
    config: {
        title: 'Step Into',
        description: 'Step into the function',
        inputSchema: {}
    },
    handler: async () => {
        try {
            if (!vscode.debug.activeDebugSession) {
                return { content: [{ type: 'text' as const, text: 'No active debug session' }] }
            }
            
            await vscode.commands.executeCommand('workbench.action.debug.stepInto')
            return { content: [{ type: 'text' as const, text: 'Stepped into' }] }
        } catch (error: any) {
            return { 
                content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                isError: true 
            }
        }
    }
}

// 함수 밖으로 나가기
export const stepOutTool = {
    name: 'step-out',
    config: {
        title: 'Step Out',
        description: 'Step out of the current function',
        inputSchema: {}
    },
    handler: async () => {
        try {
            if (!vscode.debug.activeDebugSession) {
                return { content: [{ type: 'text' as const, text: 'No active debug session' }] }
            }
            
            await vscode.commands.executeCommand('workbench.action.debug.stepOut')
            return { content: [{ type: 'text' as const, text: 'Stepped out' }] }
        } catch (error: any) {
            return { 
                content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                isError: true 
            }
        }
    }
}

// 일시 중지
export const pauseTool = {
    name: 'pause',
    config: {
        title: 'Pause Execution',
        description: 'Pause the running debug session',
        inputSchema: {}
    },
    handler: async () => {
        try {
            if (!vscode.debug.activeDebugSession) {
                return { content: [{ type: 'text' as const, text: 'No active debug session' }] }
            }
            
            await vscode.commands.executeCommand('workbench.action.debug.pause')
            return { content: [{ type: 'text' as const, text: 'Execution paused' }] }
        } catch (error: any) {
            return { 
                content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                isError: true 
            }
        }
    }
}

// 디버그 상태 가져오기
export const getDebugStateTool = {
    name: 'get-debug-state',
    config: {
        title: 'Get Debug State',
        description: 'Get current debug session state and information',
        inputSchema: {}
    },
    handler: async () => {
        try {
            const session = vscode.debug.activeDebugSession
            const breakpoints = vscode.debug.breakpoints
            
            const state = {
                hasActiveSession: !!session,
                sessionName: session?.name,
                sessionType: session?.type,
                breakpointCount: breakpoints.length,
                breakpoints: breakpoints
                    .filter(bp => bp instanceof vscode.SourceBreakpoint)
                    .map(bp => {
                        const sbp = bp as vscode.SourceBreakpoint
                        return {
                            file: getRelativePath(sbp.location.uri.fsPath),
                            line: sbp.location.range.start.line + 1,
                            enabled: sbp.enabled
                        }
                    })
            }
            
            return { content: [{ type: 'text' as const, text: JSON.stringify(state, null, 2) }] }
        } catch (error: any) {
            return { 
                content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                isError: true 
            }
        }
    }
}

// 표현식 평가
export const evaluateExpressionTool = {
    name: 'evaluate-expression',
    config: {
        title: 'Evaluate Expression',
        description: 'Evaluate expression in debug context',
        inputSchema: inputSchemas['evaluate-expression']
    },
    handler: async (args: any) => {
        const { expression } = args as { expression: string }
        
        try {
            // 디버그 세션 확인
            const session = vscode.debug.activeDebugSession
            if (!session) {
                return { 
                    content: [{ type: 'text' as const, text: 'No active debug session' }],
                    isError: true 
                }
            }
            
            // 현재 활성 스택 프레임 확인
            const activeStackItem = vscode.debug.activeStackItem
            if (!activeStackItem) {
                return { 
                    content: [{ type: 'text' as const, text: 'No active stack frame' }],
                    isError: true 
                }
            }
            
            console.log('Debug session:', session.name, session.type)
            console.log('Active stack item:', activeStackItem)
            console.log('Expression to evaluate:', expression)
            
            // DebugSession의 customRequest를 사용하여 evaluate 요청
            try {
                const requestBody = {
                    expression: expression,
                    context: 'repl',
                    frameId: 'frameId' in activeStackItem ? (activeStackItem as any).frameId : undefined
                }
                
                console.log('Evaluate request body:', requestBody)
                
                const response = await session.customRequest('evaluate', requestBody)
                
                console.log('Evaluate response:', response)
                
                if (response && response.result !== undefined) {
                    const result = typeof response.result === 'string' ? response.result : JSON.stringify(response.result)
                    return { 
                        content: [{ 
                            type: 'text' as const, 
                            text: `Expression: ${expression}\nResult: ${result}` 
                        }] 
                    }
                } else {
                    return { 
                        content: [{ 
                            type: 'text' as const, 
                            text: `Expression: ${expression}\nResponse: ${JSON.stringify(response)}` 
                        }] 
                    }
                }
            } catch (evaluateError) {
                console.log('Evaluate request failed:', evaluateError)
                return { 
                    content: [{ 
                        type: 'text' as const, 
                        text: `Evaluate error: ${evaluateError}` 
                    }],
                    isError: true 
                }
            }
        } catch (error: any) {
            return { 
                content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                isError: true 
            }
        }
    }
}

// 특정 변수 검사
export const inspectVariableTool = {
    name: 'inspect-variable',
    config: {
        title: 'Inspect Variable',
        description: 'Get detailed information about a variable',
        inputSchema: inputSchemas['inspect-variable']
    },
    handler: async (args: any) => {
        const { variableName } = args as { variableName: string }
        
        try {
            // 디버그 세션 확인
            const session = vscode.debug.activeDebugSession
            if (!session) {
                return { 
                    content: [{ type: 'text' as const, text: 'No active debug session' }],
                    isError: true 
                }
            }
            
            // 현재 활성 스택 프레임 확인
            const activeStackItem = vscode.debug.activeStackItem
            if (!activeStackItem) {
                return { 
                    content: [{ type: 'text' as const, text: 'No active stack frame' }],
                    isError: true 
                }
            }
            
            // 먼저 scopes 요청으로 변수 스코프 확인
            try {
                const scopesResponse = await session.customRequest('scopes', {
                    frameId: 'frameId' in activeStackItem ? (activeStackItem as any).frameId : undefined
                })
                
                if (scopesResponse && scopesResponse.scopes) {
                    // 각 스코프에서 variables 요청
                    for (const scope of scopesResponse.scopes) {
                        const variablesResponse = await session.customRequest('variables', {
                            variablesReference: scope.variablesReference
                        })
                        
                        if (variablesResponse && variablesResponse.variables) {
                            // 변수명으로 검색
                            const variable = variablesResponse.variables.find((v: any) => v.name === variableName)
                            if (variable) {
                                const result = {
                                    name: variable.name,
                                    value: variable.value,
                                    type: variable.type,
                                    variablesReference: variable.variablesReference,
                                    scope: scope.name
                                }
                                
                                return { 
                                    content: [{ 
                                        type: 'text' as const, 
                                        text: `Variable: ${variableName}\nDetails: ${JSON.stringify(result, null, 2)}` 
                                    }] 
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.log('Variable inspection failed:', error)
            }
            
            // 변수를 찾지 못한 경우
            return { 
                content: [{ 
                    type: 'text' as const, 
                    text: `Variable "${variableName}" not found in current scope` 
                }],
                isError: true 
            }
        } catch (error: any) {
            return { 
                content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
                isError: true 
            }
        }
    }
}

// 모든 도구 export
export const allTools = [
    addBreakpointTool,
    removeBreakpointTool,
    listBreakpointsTool,
    startDebugTool,
    stopDebugTool,
    continueTool,
    stepOverTool,
    stepIntoTool,
    stepOutTool,
    pauseTool,
    getDebugStateTool,
    evaluateExpressionTool,
    inspectVariableTool
]
