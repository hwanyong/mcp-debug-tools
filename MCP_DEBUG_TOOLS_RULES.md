# MCP Debug Tools - AI Agent Usage Rules

## System Context
You have access to MCP Debug Tools, which provides comprehensive debugging capabilities through VSCode's Debug Adapter Protocol (DAP). These tools enable you to perform debugging operations programmatically within VSCode environments.

## Prerequisites Check
Before using any debugging tools, ensure:
1. VSCode with MCP Debug Tools extension is running
2. The target project is open in VSCode
3. A valid `launch.json` configuration exists in `.vscode/` folder
4. The CLI tool is properly connected (check with `list-vscode-instances`)

## Tool Categories and Usage Patterns

### 1. Session Management
**Always start with these tools to establish context:**
- `list-vscode-instances` - Check available VSCode instances first
- `select-vscode-instance` - Select the appropriate instance if multiple exist
- `get-workspace-info` - Verify you're in the correct workspace
- `list-debug-configs` - Review available debug configurations before starting

### 2. Breakpoint Management
**Setting breakpoints effectively:**
- Use `add-breakpoint` for single breakpoints with conditions
- Use `add-breakpoints` for bulk operations (automatically batched in groups of 5)
- Always specify relative paths from workspace root
- Line numbers are 1-based (not 0-based)
- Example workflow:
  ```
  1. add-breakpoint {file: "src/main.js", line: 42}
  2. add-breakpoint {file: "src/main.js", line: 50, condition: "count > 10"}
  3. list-breakpoints (verify placement)
  ```

### 3. Debug Session Control
**Proper session lifecycle:**
1. `start-debug` with a valid config name from launch.json
2. Wait for session to be active (check `get-active-session`)
3. Use execution controls (`continue`, `step-over`, `step-into`, `step-out`, `pause`)
4. Always `stop-debug` when finished to free resources

### 4. State Inspection
**Hierarchical inspection approach:**
1. Start with `get-debug-state` for overview
2. Use `get-call-stack` to understand execution context
3. Use `get-variables-scope` to see all variables in current scope
4. Use `inspect-variable` for specific variable details
5. Use `evaluate-expression` to test expressions in debug context

### 5. Error Handling
**When tools fail:**
- "No active debug session" → Start a debug session first
- "No active stack frame" → Ensure execution is paused at a breakpoint
- "No workspace folder open" → Verify VSCode has a folder open
- Connection errors → Check VSCode extension is running

## Best Practices

### Sequential Operations
Always perform operations in logical sequence:
```
1. Session Setup
   └─> Breakpoint Configuration
       └─> Start Debug
           └─> Execution Control
               └─> State Inspection
                   └─> Stop Debug
```

### Breakpoint Strategy
- Set breakpoints BEFORE starting debug session for reliability
- Use conditional breakpoints to reduce noise: `condition: "i === problematicIndex"`
- Use hit count conditions for loops: `hitCondition: "5"` (breaks on 5th hit)
- Group related breakpoints with `add-breakpoints` for efficiency

### Variable Inspection
- Use `get-variables-scope` first for broad overview
- Then `inspect-variable` for deep inspection of complex objects
- Use `evaluate-expression` for computed values or method calls
- Remember: Variable inspection only works when paused at breakpoint

### Performance Considerations
- Bulk operations are batched (5 items per batch)
- Use `get-dap-log` sparingly as it returns all messages
- Filter console output with `get-debug-console {filter: "Error"}`
- Clean up breakpoints after debugging with `clear-breakpoints`

## Common Debugging Workflows

### Finding a Bug
```
1. list-debug-configs
2. add-breakpoint at suspected location
3. start-debug with appropriate config
4. When breakpoint hits: get-variables-scope
5. step-over through code while inspecting state
6. evaluate-expression to test hypotheses
7. stop-debug when bug is identified
```

### Tracing Execution Flow
```
1. add-breakpoints at key function entry points
2. start-debug
3. continue between breakpoints
4. get-call-stack at each pause
5. Document the execution path
6. stop-debug
```

### Analyzing Data Transformation
```
1. add-breakpoint before transformation
2. add-breakpoint after transformation
3. start-debug
4. At first breakpoint: inspect-variable for input data
5. continue
6. At second breakpoint: inspect-variable for output data
7. Compare and analyze differences
```

## Error Recovery
If debugging becomes unresponsive:
1. `stop-debug` - Stop current session
2. `clear-breakpoints` - Remove all breakpoints
3. `list-vscode-instances` - Verify connection
4. Restart debugging workflow

## Important Limitations
- Only one debug session supported per VSCode instance
- Breakpoints must use workspace-relative paths
- Some DAP features depend on debugger type (Node.js, Python, etc.)
- Variable inspection requires active paused state
- File paths are case-sensitive on Unix systems

## Safety Rules
- Always stop debug sessions when complete
- Clear unnecessary breakpoints to avoid performance impact
- Don't evaluate expressions with side effects
- Be cautious with conditional breakpoints in hot code paths
- Verify workspace before making changes

Remember: These tools provide powerful debugging capabilities but require proper sequencing and error handling for effective use.