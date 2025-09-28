# Model Context Protocol (MCP) Documentation Index

## Overview

This comprehensive documentation suite provides everything needed to understand and implement Model Context Protocol (MCP) applications. The documentation is based on analysis of real-world MCP implementations and follows current best practices.

## Documentation Structure

### 1. Core Documentation

#### [MCP_IMPLEMENTATION_GUIDE.md](./MCP_IMPLEMENTATION_GUIDE.md)
**Complete technical reference (831 lines)**
- Architecture analysis from 6 real MCP projects (MEMI, RIXA, RIMA, RIKA, RISA, TOMA)
- JSON-RPC 2.0 protocol implementation details
- Step-by-step implementation guidelines
- Technical standards and requirements
- Best practices and troubleshooting

#### [MCP_QUICK_REFERENCE.md](./MCP_QUICK_REFERENCE.md)
**Quick reference guide (130 lines)**
- Essential implementation checklist
- Core patterns and templates
- Common error codes and solutions
- Testing commands and examples

### 2. Example Implementation

#### [MCP_EXAMPLE_PROJECT/](./MCP_EXAMPLE_PROJECT/)
**Complete working example**
- Production-ready MCP server implementation
- 4 example tools demonstrating different patterns
- Full TypeScript setup with proper error handling
- Testing and development scripts
- MCP client configuration examples

## Key Architectural Patterns Documented

### 1. Standard MCP Server Structure
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  { name: 'server-name', version: '1.0.0' },
  { capabilities: { tools: {} } }
);
```

### 2. Tool Registration Pattern
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  // Route to appropriate tool handler
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [...] };
});
```

### 3. Input Validation with Zod
```typescript
const ToolSchema = z.object({
  param: z.string().min(1),
  optional: z.number().optional().default(10)
});

const validated = ToolSchema.parse(args);
```

## Protocol Implementation Details

### JSON-RPC 2.0 Message Format
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "tool-name",
    "arguments": { "param": "value" }
  }
}
```

### Standard Response Format
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      { "type": "text", "text": "Result" }
    ]
  }
}
```

### Error Handling
```typescript
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

throw new McpError(ErrorCode.InvalidParams, 'Validation failed');
```

## Real-World Examples Analyzed

### MEMI - Memory Management (19 tools)
- Graph-based memory system
- Project organization
- Semantic search with TF-IDF
- SQLite storage

### RIXA - Universal Debugging (400+ tools)
- Multi-language debugging
- Framework-specific tools
- Advanced debugging features
- Language dispatcher pattern

### RIMA - Web Scraping (6 tools)
- E-commerce scraping
- Rate limiting
- Error recovery
- Data comparison

### RIKA - UI Feedback (66+ tools)
- Visual testing
- Screenshot capture
- Image analysis
- Accessibility testing

### RISA - Security Analysis (45 tools)
- Web security testing
- Vulnerability scanning
- Content analysis
- CLI interface

### TOMA - Task Orchestration
- Task management
- Scheduling
- Safety modes
- Configuration management

## Technical Standards

### Required Dependencies
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "zod": "^3.23.8"
  }
}
```

### Project Structure
```
mcp-project/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Main server
│   ├── tools/index.ts    # Tool registration
│   ├── core/             # Business logic
│   ├── types/            # Type definitions
│   └── utils/            # Utilities
├── dist/                 # Compiled output
└── tests/                # Test files
```

### MCP Client Configuration
```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/path/to/dist/index.js", "--stdio"],
      "env": { "NODE_ENV": "production" }
    }
  }
}
```

## Best Practices Summary

1. **Always validate inputs** with Zod schemas
2. **Use TypeScript** for type safety
3. **Handle errors gracefully** with McpError
4. **Log to stderr only** in stdio mode
5. **Make tools idempotent** when possible
6. **Follow single responsibility** principle
7. **Provide clear descriptions** and schemas
8. **Test thoroughly** at unit and integration levels
9. **Implement proper cleanup** and shutdown handling
10. **Use structured logging** for debugging

## Testing and Validation

### Unit Testing
```bash
npm test
```

### Integration Testing
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

### Protocol Validation
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"tool","arguments":{}}}' | node dist/index.js | jq
```

## Common Error Codes
- `-32700`: Parse error
- `-32600`: Invalid Request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error

## Environment Variables
- `NODE_ENV`: Environment mode
- `LOG_LEVEL`: Logging level
- `*_DB_PATH`: Database paths
- `*_API_KEY`: External API keys

## Getting Started

1. **Read the Implementation Guide**: Start with `MCP_IMPLEMENTATION_GUIDE.md`
2. **Review the Quick Reference**: Use `MCP_QUICK_REFERENCE.md` for quick lookups
3. **Study the Example**: Examine `MCP_EXAMPLE_PROJECT/` for practical implementation
4. **Test Your Understanding**: Build a simple MCP server using the patterns
5. **Refer to Real Examples**: Study the documented real-world implementations

## Documentation Maintenance

This documentation is designed to be:
- **Comprehensive**: Covers all aspects of MCP implementation
- **Practical**: Based on real-world implementations
- **Current**: Reflects latest MCP SDK and best practices
- **Accessible**: Structured for both AI systems and human developers

## Support and Resources

- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Protocol Specification**: JSON-RPC 2.0 over stdio
- **TypeScript**: Recommended for type safety
- **Testing**: Jest for unit tests, manual testing for integration

This documentation suite enables any AI system to understand and implement MCP applications from scratch, following proven patterns and best practices from the MCP ecosystem.
