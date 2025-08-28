# VSCode Debug API Reference

## Namespace: `vscode.debug`

The debug namespace provides functionality for debugging in VSCode.

## Variables

### activeDebugConsole
- **Type**: `DebugConsole`
- **Description**: The currently active debug console. If no debug session is active, output sent to the debug console is not shown.

### activeDebugSession
- **Type**: `DebugSession | undefined`
- **Description**: The currently active debug session or `undefined`. The active debug session is the one represented by the debug action floating window or shown in the drop down menu.

### activeStackItem
- **Type**: `DebugThread | DebugStackFrame | undefined`
- **Description**: The currently focused thread or stack frame, or `undefined` if no thread or stack is focused. A thread can be focused any time there is an active debug session, while a stack frame can only be focused when a session is paused and the call stack has been retrieved.

### breakpoints
- **Type**: `readonly Breakpoint[]`
- **Description**: List of breakpoints.

## Events

### onDidChangeActiveDebugSession
- **Type**: `Event<DebugSession | undefined>`
- **Description**: Fires when the active debug session has changed. Also fires when the active debug session changes to `undefined`.

### onDidChangeActiveStackItem
- **Type**: `Event<DebugThread | DebugStackFrame | undefined>`
- **Description**: Fires when the `debug.activeStackItem` has changed.

### onDidChangeBreakpoints
- **Type**: `Event<BreakpointsChangeEvent>`
- **Description**: Emitted when the set of breakpoints is added, removed, or changed.

### onDidReceiveDebugSessionCustomEvent
- **Type**: `Event<DebugSessionCustomEvent>`
- **Description**: Fires when a custom DAP event is received from the debug session.

### onDidStartDebugSession
- **Type**: `Event<DebugSession>`
- **Description**: Fires when a new debug session has been started.

### onDidTerminateDebugSession
- **Type**: `Event<DebugSession>`
- **Description**: Fires when a debug session has terminated.

## Functions

### addBreakpoints(breakpoints)
- **Parameters**: 
  - `breakpoints: readonly Breakpoint[]` - The breakpoints to add
- **Returns**: `void`
- **Description**: Add breakpoints.

### removeBreakpoints(breakpoints)
- **Parameters**: 
  - `breakpoints: readonly Breakpoint[]` - The breakpoints to remove
- **Returns**: `void`
- **Description**: Remove breakpoints.

### startDebugging(folder, nameOrConfiguration, parentSessionOrOptions?)
- **Parameters**:
  - `folder: WorkspaceFolder` - The workspace folder for looking up named configurations
  - `nameOrConfiguration: string | DebugConfiguration` - Either the name of a debug/compound configuration or a DebugConfiguration object
  - `parentSessionOrOptions?: DebugSession | DebugSessionOptions` - Debug session options or parent session
- **Returns**: `Thenable<boolean>`
- **Description**: Start debugging by using either a named launch/compound configuration or by directly passing a DebugConfiguration. Named configurations are looked up in '.vscode/launch.json'.

### stopDebugging(session?)
- **Parameters**:
  - `session?: DebugSession` - The debug session to stop; if omitted all sessions are stopped
- **Returns**: `Thenable<void>`
- **Description**: Stop the given debug session or stop all debug sessions if session is omitted.

### asDebugSourceUri(source, session?)
- **Parameters**:
  - `source: DebugProtocolSource` - An object conforming to the Source type defined in DAP
  - `session?: DebugSession` - Optional debug session for reference-based sources
- **Returns**: `Uri`
- **Description**: Converts a "Source" descriptor object received via the Debug Adapter Protocol into a Uri that can be used to load its contents.

### registerDebugConfigurationProvider(debugType, provider, triggerKind?)
- **Parameters**:
  - `debugType: string` - The debug type for which the provider is registered
  - `provider: DebugConfigurationProvider` - The debug configuration provider to register
  - `triggerKind?: DebugConfigurationProviderTriggerKind` - The trigger for 'provideDebugConfiguration' method
- **Returns**: `Disposable`
- **Description**: Register a debug configuration provider for a specific debug type. Multiple providers can be registered for the same type.

### registerDebugAdapterDescriptorFactory(debugType, factory)
- **Parameters**:
  - `debugType: string` - The debug type for which the factory is registered
  - `factory: DebugAdapterDescriptorFactory` - The debug adapter descriptor factory to register
- **Returns**: `Disposable`
- **Description**: Register a debug adapter descriptor factory for a specific debug type. An extension can only register for debug types defined by the extension.

### registerDebugAdapterTrackerFactory(debugType, factory)
- **Parameters**:
  - `debugType: string` - The debug type or '*' for all debug types
  - `factory: DebugAdapterTrackerFactory` - The debug adapter tracker factory to register
- **Returns**: `Disposable`
- **Description**: Register a debug adapter tracker factory for the given debug type.

## Related Types

### Core Types
- `DebugSession` - Represents an active debug session
- `DebugConfiguration` - Configuration for starting a debug session
- `Breakpoint` - Represents a breakpoint
- `DebugConsole` - Debug console for output
- `DebugThread` - A thread in a debug session
- `DebugStackFrame` - A stack frame in a debug session

### Provider Interfaces
- `DebugConfigurationProvider` - Provides debug configurations
- `DebugAdapterDescriptorFactory` - Creates debug adapter descriptors
- `DebugAdapterTrackerFactory` - Creates debug adapter trackers

### Event Types
- `BreakpointsChangeEvent` - Event data for breakpoint changes
- `DebugSessionCustomEvent` - Custom DAP event data
- `DebugSessionOptions` - Options for starting debug sessions

## Usage Patterns

### Starting a Debug Session
```typescript
// Using a named configuration
await vscode.debug.startDebugging(
  workspaceFolder,
  'Launch Program'
);

// Using a configuration object
await vscode.debug.startDebugging(
  workspaceFolder,
  {
    type: 'node',
    request: 'launch',
    name: 'Launch Program',
    program: '${workspaceFolder}/app.js'
  }
);
```

### Managing Breakpoints
```typescript
// Add breakpoints
const breakpoint = new vscode.SourceBreakpoint(
  new vscode.Location(uri, new vscode.Position(10, 0))
);
vscode.debug.addBreakpoints([breakpoint]);

// Remove breakpoints
vscode.debug.removeBreakpoints([breakpoint]);
```

### Listening to Debug Events
```typescript
// Monitor session changes
vscode.debug.onDidChangeActiveDebugSession(session => {
  if (session) {
    console.log(`Debug session started: ${session.name}`);
  } else {
    console.log('Debug session ended');
  }
});

// Monitor breakpoint changes
vscode.debug.onDidChangeBreakpoints(event => {
  console.log(`Added: ${event.added.length} breakpoints`);
  console.log(`Removed: ${event.removed.length} breakpoints`);
  console.log(`Changed: ${event.changed.length} breakpoints`);
});
