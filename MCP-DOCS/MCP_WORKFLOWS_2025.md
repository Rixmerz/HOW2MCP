# MCP Workflows 2025: Complete Connection and Execution Flows

## Table of Contents

1. [Connection Establishment](#connection-establishment)
2. [Tool Discovery and Execution](#tool-discovery-and-execution)
3. [Resource Management](#resource-management)
4. [Notification Handling](#notification-handling)
5. [Error Recovery Workflows](#error-recovery-workflows)
6. [Production Deployment Flow](#production-deployment-flow)

## Connection Establishment

### Standard Connection Flow (stdio)

```
┌─────────────┐                                  ┌─────────────┐
│   Client    │                                  │    Server   │
└──────┬──────┘                                  └──────┬──────┘
       │                                                 │
       │  1. Start server process                       │
       │────────────────────────────────────────────────>│
       │                                                 │
       │  2. Send initialize request                    │
       │────────────────────────────────────────────────>│
       │  {                                              │
       │    "jsonrpc": "2.0",                           │
       │    "id": 1,                                    │
       │    "method": "initialize",                     │
       │    "params": {                                 │
       │      "protocolVersion": "2024-11-05",         │
       │      "capabilities": {                         │
       │        "experimental": {},                     │
       │        "sampling": {}                          │
       │      },                                        │
       │      "clientInfo": {                           │
       │        "name": "claude-desktop",               │
       │        "version": "1.0.0"                      │
       │      }                                         │
       │    }                                           │
       │  }                                             │
       │                                                 │
       │                                                 │  3. Process and validate
       │                                                 │─────┐
       │                                                 │     │
       │                                                 │<────┘
       │                                                 │
       │  4. Return server capabilities                 │
       │<────────────────────────────────────────────────│
       │  {                                              │
       │    "jsonrpc": "2.0",                           │
       │    "id": 1,                                    │
       │    "result": {                                 │
       │      "protocolVersion": "2024-11-05",         │
       │      "capabilities": {                         │
       │        "tools": {},                            │
       │        "resources": {                          │
       │          "subscribe": true,                    │
       │          "listChanged": true                   │
       │        },                                      │
       │        "prompts": {},                          │
       │        "logging": {}                           │
       │      },                                        │
       │      "serverInfo": {                           │
       │        "name": "my-mcp-server",                │
       │        "version": "1.0.0"                      │
       │      }                                         │
       │    }                                           │
       │  }                                             │
       │                                                 │
       │  5. Send initialized notification              │
       │────────────────────────────────────────────────>│
       │  {                                              │
       │    "jsonrpc": "2.0",                           │
       │    "method": "notifications/initialized"       │
       │  }                                             │
       │                                                 │
       │  ✅ Connection established                     │
       │                                                 │
```

### Implementation

```typescript
// Client-side connection
async function connectToMCPServer(config: ServerConfig): Promise<MCPClient> {
  // 1. Start server process
  const serverProcess = spawn(config.command, config.args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: config.cwd,
    env: { ...process.env, ...config.env }
  });

  // 2. Create client and transport
  const client = new Client(
    { name: 'my-client', version: '1.0.0' },
    { capabilities: {} }
  );

  const transport = new StdioClientTransport({
    stdin: serverProcess.stdin!,
    stdout: serverProcess.stdout!
  });

  // 3. Connect and initialize
  await client.connect(transport);

  // Handshake complete - client and server negotiated capabilities
  return client;
}

// Server-side connection handling
class MCPServer {
  async start(): Promise<void> {
    const server = new Server(
      { name: 'my-server', version: '1.0.0' },
      {
        capabilities: {
          tools: {},
          resources: { subscribe: true, listChanged: true },
          prompts: {}
        }
      }
    );

    // Register initialize handler (automatic in SDK)
    // When client sends initialize, SDK handles capability negotiation

    // Connect transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('MCP Server ready'); // Log to stderr
  }
}
```

### HTTP + SSE Connection Flow

```
┌─────────────┐                                  ┌─────────────┐
│   Client    │                                  │    Server   │
└──────┬──────┘                                  └──────┬──────┘
       │                                                 │
       │  1. HTTP POST /mcp/sse (establish SSE)         │
       │────────────────────────────────────────────────>│
       │  Headers:                                       │
       │    Accept: text/event-stream                   │
       │                                                 │
       │  2. SSE connection established                 │
       │<────────────────────────────────────────────────│
       │  HTTP 200 OK                                   │
       │  Content-Type: text/event-stream               │
       │  Connection: keep-alive                        │
       │                                                 │
       │  3. Send initialize via SSE                    │
       │────────────────────────────────────────────────>│
       │  data: {"jsonrpc":"2.0","id":1,...}           │
       │                                                 │
       │  4. Receive initialize response via SSE        │
       │<────────────────────────────────────────────────│
       │  data: {"jsonrpc":"2.0","id":1,...}           │
       │                                                 │
       │  5. Send initialized notification              │
       │────────────────────────────────────────────────>│
       │                                                 │
       │  ✅ Connection ready for requests              │
       │                                                 │
```

## Tool Discovery and Execution

### Complete Tool Workflow

```
┌─────────────┐                                  ┌─────────────┐
│   Client    │                                  │    Server   │
└──────┬──────┘                                  └──────┬──────┘
       │                                                 │
       │  1. Request available tools                    │
       │────────────────────────────────────────────────>│
       │  {                                              │
       │    "jsonrpc": "2.0",                           │
       │    "id": 2,                                    │
       │    "method": "tools/list"                      │
       │  }                                             │
       │                                                 │
       │                                                 │  2. Gather tool definitions
       │                                                 │─────┐
       │                                                 │     │
       │                                                 │<────┘
       │                                                 │
       │  3. Return tool list with schemas              │
       │<────────────────────────────────────────────────│
       │  {                                              │
       │    "jsonrpc": "2.0",                           │
       │    "id": 2,                                    │
       │    "result": {                                 │
       │      "tools": [                                │
       │        {                                        │
       │          "name": "search",                     │
       │          "description": "Search content",      │
       │          "inputSchema": {                      │
       │            "type": "object",                   │
       │            "properties": {                     │
       │              "query": {                        │
       │                "type": "string"                │
       │              }                                 │
       │            },                                  │
       │            "required": ["query"]               │
       │          }                                     │
       │        }                                       │
       │      ]                                         │
       │    }                                           │
       │  }                                             │
       │                                                 │
       │  4. User/AI selects tool and parameters        │
       │─────┐                                          │
       │     │                                          │
       │<────┘                                          │
       │                                                 │
       │  5. Execute tool                               │
       │────────────────────────────────────────────────>│
       │  {                                              │
       │    "jsonrpc": "2.0",                           │
       │    "id": 3,                                    │
       │    "method": "tools/call",                     │
       │    "params": {                                 │
       │      "name": "search",                         │
       │      "arguments": {                            │
       │        "query": "example search"               │
       │      }                                         │
       │    }                                           │
       │  }                                             │
       │                                                 │
       │                                                 │  6. Validate params
       │                                                 │─────┐
       │                                                 │     │
       │                                                 │<────┘
       │                                                 │
       │                                                 │  7. Execute tool logic
       │                                                 │─────┐
       │                                                 │     │
       │                                                 │<────┘
       │                                                 │
       │  8. Return results                             │
       │<────────────────────────────────────────────────│
       │  {                                              │
       │    "jsonrpc": "2.0",                           │
       │    "id": 3,                                    │
       │    "result": {                                 │
       │      "content": [                              │
       │        {                                        │
       │          "type": "text",                       │
       │          "text": "Search results..."           │
       │        }                                       │
       │      ]                                         │
       │    }                                           │
       │  }                                             │
       │                                                 │
```

### Implementation with Error Handling

```typescript
// Client-side tool execution
async function executeToolWithRetry(
  client: MCPClient,
  toolName: string,
  params: any,
  maxRetries: number = 3
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 1. List tools to verify it exists
      const tools = await client.listTools();
      const tool = tools.find(t => t.name === toolName);

      if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
      }

      // 2. Validate params against schema (client-side)
      validateParams(params, tool.inputSchema);

      // 3. Execute tool
      const result = await client.callTool(toolName, params);

      return result;
    } catch (error) {
      if (attempt < maxRetries - 1) {
        console.error(`Attempt ${attempt + 1} failed, retrying...`, error);
        await sleep(1000 * (attempt + 1)); // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}

// Server-side tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // 1. Find tool
    const tool = toolRegistry.get(name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
    }

    // 2. Validate parameters
    const validated = tool.schema.parse(args);

    // 3. Execute with timeout
    const result = await Promise.race([
      tool.handler(validated),
      timeout(30000, `Tool ${name} execution timeout`)
    ]);

    // 4. Format response
    return {
      content: [
        {
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result)
        }
      ]
    };
  } catch (error) {
    // Log error
    logger.error('Tool execution failed', {
      tool: name,
      error: error.message,
      params: args
    });

    // Return standardized error
    if (error instanceof McpError) {
      throw error;
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error.message}`
    );
  }
});
```

## Resource Management

### Resource Subscription Flow

```
┌─────────────┐                                  ┌─────────────┐
│   Client    │                                  │    Server   │
└──────┬──────┘                                  └──────┬──────┘
       │                                                 │
       │  1. List available resources                   │
       │────────────────────────────────────────────────>│
       │  { "method": "resources/list" }                │
       │                                                 │
       │  2. Receive resource list                      │
       │<────────────────────────────────────────────────│
       │  {                                              │
       │    "resources": [                              │
       │      {                                          │
       │        "uri": "file:///project/README.md",     │
       │        "name": "Project README",               │
       │        "mimeType": "text/markdown"             │
       │      }                                         │
       │    ]                                           │
       │  }                                             │
       │                                                 │
       │  3. Subscribe to resource updates              │
       │────────────────────────────────────────────────>│
       │  {                                              │
       │    "method": "resources/subscribe",            │
       │    "params": {                                 │
       │      "uri": "file:///project/README.md"        │
       │    }                                           │
       │  }                                             │
       │                                                 │
       │  4. Subscription confirmed                     │
       │<────────────────────────────────────────────────│
       │  { "result": { "subscribed": true } }          │
       │                                                 │
       │  5. Read initial resource content              │
       │────────────────────────────────────────────────>│
       │  {                                              │
       │    "method": "resources/read",                 │
       │    "params": {                                 │
       │      "uri": "file:///project/README.md"        │
       │    }                                           │
       │  }                                             │
       │                                                 │
       │  6. Receive content                            │
       │<────────────────────────────────────────────────│
       │  {                                              │
       │    "contents": [                               │
       │      {                                          │
       │        "uri": "file:///project/README.md",     │
       │        "mimeType": "text/markdown",            │
       │        "text": "# Project\n\nDescription..."   │
       │      }                                         │
       │    ]                                           │
       │  }                                             │
       │                                                 │
       │        ... time passes, file changes ...        │
       │                                                 │
       │  7. Server sends update notification           │
       │<────────────────────────────────────────────────│
       │  {                                              │
       │    "method": "notifications/resources/updated",│
       │    "params": {                                 │
       │      "uri": "file:///project/README.md"        │
       │    }                                           │
       │  }                                             │
       │                                                 │
       │  8. Client re-reads updated content            │
       │────────────────────────────────────────────────>│
       │  { "method": "resources/read", ... }           │
       │                                                 │
```

### Implementation

```typescript
// Server-side resource management
class ResourceManager {
  private subscriptions: Map<string, Set<string>> = new Map(); // uri -> client IDs
  private watchers: Map<string, fs.FSWatcher> = new Map();

  async handleSubscribe(uri: string, clientId: string): Promise<void> {
    // Add subscription
    if (!this.subscriptions.has(uri)) {
      this.subscriptions.set(uri, new Set());
    }
    this.subscriptions.get(uri)!.add(clientId);

    // Setup watcher if first subscriber
    if (this.subscriptions.get(uri)!.size === 1) {
      await this.setupWatcher(uri);
    }
  }

  private async setupWatcher(uri: string): Promise<void> {
    const path = uriToPath(uri);

    const watcher = fs.watch(path, (event, filename) => {
      // Notify all subscribers
      this.notifySubscribers(uri);
    });

    this.watchers.set(uri, watcher);
  }

  private notifySubscribers(uri: string): void {
    const subscribers = this.subscriptions.get(uri);
    if (!subscribers) return;

    // Send notification to all subscribers
    for (const clientId of subscribers) {
      server.notification({
        method: 'notifications/resources/updated',
        params: { uri }
      });
    }
  }

  async handleUnsubscribe(uri: string, clientId: string): Promise<void> {
    const subscribers = this.subscriptions.get(uri);
    if (subscribers) {
      subscribers.delete(clientId);

      // Clean up watcher if no more subscribers
      if (subscribers.size === 0) {
        const watcher = this.watchers.get(uri);
        if (watcher) {
          watcher.close();
          this.watchers.delete(uri);
        }
        this.subscriptions.delete(uri);
      }
    }
  }
}
```

## Notification Handling

### Progress Notifications

```
┌─────────────┐                                  ┌─────────────┐
│   Client    │                                  │    Server   │
└──────┬──────┘                                  └──────┬──────┘
       │                                                 │
       │  1. Start long-running operation               │
       │────────────────────────────────────────────────>│
       │  { "method": "tools/call",                     │
       │    "params": { "name": "process_large_file" }  │
       │  }                                             │
       │                                                 │
       │                                                 │  2. Start processing
       │                                                 │─────┐
       │                                                 │     │
       │                                                 │<────┘
       │                                                 │
       │  3. Progress notification (20%)                │
       │<────────────────────────────────────────────────│
       │  {                                              │
       │    "method": "notifications/progress",         │
       │    "params": {                                 │
       │      "progressToken": "proc-123",              │
       │      "progress": 20,                           │
       │      "total": 100                              │
       │    }                                           │
       │  }                                             │
       │                                                 │
       │  4. Progress notification (50%)                │
       │<────────────────────────────────────────────────│
       │                                                 │
       │  5. Progress notification (80%)                │
       │<────────────────────────────────────────────────│
       │                                                 │
       │  6. Final result                               │
       │<────────────────────────────────────────────────│
       │  {                                              │
       │    "id": 5,                                    │
       │    "result": {                                 │
       │      "content": [...]                          │
       │    }                                           │
       │  }                                             │
       │                                                 │
```

## Error Recovery Workflows

### Retry with Exponential Backoff

```typescript
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      if (attempt < maxRetries) {
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
          error: error.message
        });

        await sleep(delay);
        delay = Math.min(delay * 2, maxDelay);
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} retries: ${lastError!.message}`);
}

// Usage
const result = await executeWithRetry(
  () => client.callTool('search', { query: 'test' }),
  {
    maxRetries: 3,
    shouldRetry: (error) => {
      // Only retry on transient errors
      return error.message.includes('timeout') ||
             error.message.includes('unavailable');
    }
  }
);
```

## Production Deployment Flow

### Complete Deployment Workflow

```
┌──────────────────────────────────────────────────────────┐
│                   1. DEVELOPMENT                          │
├──────────────────────────────────────────────────────────┤
│  • Write MCP server code                                 │
│  • Add tools, resources, prompts                         │
│  • Implement tests                                       │
│  • Local testing with MCP Inspector                      │
└────────────────────┬─────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│                   2. BUILD & TEST                         │
├──────────────────────────────────────────────────────────┤
│  $ npm run build                                         │
│  $ npm test                                              │
│  $ npm run lint                                          │
│  • TypeScript compilation                                │
│  • Unit tests pass                                       │
│  • Integration tests pass                                │
│  • Protocol compliance verified                          │
└────────────────────┬─────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│                   3. CONTAINERIZATION                     │
├──────────────────────────────────────────────────────────┤
│  # Dockerfile                                            │
│  FROM node:20-alpine                                     │
│  WORKDIR /app                                            │
│  COPY package*.json ./                                   │
│  RUN npm ci --production                                 │
│  COPY dist ./dist                                        │
│  CMD ["node", "dist/index.js", "--stdio"]               │
│                                                           │
│  $ docker build -t my-mcp-server:1.0.0 .                │
│  $ docker run --rm my-mcp-server:1.0.0                  │
└────────────────────┬─────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│                   4. STAGING DEPLOYMENT                   │
├──────────────────────────────────────────────────────────┤
│  • Deploy to staging environment                         │
│  • Configure monitoring                                  │
│  • Run smoke tests                                       │
│  • Performance testing                                   │
│  • Security scanning                                     │
└────────────────────┬─────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│                   5. PRODUCTION DEPLOYMENT                │
├──────────────────────────────────────────────────────────┤
│  • Blue-green or canary deployment                       │
│  • Health checks                                         │
│  • Gradual traffic shift                                 │
│  • Monitor error rates                                   │
│  • Rollback plan ready                                   │
└────────────────────┬─────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│                   6. MONITORING & MAINTENANCE             │
├──────────────────────────────────────────────────────────┤
│  • Track metrics (latency, error rate, throughput)       │
│  • Set up alerts                                         │
│  • Log aggregation                                       │
│  • Regular updates and patches                           │
│  • Performance optimization                              │
└──────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline Example

```yaml
# .github/workflows/deploy.yml
name: MCP Server Deployment

on:
  push:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Test MCP protocol compliance
        run: |
          npm install -g @modelcontextprotocol/inspector
          npx mcp-inspector node dist/index.js --test

  docker-build:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t my-mcp-server:${{ github.sha }} .

      - name: Push to registry
        run: |
          docker tag my-mcp-server:${{ github.sha }} registry.example.com/my-mcp-server:latest
          docker push registry.example.com/my-mcp-server:latest

  deploy-staging:
    needs: docker-build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          kubectl set image deployment/mcp-server \
            mcp-server=registry.example.com/my-mcp-server:${{ github.sha }} \
            -n staging

      - name: Wait for deployment
        run: kubectl rollout status deployment/mcp-server -n staging

      - name: Run smoke tests
        run: npm run test:smoke

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production (canary)
        run: |
          kubectl set image deployment/mcp-server-canary \
            mcp-server=registry.example.com/my-mcp-server:${{ github.sha }} \
            -n production

      - name: Monitor canary
        run: ./scripts/monitor-canary.sh

      - name: Full rollout
        if: success()
        run: |
          kubectl set image deployment/mcp-server \
            mcp-server=registry.example.com/my-mcp-server:${{ github.sha }} \
            -n production
```

## Conclusion

These workflows provide complete end-to-end patterns for:

- **Connection establishment** with proper handshaking
- **Tool discovery and execution** with error handling
- **Resource management** with subscriptions and notifications
- **Error recovery** with retries and resilience
- **Production deployment** with CI/CD integration

Follow these workflows for reliable, production-ready MCP implementations.
