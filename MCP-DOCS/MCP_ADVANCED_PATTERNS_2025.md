# MCP Advanced Patterns 2025: Production-Ready Implementation Patterns

## Table of Contents

1. [Modular Server Design](#modular-server-design)
2. [Capability-Based Access Control](#capability-based-access-control)
3. [Streaming Incremental Responses](#streaming-incremental-responses)
4. [Cache and Deduplication Strategies](#cache-and-deduplication-strategies)
5. [Versioning and Backward Compatibility](#versioning-and-backward-compatibility)
6. [Audit and Traceability](#audit-and-traceability)
7. [Testing Strategies](#testing-strategies)
8. [Error Recovery and Resilience](#error-recovery-and-resilience)
9. [Performance Optimization](#performance-optimization)
10. [Multi-Tenant Architecture](#multi-tenant-architecture)

## Modular Server Design

### Principle: Single Responsibility per Server

**Why**: Easier to maintain, test, deploy, and scale independently.

### Pattern 1: Domain-Based Separation

```typescript
/**
 * Filesystem MCP Server
 * Responsibility: File system operations only
 */
class FilesystemMCPServer {
  name = 'mcp-filesystem';

  private readonly tools = [
    'read_file',
    'write_file',
    'list_directory',
    'watch_file',
    'search_files'
  ];

  async initialize(): Promise<void> {
    this.registerFileOperations();
    this.setupWatchers();
  }

  private registerFileOperations(): void {
    // Register only filesystem-related tools
    this.toolRegistry.register({
      name: 'read_file',
      description: 'Read file contents with encoding support',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute file path' },
          encoding: {
            type: 'string',
            enum: ['utf8', 'base64', 'hex'],
            default: 'utf8'
          }
        },
        required: ['path']
      },
      handler: async (params) => {
        return await this.readFile(params.path, params.encoding);
      }
    });
  }
}

/**
 * Database MCP Server
 * Responsibility: Database operations only
 */
class DatabaseMCPServer {
  name = 'mcp-database';

  private readonly tools = [
    'execute_query',
    'get_schema',
    'explain_query',
    'list_tables'
  ];

  async initialize(): Promise<void> {
    await this.connectToDatabase();
    this.registerDatabaseOperations();
  }
}

/**
 * API Gateway MCP Server
 * Responsibility: External API integrations only
 */
class APIGatewayMCPServer {
  name = 'mcp-api-gateway';

  private readonly tools = [
    'http_request',
    'graphql_query',
    'rest_call',
    'webhook_register'
  ];
}
```

### Pattern 2: Feature-Based Modules

```typescript
/**
 * Modular plugin system for MCP servers
 */
interface MCPModule {
  name: string;
  initialize(server: Server): Promise<void>;
  shutdown(): Promise<void>;
}

class SearchModule implements MCPModule {
  name = 'search';

  async initialize(server: Server): Promise<void> {
    server.toolRegistry.register({
      name: 'search',
      description: 'Search across indexed content',
      inputSchema: SearchSchema,
      handler: this.handleSearch.bind(this)
    });
  }

  private async handleSearch(params: any) {
    // Search implementation
  }

  async shutdown(): Promise<void> {
    // Cleanup search indices
  }
}

class CacheModule implements MCPModule {
  name = 'cache';

  async initialize(server: Server): Promise<void> {
    server.addMiddleware(this.cacheMiddleware.bind(this));
  }

  private async cacheMiddleware(context: RequestContext) {
    const cacheKey = this.getCacheKey(context.request);
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      context.response = cached;
    }

    return context;
  }

  async shutdown(): Promise<void> {
    await this.cache.flush();
  }
}

// Compose modular server
class ModularMCPServer {
  private modules: MCPModule[] = [];

  use(module: MCPModule): this {
    this.modules.push(module);
    return this;
  }

  async initialize(): Promise<void> {
    for (const module of this.modules) {
      await module.initialize(this.server);
      this.logger.info(`Module ${module.name} initialized`);
    }
  }
}

// Usage
const server = new ModularMCPServer()
  .use(new SearchModule())
  .use(new CacheModule())
  .use(new AuthModule())
  .use(new MetricsModule());

await server.initialize();
```

## Capability-Based Access Control

### Pattern 1: Least Privilege Principle

```typescript
/**
 * Capability-based access control system
 */
interface Capability {
  resource: string;
  actions: string[];
  constraints?: Record<string, any>;
}

interface Principal {
  id: string;
  capabilities: Capability[];
}

class CapabilityManager {
  hasCapability(
    principal: Principal,
    resource: string,
    action: string
  ): boolean {
    for (const cap of principal.capabilities) {
      if (this.matchesResource(cap.resource, resource)) {
        if (cap.actions.includes('*') || cap.actions.includes(action)) {
          return this.checkConstraints(cap.constraints);
        }
      }
    }
    return false;
  }

  private matchesResource(pattern: string, resource: string): boolean {
    // Support wildcards: files/* matches files/read, files/write
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return regex.test(resource);
  }

  private checkConstraints(constraints?: Record<string, any>): boolean {
    if (!constraints) return true;

    // Check time-based constraints
    if (constraints.validUntil) {
      if (Date.now() > constraints.validUntil) return false;
    }

    // Check rate limits
    if (constraints.rateLimit) {
      return this.checkRateLimit(constraints.rateLimit);
    }

    return true;
  }
}

// Example usage
const principal: Principal = {
  id: 'user-123',
  capabilities: [
    {
      resource: 'files/*',
      actions: ['read'],
      constraints: {
        validUntil: Date.now() + 3600000, // 1 hour
        rateLimit: { requests: 100, window: 60000 } // 100 req/min
      }
    },
    {
      resource: 'database/public/*',
      actions: ['read', 'query']
    }
  ]
};

const capMgr = new CapabilityManager();

// Check permissions before tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const principal = await authenticatePrincipal(request);

  if (!capMgr.hasCapability(principal, request.params.name, 'execute')) {
    throw new McpError(ErrorCode.InvalidRequest, 'Insufficient permissions');
  }

  return await toolRegistry.execute(request.params.name, request.params.arguments);
});
```

### Pattern 2: Context-Aware Filtering

```typescript
/**
 * Filter resources based on principal capabilities
 */
class ResourceFilter {
  filterResources(
    principal: Principal,
    resources: Resource[]
  ): Resource[] {
    return resources.filter(resource => {
      return this.canAccess(principal, resource);
    });
  }

  private canAccess(principal: Principal, resource: Resource): boolean {
    for (const cap of principal.capabilities) {
      if (this.matchesResource(cap.resource, resource.uri)) {
        // Check if principal has 'read' capability
        if (cap.actions.includes('read') || cap.actions.includes('*')) {
          return true;
        }
      }
    }
    return false;
  }
}

// Filter tools list based on capabilities
server.setRequestHandler(ListToolsRequestSchema, async (request) => {
  const principal = await authenticatePrincipal(request);
  const allTools = toolRegistry.list();

  // Only return tools the principal can execute
  const allowedTools = allTools.filter(tool => {
    return capMgr.hasCapability(principal, tool.name, 'execute');
  });

  return { tools: allowedTools };
});
```

## Streaming Incremental Responses

### Pattern 1: Server-Sent Events (SSE) Streaming

```typescript
/**
 * Streaming response handler for long-running operations
 */
class StreamingToolHandler {
  async handleStreamingTool(
    params: any,
    sendProgress: (data: any) => void
  ): Promise<any> {
    const total = params.items.length;
    const results = [];

    for (let i = 0; i < total; i++) {
      const result = await this.processItem(params.items[i]);
      results.push(result);

      // Send progress update every 10 items or on completion
      if (i % 10 === 0 || i === total - 1) {
        sendProgress({
          type: 'progress',
          completed: i + 1,
          total,
          percentage: ((i + 1) / total) * 100,
          currentResult: result
        });
      }
    }

    return { results, total: results.length };
  }
}

// Express + SSE implementation
app.post('/mcp/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendProgress = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const result = await streamingHandler.handleStreamingTool(
      req.body.params,
      sendProgress
    );

    // Send final result
    res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});
```

### Pattern 2: Chunked Response Processing

```typescript
/**
 * Stream large responses in chunks
 */
class ChunkedResponseHandler {
  async *processInChunks(
    items: any[],
    chunkSize: number = 100
  ): AsyncGenerator<any[]> {
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const processed = await Promise.all(
        chunk.map(item => this.processItem(item))
      );
      yield processed;
    }
  }
}

// Usage with MCP resource subscription
server.setResourceSubscriptionHandler(async (uri) => {
  const handler = new ChunkedResponseHandler();
  const items = await loadLargeDataset();

  for await (const chunk of handler.processInChunks(items)) {
    // Send notification for each chunk
    server.notification({
      method: 'notifications/resources/updated',
      params: {
        uri,
        chunk,
        more: true
      }
    });
  }

  // Send final notification
  server.notification({
    method: 'notifications/resources/updated',
    params: {
      uri,
      more: false
    }
  });
});
```

## Cache and Deduplication Strategies

### Pattern 1: Multi-Layer Caching

```typescript
/**
 * Three-tier cache: Memory → Redis → Database
 */
class MultiLayerCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private redis: RedisClient;
  private db: DatabaseConnection;

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // Layer 1: Memory cache (fastest)
    const memEntry = this.memoryCache.get(key);
    if (memEntry && !this.isExpired(memEntry)) {
      return memEntry.value;
    }

    // Layer 2: Redis cache (fast, distributed)
    try {
      const redisValue = await this.redis.get(key);
      if (redisValue) {
        const parsed = JSON.parse(redisValue);
        this.memoryCache.set(key, {
          value: parsed,
          expiresAt: Date.now() + ttl * 1000
        });
        return parsed;
      }
    } catch (error) {
      this.logger.warn('Redis cache miss', { key, error });
    }

    // Layer 3: Database cache (persistent)
    try {
      const dbEntry = await this.db.getCacheEntry(key);
      if (dbEntry && !this.isExpired(dbEntry)) {
        // Populate upper layers
        await this.redis.setex(key, ttl, JSON.stringify(dbEntry.value));
        this.memoryCache.set(key, dbEntry);
        return dbEntry.value;
      }
    } catch (error) {
      this.logger.warn('Database cache miss', { key, error });
    }

    // Cache miss - fetch fresh data
    const freshData = await fetcher();

    // Populate all cache layers
    this.memoryCache.set(key, {
      value: freshData,
      expiresAt: Date.now() + ttl * 1000
    });

    await this.redis.setex(key, ttl, JSON.stringify(freshData));
    await this.db.setCacheEntry(key, freshData, ttl);

    return freshData;
  }

  async invalidate(keyPattern: string): Promise<void> {
    // Invalidate across all layers
    for (const key of this.memoryCache.keys()) {
      if (this.matchesPattern(key, keyPattern)) {
        this.memoryCache.delete(key);
      }
    }

    await this.redis.del(keyPattern);
    await this.db.deleteCacheEntries(keyPattern);
  }
}
```

### Pattern 2: Request Deduplication

```typescript
/**
 * Deduplicate identical concurrent requests
 */
class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map();

  async deduplicate<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // Check if request is already in flight
    const existing = this.pending.get(key);
    if (existing) {
      this.logger.debug('Request deduplicated', { key });
      return existing;
    }

    // Execute and cache promise
    const promise = fn()
      .finally(() => {
        // Remove from pending when complete
        this.pending.delete(key);
      });

    this.pending.set(key, promise);
    return promise;
  }
}

// Usage
const deduplicator = new RequestDeduplicator();

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const key = `tool:${request.params.name}:${JSON.stringify(request.params.arguments)}`;

  return await deduplicator.deduplicate(key, async () => {
    return await toolRegistry.execute(
      request.params.name,
      request.params.arguments
    );
  });
});
```

### Pattern 3: Content-Based Deduplication

```typescript
/**
 * Deduplicate based on content hash
 */
class ContentDeduplicator {
  private contentStore: Map<string, any> = new Map();

  async store(content: any): Promise<string> {
    const hash = this.computeHash(content);

    if (!this.contentStore.has(hash)) {
      this.contentStore.set(hash, content);
      this.logger.debug('Stored new content', { hash });
    } else {
      this.logger.debug('Content already exists', { hash });
    }

    return hash;
  }

  async retrieve(hash: string): Promise<any | null> {
    return this.contentStore.get(hash) || null;
  }

  private computeHash(content: any): string {
    const crypto = require('crypto');
    const str = JSON.stringify(content);
    return crypto.createHash('sha256').update(str).digest('hex');
  }
}
```

## Versioning and Backward Compatibility

### Pattern 1: API Versioning

```typescript
/**
 * Version-aware MCP server
 */
interface VersionedTool {
  name: string;
  version: string;
  deprecated?: boolean;
  deprecationMessage?: string;
  handler: (params: any) => Promise<any>;
}

class VersionedToolRegistry {
  private tools: Map<string, VersionedTool[]> = new Map();

  register(tool: VersionedTool): void {
    const versions = this.tools.get(tool.name) || [];
    versions.push(tool);
    versions.sort((a, b) => this.compareVersions(b.version, a.version));
    this.tools.set(tool.name, versions);
  }

  async execute(
    name: string,
    version: string | undefined,
    params: any
  ): Promise<any> {
    const versions = this.tools.get(name);
    if (!versions || versions.length === 0) {
      throw new Error(`Tool ${name} not found`);
    }

    // Use specific version or latest
    const tool = version
      ? versions.find(t => t.version === version)
      : versions[0]; // Latest version

    if (!tool) {
      throw new Error(`Tool ${name} version ${version} not found`);
    }

    // Warn if deprecated
    if (tool.deprecated) {
      this.logger.warn('Using deprecated tool', {
        name: tool.name,
        version: tool.version,
        message: tool.deprecationMessage
      });
    }

    return await tool.handler(params);
  }

  list(includeDeprecated: boolean = false): VersionedTool[] {
    const allTools: VersionedTool[] = [];

    for (const versions of this.tools.values()) {
      // Always include latest version
      allTools.push(versions[0]);

      // Include other versions if requested
      if (includeDeprecated) {
        allTools.push(...versions.slice(1));
      }
    }

    return allTools;
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;
      if (num1 !== num2) return num1 - num2;
    }

    return 0;
  }
}

// Register multiple versions
const registry = new VersionedToolRegistry();

registry.register({
  name: 'search',
  version: '1.0.0',
  deprecated: true,
  deprecationMessage: 'Use version 2.0.0 with improved ranking',
  handler: async (params) => {
    return await searchV1(params);
  }
});

registry.register({
  name: 'search',
  version: '2.0.0',
  handler: async (params) => {
    return await searchV2(params);
  }
});

// Execute with version
await registry.execute('search', '2.0.0', { query: 'test' });
await registry.execute('search', undefined, { query: 'test' }); // Uses latest
```

### Pattern 2: Schema Evolution

```typescript
/**
 * Handle schema changes gracefully
 */
class SchemaEvolution {
  /**
   * Migrate old params to new schema
   */
  migrateParams(
    params: any,
    fromVersion: string,
    toVersion: string
  ): any {
    const migrations = this.getMigrations(fromVersion, toVersion);

    let migrated = { ...params };
    for (const migration of migrations) {
      migrated = migration(migrated);
    }

    return migrated;
  }

  private getMigrations(from: string, to: string): Array<(params: any) => any> {
    // Example migrations
    const allMigrations: Record<string, (params: any) => any> = {
      '1.0.0→2.0.0': (params) => ({
        ...params,
        // Rename field
        limit: params.maxResults,
        maxResults: undefined,
        // Add new required field with default
        sortBy: params.sortBy || 'relevance'
      }),
      '2.0.0→3.0.0': (params) => ({
        ...params,
        // Transform structure
        filters: {
          category: params.category,
          dateRange: params.dateRange
        },
        category: undefined,
        dateRange: undefined
      })
    };

    const needed: Array<(params: any) => any> = [];
    const versions = ['1.0.0', '2.0.0', '3.0.0'];
    const fromIdx = versions.indexOf(from);
    const toIdx = versions.indexOf(to);

    for (let i = fromIdx; i < toIdx; i++) {
      const key = `${versions[i]}→${versions[i + 1]}`;
      if (allMigrations[key]) {
        needed.push(allMigrations[key]);
      }
    }

    return needed;
  }
}
```

## Audit and Traceability

### Pattern 1: Comprehensive Audit Logging

```typescript
/**
 * Audit trail for all MCP operations
 */
interface AuditEntry {
  timestamp: number;
  requestId: string;
  principal: string;
  operation: string;
  resource: string;
  params: any;
  result?: any;
  error?: string;
  duration: number;
  metadata: Record<string, any>;
}

class AuditLogger {
  private storage: AuditStorage;

  async log(entry: AuditEntry): Promise<void> {
    await this.storage.append(entry);

    // Also send to monitoring system
    this.sendToMonitoring(entry);
  }

  async query(filters: {
    principal?: string;
    operation?: string;
    startTime?: number;
    endTime?: number;
  }): Promise<AuditEntry[]> {
    return await this.storage.query(filters);
  }

  private sendToMonitoring(entry: AuditEntry): void {
    // Send metrics
    metrics.recordOperation({
      operation: entry.operation,
      duration: entry.duration,
      success: !entry.error
    });

    // Alert on errors
    if (entry.error) {
      alerts.send({
        level: 'error',
        message: `Operation failed: ${entry.operation}`,
        details: entry
      });
    }
  }
}

// Middleware for automatic auditing
class AuditMiddleware {
  constructor(private auditLogger: AuditLogger) {}

  async handle(context: RequestContext): Promise<RequestContext> {
    const startTime = Date.now();

    try {
      // Process request
      const result = await context.next();

      // Log successful operation
      await this.auditLogger.log({
        timestamp: startTime,
        requestId: context.requestId,
        principal: context.principal.id,
        operation: context.request.method,
        resource: context.request.params?.name,
        params: context.request.params,
        result,
        duration: Date.now() - startTime,
        metadata: context.metadata
      });

      return result;
    } catch (error) {
      // Log failed operation
      await this.auditLogger.log({
        timestamp: startTime,
        requestId: context.requestId,
        principal: context.principal.id,
        operation: context.request.method,
        resource: context.request.params?.name,
        params: context.request.params,
        error: error.message,
        duration: Date.now() - startTime,
        metadata: context.metadata
      });

      throw error;
    }
  }
}
```

### Pattern 2: Distributed Tracing

```typescript
/**
 * OpenTelemetry integration for distributed tracing
 */
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

class TracingMiddleware {
  private tracer = trace.getTracer('mcp-server');

  async handle(ctx: RequestContext): Promise<RequestContext> {
    const span = this.tracer.startSpan('mcp.request', {
      attributes: {
        'mcp.method': ctx.request.method,
        'mcp.tool': ctx.request.params?.name,
        'mcp.principal': ctx.principal.id
      }
    });

    try {
      // Execute in span context
      const result = await context.with(
        trace.setSpan(context.active(), span),
        async () => {
          return await ctx.next();
        }
      );

      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }
}
```

## Testing Strategies

### Pattern 1: Contract Testing

```typescript
/**
 * Test MCP protocol compliance
 */
describe('MCP Protocol Compliance', () => {
  let server: Server;

  beforeEach(async () => {
    server = new Server(
      { name: 'test-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    await server.initialize();
  });

  it('should respond to initialize request', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    };

    const response = await server.handleRequest(request);

    expect(response).toMatchObject({
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: expect.any(String),
        capabilities: expect.any(Object),
        serverInfo: expect.objectContaining({
          name: expect.any(String),
          version: expect.any(String)
        })
      }
    });
  });

  it('should list tools with valid schemas', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };

    const response = await server.handleRequest(request);

    expect(response.result.tools).toBeInstanceOf(Array);
    response.result.tools.forEach(tool => {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(tool.inputSchema).toHaveProperty('type', 'object');
    });
  });
});
```

### Pattern 2: Integration Testing

```typescript
/**
 * End-to-end integration tests
 */
describe('MCP Server Integration', () => {
  let client: MCPClient;

  beforeEach(async () => {
    client = new MCPClient();
    await client.connect({ command: 'node', args: ['dist/index.js'] });
  });

  afterEach(async () => {
    await client.disconnect();
  });

  it('should execute search tool successfully', async () => {
    const result = await client.callTool('search', {
      query: 'test query',
      limit: 10
    });

    expect(result).toHaveProperty('content');
    expect(result.content).toBeInstanceOf(Array);
  });

  it('should handle errors gracefully', async () => {
    await expect(
      client.callTool('search', { /* missing required param */ })
    ).rejects.toThrow(/Invalid params/);
  });
});
```

## Error Recovery and Resilience

### Pattern 1: Retry with Exponential Backoff

```typescript
/**
 * Resilient operation executor
 */
class ResilientExecutor {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
      backoffMultiplier?: number;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2
    } = options;

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          this.logger.warn('Operation failed, retrying', {
            attempt: attempt + 1,
            maxRetries,
            delay,
            error: error.message
          });

          await this.sleep(delay);
          delay = Math.min(delay * backoffMultiplier, maxDelay);
        }
      }
    }

    throw new Error(`Operation failed after ${maxRetries} retries: ${lastError.message}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Pattern 2: Circuit Breaker

```typescript
/**
 * Circuit breaker pattern for external dependencies
 */
enum CircuitState {
  CLOSED,  // Normal operation
  OPEN,    // Failing, reject requests
  HALF_OPEN // Testing if service recovered
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();

      // Success - reset if in HALF_OPEN
      if (this.state === CircuitState.HALF_OPEN) {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = CircuitState.OPEN;
      this.logger.error('Circuit breaker opened', { failures: this.failures });
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
    this.logger.info('Circuit breaker reset');
  }
}
```

## Performance Optimization

### Pattern 1: Connection Pooling

```typescript
/**
 * Database connection pool
 */
class ConnectionPool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();

  constructor(
    private create: () => Promise<T>,
    private destroy: (conn: T) => Promise<void>,
    private maxSize: number = 10
  ) {}

  async acquire(): Promise<T> {
    // Reuse available connection
    if (this.available.length > 0) {
      const conn = this.available.pop()!;
      this.inUse.add(conn);
      return conn;
    }

    // Create new if under limit
    if (this.inUse.size < this.maxSize) {
      const conn = await this.create();
      this.inUse.add(conn);
      return conn;
    }

    // Wait for available connection
    return await this.waitForConnection();
  }

  async release(conn: T): Promise<void> {
    this.inUse.delete(conn);
    this.available.push(conn);
  }

  async destroy(): Promise<void> {
    const all = [...this.available, ...this.inUse];
    await Promise.all(all.map(conn => this.destroy(conn)));
    this.available = [];
    this.inUse.clear();
  }

  private async waitForConnection(): Promise<T> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.available.length > 0) {
          clearInterval(interval);
          const conn = this.available.pop()!;
          this.inUse.add(conn);
          resolve(conn);
        }
      }, 100);
    });
  }
}
```

### Pattern 2: Lazy Loading and Code Splitting

```typescript
/**
 * Lazy load heavy dependencies
 */
class LazyToolRegistry {
  private loaders: Map<string, () => Promise<any>> = new Map();
  private loaded: Map<string, any> = new Map();

  registerLazy(name: string, loader: () => Promise<any>): void {
    this.loaders.set(name, loader);
  }

  async execute(name: string, params: any): Promise<any> {
    // Load tool on first use
    if (!this.loaded.has(name)) {
      const loader = this.loaders.get(name);
      if (!loader) {
        throw new Error(`Tool ${name} not found`);
      }

      this.logger.info('Lazy loading tool', { name });
      const tool = await loader();
      this.loaded.set(name, tool);
    }

    const tool = this.loaded.get(name);
    return await tool.handler(params);
  }
}

// Usage
const registry = new LazyToolRegistry();

// Register heavy tools with lazy loading
registry.registerLazy('image-processing', async () => {
  const { ImageProcessor } = await import('./heavy/image-processor.js');
  return {
    handler: async (params) => {
      const processor = new ImageProcessor();
      return await processor.process(params);
    }
  };
});
```

## Multi-Tenant Architecture

### Pattern: Tenant Isolation

```typescript
/**
 * Multi-tenant MCP server with data isolation
 */
interface Tenant {
  id: string;
  name: string;
  config: Record<string, any>;
}

class MultiTenantServer {
  private tenants: Map<string, Tenant> = new Map();
  private tenantStorage: Map<string, any> = new Map();

  async initialize(): Promise<void> {
    // Load tenant configurations
    await this.loadTenants();

    // Setup isolated resources per tenant
    for (const tenant of this.tenants.values()) {
      await this.initializeTenant(tenant);
    }
  }

  private async initializeTenant(tenant: Tenant): Promise<void> {
    // Create isolated storage
    const storage = new IsolatedStorage(tenant.id);
    await storage.initialize();
    this.tenantStorage.set(tenant.id, storage);

    this.logger.info('Tenant initialized', { tenantId: tenant.id });
  }

  async handleRequest(request: MCPRequest, tenantId: string): Promise<any> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const storage = this.tenantStorage.get(tenantId);

    // Execute request with tenant context
    return await this.executeInTenantContext(tenant, storage, request);
  }

  private async executeInTenantContext(
    tenant: Tenant,
    storage: any,
    request: MCPRequest
  ): Promise<any> {
    // All operations are scoped to this tenant
    const context = {
      tenant,
      storage,
      config: tenant.config
    };

    return await this.router.route(request, context);
  }
}
```

## Conclusion

These advanced patterns enable building production-ready MCP servers that are:

- **Modular** - Easy to maintain and extend
- **Secure** - Capability-based access control
- **Performant** - Caching, pooling, lazy loading
- **Resilient** - Error handling, retries, circuit breakers
- **Observable** - Comprehensive auditing and tracing
- **Maintainable** - Versioning and backward compatibility

Choose patterns based on your specific requirements and scale them as your needs grow.
