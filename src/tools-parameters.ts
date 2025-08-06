import { z } from 'zod'

export const inputSchemas = {
    'add-breakpoint': {
        file: z.string().describe('Relative path from workspace root'),
        line: z.number().int().min(1).describe('Line number (1-based)'),
        condition: z.string().optional().describe('Condition expression'),
        hitCondition: z.string().optional().describe('Hit count condition'),
        logMessage: z.string().optional().describe('Log message to output')
    },
    'remove-breakpoint': {
        file: z.string().describe('Relative path from workspace root'),
        line: z.number().int().min(1).describe('Line number (1-based)')
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
    }
}