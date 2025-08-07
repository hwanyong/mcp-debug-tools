import { z } from 'zod'

export const inputSchemas = {
    'add-breakpoint': {
        file: z.string().describe('Relative path from workspace root'),
        line: z.number().int().min(1).describe('Line number (1-based)'),
        condition: z.string().optional().describe('Condition expression'),
        hitCondition: z.string().optional().describe('Hit count condition'),
        logMessage: z.string().optional().describe('Log message to output')
    },
    'add-breakpoints': {
        breakpoints: z.array(z.object({
            file: z.string().describe('Relative path from workspace root'),
            line: z.number().int().min(1).describe('Line number (1-based)'),
            condition: z.string().optional().describe('Condition expression'),
            hitCondition: z.string().optional().describe('Hit count condition'),
            logMessage: z.string().optional().describe('Log message to output')
        })).describe('Array of breakpoint configurations')
    },
    'remove-breakpoint': {
        file: z.string().describe('Relative path from workspace root'),
        line: z.number().int().min(1).describe('Line number (1-based)')
    },
    'clear-breakpoints': {
        files: z.array(z.string()).optional().describe('Array of relative paths from workspace root')
    },
    'start-debug': {
        config: z.string().describe('Configuration name from launch.json')
    },
    'evaluate-expression': {
        expression: z.string().describe('Expression to evaluate in debug context')
    },
    'inspect-variable': {
        variableName: z.string().describe('Name of the variable to inspect')
    },
    'list-debug-configs': {
        // 파라미터 없음
    },
    'select-debug-config': {
        configName: z.string().describe('Debug configuration name to select')
    },
    
    // 새로운 도구 스키마들
    'get-dap-log': {
        // 파라미터 없음 - 모든 DAP 로그 반환
    },
    
    'get-breakpoints': {
        // 파라미터 없음 - 모든 브레이크포인트 반환
    },
    
    'get-active-session': {
        // 파라미터 없음 - 활성 세션 정보 반환
    },
    
    'get-debug-console': {
        limit: z.number().optional().describe('Number of recent console messages to retrieve'),
        filter: z.string().optional().describe('Filter messages by type (output, error, etc.)')
    },
    
    'get-active-stack-item': {
        // 파라미터 없음 - 현재 활성 스택 아이템 반환
    },
    
    'get-call-stack': {
        threadId: z.number().optional().describe('Specific thread ID'),
        startFrame: z.number().optional().describe('Start frame index'),
        levels: z.number().optional().describe('Number of frames to retrieve')
    },
    
    'get-variables-scope': {
        frameId: z.number().optional().describe('Specific frame ID'),
        scopeName: z.string().optional().describe('Filter by scope name')
    },
    
    'get-thread-list': {
        // 파라미터 없음 - 모든 스레드 목록 반환
    },
    
    'get-exception-info': {
        limit: z.number().optional().describe('Number of recent exceptions to retrieve'),
        includeStackTrace: z.boolean().optional().describe('Include stack trace information')
    }
}