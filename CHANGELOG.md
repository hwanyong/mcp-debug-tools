# Change Log

All notable changes to the "mcp-debug-tools" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Released]

## [0.2.1] - 2025-09-16

### ⚠️ Important Configuration Change
- **MCP configuration now requires `@latest` tag for proper version management**
  ```json
  {
    "mcpServers": {
      "release-dap-proxy": {
        "command": "npx",
        "args": [
          "-y",
          "@uhd_kr/mcp-debug-tools@latest"
        ]
      }
    }
  }
  ```
  - Without `@latest` tag, npx may use cached outdated versions
  - This ensures you always get the most recent bug fixes and improvements
  - Previous configuration without version tag may cause timeout issues

### Added
- New test suites for MCP connection validation (`test-mcp-connection.js`)
- Comprehensive tool testing framework (`test-all-tools.js`)

### Changed
- **Major refactoring of configuration management and DAP message handling**
  - Simplified `config-manager.ts` and `registry-manager.ts` implementation
  - Optimized `resources.ts` for better performance (reduced from ~115 lines)
  - Improved `server.ts` architecture for better maintainability
  - Streamlined `tools.ts` implementation (reduced by ~180 lines)
- Enhanced package metadata across all package files
- Improved error handling in MCP client connections

### Fixed
- **Critical timeout issue when starting debug sessions** - Connection to VSCode instances is now more stable with improved heartbeat and retry mechanisms
- DAP message tracking performance optimization
- State management memory leaks in long-running sessions

### Performance
- Disabled debug console output collection for performance optimization
- Reduced overall codebase by ~400 lines while maintaining functionality
- Optimized resource handling and state management

## [0.1.5] - Previous releases
- Initial release with basic debugging capabilities
- VSCode extension for DAP-MCP bridge
- CLI tool for AI integration