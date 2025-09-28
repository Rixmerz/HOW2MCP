# MCP Quick Reference Guide

## Essential MCP Implementation Checklist

### 1. Project Setup
```bash
npm init -y
npm install @modelcontextprotocol/sdk zod
npm install -D typescript @types/node tsx
```

### 2. Core Dependencies
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "zod": "^3.23.8"
  }
}
```

### 3. Basic Server Structure
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  { name: 'my-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 4. Tool Registration Pattern
```typescript
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  // Handle tool execution
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [...] };
});
```

### 5. JSON-RPC 2.0 Message Format
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

### 6. Input Validation with Zod
```typescript
const ToolSchema = z.object({
  param: z.string().min(1),
  optional: z.number().optional().default(10)
});

const validated = ToolSchema.parse(args);
```

### 7. Error Handling
```typescript
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

throw new McpError(ErrorCode.InvalidParams, 'Validation failed');
```

### 8. MCP Client Configuration
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/dist/index.js", "--stdio"],
      "env": { "NODE_ENV": "production" }
    }
  }
}
```

## Key Architectural Patterns

### Standard Project Structure
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

### Tool Definition Template
```typescript
{
  name: 'tool-name',
  description: 'Tool description',
  inputSchema: {
    type: 'object',
    properties: {
      param: {
        type: 'string',
        description: 'Parameter description'
      }
    },
    required: ['param']
  }
}
```

### Response Format
```typescript
return {
  content: [
    {
      type: 'text',
      text: 'Tool execution result'
    }
  ]
};
```

## Common Error Codes
- `-32700`: Parse error
- `-32600`: Invalid Request  
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error

## Best Practices
1. **Always validate inputs** with Zod schemas
2. **Use TypeScript** for type safety
3. **Handle errors gracefully** with McpError
4. **Log to stderr only** in stdio mode
5. **Make tools idempotent** when possible
6. **Follow single responsibility** principle
7. **Provide clear descriptions** and schemas

## Testing Commands
```bash
# Build project
npm run build

# Test tools/list
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js

# Test tool call
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"tool-name","arguments":{}}}' | node dist/index.js
```

## Real-World Examples
- **MEMI**: Memory management with 19 tools
- **RIXA**: Universal debugging with 400+ tools  
- **RIMA**: Web scraping with 6 specialized tools
- **RIKA**: UI feedback with visual testing tools
- **RISA**: Security analysis with 45 tools

## Environment Variables
- `NODE_ENV`: Environment mode
- `LOG_LEVEL`: Logging level
- `*_DB_PATH`: Database paths
- `*_API_KEY`: External API keys

## Troubleshooting
1. **Module errors**: Check TypeScript config and imports
2. **JSON-RPC errors**: Validate message format
3. **Tool registration**: Verify schema definitions
4. **Client connection**: Check file paths and permissions

For complete implementation details, see `MCP_IMPLEMENTATION_GUIDE.md`.
