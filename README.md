# MCP Debug Tools

A bridge solution that enables AI tools (Cursor, Windsurf, etc.) to access VSCode's debugging capabilities. Connects Model Context Protocol (MCP) with Debug Adapter Protocol (DAP) to allow AI to perform debugging tasks.

## ⚠️ Beta Testing

Currently in beta testing. Please report any issues or feedback.

**Contact:** [yoo.hwanyong@gmail.com](mailto:yoo.hwanyong@gmail.com)

## 🎯 Key Features

### Debug Control
- **Breakpoint Management**: Add/remove conditional breakpoints, bulk operations
- **Execution Control**: Start/stop debug, continue/pause, Step Into/Over/Out
- **Variable Inspection**: Check values, evaluate expressions, scope analysis
- **Stack Tracing**: Call stack, thread management, exception information

### Auto-Connection System
- Automatic VSCode instance discovery and connection
- Multiple VSCode windows support
- Workspace-based configuration management
- Real-time heartbeat monitoring

## 📦 Installation

### 1. VSCode Extension (Required)

Provides debugging capabilities as a server in VSCode.

**Method 1: VSCode Marketplace**
```
1. Open VSCode Extensions tab (Ctrl+Shift+X)
2. Search for "MCP Debug Tools"
3. Click Install
```

**Method 2: Direct Link**
- [MCP Debug Tools on VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=uhd.mcp-debug-tools)

### 2. CLI Tool

Client that connects AI tools with VSCode.

```bash
# Run directly with npx (no installation needed)
npx @uhd_kr/mcp-debug-tools
```

## 🔧 Configuration

### MCP Setup (Cursor/Windsurf)

Add to `mcp.json` or configuration file:

```json
{
  "mcpServers": {
    "dap-proxy": {
      "command": "npx",
      "args": ["-y", "@uhd_kr/mcp-debug-tools"],
      "env": {}
    }
  }
}
```

### CLI Options

```bash
# Auto-connect (recommended)
npx @uhd_kr/mcp-debug-tools

# Specify port
npx @uhd_kr/mcp-debug-tools --port=8891

# Disable auto-discovery
npx @uhd_kr/mcp-debug-tools --no-auto
```

## 🛠️ Supported Features

### MCP Tools (Executable Commands)

#### Breakpoint Management
- `add-breakpoint` - Add breakpoint with conditional support
- `add-breakpoints` - Add multiple breakpoints at once
- `remove-breakpoint` - Remove specific breakpoint
- `clear-breakpoints` - Clear all/specific file breakpoints
- `list-breakpoints` - List all breakpoints

#### Debug Control
- `start-debug` - Start debug session
- `stop-debug` - Stop debug session
- `continue` - Continue execution
- `step-over` - Step over line
- `step-into` - Step into function
- `step-out` - Step out of function
- `pause` - Pause execution

#### State Inspection
- `get-debug-state` - Debug session state
- `evaluate-expression` - Evaluate expression
- `inspect-variable` - Variable details
- `get-variables-scope` - All variables in scope
- `get-call-stack` - Call stack information
- `get-thread-list` - Thread list
- `get-exception-info` - Exception information

#### Configuration Management
- `list-debug-configs` - List launch.json configurations
- `select-debug-config` - Select debug configuration

#### Workspace Management
- `select-vscode-instance` - Select VSCode instance
- `list-vscode-instances` - List active instances
- `get-workspace-info` - Workspace information

### MCP Resources (Read-only Information)

- `dap-log://current` - DAP protocol message log
- `debug://breakpoints` - Current breakpoint information
- `debug://active-session` - Active debug session info
- `debug://console` - Debug console output
- `debug://call-stack` - Call stack information
- `debug://variables-scope` - Variable scope information

## 🏗️ Architecture

```
┌─────────────┐    HTTP    ┌─────────────┐    stdio   ┌─────────────┐
│   VSCode    │ ◄────────► │  CLI Tool   │ ◄────────► │ AI Tool     │
│  Extension  │   (8890)   │             │            │ (Cursor)    │
└─────────────┘            └─────────────┘            └─────────────┘
```

### Auto-Connection Mechanism

1. **Workspace Config**: `.mcp-debug-tools/config.json` - Stores VSCode connection info
2. **Global Registry**: `~/.mcp-debug-tools/active-configs.json` - Tracks all active instances
3. **Heartbeat**: 5-second interval liveness updates
4. **PID Verification**: Process status checking

## 🚀 Getting Started

1. Install VSCode Extension
2. Open project in VSCode
3. Add to AI tool's MCP configuration
4. Use debugging commands in AI tool

## 💡 Common Use Cases

### 1. Finding and Fixing Bugs
Ask your AI assistant to help debug your code:
```
"There's an error in my calculateTotal function. Can you set breakpoints
at the start of the function and step through to find the issue?"
```
The AI will:
- Set breakpoints in the problematic function
- Start debug session
- Step through code line by line
- Inspect variables to identify the bug
- Suggest fixes based on the debugging data

### 2. Understanding Complex Code Flow
When exploring unfamiliar codebases:
```
"I need to understand how the authentication flow works. Can you trace
through the login process step by step?"
```
The AI will:
- Identify key authentication functions
- Set strategic breakpoints
- Run through the authentication flow
- Explain each step with actual runtime data
- Show how data transforms through the process

### 3. Validating Data Processing
For data transformation pipelines:
```
"Please verify that my data transformation pipeline correctly processes
the input array and produces the expected output format"
```
The AI will:
- Set breakpoints at transformation stages
- Inspect input data structure
- Monitor data changes at each step
- Validate output against requirements
- Identify any data integrity issues

### 4. Performance Bottleneck Detection
Finding performance issues:
```
"My application is running slowly. Can you help identify which functions
are taking the most time during execution?"
```
The AI will:
- Set breakpoints at function entry/exit points
- Monitor execution flow
- Identify functions called frequently
- Suggest optimization opportunities
- Highlight potential bottlenecks

### 5. Exception Handling Analysis
Debugging runtime errors:
```
"My app crashes with an unhandled exception. Can you catch it and show
me the exact state when it occurs?"
```
The AI will:
- Monitor for exceptions
- Capture exception details and stack trace
- Show variable states at crash point
- Analyze the root cause
- Suggest error handling improvements

### 6. Test-Driven Debugging
Debugging failing tests:
```
"My unit test is failing. Can you debug the test execution and show me
why the assertion fails?"
```
The AI will:
- Run tests in debug mode
- Break at test assertions
- Compare expected vs actual values
- Trace back to the source of discrepancy
- Suggest test or code fixes

## 📊 Current Limitations

- Single debug session only (multi-session support planned)
- Some advanced features limited by VSCode Debug API
- DAP messages are read-only
- Real-time sync limited by MCP protocol constraints

## 🔮 Future Plans

### Short-term
- Multiple debug session support
- Watch expressions
- Memory viewer
- Module information

### Long-term
- WebSocket real-time updates
- Custom debugger adapter support
- Remote debugging
- Performance profiling tools

## 🐛 Troubleshooting

### CLI Can't Find VSCode
1. Verify VSCode Extension is active
2. Check `.mcp-debug-tools/config.json` exists
3. Try manual connection with `--port` option

### Multiple VSCode Windows
- CLI auto-selects based on current directory
- Use `list-vscode-instances` to check active instances
- Use `select-vscode-instance` to choose specific instance

## 📄 License

GNU General Public License v3.0 - [LICENSE](https://github.com/hwanyong/mcp-debug-tools/blob/main/LICENSE)

## 🤝 Contributing

Issues and Pull Requests welcome!

## 📚 References

- [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [VSCode Extension API](https://code.visualstudio.com/api)

---

**Enjoy debugging with AI! 🚀**