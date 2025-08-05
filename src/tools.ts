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
    getDebugStateTool
]
