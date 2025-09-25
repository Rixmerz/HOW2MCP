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
- **tmux-mcp-server**: Terminal orchestration with 23 production tools (🏆 Production-grade reference)

## Production Patterns (tmux-mcp-server)

### Advanced Dependencies
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.23.8",
    "zod-to-json-schema": "^3.22.4",
    "chokidar": "^4.0.1",
    "uuid": "^11.0.3"
  }
}
```

### Production Tool Organization
```typescript
// Category-based tool modules (23 tools total)
├── session-tools.ts     // 6 tools: tmux_create_session, tmux_execute_command, etc.
├── log-tools.ts         // 5 tools: logs_get_recent, logs_analyze, etc.
├── process-tools.ts     // 6 tools: process_monitor, process_list_ports, etc.
└── error-tools.ts       // 6 tools: errors_watch, errors_analyze, etc.

// Centralized registration with automatic schema conversion
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'tmux_create_session',
        description: 'Create tmux session with custom configurations',
        inputSchema: zodToJsonSchema(CreateSessionSchema) // Automatic conversion
      }
      // ... 22 more tools
    ]
  };
});
```

### Event-Driven Architecture
```typescript
// Cross-component coordination with EventEmitter
export class McpIntegrator extends EventEmitter {
  async handleError(error: ErrorEntry): Promise<void> {
    // Smart triggering based on thresholds
    const errorCount = await this.countRecentErrors(error.paneId);
    if (errorCount >= 3) {
      this.emit('trigger_sequential', {
        analysis: { type: 'multiple_error_analysis', error }
      });
    }
  }
}
```

### State Management and Persistence
```typescript
// Comprehensive state management
interface TmuxSession {
  name: string;
  id: string;
  windows: TmuxWindow[];
  created: Date;
  attached: boolean;
}

// Automatic serialization and recovery
export class SessionSerializer {
  async serializeSession(session: TmuxSession): Promise<void> {
    const serializedData = {
      session,
      timestamp: new Date(),
      metadata: await this.collectMetadata(session)
    };
    await this.storage.save(session.id, serializedData);
  }
}
```

### Security and Command Safety
```typescript
// Production-grade command escaping
export class CommandEscaper {
  async executeTmuxCommand(command: string, args: string[] = []): Promise<string> {
    // 1. Validate against allowlist
    if (!this.isAllowedCommand(command)) {
      throw new Error(`Command not allowed: ${command}`);
    }

    // 2. Escape arguments to prevent injection
    const escapedArgs = args.map(arg => this.escapeArg(arg));

    // 3. Execute with timeout and resource limits
    return this.executeWithLimits('tmux', [command, ...escapedArgs]);
  }
}
```

### Cross-MCP Integration Pattern
```typescript
// Intelligent coordination with other MCP servers
this.mcpIntegrator.on('trigger_sequential', (data) => {
  // In production: trigger sequential-thinking MCP
  console.log(`Sequential analysis triggered: ${data.analysis.type}`);
});

this.mcpIntegrator.on('trigger_context7', (data) => {
  // In production: trigger Context7 MCP for documentation
  console.log(`Documentation lookup: ${data.library}`);
});
```

### Production Configuration
```json
{
  "mcpServers": {
    "tmux-mcp-server": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "/opt/tmux-mcp-server",
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info",
        "LOG_DIRECTORY": "/var/log/tmux-mcp-server",
        "STORAGE_DIRECTORY": "/var/lib/tmux-mcp-server",
        "MAX_LOG_SIZE": "104857600",
        "SESSION_TIMEOUT": "86400000"
      }
    }
  }
}
```

### Advanced Testing Commands
```bash
# Test comprehensive development session creation
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"tmux_create_session","arguments":{"name":"dev","windows":[{"name":"editor","panes":[{"command":"code ."}]}]}}}' | node dist/index.js

# Test process monitoring
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"process_monitor","arguments":{"pattern":"node","limit":5}}}' | node dist/index.js

# Test error detection
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"errors_watch","arguments":{"paneId":"dev:0.0","languages":["javascript"]}}}' | node dist/index.js
```

### Production Deployment
```dockerfile
# Docker container
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
CMD ["node", "dist/index.js"]
```

```ini
# Systemd service
[Unit]
Description=Tmux MCP Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/node dist/index.js
Environment=NODE_ENV=production
Restart=always
RestartSec=5
```

## Environment Variables
- `NODE_ENV`: Environment mode
- `LOG_LEVEL`: Logging level
- `*_DB_PATH`: Database paths
- `*_API_KEY`: External API keys

### Production Environment Variables (tmux-mcp-server)
- `LOG_DIRECTORY`: Log file storage directory (default: `./logs`)
- `STORAGE_DIRECTORY`: Session persistence directory (default: `./storage`)
- `MAX_LOG_SIZE`: Maximum log file size in bytes (default: `104857600`)
- `SESSION_TIMEOUT`: Session timeout in milliseconds (default: `86400000`)
- `ENABLE_LOGGING`: Enable automatic log capture (default: `true`)

## Troubleshooting
1. **Module errors**: Check TypeScript config and imports
2. **JSON-RPC errors**: Validate message format
3. **Tool registration**: Verify schema definitions
4. **Client connection**: Check file paths and permissions

For complete implementation details, see `MCP_IMPLEMENTATION_GUIDE.md`.
