# MCP Integration Cookbook - 2025 Edition

Practical recipes for integrating MCP servers with various frameworks, tools, and platforms.

## Table of Contents

1. [Zod + JSON Schema Integration](#zod--json-schema-integration)
2. [Claude Desktop Integration](#claude-desktop-integration)
3. [HTTP + SSE Transport](#http--sse-transport)
4. [Redis Caching Integration](#redis-caching-integration)
5. [Vector Database Integration](#vector-database-integration)
6. [OpenTelemetry Observability](#opentelemetry-observability)
7. [Authentication Integration](#authentication-integration)
8. [Database Integration Patterns](#database-integration-patterns)
9. [CI/CD Integration](#cicd-integration)
10. [Testing Integration](#testing-integration)

## Zod + JSON Schema Integration

### Recipe: Type-Safe Tool Definitions

**Problem**: Need runtime validation AND type-safe JSON Schema for MCP tool registration.

**Solution**: Use Zod for validation, convert to JSON Schema for registration.

```typescript
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Step 1: Define Zod schema with descriptions
const SearchToolSchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty')
    .describe('Search query string'),

  filters: z.object({
    category: z.enum(['docs', 'code', 'api'])
      .optional()
      .describe('Filter by category'),

    dateRange: z.object({
      from: z.string().datetime().describe('Start date'),
      to: z.string().datetime().describe('End date'),
    }).optional().describe('Optional date range filter'),

    maxResults: z.number()
      .int()
      .min(1)
      .max(100)
      .default(10)
      .describe('Maximum number of results'),
  }).optional().describe('Optional search filters'),

  includeArchived: z.boolean()
    .default(false)
    .describe('Include archived results'),

}).describe('Search tool input parameters');

// Step 2: Infer TypeScript type
type SearchToolInput = z.infer<typeof SearchToolSchema>;

// Step 3: Convert to JSON Schema
const searchToolJsonSchema = zodToJsonSchema(
  SearchToolSchema,
  'SearchTool'
);

// Step 4: Register tool with JSON Schema
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [{
      name: 'search',
      description: 'Advanced search with filters and pagination',
      inputSchema: searchToolJsonSchema
    }]
  };
});

// Step 5: Tool handler with Zod validation
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'search') {
    // Type-safe validation
    const validated = SearchToolSchema.parse(args);

    // TypeScript knows all types now
    const results = await performSearch({
      query: validated.query,
      filters: validated.filters, // Typed!
      includeArchived: validated.includeArchived,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results, null, 2)
      }]
    };
  }
});
```

**Benefits**:
- ✅ Single source of truth for validation
- ✅ Automatic TypeScript types
- ✅ Runtime validation with clear error messages
- ✅ MCP-compatible JSON Schema

## Claude Desktop Integration

### Recipe: Production Claude Desktop Configuration

**Problem**: Server not appearing in Claude Desktop or tools not working.

**Solution**: Use absolute paths and proper JSON Schema format.

```json
{
  "mcpServers": {
    "my-production-server": {
      "command": "/Users/username/.nvm/versions/node/v22.16.0/bin/node",
      "args": [
        "/Users/username/projects/my-mcp-server/dist/index.js",
        "--stdio"
      ],
      "cwd": "/Users/username/projects/my-mcp-server",
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info",
        "REDIS_URL": "redis://localhost:6379",
        "DATABASE_URL": "postgresql://localhost/myapp"
      }
    }
  }
}
```

**Find Your Node Path**:
```bash
# For nvm users
nvm which current

# For standard installation
which node

# Verify it works
/path/to/node --version
```

**Test Configuration**:
```bash
# 1. Build your server
npm run build

# 2. Test stdio mode manually
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  /Users/username/.nvm/versions/node/v22.16.0/bin/node \
  /Users/username/projects/my-mcp-server/dist/index.js \
  --stdio

# 3. Should see tools listed in JSON-RPC format
```

## HTTP + SSE Transport

### Recipe: Remote MCP Server with Streaming

**Problem**: Need to expose MCP server over HTTP with streaming responses.

**Solution**: Use HTTP + Server-Sent Events (SSE) transport.

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import cors from 'cors';

const app = express();
const mcpServer = new Server(
  { name: 'remote-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Enable CORS for remote access
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

app.use(express.json());

// SSE endpoint for streaming
app.get('/sse', async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Create SSE transport
  const transport = new SSEServerTransport('/message', res);

  // Connect MCP server to transport
  await mcpServer.connect(transport);

  // Handle client disconnect
  req.on('close', () => {
    transport.close();
  });
});

// POST endpoint for messages
app.post('/message', async (req, res) => {
  // Forward message to MCP server
  // Response sent via SSE
  res.status(202).send({ status: 'processing' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.error(`MCP server listening on http://localhost:${PORT}`);
});
```

**Client Configuration**:
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "http://localhost:3000/sse",
      "transport": "sse"
    }
  }
}
```

## Redis Caching Integration

### Recipe: Multi-Layer Cache with Redis

**Problem**: Need distributed caching for MCP server across multiple instances.

**Solution**: Implement Memory → Redis → Database cache pattern.

```typescript
import Redis from 'ioredis';

class MultiLayerCache<T> {
  private memoryCache = new Map<string, { value: T; expiresAt: number }>();
  private redis: Redis;
  private readonly memoryTTL = 60; // 1 minute
  private readonly redisTTL = 3600; // 1 hour

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    // Handle Redis errors gracefully
    this.redis.on('error', (error) => {
      console.error('Redis error:', error);
    });
  }

  async get(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.redisTTL
  ): Promise<T> {
    // Layer 1: Memory cache (fastest, ephemeral)
    const memEntry = this.memoryCache.get(key);
    if (memEntry && memEntry.expiresAt > Date.now()) {
      return memEntry.value;
    }

    try {
      // Layer 2: Redis cache (fast, distributed)
      const redisValue = await this.redis.get(key);
      if (redisValue) {
        const parsed = JSON.parse(redisValue) as T;

        // Populate memory cache
        this.memoryCache.set(key, {
          value: parsed,
          expiresAt: Date.now() + this.memoryTTL * 1000
        });

        return parsed;
      }
    } catch (error) {
      console.error('Redis GET error:', error);
      // Continue to fetcher if Redis fails
    }

    // Layer 3: Cache miss - fetch fresh data
    const freshData = await fetcher();

    // Populate all cache layers
    await this.set(key, freshData, ttl);

    return freshData;
  }

  async set(key: string, value: T, ttl: number = this.redisTTL): Promise<void> {
    // Update memory cache
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + this.memoryTTL * 1000
    });

    try {
      // Update Redis cache
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis SET error:', error);
      // Continue even if Redis fails
    }
  }

  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      // Also clear memory cache matching pattern
      for (const key of this.memoryCache.keys()) {
        if (key.match(new RegExp(pattern.replace('*', '.*')))) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Redis pattern invalidation error:', error);
    }
  }

  async close(): Promise<void> {
    this.memoryCache.clear();
    await this.redis.quit();
  }
}

// Usage in MCP server
const cache = new MultiLayerCache<any>(
  process.env.REDIS_URL || 'redis://localhost:6379'
);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await cache.close();
  process.exit(0);
});

// In tool handler
async function handleCachedTool(args: any) {
  const cacheKey = `tool:${args.resource}:${args.query}`;

  return await cache.get(cacheKey, async () => {
    // Expensive operation only runs on cache miss
    return await performExpensiveOperation(args);
  }, 300); // 5 minute TTL
}
```

## Vector Database Integration

### Recipe: Semantic Search with Qdrant

**Problem**: Need semantic search capabilities in MCP server.

**Solution**: Integrate Qdrant vector database for embeddings.

```typescript
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';

class SemanticSearchTool {
  private qdrant: QdrantClient;
  private openai: OpenAI;
  private collectionName = 'documents';

  constructor() {
    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async initialize(): Promise<void> {
    // Create collection if it doesn't exist
    try {
      await this.qdrant.getCollection(this.collectionName);
    } catch (error) {
      await this.qdrant.createCollection(this.collectionName, {
        vectors: {
          size: 1536, // OpenAI ada-002 dimension
          distance: 'Cosine',
        },
      });
    }
  }

  async indexDocument(id: string, text: string, metadata: any): Promise<void> {
    // Generate embedding
    const embedding = await this.generateEmbedding(text);

    // Store in Qdrant
    await this.qdrant.upsert(this.collectionName, {
      points: [{
        id,
        vector: embedding,
        payload: {
          text,
          ...metadata,
        },
      }],
    });
  }

  async search(query: string, limit: number = 10): Promise<any[]> {
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Search Qdrant
    const results = await this.qdrant.search(this.collectionName, {
      vector: queryEmbedding,
      limit,
      with_payload: true,
    });

    return results.map(result => ({
      id: result.id,
      score: result.score,
      text: result.payload?.text,
      metadata: result.payload,
    }));
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  }
}

// MCP Tool Registration
const semanticSearch = new SemanticSearchTool();
await semanticSearch.initialize();

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'semantic-search') {
    const results = await semanticSearch.search(
      args.query,
      args.maxResults || 10
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results, null, 2)
      }]
    };
  }
});
```

## OpenTelemetry Observability

### Recipe: Production Observability Stack

**Problem**: Need comprehensive monitoring and tracing for MCP server.

**Solution**: Integrate OpenTelemetry with Prometheus and Jaeger.

```typescript
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics';

// Initialize tracing
const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'mcp-server',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
});

// Configure Jaeger exporter
const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
});

provider.addSpanProcessor(new BatchSpanProcessor(jaegerExporter));
provider.register();

const tracer = trace.getTracer('mcp-server', '1.0.0');

// Initialize metrics
const metricsExporter = new PrometheusExporter(
  { port: 9464 },
  () => console.error('Prometheus scrape endpoint: http://localhost:9464/metrics')
);

const meterProvider = new MeterProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'mcp-server',
  }),
  readers: [metricsExporter],
});

const meter = meterProvider.getMeter('mcp-server');

// Create metrics
const toolExecutionCounter = meter.createCounter('tool_executions_total', {
  description: 'Total number of tool executions',
});

const toolExecutionDuration = meter.createHistogram('tool_execution_duration_ms', {
  description: 'Tool execution duration in milliseconds',
});

// Instrumented tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const correlationId = uuidv4();

  return await tracer.startActiveSpan(
    `tool.${name}`,
    {
      attributes: {
        'tool.name': name,
        'tool.args': JSON.stringify(args),
        'correlation.id': correlationId,
      },
    },
    async (span) => {
      const startTime = Date.now();

      try {
        // Execute tool
        const result = await executeTool(name, args);

        // Record metrics
        const duration = Date.now() - startTime;
        toolExecutionCounter.add(1, { tool: name, status: 'success' });
        toolExecutionDuration.record(duration, { tool: name });

        // Record successful span
        span.setStatus({ code: SpanStatusCode.OK });
        span.setAttribute('tool.result.size', JSON.stringify(result).length);
        span.setAttribute('tool.duration.ms', duration);

        return result;
      } catch (error) {
        // Record error metrics
        toolExecutionCounter.add(1, { tool: name, status: 'error' });

        // Record error in span
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        span.recordException(error);

        throw error;
      } finally {
        span.end();
      }
    }
  );
});
```

## Authentication Integration

### Recipe: JWT-Based Authentication

**Problem**: Need to secure MCP server with authentication.

**Solution**: Implement JWT middleware for HTTP transport.

```typescript
import jwt from 'jsonwebtoken';
import express from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthPayload {
  userId: string;
  capabilities: string[];
  exp?: number;
}

// JWT middleware
function authenticateJWT(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;

    // Add user context to request
    (req as any).user = payload;

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Apply authentication to MCP endpoints
app.get('/sse', authenticateJWT, async (req, res) => {
  const user = (req as any).user;

  // Create MCP transport with user context
  const transport = new SSEServerTransport('/message', res);

  // Pass user capabilities to MCP server
  const serverWithCapabilities = createServerWithCapabilities(user.capabilities);

  await serverWithCapabilities.connect(transport);
});

// Capability-based tool access
function createServerWithCapabilities(capabilities: string[]) {
  const server = new Server(
    { name: 'secure-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;

    // Check if user has capability for this tool
    const requiredCapability = `tools:${name}`;
    if (!capabilities.includes(requiredCapability)) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Missing required capability: ${requiredCapability}`
      );
    }

    // Execute tool
    return await executeTool(name, request.params.arguments);
  });

  return server;
}

// Token generation endpoint
app.post('/auth/token', async (req, res) => {
  const { username, password } = req.body;

  // Validate credentials (use proper auth system)
  const user = await validateCredentials(username, password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT with capabilities
  const token = jwt.sign(
    {
      userId: user.id,
      capabilities: user.capabilities,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token });
});
```

## Database Integration Patterns

### Recipe: PostgreSQL with Connection Pooling

**Problem**: Need reliable database access in MCP server.

**Solution**: Use connection pooling with proper error handling.

```typescript
import { Pool, PoolClient } from 'pg';

class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20, // Maximum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
    });
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(sql, params);
      return result.rows as T[];
    } finally {
      client.release();
    }
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Usage in MCP tool
const db = new DatabaseService();

async function handleDatabaseTool(args: any) {
  const users = await db.query<{ id: string; name: string }>(
    'SELECT id, name FROM users WHERE active = $1 LIMIT $2',
    [true, args.limit || 10]
  );

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(users, null, 2)
    }]
  };
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await db.close();
  process.exit(0);
});
```

## CI/CD Integration

### Recipe: GitHub Actions Deployment

**Problem**: Need automated testing and deployment for MCP server.

**Solution**: GitHub Actions workflow with testing and Docker deployment.

```yaml
# .github/workflows/deploy.yml
name: Deploy MCP Server

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      redis:
        image: redis:7
        ports:
          - 6379:6379

      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Unit tests
        run: npm test
        env:
          REDIS_URL: redis://localhost:6379
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Integration tests
        run: npm run test:integration

      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t mcp-server:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push mcp-server:${{ github.sha }}

      - name: Deploy to production
        run: |
          # Your deployment script here
          echo "Deploying mcp-server:${{ github.sha }}"
```

## Testing Integration

### Recipe: Comprehensive Test Setup

**Problem**: Need robust testing for MCP server.

**Solution**: Jest with integration and E2E tests.

```typescript
// tests/setup.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { spawn, ChildProcess } from 'child_process';

export class TestMCPServer {
  private process?: ChildProcess;
  private serverPath: string;

  constructor(serverPath: string) {
    this.serverPath = serverPath;
  }

  async start(): Promise<void> {
    this.process = spawn('node', [this.serverPath, '--stdio']);

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async sendRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);

      this.process!.stdout.once('data', (data) => {
        clearTimeout(timeout);
        try {
          resolve(JSON.parse(data.toString()));
        } catch (error) {
          reject(error);
        }
      });

      this.process!.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// tests/integration.test.ts
import { TestMCPServer } from './setup';

describe('MCP Server Integration Tests', () => {
  let server: TestMCPServer;

  beforeAll(async () => {
    server = new TestMCPServer('./dist/index.js');
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  test('should list all tools', async () => {
    const response = await server.sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    });

    expect(response.result.tools).toHaveLength(7);
    expect(response.result.tools[0].name).toBe('echo');
  });

  test('should execute tool with validation', async () => {
    const response = await server.sendRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'calculator',
        arguments: { operation: 'add', a: 5, b: 3 },
      },
    });

    expect(response.result.content[0].text).toContain('8');
  });

  test('should handle validation errors', async () => {
    const response = await server.sendRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'calculator',
        arguments: { operation: 'invalid', a: 5, b: 3 },
      },
    });

    expect(response.error).toBeDefined();
    expect(response.error.code).toBe(-32602);
  });
});
```

## Conclusion

These integration recipes provide production-ready patterns for:

- ✅ Type-safe validation with Zod + JSON Schema
- ✅ Claude Desktop integration with proper configuration
- ✅ Remote access with HTTP + SSE
- ✅ Distributed caching with Redis
- ✅ Semantic search with vector databases
- ✅ Comprehensive observability with OpenTelemetry
- ✅ Secure authentication with JWT
- ✅ Reliable database access with pooling
- ✅ Automated CI/CD pipelines
- ✅ Robust testing infrastructure

For more patterns and examples, see:
- [MCP_ADVANCED_PATTERNS_2025.md](./MCP_ADVANCED_PATTERNS_2025.md)
- [MCP_WORKFLOWS_2025.md](./MCP_WORKFLOWS_2025.md)
- [MCP_IMPLEMENTATION_GUIDE.md](./MCP_IMPLEMENTATION_GUIDE.md)
