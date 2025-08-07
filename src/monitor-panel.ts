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
            case 'startServer':
                vscode.commands.executeCommand('dap-proxy.startServer')
                break
            case 'stopServer':
                vscode.commands.executeCommand('dap-proxy.stopServer')
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
        host: 'localhost',
        port: state.currentPort,
        fullUrl: state.currentPort ? `http://localhost:${state.currentPort}` : null,
        startTime: state.serverStartTime?.toLocaleString('en-US'),
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
        return 'MCP server has not started yet.'
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
        vscode.window.showInformationMessage('MCP configuration has been copied to clipboard!')
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
                .beta-notice {
                    background-color: var(--vscode-textBlockQuote-background);
                    border-left: 4px solid #ff9800;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .warning-box {
                    background-color: var(--vscode-inputValidation-warningBackground);
                    border: 1px solid var(--vscode-inputValidation-warningBorder);
                    border-radius: 4px;
                    padding: 15px;
                    margin: 15px 0;
                }
                .info-box {
                    background-color: var(--vscode-textBlockQuote-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 15px;
                    margin: 15px 0;
                }
                .feature-list {
                    margin: 10px 0;
                    padding-left: 20px;
                }
                .feature-list li {
                    margin: 8px 0;
                }
                .email-link {
                    color: var(--vscode-textLink-foreground);
                    text-decoration: none;
                }
                .email-link:hover {
                    text-decoration: underline;
                }
                .section-divider {
                    border-top: 1px solid var(--vscode-panel-border);
                    margin: 30px 0;
                }
            </style>
        </head>
        <body>
            <h1>🔍 DAP Proxy Monitor 
                <button class="button refresh-btn" onclick="refresh()">🔄 Refresh</button>
            </h1>
            
            <div class="beta-notice">
                <strong>⚠️ Beta Testing Notice</strong><br>
                This program is currently in beta testing phase. Please report any issues or provide feedback.
            </div>
            
            <h2>📊 MCP Server Status</h2>
            <div>
                <span class="status-indicator ${serverStatus.isRunning ? 'status-running' : 'status-stopped'}"></span>
                <strong>${serverStatus.isRunning ? '🟢 Running' : '🔴 Stopped'}</strong>
                
                <!-- 서버 제어 버튼 추가 -->
                <div style="margin-top: 15px;">
                    ${serverStatus.isRunning ? 
                        '<button class="button" onclick="stopServer()" style="background-color: #f44336;">🛑 Stop Server</button>' :
                        '<button class="button" onclick="startServer()" style="background-color: #4CAF50;">▶️ Start Server</button>'
                    }
                </div>
            </div>
            
            <div class="info-grid">
                <span class="info-label">Host:</span>
                <span>${serverStatus.host}</span>
                
                <span class="info-label">Port:</span>
                <span>${serverStatus.port || 'Unknown'}</span>
                
                <span class="info-label">Server URL:</span>
                <span>${serverStatus.fullUrl || 'Not available'}</span>
                
                <span class="info-label">Start Time:</span>
                <span>${serverStatus.startTime || 'Unknown'}</span>
                
                <span class="info-label">Uptime:</span>
                <span>${serverStatus.uptime || 'Unknown'}</span>
                
                <span class="info-label">Active Sessions:</span>
                <span>${serverStatus.sessionCount}</span>
                
                <span class="info-label">DAP Messages:</span>
                <span>${serverStatus.messageCount}</span>
            </div>
            
            <div class="warning-box">
                <strong>⚠️ Current Limitations</strong><br>
                • Only one debugging session per server is supported<br>
                • For multiple simultaneous debugging sessions, you need to change the port in MCP configuration
            </div>
            
            <h2>🔧 Multiple Debugging Sessions</h2>
            <p>To run multiple debugging sessions simultaneously, modify your MCP configuration with different ports:</p>
            <div class="code-block">{
  "mcpServers": {
    "dap-proxy": {
      "command": "node",
      "args": [
        "/Users/uhd/Projects/mcp-dap-vscode/Package/mcp-debug-tools/out/cli.js",
        "--port=8890"
      ]
    }
  }
}</div>
            
            <div class="section-divider"></div>
            
            <h2>📧 Feedback</h2>
            <div class="info-box">
                <p>We welcome your feedback and suggestions for improvement!</p>
                <p><strong>Contact:</strong> <a href="mailto:yoo.hwanyong@gmail.com" class="email-link">yoo.hwanyong@gmail.com</a></p>
            </div>
            
            <h2>🚀 Upcoming Features</h2>
            <div class="info-box">
                <p><strong>Features currently under development:</strong></p>
                <ul class="feature-list">
                    <li><strong>Multi-Session Support:</strong> Support for multiple debugging sessions on a single server - This will allow you to debug multiple applications simultaneously without needing separate MCP configurations.</li>
                    <li><strong>Customizable Data Structures:</strong> Unified tool integration to reduce frequent tool calls - This feature will consolidate multiple tools into one, optimizing performance and reducing the overhead of multiple tool invocations.</li>
                </ul>
                <p><em>These features are expected to significantly improve the debugging experience and tool efficiency.</em></p>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function copyMcpConfig() {
                    vscode.postMessage({command: 'copyMcpConfig'});
                }
                
                function refresh() {
                    vscode.postMessage({command: 'refresh'});
                }
                
                function startServer() {
                    vscode.postMessage({command: 'startServer'});
                }
                
                function stopServer() {
                    vscode.postMessage({command: 'stopServer'});
                }
                
                // Auto refresh every 5 seconds
                setInterval(refresh, 5000);
            </script>
        </body>
        </html>
    `
}
