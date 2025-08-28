# Debug Adapter Protocol Specification

## Overview
The Debug Adapter Protocol (DAP) defines the protocol used between an editor or IDE and a debugger or runtime. It enables language-agnostic debugging support.

## Protocol Structure

### Base Protocol
- **ProtocolMessage**: Base class with `seq` and `type`
- **Request**: Client/adapter initiated request with `command` and `arguments`
- **Response**: Response with `success`, `command`, and `body`
- **Event**: Debug adapter initiated event with `event` and `body`

### Key Events
1. **Initialized**: Adapter ready to accept configuration
2. **Stopped**: Execution stopped (breakpoint, step, exception, etc.)
3. **Continued**: Execution resumed
4. **Thread**: Thread started/exited
5. **Output**: Target produced output
6. **Breakpoint**: Breakpoint information changed
7. **Module**: Module loaded/changed/removed
8. **Process**: Debugging new process

### Core Requests
1. **Initialize**: First request to configure adapter
2. **Launch/Attach**: Start debugging
3. **SetBreakpoints**: Set source breakpoints
4. **SetFunctionBreakpoints**: Set function breakpoints
5. **SetDataBreakpoints**: Set data breakpoints
6. **Continue/Next/StepIn/StepOut**: Execution control
7. **StackTrace**: Get call stack
8. **Scopes**: Get variable scopes
9. **Variables**: Get variables in scope
10. **Evaluate**: Evaluate expressions

### Advanced Features
- **Conditional Breakpoints**: `condition` property
- **Hit Conditional Breakpoints**: `hitCondition` property
- **Log Points**: `logMessage` property
- **Data Breakpoints**: Memory/variable watch
- **Instruction Breakpoints**: Assembly-level debugging
- **Memory Operations**: Read/write memory
- **Disassembly**: Instruction-level view
- **Reverse Debugging**: Step back, reverse continue

### Capabilities
Adapters advertise capabilities through `Capabilities` object:
- `supportsConfigurationDoneRequest`
- `supportsFunctionBreakpoints`
- `supportsConditionalBreakpoints`
- `supportsDataBreakpoints`
- `supportsStepBack`
- `supportsSetVariable`
- `supportsRestartFrame`
- `supportsCompletionsRequest`
- And many more...

### Type System
Rich type definitions for:
- **Breakpoint**: Verified status, location, message
- **Source**: File path or reference
- **StackFrame**: Call stack entry
- **Scope**: Variable scope (locals, arguments, etc.)
- **Variable**: Name/value with presentation hints
- **Thread**: Thread information
- **Module**: Loaded modules

### Variable References
- Objects use `variablesReference` for lazy loading
- References valid only while execution suspended
- Supports paging with `start` and `count`

### Presentation Hints
- **Variable kinds**: property, method, class, data, etc.
- **Variable attributes**: static, constant, readOnly, etc.
- **Variable visibility**: public, private, protected, etc.
