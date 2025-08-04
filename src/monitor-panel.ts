import * as vscode from 'vscode'
import { state } from './state'

/**
 * Create and show the monitoring panel
 */
export function createMonitoringPanel() {
    const panel = vscode.window.createWebviewPanel(
        'dapProxyMonitor',
        'DAP Proxy Monitor',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    )
    
    // Add to active panels list
    state.addPanel(panel)
    
    // Remove from list when panel is disposed
    panel.onDidDispose(() => {
        state.removePanel(panel)
    })
    
    // Handle messages from webview
    panel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
            case 'copyMcpConfig':
                copyMcpConfigToClipboard()
                break
            case 'refresh':
                updatePanel(panel)
                break
        }
    })
    
    panel.webview.html = getWebviewContent()
}

/**
 * Update all active panels
 */
export function updateAllPanels() {
    state.activePanels.forEach(panel => updatePanel(panel))
}

/**
 * Update a specific panel
 */
function updatePanel(panel: vscode.WebviewPanel) {
    if (panel.webview) {
        panel.webview.html = getWebviewContent()
    }
}

/**
 * Get current server status information
 */
function getServerStatus() {
    return {
        isRunning: state.isServerRunning(),
        port: state.currentPort,
        startTime: state.serverStartTime?.toLocaleString('ko-KR'),
        uptime: state.getUptime(),
        sessionCount: state.getTransportCount(),
        messageCount: state.dapMessages.length
    }
}

/**
 * Generate mcp.json configuration for current server
 */
function generateMcpConfig(): string {
    if (!state.currentPort) {
        return 'MCP 서버가 아직 시작되지 않았습니다.'
    }
    
    const config = {
        "mcpServers": {
            "dap-proxy": {
                "command": "curl",
                "args": [
                    "-X", "POST",
                    `http://localhost:${state.currentPort}/mcp`,
                    "-H", "Content-Type: application/json"
                ]
            }
        }
    }
    
    return JSON.stringify(config, null, 2)
}

/**
 * Copy MCP configuration to clipboard
 */
function copyMcpConfigToClipboard() {
    const config = generateMcpConfig()
    vscode.env.clipboard.writeText(config).then(() => {
        vscode.window.showInformationMessage('MCP 설정이 클립보드에 복사되었습니다!')
    })
}

/**
 * Generate HTML content for the monitoring panel
 */
function getWebviewContent(): string {
    const serverStatus = getServerStatus()
    const mcpConfig = generateMcpConfig()
    
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DAP Proxy Monitor</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 20px;
                    margin: 0;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    line-height: 1.6;
                }
                h1, h2 {
                    color: var(--vscode-titleBar-activeForeground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 10px;
                    margin-top: 30px;
                }
                .status-indicator {
                    display: inline-block;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    margin-right: 8px;
                }
                .status-running { background-color: #4CAF50; }
                .status-stopped { background-color: #f44336; }
                .info-grid {
                    display: grid;
                    grid-template-columns: auto 1fr;
                    gap: 10px 20px;
                    margin: 15px 0;
                    font-family: monospace;
                }
                .info-label {
                    font-weight: bold;
                    color: var(--vscode-symbolIcon-propertyForeground);
                }
                .code-block {
                    background-color: var(--vscode-textCodeBlock-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 15px;
                    margin: 10px 0;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    white-space: pre-wrap;
                    overflow-x: auto;
                }
                .button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 5px 5px 5px 0;
                    font-size: 13px;
                }
                .button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .refresh-btn {
                    float: right;
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
            </style>
        </head>
        <body>
            <h1>🔍 DAP Proxy Monitor 
                <button class="button refresh-btn" onclick="refresh()">🔄 새로고침</button>
            </h1>
            
            <h2>📊 MCP 서버 상태</h2>
            <div>
                <span class="status-indicator ${serverStatus.isRunning ? 'status-running' : 'status-stopped'}"></span>
                <strong>${serverStatus.isRunning ? '🟢 실행 중' : '🔴 중지됨'}</strong>
            </div>
            
            <div class="info-grid">
                <span class="info-label">포트:</span>
                <span>${serverStatus.port || '알 수 없음'}</span>
                
                <span class="info-label">시작 시간:</span>
                <span>${serverStatus.startTime || '알 수 없음'}</span>
                
                <span class="info-label">실행 시간:</span>
                <span>${serverStatus.uptime || '알 수 없음'}</span>
                
                <span class="info-label">활성 세션:</span>
                <span>${serverStatus.sessionCount}개</span>
                
                <span class="info-label">DAP 메시지:</span>
                <span>${serverStatus.messageCount}개</span>
            </div>
            
            <h2>🔗 MCP 연결 설정</h2>
            <p>현재 포트 기반으로 생성된 mcp.json 설정:</p>
            <div class="code-block">${mcpConfig}</div>
            <button class="button" onclick="copyMcpConfig()">📋 클립보드에 복사</button>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function copyMcpConfig() {
                    vscode.postMessage({command: 'copyMcpConfig'});
                }
                
                function refresh() {
                    vscode.postMessage({command: 'refresh'});
                }
                
                // Auto refresh every 5 seconds
                setInterval(refresh, 5000);
            </script>
        </body>
        </html>
    `
}
