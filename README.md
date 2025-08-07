# MCP Debug Tools

A comprehensive debugging solution that combines VSCode extension and CLI tool for MCP-based debugging with DAP protocol support. This project enables AI tools like Cursor to access VSCode's debugging capabilities through the Model Context Protocol (MCP).

## ⚠️ Beta Testing Notice

**This program is currently in beta testing phase.** Please report any issues or provide feedback to help improve the tool.

**Contact:** [yoo.hwanyong@gmail.com](mailto:yoo.hwanyong@gmail.com)

## 🎯 Overview

MCP Debug Tools consists of two independent programs that work together to provide debugging capabilities:

1. **VSCode Extension (Server)**: Runs inside VSCode, provides HTTP server for MCP communication
2. **CLI Tool (Client)**: Standalone command-line tool that connects to the extension and exposes MCP services

## 📦 Two Distribution Methods

This project is distributed as **two independent programs**:

### 1. VSCode Extension (Server)

A VSCode extension distributed through the VSCode Marketplace that acts as the MCP server.

#### Installation

**⚠️ Prerequisite for MCP Usage**: You must install the VSCode extension before using the MCP CLI tool.

**Method 1: Install from VSCode Marketplace**
1. Open VSCode (or VSCode-based editors like Cursor, Windsurf, etc.)
2. Go to the Extensions view (Ctrl+Shift+X)
3. Search for "MCP Debug Tools"
4. Click "Install" on the extension by Hwanyong Yoo

**Method 2: Direct Marketplace Link**
- Visit: [MCP Debug Tools on VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=uhd.mcp-debug-tools)
- Click "Install" button
- The extension will be installed in your VSCode (including Cursor, Windsurf, and other VSCode-based editors)

**Method 3: Manual Installation**
```bash
# Download .vsix file and install manually
# 1. Download from marketplace
# 2. In VSCode: Ctrl+Shift+P → "Extensions: Install from VSIX"
# 3. Select the downloaded .vsix file
```

#### Features
- DAP message tracking and debugging tools
- HTTP server (port 8890) for MCP communication
- Monitoring panel and status bar integration
- MCP server role for external tools

### 2. CLI Tool (Client)

A command-line tool distributed as an npm package that acts as the MCP client.

#### Installation
```bash
# No installation required - runs via npx
# The tool is automatically downloaded and executed
```

#### Usage
```bash
# Run via npx (automatically downloads and executes)
npx @uhd_kr/mcp-debug-tools

# Specify custom port
npx @uhd_kr/mcp-debug-tools --port=8891

# Show help
npx @uhd_kr/mcp-debug-tools --help
```

#### MCP Configuration
Add to your `mcp.json` file:
```json
{
  "mcpServers": {
    "dap-proxy": {
      "command": "npx",
      "args": ["-y", "@uhd_kr/mcp-debug-tools", "--port=8890"],
      "env": {}
    }
  }
}
```

#### Features
- Connects to VSCode extension's HTTP server
- Acts as MCP client to extension, MCP server to AI tools
- Provides stdio-based MCP services to Cursor and other AI tools

## 🔄 Architecture

```
┌─────────────────┐    HTTP    ┌─────────────────┐    stdio    ┌─────────────────┐
│   VSCode        │ ──────────▶ │   CLI Tool      │ ──────────▶ │   Cursor/AI      │
│   Extension     │   (8890)    │   (MCP Client)  │             │   (MCP Client)   │
│   (MCP Server)  │             │   (MCP Server)  │             │                 │
└─────────────────┘             └─────────────────┘             └─────────────────┘
```

### Data Flow
1. **VSCode Extension** → Runs HTTP server (port 8890)
2. **CLI Tool** → Connects to extension via HTTP client
3. **CLI Tool** → Provides MCP services to AI tools via stdio

### Dependencies
- CLI Tool requires VSCode Extension to be running first
- Extension provides HTTP server, CLI acts as proxy

## 🚀 Use Cases

### 1. VSCode Extension Only
- Use debugging tools within VSCode
- Monitor DAP messages through monitoring panel
- Manage breakpoints and debug sessions

### 2. CLI Tool with Extension
1. Install and activate VSCode Extension
2. Configure MCP in your AI tool (e.g., Cursor)
3. Use debugging capabilities from AI tools via MCP

## 📋 Features

### Tools (Executable Commands)

#### Breakpoint Management
- `add-breakpoint` - Add breakpoint to specific file and line
- `remove-breakpoint` - Remove breakpoint from specific file and line
- `list-breakpoints` - List all breakpoints in workspace
- `add-breakpoints` - Add multiple breakpoints at once
- `clear-breakpoints` - Remove all breakpoints or breakpoints from specific files

#### Debug Control
- `start-debug` - Start debug session with configuration
- `stop-debug` - Stop active debug session
- `continue` - Continue execution
- `step-over` - Step over current line
- `step-into` - Step into function
- `step-out` - Step out of function
- `pause` - Pause execution

#### Variable and Expression Tools
- `evaluate-expression` - Evaluate expression in debug context
- `inspect-variable` - Get detailed information about a specific variable

#### Debug Configuration Management
- `list-debug-configs` - List all available debug configurations from launch.json
- `select-debug-config` - Select a debug configuration by name

#### Status Queries
- `get-debug-state` - Get current debug session state

### Resources (Read-only Information)

#### Core Debug Information
- `dap-log://current` - DAP protocol message log
- `debug://breakpoints` - Current breakpoint information
- `debug://active-session` - Active debug session details
- `debug://console` - Debug console output
- `debug://active-stack-item` - Current stack frame information

#### Advanced Debug Information
- `debug://call-stack` - Complete call stack information
- `debug://variables-scope` - All variables in current scope
- `debug://thread-list` - All threads in debug session
- `debug://exception-info` - Exception details and stack trace

### New Tools (Latest Additions)

#### Variable Inspection Tools
- `get-variables-scope` - Retrieve all variables in current scope with detailed information
- `get-call-stack` - Get complete call stack with frame details
- `get-thread-list` - Retrieve all threads with their states

#### Debug Session Information
- `get-dap-log` - Retrieve all DAP protocol messages for analysis
- `get-active-session` - Get detailed information about the currently active debug session
- `get-debug-console` - Retrieve recent debug console output with filtering options
- `get-active-stack-item` - Get currently focused thread or stack frame information

#### Exception Handling
- `get-exception-info` - Retrieve exception details and stack trace with comprehensive error information

#### Enhanced Breakpoint Management
- `get-breakpoints` - Retrieve all current breakpoints with detailed properties (condition, hitCondition, logMessage)

## 🔧 Technical Details

### MCP Protocol Integration
- Uses Model Context Protocol for AI tool communication
- HTTP-based transport between extension and CLI
- stdio-based transport between CLI and AI tools

### DAP Protocol Support
- Tracks Debug Adapter Protocol messages
- Provides debugging capabilities through DAP
- Supports multiple debugger types

### Architecture Components
- **Extension**: VSCode extension with HTTP server
- **CLI**: Standalone tool with MCP client/server
- **State Management**: Global state for sessions and messages
- **Tools**: MCP tools for debugging operations
- **Resources**: MCP resources for debugging information

## ⚠️ Important Notes

### Prerequisites
1. **CLI Tool Usage**: VSCode Extension must be running first
2. **Port Conflicts**: Default port 8890, ensure no conflicts
3. **Dependencies**: CLI Tool depends on Extension's HTTP server

### Current Limitations
- **Single Session Support**: Only one debugging session per server is supported
- **Multiple Sessions**: For multiple simultaneous debugging sessions, you need to change the port in MCP configuration
- **VSCode Debug API limitations**: High-level API only
- **DAP message parsing**: Read-only, no direct transmission
- **Real-time synchronization**: Constraints due to MCP protocol
- **Debugger-specific features**: Depend on individual debugger support

### Security Considerations
- HTTP server runs on localhost only
- No authentication required for local development
- DNS rebinding protection disabled for local use

## 📝 Configuration

### Extension Settings
- Server port configuration (default: 8890)
- Logging level settings
- Panel update frequency

### CLI Tool Options
- `--port=<number>` - Specify server port
- `--domain=<url>` - Specify server domain
- `--help, -h` - Show help information

### MCP Configuration
For AI tools like Cursor, add to your `mcp.json`:
```json
{
  "mcpServers": {
    "dap-proxy": {
      "command": "npx",
      "args": ["-y", "@uhd_kr/mcp-debug-tools", "--port=8890"],
      "env": {}
    }
  }
}
```

### Multiple Debugging Sessions
To run multiple debugging sessions simultaneously, modify your MCP configuration with different ports:
```json
{
  "mcpServers": {
    "dap-proxy": {
      "command": "npx",
      "args": ["-y", "@uhd_kr/mcp-debug-tools", "--port=8891"], // other port
      "env": {}
    }
  }
}
```

## 🚀 Getting Started

### Quick Start
1. Install VSCode Extension from Marketplace
2. Activate extension in VSCode
3. Configure MCP in your AI tool (e.g., Cursor)
4. Use debugging features from AI tools via MCP

## 📊 Performance Considerations

### Memory Management
- DAP message accumulation disabled to prevent memory leaks
- Session cleanup on transport close
- Automatic garbage collection for old messages

### Scalability
- Multiple session support
- Concurrent transport handling
- Efficient message parsing

## 🔮 Future Enhancements

### Planned Features
- **Multi-Session Support**: Support for multiple debugging sessions on a single server - This will allow you to debug multiple applications simultaneously without needing separate MCP configurations
- **Customizable Data Structures**: Unified tool integration to reduce frequent tool calls - This feature will consolidate multiple tools into one, optimizing performance and reducing the overhead of multiple tool invocations
- Variable inspection and modification
- Call stack analysis
- Thread management
- Exception handling
- Module information
- Watch expressions

### Architecture Improvements
- WebSocket support for real-time updates
- Enhanced error handling
- Better session management
- Performance optimizations

*These features are expected to significantly improve the debugging experience and tool efficiency.*

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](https://github.com/hwanyong/mcp-debug-tools/blob/main/LICENSE) file for details.

**Key Terms:**
- ✅ **Free to use, modify, and distribute**
- ✅ **Source code must be shared when distributing modified versions**
- ✅ **Commercial use allowed with source code sharing**
- ✅ **Network use (web services) also requires source code sharing**

For more information about GPL v3, visit: https://www.gnu.org/licenses/gpl-3.0.html

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

## 📚 Documentation

- [VSCode Extension API](https://code.visualstudio.com/api/references/vscode-api#debug)
- [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/)
- [MCP Specification](https://modelcontextprotocol.io/)

## 🐛 Known Issues

- Some DAP features require custom request API (not yet available)
- Real-time updates limited by MCP protocol constraints
- Debugger-specific features depend on individual debugger support

## 📞 Support

For issues and questions:
- Create GitHub issue
- Check existing documentation
- Review implementation plan in `/docs` folder
- **Contact:** [yoo.hwanyong@gmail.com](mailto:yoo.hwanyong@gmail.com)

---

**Enjoy debugging with MCP!**
