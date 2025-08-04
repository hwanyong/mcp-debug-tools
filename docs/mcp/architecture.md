# Model Context Protocol (MCP) Architecture

## Overview
The Model Context Protocol (MCP) is a protocol that enables AI applications to access context from various sources through a standardized client-server architecture.

## Core Concepts

### Participants
- **MCP Host**: AI application that manages MCP clients (e.g., Claude Desktop, VS Code)
- **MCP Client**: Component that maintains 1:1 connection with an MCP server
- **MCP Server**: Program that provides context to MCP clients

### Architecture Layers

#### 1. Data Layer
- JSON-RPC 2.0 based protocol
- Handles lifecycle management and core primitives
- Defines message structure and semantics

#### 2. Transport Layer
- Manages communication channels
- Supports two mechanisms:
  - **Stdio**: Local process communication via stdin/stdout
  - **Streamable HTTP**: Remote communication via HTTP POST + SSE

## Core Primitives

### Server Primitives

#### 1. Tools
- Executable functions for AI actions
- Discovery: `tools/list`
- Execution: `tools/call`
- Example: Database queries, API calls

#### 2. Resources
- Data sources for contextual information
- Discovery: `resources/list`
- Retrieval: `resources/read`
- Example: File contents, database records

#### 3. Prompts
- Reusable interaction templates
- Discovery: `prompts/list`
- Retrieval: `prompts/get`
- Example: System prompts, few-shot examples

### Client Primitives

#### 1. Sampling
- Request LLM completions: `sampling/complete`
- Allows servers to stay model-independent

#### 2. Elicitation
- Request user input: `elicitation/request`
- For additional information or confirmation

#### 3. Logging
- Send log messages to clients
- For debugging and monitoring

## Lifecycle Management

### Initialization Sequence
1. Client sends `initialize` request with:
   - Protocol version
   - Client capabilities
   - Client info

2. Server responds with:
   - Server capabilities
   - Server info

3. Client sends `notifications/initialized`

### Capability Negotiation
```json
{
  "tools": {"listChanged": true},
  "resources": {},
  "prompts": {}
}
```

## Notifications
- Real-time updates without request/response
- Examples:
  - `tools/list_changed`
  - `resources/list_changed`
- No response expected (JSON-RPC notification)

## Message Flow Example

### Tool Discovery and Execution
1. **Initialize connection**
2. **Discover tools**: `tools/list`
3. **Execute tool**: `tools/call` with arguments
4. **Receive notifications**: `tools/list_changed`

### Content Types
- Text
- Images
- Resources
- Multi-format responses via content arrays

## Implementation Patterns

### Dynamic Discovery
- Listings can change at runtime
- Clients should refresh on notifications
- Supports evolving capabilities

### Error Handling
- Standard JSON-RPC error responses
- Transport-specific error mechanisms

### Security Considerations
- Transport-level authentication
- OAuth for HTTP transport
- Process isolation for stdio
