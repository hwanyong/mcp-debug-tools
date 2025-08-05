import { z } from 'zod'

export const inputSchemas = {
    'add-breakpoint': {
        file: z.string().describe('Relative path from workspace root'),
        line: z.number().int().min(1).describe('Line number (1-based)')
    },
    'remove-breakpoint': {
        file: z.string().describe('Relative path from workspace root'),
    },
    'start-debug': {
        config: z.string().describe('Configuration name from launch.json')
    },
    'evaluate-expression': {
        expression: z.string().describe('Expression to evaluate in debug context')
    },
    'inspect-variable': {
        variableName: z.string().describe('Name of the variable to inspect')
    }
}