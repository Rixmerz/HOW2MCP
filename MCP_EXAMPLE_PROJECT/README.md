# Example MCP Server

This is a complete example implementation of a Model Context Protocol (MCP) server that demonstrates best practices and patterns extracted from real-world MCP projects.

## Features

- **Complete MCP Implementation**: Follows all MCP protocol specifications
- **TypeScript**: Full type safety and modern development experience
- **Best Practices**: Error handling, logging, validation, and testing
- **Example Tools**: 4 different tools demonstrating various patterns
- **Production Ready**: Proper error handling, logging, and graceful shutdown

## Tools Included

1. **echo** - Simple text echoing with repetition
2. **calculator** - Basic mathematical operations
3. **data-processor** - Array processing with multiple operations
4. **status** - Server health and system information

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Test the server
npm run test:mcp
```

### Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### MCP Client Configuration

#### Claude Desktop Configuration (Recommended)

Add to your Claude Desktop configuration file (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "example-mcp-server": {
      "command": "/Users/username/.nvm/versions/node/v22.16.0/bin/node",
      "args": ["/full/path/to/your/project/dist/index.js", "--stdio"],
      "cwd": "/full/path/to/your/project",
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Important**: Use absolute paths for both the Node.js executable and the server script. Find your Node.js path with:
```bash
which node
# or for nvm users:
nvm which current
```

#### Alternative Configuration (Generic MCP Client)

```json
{
  "mcpServers": {
    "example-mcp-server": {
      "command": "node",
      "args": ["/path/to/dist/index.js", "--stdio"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## Project Structure

```
src/
├── index.ts              # Main server entry point
├── tools/
│   └── index.ts          # Tool registration and handlers
└── utils/
    ├── logger.ts         # Logging utility
    └── errors.ts         # Error handling utilities
```

## Testing the Server

### Manual Testing

```bash
# List available tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start

# Test echo tool
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"echo","arguments":{"message":"Hello","repeat":3}}}' | npm start

# Test calculator
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"calculator","arguments":{"operation":"add","a":5,"b":3}}}' | npm start

# Test data processor
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"data-processor","arguments":{"data":["apple","banana","apple","cherry"],"operation":"unique"}}}' | npm start

# Test status
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"status","arguments":{"includeSystemInfo":true}}}' | npm start
```

### Expected Responses

#### Tools List
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "echo",
        "description": "Echo a message with optional repetition",
        "inputSchema": { ... }
      },
      ...
    ]
  }
}
```

#### Echo Tool
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Echo result: Hello Hello Hello"
      }
    ]
  }
}
```

## Architecture Highlights

### Error Handling
- Comprehensive error handling with standardized MCP error codes
- Input validation using Zod schemas
- Graceful error recovery and logging

### Logging
- Structured logging to stderr (doesn't interfere with stdio)
- Configurable log levels
- Request/response tracking

### Type Safety
- Full TypeScript implementation
- Strict type checking
- Comprehensive type definitions

### Best Practices
- Single responsibility principle for tools
- Idempotent operations where possible
- Clear input/output schemas
- Comprehensive documentation

## Environment Variables

- `NODE_ENV`: Environment mode (development/production)
- `LOG_LEVEL`: Logging level (error/warn/info/debug)

## Development Guidelines

1. **Add New Tools**: Create handlers in `src/tools/index.ts`
2. **Input Validation**: Always use Zod schemas for runtime validation
3. **Schema Registration**: Convert Zod schemas to JSON Schema format for tool registration
4. **Error Handling**: Use McpError for standardized responses
5. **Logging**: Use the Logger utility for structured logging (stderr only)
6. **Testing**: Add tests for all new functionality

## Troubleshooting

### Common Issues

#### "No tools are being exposed" in Claude Desktop
- **Cause**: Zod schemas don't serialize correctly for MCP
- **Solution**: Use JSON Schema format in tool registration (see `src/tools/index.ts`)

#### Server fails to start
- **Cause**: Incorrect paths in Claude Desktop configuration
- **Solution**: Use absolute paths for Node.js executable and server script

#### Framework detection issues
- **Cause**: Missing framework indicators or dependencies
- **Solution**: Implement fallback detection by scanning source code

### Testing Claude Desktop Integration

```bash
# Test server startup
npm run build
node dist/index.js --stdio

# Test tool listing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js --stdio

# Test tool execution
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"echo","arguments":{"message":"test"}}}' | node dist/index.js --stdio
```

### Debug Mode

Enable debug logging:
```bash
DEBUG=true node dist/index.js --stdio
```

## License

MIT
