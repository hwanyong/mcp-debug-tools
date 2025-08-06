import * as vscode from 'vscode'
import { z } from 'zod'
import * as path from 'path'
import { getWorkspaceRoot, getRelativePath } from './utils/path'
import { inputSchemas } from './tools-parameters'
import { parseJsonWithComments } from './utils/json'

// 브레이크포인트 추가
export const addBreakpointTool = {
    name: 'add-breakpoint',
    config: {
        title: 'Add Breakpoint',
        description: 'Add a breakpoint to a file at specified line with optional conditions',
        inputSchema: inputSchemas['add-breakpoint']
    },
    handler: async (args: any) => {
        const { file, line, condition, hitCondition, logMessage } = args as { 
            file: string, 
            line: number, 
            condition?: string, 
            hitCondition?: string, 
            logMessage?: string 
        }
        
        try {
            const uri = vscode.Uri.file(path.join(getWorkspaceRoot(), file))
            const location = new vscode.Location(uri, new vscode.Position(line - 1, 0))
            
            // 브레이크포인트 생성
            const breakpoint = new vscode.SourceBreakpoint(location)
            
            // 조건부 설정 (옵셔널)
            if (condition) {
                (breakpoint as any).condition = condition
            }
            
            if (hitCondition) {
                (breakpoint as any).hitCondition = hitCondition
            }
            
            if (logMessage) {
                (breakpoint as any).logMessage = logMessage
            }
            
            vscode.debug.addBreakpoints([breakpoint])
            
            const result = {
                file: file,
                line: line,
                condition: condition || null,
                hitCondition: hitCondition || null,
                logMessage: logMessage || null,
                message: condition || hitCondition || logMessage ? 
                    'Conditional breakpoint added successfully' : 
                    'Breakpoint added successfully'
            }
            
            return { 
                content: [{ 
                    type: 'text' as const, 
                    text: JSON.stringify(result, null, 2) 
                }] 
            }
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

// 모든 브레이크포인트 제거
export const clearBreakpointsTool = {
    name: 'clear-breakpoints',
    config: {
        title: 'Clear Breakpoints',
        description: 'Remove all breakpoints or breakpoints from a specific file',
        inputSchema: inputSchemas['clear-breakpoints']
    },
    handler: async (args: any) => {
        const { files } = args as { files?: string[] }
        
        try {
            let breakpoints: vscode.Breakpoint[]
            
            if (files && files.length > 0) {
                // 특정 파일들의 브레이크포인트만 제거
                const uris = files.map(file => vscode.Uri.file(path.join(getWorkspaceRoot(), file)))
                breakpoints = vscode.debug.breakpoints.filter(bp => 
                    bp instanceof vscode.SourceBreakpoint &&
                    uris.some(uri => bp.location.uri.fsPath === uri.fsPath)
                )
                
                if (breakpoints.length > 0) {
                    vscode.debug.removeBreakpoints(breakpoints)
                    return { content: [{ type: 'text' as const, text: `Cleared ${breakpoints.length} breakpoint(s) from ${files.length} file(s): ${files.join(', ')}` }] }
                }
                return { content: [{ type: 'text' as const, text: `No breakpoints found in specified files: ${files.join(', ')}` }] }
            } else {
                // 모든 브레이크포인트 제거
                breakpoints = vscode.debug.breakpoints.filter(bp => bp instanceof vscode.SourceBreakpoint)
                
                if (breakpoints.length > 0) {
                    vscode.debug.removeBreakpoints(breakpoints)
                    return { content: [{ type: 'text' as const, text: `Cleared ${breakpoints.length} breakpoint(s) from all files` }] }
                }
                return { content: [{ type: 'text' as const, text: 'No breakpoints to clear' }] }
            }
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

// 디버그 구성 목록 조회
export const listDebugConfigsTool = {
    name: 'list-debug-configs',
    config: {
        title: 'List Debug Configurations',
        description: 'List all available debug configurations from launch.json',
        inputSchema: inputSchemas['list-debug-configs']
    },
    handler: async () => {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
            if (!workspaceFolder) {
                return { 
                    content: [{ type: 'text' as const, text: 'No workspace folder open' }],
                    isError: true 
                }
            }
            
            // launch.json 파일 읽기
            const launchJsonUri = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'launch.json')
            
            try {
                const launchJsonContent = await vscode.workspace.fs.readFile(launchJsonUri)
                const contentString = launchJsonContent.toString()
                
                // 디버깅을 위한 내용 출력
                console.log('Launch.json content length:', contentString.length)
                console.log('Launch.json first 100 chars:', contentString.substring(0, 100))
                
                // JSON 파싱 시도 (주석 제거 후)
                let launchJson
                try {
                    launchJson = parseJsonWithComments(contentString)
                } catch (parseError: any) {
                    return { 
                        content: [{ 
                            type: 'text' as const, 
                            text: JSON.stringify({
                                workspace: workspaceFolder.name,
                                message: 'launch.json JSON parsing failed',
                                error: parseError.message,
                                contentLength: contentString.length,
                                contentPreview: contentString.substring(0, 200),
                                configurations: []
                            }, null, 2) 
                        }] 
                    }
                }
                
                if (launchJson.configurations && Array.isArray(launchJson.configurations)) {
                    const configs = launchJson.configurations.map((config: any, index: number) => ({
                        name: config.name || `Configuration ${index + 1}`,
                        type: config.type || 'unknown',
                        request: config.request || 'unknown',
                        program: config.program || config.args?.[0] || 'not specified',
                        cwd: config.cwd || 'not specified',
                        env: config.env || {},
                        args: config.args || []
                    }))
                    
                    return { 
                        content: [{ 
                            type: 'text' as const, 
                            text: JSON.stringify({
                                workspace: workspaceFolder.name,
                                configurations: configs,
                                total: configs.length
                            }, null, 2) 
                        }] 
                    }
                } else {
                    return { 
                        content: [{ 
                            type: 'text' as const, 
                            text: JSON.stringify({
                                workspace: workspaceFolder.name,
                                message: 'No debug configurations found in launch.json',
                                configurations: []
                            }, null, 2) 
                        }] 
                    }
                }
            } catch (fileError: any) {
                return { 
                    content: [{ 
                        type: 'text' as const, 
                        text: JSON.stringify({
                            workspace: workspaceFolder.name,
                            message: 'launch.json not found or invalid',
                            error: fileError.message,
                            configurations: []
                        }, null, 2) 
                    }] 
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

// 디버그 구성 선택
export const selectDebugConfigTool = {
    name: 'select-debug-config',
    config: {
        title: 'Select Debug Configuration',
        description: 'Select a debug configuration by name',
        inputSchema: inputSchemas['select-debug-config']
    },
    handler: async (args: any) => {
        const { configName } = args as { configName: string }
        
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
            if (!workspaceFolder) {
                return { 
                    content: [{ type: 'text' as const, text: 'No workspace folder open' }],
                    isError: true 
                }
            }
            
            // launch.json 파일 읽기
            const launchJsonUri = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'launch.json')
            
            try {
                const launchJsonContent = await vscode.workspace.fs.readFile(launchJsonUri)
                const launchJson = parseJsonWithComments(launchJsonContent.toString())
                
                if (launchJson.configurations && Array.isArray(launchJson.configurations)) {
                    const selectedConfig = launchJson.configurations.find((config: any) => config.name === configName)
                    
                    if (selectedConfig) {
                        return { 
                            content: [{ 
                                type: 'text' as const, 
                                text: JSON.stringify({
                                    message: `Debug configuration "${configName}" selected`,
                                    configuration: {
                                        name: selectedConfig.name,
                                        type: selectedConfig.type || 'unknown',
                                        request: selectedConfig.request || 'unknown',
                                        program: selectedConfig.program || selectedConfig.args?.[0] || 'not specified',
                                        cwd: selectedConfig.cwd || 'not specified',
                                        env: selectedConfig.env || {},
                                        args: selectedConfig.args || []
                                    }
                                }, null, 2) 
                            }] 
                        }
                    } else {
                        const availableConfigs = launchJson.configurations.map((config: any) => config.name)
                        return { 
                            content: [{ 
                                type: 'text' as const, 
                                text: JSON.stringify({
                                    message: `Debug configuration "${configName}" not found`,
                                    requestedConfig: configName,
                                    availableConfigs: availableConfigs,
                                    suggestion: availableConfigs.length > 0 ? 
                                        `Available configurations: ${availableConfigs.join(', ')}` : 
                                        'No debug configurations available'
                                }, null, 2) 
                            }],
                            isError: true 
                        }
                    }
                } else {
                    return { 
                        content: [{ 
                            type: 'text' as const, 
                            text: 'No debug configurations found in launch.json' 
                        }],
                        isError: true 
                    }
                }
            } catch (fileError: any) {
                return { 
                    content: [{ 
                        type: 'text' as const, 
                        text: `Error reading launch.json: ${fileError.message}` 
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

// 모든 도구 export
export const allTools = [
    addBreakpointTool,
    removeBreakpointTool,
    clearBreakpointsTool,
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
    inspectVariableTool,
    listDebugConfigsTool,
    selectDebugConfigTool
]
