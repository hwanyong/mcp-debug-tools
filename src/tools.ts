import * as vscode from 'vscode'
import { z } from 'zod'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { getWorkspaceRoot, getRelativePath } from './utils/path'
import { inputSchemas } from './tools-parameters'
import { parseJsonWithComments } from './utils/json'
import { state } from './state'
import { WorkspaceConfig } from './config-manager'
import { RegistryEntry } from './registry-manager'

// 브레이크포인트 추가
export const addBreakpointTool = {
    name: 'add-breakpoint',
    config: {
        title: 'Add Breakpoint',
        description: 'Add a breakpoint to a file at specified line with optional conditions',
        inputSchema: inputSchemas['add-breakpoint']
    },
    handler: async (args: any) => {
        const { file, line, condition, hitCondition, logMessage } = args
        const tmpLogMessage = null
        
        console.log(`[DEBUG] addBreakpoint 시작: ${file}:${line}`)
        const startTime = Date.now()
        
        try {
            const uri = vscode.Uri.file(path.join(getWorkspaceRoot(), file))
            const location = new vscode.Location(uri, new vscode.Position(line - 1, 0))
            
            console.log(`[DEBUG] 브레이크포인트 생성 중...`)
            // 브레이크포인트 생성
            const breakpoint = new vscode.SourceBreakpoint(location)
            
            // 조건부 설정 (옵셔널)
            if (condition) {
                (breakpoint as any).condition = condition
            }
            
            if (hitCondition) {
                (breakpoint as any).hitCondition = hitCondition
            }
            
            // if (logMessage) {
            //     (breakpoint as any).logMessage = logMessage
            // }
            
            console.log(`[DEBUG] VSCode API 호출 전: vscode.debug.addBreakpoints`)
            
            // 타임아웃 설정 (10초)
            const addBreakpointPromise = vscode.debug.addBreakpoints([breakpoint])
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('VSCode addBreakpoints API timed out after 10 seconds'))
                }, 10000)
            })
            
            await Promise.race([addBreakpointPromise, timeoutPromise])
            
            const duration = Date.now() - startTime
            console.log(`[DEBUG] 브레이크포인트 추가 완료 (${duration}ms)`)
            
            const result = {
                file: file,
                line: line,
                condition: condition || null,
                hitCondition: hitCondition || null,
                logMessage: tmpLogMessage || null,
                message: condition || hitCondition || tmpLogMessage ? 
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

// 다수 브레이크포인트 추가
export const addBreakpointsTool = {
    name: 'add-breakpoints',
    config: {
        title: 'Add Multiple Breakpoints',
        description: 'Add multiple breakpoints to files with specified lines and optional conditions',
        inputSchema: inputSchemas['add-breakpoints']
    },
    handler: async (args: any) => {
        const { breakpoints } = args
        
        try {
            const results: any[] = []
            const BATCH_SIZE = 5
            
            // 배치 단위로 처리
            for (let i = 0; i < breakpoints.length; i += BATCH_SIZE) {
                const batch = breakpoints.slice(i, i + BATCH_SIZE)
                const batchBreakpoints: vscode.SourceBreakpoint[] = []
                
                for (const bp of batch) {
                    const { file, line, condition, hitCondition } = bp
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
                    
                    batchBreakpoints.push(breakpoint)
                    results.push({
                        file: file,
                        line: line,
                        condition: condition || null,
                        hitCondition: hitCondition || null,
                        logMessage: null,
                        message: condition || hitCondition ? 
                            'Conditional breakpoint added successfully' : 
                            'Breakpoint added successfully'
                    })
                }
                
                // 각 배치를 개별적으로 처리
                await vscode.debug.addBreakpoints(batchBreakpoints)
                
                // 배치 사이에 짧은 지연 추가
                if (i + BATCH_SIZE < breakpoints.length) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                }
            }
            
            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({
                        totalBreakpoints: breakpoints.length,
                        results: results
                    }, null, 2)
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
        const { file, line } = args
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
        const startTime = Date.now()
        console.error(`🔧 [clear-breakpoints] 핸들러 시작`)
        
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
                    console.error(`⏳ [clear-breakpoints] VSCode API 호출 전`)
                    vscode.debug.removeBreakpoints(breakpoints)
                    const elapsed = Date.now() - startTime
                    console.error(`✅ [clear-breakpoints] VSCode API 호출 완료 (${elapsed}ms)`)
                    
                    const result = { content: [{ type: 'text' as const, text: `Cleared ${breakpoints.length} breakpoint(s) from ${files.length} file(s): ${files.join(', ')}` }] }
                    console.error(`📤 [clear-breakpoints] 결과 반환`)
                    return result
                }
                return { content: [{ type: 'text' as const, text: `No breakpoints found in specified files: ${files.join(', ')}` }] }
            } else {
                // 모든 브레이크포인트 제거
                breakpoints = vscode.debug.breakpoints.filter(bp => bp instanceof vscode.SourceBreakpoint)
                
                if (breakpoints.length > 0) {
                    console.error(`⏳ [clear-breakpoints] VSCode API 호출 전`)
                    vscode.debug.removeBreakpoints(breakpoints)
                    const elapsed = Date.now() - startTime
                    console.error(`✅ [clear-breakpoints] VSCode API 호출 완료 (${elapsed}ms)`)
                    
                    const result = { content: [{ type: 'text' as const, text: `Cleared ${breakpoints.length} breakpoint(s) from all files` }] }
                    console.error(`📤 [clear-breakpoints] 결과 반환`)
                    return result
                }
                return { content: [{ type: 'text' as const, text: 'No breakpoints to clear' }] }
            }
        } catch (error: any) {
            const elapsed = Date.now() - startTime
            console.error(`❌ [clear-breakpoints] 오류 (${elapsed}ms):`, error)
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
        const { config } = args
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
        const { expression } = args
        
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
        const { variableName } = args
        
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
        const { configName } = args
        
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

// 새로운 도구들 추가

// 1. DAP 로그 도구
export const getDapLogTool = {
    name: 'get-dap-log',
    config: {
        title: 'Get DAP Log',
        description: 'Retrieve all DAP protocol messages',
        inputSchema: inputSchemas['get-dap-log']
    },
    handler: async (args: any) => {
        try {
            // DAP 메시지 수집이 비활성화됨
            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({
                        message: 'DAP message collection is disabled for performance optimization',
                        messages: []
                    }, null, 2)
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

// 2. 브레이크포인트 목록 도구
export const getBreakpointsTool = {
    name: 'get-breakpoints',
    config: {
        title: 'Get Breakpoints',
        description: 'Retrieve all current breakpoints',
        inputSchema: inputSchemas['get-breakpoints']
    },
    handler: async (args: any) => {
        try {
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
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify(breakpoints, null, 2)
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

// 3. 활성 세션 도구
export const getActiveSessionTool = {
    name: 'get-active-session',
    config: {
        title: 'Get Active Session',
        description: 'Retrieve information about the currently active debug session',
        inputSchema: inputSchemas['get-active-session']
    },
    handler: async (args: any) => {
        try {
            const session = vscode.debug.activeDebugSession
            
            if (!session) {
                return {
                    content: [{
                        type: 'text' as const,
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
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify(sessionInfo, null, 2)
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

// 4. 디버그 콘솔 도구
export const getDebugConsoleTool = {
    name: 'get-debug-console',
    config: {
        title: 'Get Debug Console',
        description: 'Retrieve recent debug console output',
        inputSchema: inputSchemas['get-debug-console']
    },
    handler: async (args: any) => {
        try {
            const { limit, filter } = args
            
            // DAP 메시지 수집이 비활성화됨
            return {
                content: [{
                    type: 'text' as const,
                    text: 'Debug console output collection is disabled for performance optimization'
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

// 5. 활성 스택 아이템 도구
export const getActiveStackItemTool = {
    name: 'get-active-stack-item',
    config: {
        title: 'Get Active Stack Item',
        description: 'Retrieve currently focused thread or stack frame',
        inputSchema: inputSchemas['get-active-stack-item']
    },
    handler: async (args: any) => {
        try {
            const activeStackItem = vscode.debug.activeStackItem
            
            if (!activeStackItem) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ message: 'No focused thread or stack frame' }, null, 2)
                    }]
                }
            }
            
            const itemInfo: any = {
                type: 'frameId' in activeStackItem ? 'stackFrame' : 'thread',
                sessionId: activeStackItem.session.id,
                sessionName: activeStackItem.session.name,
                sessionType: activeStackItem.session.type
            }
            
            if ('frameId' in activeStackItem) {
                itemInfo.frameId = (activeStackItem as any).frameId
                itemInfo.threadId = activeStackItem.threadId
            } else {
                itemInfo.threadId = activeStackItem.threadId
            }
            
            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify(itemInfo, null, 2)
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

// 6. 콜스택 도구
export const getCallStackTool = {
    name: 'get-call-stack',
    config: {
        title: 'Get Call Stack',
        description: 'Retrieve complete call stack information',
        inputSchema: inputSchemas['get-call-stack']
    },
    handler: async (args: any) => {
        try {
            const { threadId, startFrame = 0, levels = 100 } = args
            const session = vscode.debug.activeDebugSession
            
            if (!session) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ message: 'No active debug session' }, null, 2)
                    }]
                }
            }
            
            const activeStackItem = vscode.debug.activeStackItem
            if (!activeStackItem) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ message: 'No active stack frame' }, null, 2)
                    }]
                }
            }
            
            const targetThreadId = threadId || activeStackItem.threadId
            
            try {
                const response = await session.customRequest('stackTrace', {
                    threadId: targetThreadId,
                    startFrame: startFrame,
                    levels: levels
                })
                
                if (response && response.stackFrames) {
                    const callStack = {
                        threadId: targetThreadId,
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
                        content: [{
                            type: 'text' as const,
                            text: JSON.stringify(callStack, null, 2)
                        }]
                    }
                }
            } catch (error) {
                console.log('Stack trace request failed:', error)
            }
            
            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({ message: 'Failed to get call stack' }, null, 2)
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

// 7. 변수/스코프 도구
export const getVariablesScopeTool = {
    name: 'get-variables-scope',
    config: {
        title: 'Get Variables and Scopes',
        description: 'Retrieve all variables in current scope',
        inputSchema: inputSchemas['get-variables-scope']
    },
    handler: async (args: any) => {
        try {
            const { frameId, scopeName } = args
            const session = vscode.debug.activeDebugSession
            
            if (!session) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ message: 'No active debug session' }, null, 2)
                    }]
                }
            }
            
            const activeStackItem = vscode.debug.activeStackItem
            if (!activeStackItem) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ message: 'No active stack frame' }, null, 2)
                    }]
                }
            }
            
            const targetFrameId = frameId || ('frameId' in activeStackItem ? (activeStackItem as any).frameId : undefined)
            
            try {
                const scopesResponse = await session.customRequest('scopes', {
                    frameId: targetFrameId
                })
                
                if (scopesResponse && scopesResponse.scopes) {
                    const allScopes = []
                    
                    for (const scope of scopesResponse.scopes) {
                        if (scopeName && scope.name !== scopeName) continue
                        
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
                        frameId: targetFrameId,
                        threadId: activeStackItem.threadId,
                        scopes: allScopes
                    }
                    
                    return {
                        content: [{
                            type: 'text' as const,
                            text: JSON.stringify(result, null, 2)
                        }]
                    }
                }
            } catch (error) {
                console.log('Variables and scopes request failed:', error)
            }
            
            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({ message: 'Failed to get variables and scopes' }, null, 2)
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

// 8. 스레드 목록 도구
export const getThreadListTool = {
    name: 'get-thread-list',
    config: {
        title: 'Get Thread List',
        description: 'Retrieve all threads in debug session',
        inputSchema: inputSchemas['get-thread-list']
    },
    handler: async (args: any) => {
        try {
            const session = vscode.debug.activeDebugSession
            
            if (!session) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ message: 'No active debug session' }, null, 2)
                    }]
                }
            }
            
            try {
                const response = await session.customRequest('threads')
                
                if (response && response.threads) {
                    const threadList = {
                        sessionId: session.id,
                        sessionName: session.name,
                        sessionType: session.type,
                        threads: response.threads.map((thread: any) => ({
                            id: thread.id,
                            name: thread.name,
                            presentationHint: thread.presentationHint
                        }))
                    }
                    
                    return {
                        content: [{
                            type: 'text' as const,
                            text: JSON.stringify(threadList, null, 2)
                        }]
                    }
                }
            } catch (error) {
                console.log('Threads request failed:', error)
            }
            
            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({ message: 'Failed to get thread list' }, null, 2)
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

// 9. 예외 정보 도구
export const getExceptionInfoTool = {
    name: 'get-exception-info',
    config: {
        title: 'Get Exception Information',
        description: 'Retrieve exception details and stack trace',
        inputSchema: inputSchemas['get-exception-info']
    },
    handler: async (args: any) => {
        try {
            const { limit, includeStackTrace } = args
            const session = vscode.debug.activeDebugSession
            
            if (!session) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ message: 'No active debug session' }, null, 2)
                    }]
                }
            }
            
            // DAP 메시지 수집이 비활성화되어 예외 정보를 수집할 수 없음
            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({
                        message: 'Exception information collection is disabled for performance optimization',
                        sessionId: session.id,
                        sessionName: session.name,
                        exceptions: [],
                        totalExceptions: 0
                    }, null, 2)
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

// 10. VSCode 인스턴스 선택 도구
export const selectVSCodeInstanceTool = {
    name: 'select-vscode-instance',
    config: {
        title: 'Select VSCode Instance',
        description: 'Select a specific VSCode instance to connect to',
        inputSchema: inputSchemas['select-vscode-instance']
    },
    handler: async (args: any) => {
        try {
            const { port, workspace } = args
            
            // 글로벌 레지스트리 읽기
            const registryPath = path.join(os.homedir(), '.mcp-debug-tools', 'active-configs.json')
            
            if (!fs.existsSync(registryPath)) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({
                            message: 'No active VSCode instances found',
                            registryPath: registryPath
                        }, null, 2)
                    }]
                }
            }
            
            const registryData = fs.readFileSync(registryPath, 'utf8')
            const registry = JSON.parse(registryData)
            
            // 활성 인스턴스 필터링
            const activeInstances = (registry.activeInstances || []).filter((entry: RegistryEntry) => {
                if (fs.existsSync(entry.configPath)) {
                    try {
                        const configData = fs.readFileSync(entry.configPath, 'utf8')
                        const config = JSON.parse(configData) as WorkspaceConfig
                        
                        // PID 체크만 수행
                        try {
                            process.kill(config.pid, 0)
                            return true // 프로세스가 살아있으면 활성
                        } catch {
                            return false
                        }
                    } catch {
                        return false
                    }
                }
                return false
            })
            
            if (activeInstances.length === 0) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ message: 'No active VSCode instances found' }, null, 2)
                    }]
                }
            }
            
            // 포트나 workspace로 선택
            let selectedInstance = null
            
            if (port) {
                selectedInstance = activeInstances.find((i: RegistryEntry) => i.port === port)
            } else if (workspace) {
                selectedInstance = activeInstances.find((i: RegistryEntry) =>
                    i.workspacePath === workspace || i.workspaceName === workspace
                )
            }
            
            if (selectedInstance) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({
                            message: 'VSCode instance selected',
                            instance: {
                                port: selectedInstance.port,
                                workspaceName: selectedInstance.workspaceName,
                                workspacePath: selectedInstance.workspacePath,
                                pid: selectedInstance.pid,
                                connectionUrl: `http://localhost:${selectedInstance.port}/mcp`
                            },
                            recommendation: `Use --port=${selectedInstance.port} when running the CLI`
                        }, null, 2)
                    }]
                }
            } else {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({
                            message: 'No matching VSCode instance found',
                            availableInstances: activeInstances.map((i: RegistryEntry) => ({
                                port: i.port,
                                workspaceName: i.workspaceName,
                                workspacePath: i.workspacePath
                            }))
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

// 11. Workspace 정보 조회 도구
export const getWorkspaceInfoTool = {
    name: 'get-workspace-info',
    config: {
        title: 'Get Workspace Information',
        description: 'Get information about the current workspace',
        inputSchema: inputSchemas['get-workspace-info']
    },
    handler: async (args: any) => {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
            
            if (!workspaceFolder) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ message: 'No workspace folder open' }, null, 2)
                    }]
                }
            }
            
            // 설정 파일 확인
            const configPath = path.join(workspaceFolder.uri.fsPath, '.mcp-debug-tools', 'config.json')
            let configInfo = null
            
            if (fs.existsSync(configPath)) {
                try {
                    const configData = fs.readFileSync(configPath, 'utf8')
                    const config = JSON.parse(configData) as WorkspaceConfig
                    // PID 체크로 활성 상태 확인
                    let isAlive = false
                    try {
                        process.kill(config.pid, 0)
                        isAlive = true
                    } catch {
                        isAlive = false
                    }
                    
                    configInfo = {
                        port: config.port,
                        pid: config.pid,
                        isAlive: isAlive
                    }
                } catch (error) {
                    configInfo = { error: 'Failed to read config file' }
                }
            }
            
            const workspaceInfo = {
                name: workspaceFolder.name,
                path: workspaceFolder.uri.fsPath,
                configFile: configPath,
                configStatus: configInfo || 'No config file',
                serverInfo: {
                    isRunning: state.isServerRunning(),
                    port: state.currentPort,
                    sessionCount: state.getTransportCount(),
                    uptime: state.getUptime()
                }
            }
            
            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify(workspaceInfo, null, 2)
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

// 12. VSCode 인스턴스 목록 도구
export const listVSCodeInstancesTool = {
    name: 'list-vscode-instances',
    config: {
        title: 'List VSCode Instances',
        description: 'List all active VSCode instances with debug proxy',
        inputSchema: inputSchemas['list-vscode-instances']
    },
    handler: async (args: any) => {
        try {
            const registryPath = path.join(os.homedir(), '.mcp-debug-tools', 'active-configs.json')
            
            if (!fs.existsSync(registryPath)) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({
                            message: 'No registry file found',
                            instances: []
                        }, null, 2)
                    }]
                }
            }
            
            const registryData = fs.readFileSync(registryPath, 'utf8')
            const registry = JSON.parse(registryData)
            
            // 활성 인스턴스 확인 및 상세 정보 수집
            const instances = []
            
            for (const entry of (registry.activeInstances || [])) {
                if (fs.existsSync(entry.configPath)) {
                    try {
                        const configData = fs.readFileSync(entry.configPath, 'utf8')
                        const config = JSON.parse(configData) as WorkspaceConfig
                        
                        // PID 체크만 수행
                        let isAlive = false
                        try {
                            process.kill(config.pid, 0)
                            isAlive = true
                        } catch {
                            isAlive = false
                        }
                        
                        if (isAlive) {
                            instances.push({
                                port: config.port,
                                workspaceName: config.workspaceName,
                                workspacePath: config.workspacePath,
                                pid: config.pid,
                                instanceId: config.vscodeInstanceId,
                                status: 'active',
                                connectionUrl: `http://localhost:${config.port}/mcp`
                            })
                        } else {
                            instances.push({
                                port: config.port,
                                workspaceName: config.workspaceName,
                                workspacePath: config.workspacePath,
                                pid: config.pid,
                                instanceId: config.vscodeInstanceId,
                                status: 'stale',
                                reason: 'process not found'
                            })
                        }
                    } catch (error) {
                        // 설정 파일 읽기 실패
                        instances.push({
                            workspaceName: entry.workspaceName,
                            workspacePath: entry.workspacePath,
                            status: 'error',
                            error: 'Failed to read config file'
                        })
                    }
                } else {
                    // 설정 파일 없음
                    instances.push({
                        workspaceName: entry.workspaceName,
                        workspacePath: entry.workspacePath,
                        status: 'missing',
                        configPath: entry.configPath
                    })
                }
            }
            
            // 현재 VSCode 인스턴스 정보 추가
            const currentWorkspace = vscode.workspace.workspaceFolders?.[0]
            const currentInfo = currentWorkspace ? {
                currentInstance: {
                    workspaceName: currentWorkspace.name,
                    workspacePath: currentWorkspace.uri.fsPath,
                    serverRunning: state.isServerRunning(),
                    port: state.currentPort
                }
            } : {}
            
            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({
                        ...currentInfo,
                        totalInstances: instances.length,
                        activeInstances: instances.filter(i => i.status === 'active').length,
                        instances: instances
                    }, null, 2)
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

// 모든 도구 export
export const allTools = [
    addBreakpointTool,
    addBreakpointsTool,
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
    selectDebugConfigTool,
    
    // 새로운 도구들 추가
    getDapLogTool,
    getBreakpointsTool,
    getActiveSessionTool,
    getDebugConsoleTool,
    getActiveStackItemTool,
    getCallStackTool,
    getVariablesScopeTool,
    getThreadListTool,
    getExceptionInfoTool,
    
    // 새로운 Workspace 관련 도구들 추가
    selectVSCodeInstanceTool,
    getWorkspaceInfoTool,
    listVSCodeInstancesTool
]
