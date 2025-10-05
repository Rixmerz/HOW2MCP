# MCP Architecture 2025: Modern Reference Architecture

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Communication Layers](#communication-layers)
4. [Component Interaction Patterns](#component-interaction-patterns)
5. [Transport Mechanisms](#transport-mechanisms)
6. [Capability Negotiation](#capability-negotiation)
7. [Modular Server Design](#modular-server-design)
8. [Real-World Architecture Examples](#real-world-architecture-examples)

## Architecture Overview

### The Modern MCP Stack (2025)

```
┌─────────────────────────────────────────────────────────────────┐
│                     HOST / CLIENT APPLICATION                    │
│          (Claude Desktop, Custom AI Agent, MCP Client)          │
└────────────────────────┬────────────────────────────────────────┘
                         │ JSON-RPC 2.0
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSPORT LAYER                               │
│  • stdio (local processes)                                       │
│  • HTTP + SSE (remote servers, streaming)                       │
│  • WebSocket (bidirectional, real-time)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MCP SERVER(S)                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. PROTOCOL LAYER (JSON-RPC 2.0)                         │  │
│  │    • Request/Response handling                            │  │
│  │    • Error standardization                                │  │
│  │    • Message validation                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 2. CAPABILITY NEGOTIATION                                │  │
│  │    • Feature discovery                                    │  │
│  │    • Version compatibility                                │  │
│  │    • Permission scoping                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 3. REGISTRY & CATALOG                                    │  │
│  │    • Tools registration                                   │  │
│  │    • Resources catalog                                    │  │
│  │    • Prompts library                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 4. REQUEST ROUTING & HANDLERS                            │  │
│  │    • Tool execution handlers                              │  │
│  │    • Resource providers                                   │  │
│  │    • Notification dispatchers                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 5. PERSISTENCE & STATE                                   │  │
│  │    • Vector databases (Qdrant, Chroma, Weaviate)         │  │
│  │    • Cache layer (Redis, SQLite, LevelDB)                │  │
│  │    • Session management                                   │  │
│  │    • Indexing engines                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 6. EXTERNAL INTEGRATIONS                                 │  │
│  │    • Database connections                                 │  │
│  │    • API clients                                          │  │
│  │    • File system access                                   │  │
│  │    • Third-party services                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Host / Client Layer

**Purpose**: The application that provides context to AI models through MCP.

**Responsibilities**:
- Manage connections to multiple MCP servers
- Aggregate capabilities from different servers
- Route requests to appropriate servers
- Handle authentication and authorization
- Provide UI/UX for tool interaction

**Implementation Pattern**:
```typescript
class MCPHost {
  private servers: Map<string, MCPConnection> = new Map();

  async connectToServer(
    name: string,
    config: ServerConfig
  ): Promise<void> {
    const connection = new MCPConnection(config);
    await connection.initialize();

    const capabilities = await connection.getCapabilities();
    this.servers.set(name, connection);

    this.logger.info('Connected to server', { name, capabilities });
  }

  async executeToolAcrossServers(
    toolName: string,
    params: any
  ): Promise<any> {
    // Find server with the tool
    for (const [name, server] of this.servers) {
      const tools = await server.listTools();
      if (tools.some(t => t.name === toolName)) {
        return await server.executeTool(toolName, params);
      }
    }
    throw new Error(`Tool ${toolName} not found in any server`);
  }
}
```

### 2. Transport Layer

**Purpose**: Handle communication between host and servers.

**Available Transports**:

#### Standard I/O (stdio)
```typescript
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const transport = new StdioServerTransport();
await server.connect(transport);
```

**Best for**: Local processes, desktop applications, CLI tools

#### HTTP + Server-Sent Events (SSE)
```typescript
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const app = express();
const transport = new SSEServerTransport('/mcp/sse', app);
await server.connect(transport);
```

**Best for**: Remote servers, web applications, streaming responses

#### WebSocket
```typescript
import { WebSocketServerTransport } from '@modelcontextprotocol/sdk/server/websocket.js';

const wss = new WebSocketServer({ port: 8080 });
const transport = new WebSocketServerTransport(wss);
await server.connect(transport);
```

**Best for**: Bidirectional communication, real-time updates, collaborative features

### 3. Protocol Layer (JSON-RPC 2.0)

**Purpose**: Standardized message format and error handling.

**Key Message Types**:

#### Request
```typescript
interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}
```

#### Response
```typescript
interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
```

#### Notification (no response expected)
```typescript
interface MCPNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}
```

### 4. Capability Negotiation

**Purpose**: Establish what features client and server support.

**Handshake Flow**:
```typescript
// 1. Client sends initialize request
const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {
      experimental: {},
      sampling: {}
    },
    clientInfo: {
      name: 'claude-desktop',
      version: '1.0.0'
    }
  }
};

// 2. Server responds with capabilities
const initResponse = {
  jsonrpc: '2.0',
  id: 1,
  result: {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {},
      resources: {
        subscribe: true,
        listChanged: true
      },
      prompts: {},
      logging: {}
    },
    serverInfo: {
      name: 'my-mcp-server',
      version: '1.0.0'
    }
  }
};

// 3. Client sends initialized notification
const initNotification = {
  jsonrpc: '2.0',
  method: 'notifications/initialized'
};
```

**Capability Detection Pattern**:
```typescript
class CapabilityManager {
  private clientCapabilities: any;
  private serverCapabilities: any;

  async negotiate(
    clientCaps: any,
    serverCaps: any
  ): Promise<NegotiatedCapabilities> {
    const negotiated: NegotiatedCapabilities = {
      tools: this.negotiateTools(clientCaps, serverCaps),
      resources: this.negotiateResources(clientCaps, serverCaps),
      prompts: this.negotiatePrompts(clientCaps, serverCaps),
      streaming: this.negotiateStreaming(clientCaps, serverCaps)
    };

    return negotiated;
  }

  private negotiateStreaming(client: any, server: any): boolean {
    return (
      server.resources?.subscribe === true &&
      client.experimental?.streamingSupport === true
    );
  }
}
```

### 5. Registry & Catalog

**Purpose**: Manage available tools, resources, and prompts.

**Tool Registration**:
```typescript
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: (params: any) => Promise<ToolResult>;
}

class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} already registered`);
    }

    // Validate schema
    this.validateSchema(tool.inputSchema);

    this.tools.set(tool.name, tool);
    this.logger.info('Tool registered', { name: tool.name });
  }

  async execute(name: string, params: any): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
    }

    // Validate params against schema
    this.validateParams(params, tool.inputSchema);

    // Execute handler
    return await tool.handler(params);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }));
  }
}
```

### 6. Request Routing & Handlers

**Purpose**: Direct incoming requests to appropriate handlers.

**Router Pattern**:
```typescript
class RequestRouter {
  private handlers: Map<string, RequestHandler> = new Map();

  route(request: MCPRequest): Promise<any> {
    const handler = this.handlers.get(request.method);

    if (!handler) {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Method ${request.method} not supported`
      );
    }

    return handler(request.params);
  }

  register(method: string, handler: RequestHandler): void {
    this.handlers.set(method, handler);
  }
}

// Usage
const router = new RequestRouter();

router.register('tools/list', async () => {
  return { tools: toolRegistry.list() };
});

router.register('tools/call', async (params) => {
  return await toolRegistry.execute(params.name, params.arguments);
});

router.register('resources/list', async () => {
  return { resources: resourceCatalog.list() };
});
```

## Communication Layers

### Layer 1: Physical Transport

**stdio**: Process stdin/stdout
- ✅ Simple, no network overhead
- ✅ Perfect for local tools
- ❌ Limited to single machine
- ❌ No concurrent connections

**HTTP + SSE**: Server-Sent Events over HTTP
- ✅ Remote access capability
- ✅ Streaming support
- ✅ Standard web protocols
- ❌ Unidirectional (server → client)

**WebSocket**: Full-duplex communication
- ✅ Bidirectional real-time
- ✅ Low latency
- ✅ Persistent connection
- ❌ More complex setup

### Layer 2: Message Protocol (JSON-RPC 2.0)

**Standard Methods**:
- `initialize` - Establish connection and capabilities
- `notifications/initialized` - Confirm initialization
- `tools/list` - Get available tools
- `tools/call` - Execute a tool
- `resources/list` - Get available resources
- `resources/read` - Read resource content
- `resources/subscribe` - Subscribe to resource changes
- `prompts/list` - Get available prompts
- `prompts/get` - Get prompt template

### Layer 3: Application Protocol (MCP Semantics)

**Tool Execution Flow**:
```
1. Client: tools/list → Server: [tool1, tool2, ...]
2. Client: tools/call(tool1, {params}) → Server: {result}
3. Server: notifications/tools/list_changed → Client: refresh tools
```

**Resource Management Flow**:
```
1. Client: resources/list → Server: [resource1, resource2, ...]
2. Client: resources/subscribe(resource1) → Server: {subscribed: true}
3. Server: notifications/resources/updated(resource1) → Client: fetch new data
4. Client: resources/read(resource1) → Server: {contents}
```

## Component Interaction Patterns

### Pattern 1: Server Initialization Sequence

```typescript
async function initializeServer(): Promise<void> {
  // 1. Create server instance
  const server = new Server(
    { name: 'my-server', version: '1.0.0' },
    { capabilities: { tools: {}, resources: {} } }
  );

  // 2. Initialize core components
  const storage = new StorageEngine();
  await storage.initialize();

  const cache = new CacheManager(storage);
  await cache.initialize();

  // 3. Register tools
  const toolRegistry = new ToolRegistry();
  toolRegistry.register({
    name: 'search',
    description: 'Search the knowledge base',
    inputSchema: SearchSchema,
    handler: async (params) => {
      const cached = await cache.get(params.query);
      if (cached) return cached;

      const results = await storage.search(params.query);
      await cache.set(params.query, results);
      return results;
    }
  });

  // 4. Setup request handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolRegistry.list()
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => ({
    content: await toolRegistry.execute(
      request.params.name,
      request.params.arguments
    )
  }));

  // 5. Connect transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // 6. Setup error handling
  process.on('SIGINT', async () => {
    await cache.flush();
    await storage.close();
    process.exit(0);
  });
}
```

### Pattern 2: Request Processing Pipeline

```typescript
class RequestPipeline {
  private middleware: Middleware[] = [];

  use(middleware: Middleware): void {
    this.middleware.push(middleware);
  }

  async process(request: MCPRequest): Promise<MCPResponse> {
    let context: RequestContext = {
      request,
      metadata: {},
      startTime: Date.now()
    };

    // Execute middleware chain
    for (const mw of this.middleware) {
      context = await mw(context);
      if (context.response) {
        return context.response; // Early return
      }
    }

    // Execute actual handler
    const result = await this.router.route(request);

    return {
      jsonrpc: '2.0',
      id: request.id,
      result
    };
  }
}

// Middleware examples
const loggingMiddleware: Middleware = async (context) => {
  logger.info('Request received', {
    method: context.request.method,
    id: context.request.id
  });
  return context;
};

const authMiddleware: Middleware = async (context) => {
  const token = context.metadata.authorization;
  if (!token || !isValid(token)) {
    context.response = {
      jsonrpc: '2.0',
      id: context.request.id,
      error: {
        code: ErrorCode.InvalidRequest,
        message: 'Unauthorized'
      }
    };
  }
  return context;
};

const cachingMiddleware: Middleware = async (context) => {
  if (context.request.method === 'tools/call') {
    const cacheKey = getCacheKey(context.request);
    const cached = await cache.get(cacheKey);
    if (cached) {
      context.response = {
        jsonrpc: '2.0',
        id: context.request.id,
        result: cached
      };
    }
  }
  return context;
};
```

## Transport Mechanisms

### stdio Transport Implementation

```typescript
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

class StdioMCPServer {
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Log to stderr only (stdout is reserved for MCP messages)
    this.logger.configure({ stream: process.stderr });
  }
}
```

**Configuration**:
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["dist/index.js", "--stdio"]
    }
  }
}
```

### HTTP + SSE Transport Implementation

```typescript
import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

class HTTPMCPServer {
  async start(): Promise<void> {
    const app = express();
    app.use(express.json());

    // SSE endpoint for MCP communication
    const transport = new SSEServerTransport('/mcp/sse', app);
    await this.server.connect(transport);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', version: '1.0.0' });
    });

    app.listen(3000, () => {
      this.logger.info('MCP server listening on port 3000');
    });
  }
}
```

**Client Configuration**:
```typescript
const client = new Client({
  name: 'my-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

const transport = new SSEClientTransport(
  new URL('http://localhost:3000/mcp/sse')
);

await client.connect(transport);
```

## Modular Server Design

### Single Responsibility Servers

**Principle**: Each server should have one clear domain of responsibility.

**Example Structure**:
```
mcp-servers/
├── mcp-filesystem/          # File system operations
│   ├── read, write, list, search files
│   └── Watch for changes
├── mcp-database/            # Database operations
│   ├── Query execution
│   └── Schema inspection
├── mcp-api-gateway/         # API integrations
│   ├── HTTP requests
│   └── Authentication management
├── mcp-memory/              # Knowledge management
│   ├── Store and retrieve information
│   └── Semantic search
└── mcp-orchestrator/        # Coordinate other servers
    ├── Workflow management
    └── Multi-server operations
```

### Modular Server Implementation

```typescript
// Base server interface
interface MCPServerModule {
  name: string;
  version: string;
  capabilities: ServerCapabilities;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

// Filesystem module
class FilesystemServer implements MCPServerModule {
  name = 'mcp-filesystem';
  version = '1.0.0';
  capabilities = { tools: {}, resources: { subscribe: true } };

  private watcher: FSWatcher;

  async initialize(): Promise<void> {
    this.registerTools();
    this.setupWatching();
  }

  private registerTools(): void {
    this.toolRegistry.register({
      name: 'read_file',
      description: 'Read file contents',
      inputSchema: ReadFileSchema,
      handler: async (params) => {
        return await fs.readFile(params.path, 'utf-8');
      }
    });

    this.toolRegistry.register({
      name: 'write_file',
      description: 'Write file contents',
      inputSchema: WriteFileSchema,
      handler: async (params) => {
        await fs.writeFile(params.path, params.content);
        return { success: true };
      }
    });
  }

  private setupWatching(): void {
    this.watcher = fs.watch('.', { recursive: true }, (event, filename) => {
      this.notifyChange({ event, filename });
    });
  }

  async shutdown(): Promise<void> {
    this.watcher?.close();
  }
}

// Database module
class DatabaseServer implements MCPServerModule {
  name = 'mcp-database';
  version = '1.0.0';
  capabilities = { tools: {} };

  private connection: DatabaseConnection;

  async initialize(): Promise<void> {
    this.connection = await connectToDatabase();
    this.registerTools();
  }

  private registerTools(): void {
    this.toolRegistry.register({
      name: 'query',
      description: 'Execute SQL query',
      inputSchema: QuerySchema,
      handler: async (params) => {
        return await this.connection.query(params.sql, params.params);
      }
    });
  }

  async shutdown(): Promise<void> {
    await this.connection.close();
  }
}
```

## Real-World Architecture Examples

### Example 1: Multi-Server Coordination

```typescript
/**
 * Orchestrator server that coordinates multiple specialized servers
 */
class OrchestratorServer {
  private servers: Map<string, MCPServerModule> = new Map();

  async initialize(): Promise<void> {
    // Initialize specialized servers
    this.servers.set('filesystem', new FilesystemServer());
    this.servers.set('database', new DatabaseServer());
    this.servers.set('api', new APIGatewayServer());

    for (const server of this.servers.values()) {
      await server.initialize();
    }

    // Register orchestration tools
    this.registerOrchestratorTools();
  }

  private registerOrchestratorTools(): void {
    this.toolRegistry.register({
      name: 'backup_database_to_file',
      description: 'Backup database to file using both servers',
      inputSchema: BackupSchema,
      handler: async (params) => {
        // Use database server to export
        const dbServer = this.servers.get('database');
        const data = await dbServer.execute('export', params);

        // Use filesystem server to write
        const fsServer = this.servers.get('filesystem');
        await fsServer.execute('write_file', {
          path: params.outputPath,
          content: JSON.stringify(data)
        });

        return { success: true, path: params.outputPath };
      }
    });
  }
}
```

### Example 2: Streaming Architecture

```typescript
/**
 * Server with streaming support for large responses
 */
class StreamingServer {
  async initialize(): Promise<void> {
    this.toolRegistry.register({
      name: 'analyze_large_dataset',
      description: 'Analyze dataset with progress updates',
      inputSchema: AnalyzeSchema,
      handler: async (params, context) => {
        const total = params.records.length;
        const results = [];

        for (let i = 0; i < total; i++) {
          const result = await this.processRecord(params.records[i]);
          results.push(result);

          // Send progress notification
          if (i % 100 === 0) {
            await context.sendProgress({
              total,
              completed: i,
              percentage: (i / total) * 100
            });
          }
        }

        return { results, total: results.length };
      }
    });
  }
}
```

### Example 3: Caching Architecture

```typescript
/**
 * Server with multi-layer caching
 */
class CachedServer {
  private memoryCache: Map<string, any> = new Map();
  private redisCache: RedisClient;
  private persistentCache: SQLiteConnection;

  async getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // Layer 1: Memory cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // Layer 2: Redis cache
    const redisValue = await this.redisCache.get(key);
    if (redisValue) {
      const parsed = JSON.parse(redisValue);
      this.memoryCache.set(key, parsed);
      return parsed;
    }

    // Layer 3: Persistent cache
    const dbValue = await this.persistentCache.get(key);
    if (dbValue && !this.isExpired(dbValue, ttl)) {
      await this.redisCache.setex(key, ttl, JSON.stringify(dbValue.data));
      this.memoryCache.set(key, dbValue.data);
      return dbValue.data;
    }

    // Cache miss - fetch fresh data
    const freshData = await fetcher();

    // Populate all cache layers
    this.memoryCache.set(key, freshData);
    await this.redisCache.setex(key, ttl, JSON.stringify(freshData));
    await this.persistentCache.set(key, freshData);

    return freshData;
  }
}
```

## Conclusion

The 2025 MCP architecture emphasizes:

1. **Modularity** - Single-responsibility servers that can be composed
2. **Capability Negotiation** - Flexible feature discovery and compatibility
3. **Multiple Transports** - Support for different deployment scenarios
4. **Layered Caching** - Performance optimization at multiple levels
5. **Streaming Support** - Handle large responses efficiently
6. **Type Safety** - Comprehensive validation and error handling
7. **Observability** - Built-in logging and monitoring

This architecture enables building scalable, maintainable, and production-ready MCP applications that can handle real-world complexity while maintaining simplicity and developer experience.
