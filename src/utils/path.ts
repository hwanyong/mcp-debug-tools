import * as vscode from 'vscode'
import * as path from 'path'

/**
 * Get the current workspace root path
 */
export function getWorkspaceRoot(): string {
    // Try to get from active debug session first
    const activeSession = vscode.debug.activeDebugSession
    if (activeSession && activeSession.workspaceFolder) {
        return activeSession.workspaceFolder.uri.fsPath
    }
    
    // Fallback to first workspace folder
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        return vscode.workspace.workspaceFolders[0].uri.fsPath
    }
    
    throw new Error('No workspace folder found. Please open a workspace or folder in VS Code.')
}

/**
 * Convert absolute path to relative path from workspace root
 */
export function getRelativePath(absolutePath: string): string {
    try {
        const workspaceRoot = getWorkspaceRoot()
        const relativePath = path.relative(workspaceRoot, absolutePath)
        
        // If the relative path goes outside workspace (starts with ..), return absolute path
        if (relativePath.startsWith('..')) {
            return absolutePath
        }
        
        return relativePath
    } catch (error) {
        // If we can't get workspace root, return absolute path
        return absolutePath
    }
}
