# MCP Remote Deployment 2025: Hosting and Scaling Guide

## Table of Contents

1. [Introduction to Remote MCP](#introduction-to-remote-mcp)
2. [Architecture Patterns](#architecture-patterns)
3. [Transport Mechanisms](#transport-mechanisms)
4. [Cloudflare Workers Deployment](#cloudflare-workers-deployment)
5. [HTTP + SSE Implementation](#http--sse-implementation)
6. [WebSocket Implementation](#websocket-implementation)
7. [Authentication and Authorization](#authentication-and-authorization)
8. [Load Balancing and Scaling](#load-balancing-and-scaling)
9. [Monitoring and Observability](#monitoring-and-observability)
10. [Best Practices](#best-practices)

## Introduction to Remote MCP

### Local vs Remote MCP Servers

#### Local MCP (stdio Transport)
```
┌──────────────┐
│ Claude       │
│ Desktop      │
└──────┬───────┘
       │ stdin/stdout
       ↓
┌──────────────┐
│ MCP Server   │
│ (Local Proc) │
└──────────────┘
```

**Characteristics:**
- Single user
- No network required
- Simple setup
- Limited to local machine resources
- No sharing between users

#### Remote MCP (HTTP/SSE or WebSocket)
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Claude       │────▶│ Load         │────▶│ MCP Server   │
│ Desktop      │     │ Balancer     │     │ Instance 1   │
└──────────────┘     │              │     └──────────────┘
                     │              │
┌──────────────┐     │              │     ┌──────────────┐
│ Web Client   │────▶│              │────▶│ MCP Server   │
└──────────────┘     │              │     │ Instance 2   │
                     └──────────────┘     └──────────────┘
                                          ┌──────────────┐
                                          │ MCP Server   │
                                          │ Instance N   │
                                          └──────────────┘
```

**Characteristics:**
- Multi-user support
- Network-based communication
- Scalable infrastructure
- Shared resources and data
- Centralized management

### When to Use Remote MCP

**Use Remote MCP When:**
- ✅ Multiple users need access to the same MCP server
- ✅ Server requires significant compute resources (GPUs, high RAM)
- ✅ Accessing centralized data or services
- ✅ Need horizontal scaling for load
- ✅ Require centralized monitoring and logging
- ✅ Implementing rate limiting and quotas
- ✅ Need to expose MCP to web clients

**Use Local MCP When:**
- ✅ Single user, personal productivity tools
- ✅ Accessing local filesystem exclusively
- ✅ Privacy-sensitive operations (local-only data)
- ✅ No network dependency required
- ✅ Simple tools with minimal resources

## Architecture Patterns

### 1. Direct Remote MCP Server

```
┌──────────────┐
│   Client     │
└──────┬───────┘
       │ HTTPS + SSE
       ↓
┌──────────────────────┐
│  MCP Server          │
│  ┌────────────────┐  │
│  │ HTTP Endpoint  │  │
│  │ SSE Stream     │  │
│  │ Tool Handlers  │  │
│  └────────────────┘  │
└──────────────────────┘
```

**Use Case:** Simple deployments, single server instance

**Pros:**
- Simplest architecture
- Low latency
- Easy debugging

**Cons:**
- No high availability
- Limited scaling
- Single point of failure

### 2. Load Balanced MCP Cluster

```
┌──────────────┐     ┌─────────────────┐
│   Client     │────▶│ Load Balancer   │
└──────────────┘     │  (Cloudflare)   │
                     └────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │ MCP      │    │ MCP      │    │ MCP      │
       │ Server 1 │    │ Server 2 │    │ Server N │
       └──────────┘    └──────────┘    └──────────┘
              │               │               │
              └───────────────┴───────────────┘
                              ↓
                     ┌─────────────────┐
                     │ Shared Database │
                     │ Shared Cache    │
                     └─────────────────┘
```

**Use Case:** Production deployments, high traffic

**Pros:**
- High availability
- Horizontal scaling
- No single point of failure

**Cons:**
- More complex setup
- Requires shared state management
- Higher cost

### 3. Serverless MCP (Cloudflare Workers)

```
┌──────────────┐
│   Client     │
└──────┬───────┘
       │ HTTPS
       ↓
┌────────────────────────┐
│ Cloudflare Edge        │
│ ┌────────────────────┐ │
│ │ Worker             │ │
│ │ (MCP Handler)      │ │
│ │                    │ │
│ │ Durable Objects    │ │
│ │ (State Storage)    │ │
│ └────────────────────┘ │
└────────────────────────┘
       │
       ↓
┌────────────────────────┐
│ D1 Database            │
│ R2 Storage             │
│ KV Namespace           │
└────────────────────────┘
```

**Use Case:** Global edge deployment, infinite scaling

**Pros:**
- Auto-scaling (0 to millions)
- Global edge distribution
- Pay-per-use pricing
- Zero maintenance

**Cons:**
- Platform lock-in (Cloudflare-specific)
- Cold start latency
- Stateless nature requires external storage

## Transport Mechanisms

### HTTP + SSE (Server-Sent Events)

**Best for:** Unidirectional streaming from server to client

```typescript
// Server implementation
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const app = express();
const mcpServer = new Server(
  { name: 'remote-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// HTTP endpoint for client requests
app.post('/mcp/request', express.json(), async (req, res) => {
  const { method, params } = req.body;

  // Handle MCP request
  const response = await mcpServer.handleRequest({ method, params });

  res.json(response);
});

// SSE endpoint for server notifications
app.get('/mcp/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send notifications via SSE
  mcpServer.on('notification', (notification) => {
    res.write(`data: ${JSON.stringify(notification)}\n\n`);
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

app.listen(3000);
```

```typescript
// Client implementation
class RemoteMCPClient {
  private endpoint: string;
  private eventSource: EventSource;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.connectSSE();
  }

  private connectSSE(): void {
    this.eventSource = new EventSource(`${this.endpoint}/events`);

    this.eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      this.handleNotification(notification);
    };

    this.eventSource.onerror = () => {
      console.error('SSE connection error, reconnecting...');
      setTimeout(() => this.connectSSE(), 5000);
    };
  }

  async callTool(name: string, args: any): Promise<any> {
    const response = await fetch(`${this.endpoint}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'tools/call',
        params: { name, arguments: args }
      })
    });

    return await response.json();
  }
}
```

### WebSocket (Bidirectional)

**Best for:** Real-time bidirectional communication

```typescript
// Server implementation
import WebSocket from 'ws';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', (ws) => {
  const mcpServer = new Server(
    { name: 'remote-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  // Handle incoming messages
  ws.on('message', async (data) => {
    const request = JSON.parse(data.toString());
    const response = await mcpServer.handleRequest(request);
    ws.send(JSON.stringify(response));
  });

  // Send server notifications
  mcpServer.on('notification', (notification) => {
    ws.send(JSON.stringify(notification));
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
```

```typescript
// Client implementation
class WebSocketMCPClient {
  private ws: WebSocket;
  private pendingRequests: Map<string, any> = new Map();

  constructor(url: string) {
    this.ws = new WebSocket(url);

    this.ws.on('message', (data) => {
      const response = JSON.parse(data.toString());

      if (response.id && this.pendingRequests.has(response.id)) {
        const { resolve } = this.pendingRequests.get(response.id);
        resolve(response.result);
        this.pendingRequests.delete(response.id);
      }
    });
  }

  async callTool(name: string, args: any): Promise<any> {
    const id = Math.random().toString(36);

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id,
        method: 'tools/call',
        params: { name, arguments: args }
      }));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }
}
```

## Cloudflare Workers Deployment

### Using Cloudflare Agents SDK

```typescript
// worker.ts - Complete Cloudflare Worker MCP implementation
import { MCPAgent } from '@cloudflare/agents';

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Create MCP agent
    const agent = new MCPAgent({
      name: 'cloudflare-mcp',
      version: '1.0.0',
      capabilities: {
        tools: {},
        resources: {}
      }
    });

    // Register tools
    agent.tool('database_query', {
      description: 'Execute SQL query',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          params: { type: 'array' }
        },
        required: ['query']
      },
      handler: async (args: { query: string; params?: any[] }) => {
        const results = await env.DB.prepare(args.query)
          .bind(...(args.params || []))
          .all();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results)
          }]
        };
      }
    });

    agent.tool('cache_get', {
      description: 'Get value from cache',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string' }
        },
        required: ['key']
      },
      handler: async (args: { key: string }) => {
        const value = await env.CACHE.get(args.key);
        return {
          content: [{
            type: 'text',
            text: value || 'null'
          }]
        };
      }
    });

    agent.tool('cache_set', {
      description: 'Set value in cache',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          value: { type: 'string' },
          ttl: { type: 'number' }
        },
        required: ['key', 'value']
      },
      handler: async (args: { key: string; value: string; ttl?: number }) => {
        await env.CACHE.put(args.key, args.value, {
          expirationTtl: args.ttl || 3600
        });

        return {
          content: [{
            type: 'text',
            text: 'Success'
          }]
        };
      }
    });

    // Handle MCP request
    return await agent.fetch(request);
  }
};
```

### Deployment Configuration

```toml
# wrangler.toml - Cloudflare Workers configuration
name = "mcp-server"
main = "worker.ts"
compatibility_date = "2025-01-20"

[env.production]
route = "https://mcp.example.com/*"

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "mcp_database"
database_id = "your-database-id"

# KV Cache binding
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

# Durable Object for stateful operations
[[durable_objects.bindings]]
name = "CODE_SANDBOX"
class_name = "CodeSandbox"
script_name = "mcp-server"

# Environment variables
[vars]
ENVIRONMENT = "production"
```

### Deployment Commands

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create mcp_database

# Create KV namespace
wrangler kv:namespace create CACHE

# Deploy to production
wrangler deploy

# View logs
wrangler tail

# Test locally
wrangler dev
```

## Authentication and Authorization

### JWT-Based Authentication

```typescript
// Auth middleware for remote MCP
import jwt from 'jsonwebtoken';

interface AuthConfig {
  jwtSecret: string;
  allowedScopes: string[];
}

class MCPAuthHandler {
  constructor(private config: AuthConfig) {}

  async authenticate(request: Request): Promise<AuthContext> {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, this.config.jwtSecret) as any;

      return {
        userId: decoded.sub,
        scopes: decoded.scopes || [],
        email: decoded.email
      };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  authorize(context: AuthContext, requiredScope: string): void {
    if (!context.scopes.includes(requiredScope)) {
      throw new Error(`Missing required scope: ${requiredScope}`);
    }
  }
}

// Usage in MCP server
const authHandler = new MCPAuthHandler({
  jwtSecret: process.env.JWT_SECRET!,
  allowedScopes: ['mcp:read', 'mcp:write', 'mcp:admin']
});

app.post('/mcp/request', async (req, res) => {
  try {
    // Authenticate request
    const authContext = await authHandler.authenticate(req);

    // Check authorization for specific tool
    const toolName = req.body.params?.name;
    if (toolName === 'database_execute') {
      authHandler.authorize(authContext, 'mcp:write');
    }

    // Process MCP request
    const response = await mcpServer.handleRequest(req.body);
    res.json(response);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});
```

### API Key Authentication

```typescript
class APIKeyAuth {
  constructor(private validKeys: Map<string, APIKeyInfo>) {}

  async authenticate(request: Request): Promise<AuthContext> {
    const apiKey = request.headers.get('X-API-Key');

    if (!apiKey) {
      throw new Error('Missing API key');
    }

    const keyInfo = this.validKeys.get(apiKey);

    if (!keyInfo) {
      throw new Error('Invalid API key');
    }

    if (keyInfo.expiresAt < Date.now()) {
      throw new Error('API key expired');
    }

    // Track usage
    keyInfo.usageCount++;
    keyInfo.lastUsed = Date.now();

    return {
      userId: keyInfo.userId,
      scopes: keyInfo.scopes,
      rateLimit: keyInfo.rateLimit
    };
  }
}

interface APIKeyInfo {
  userId: string;
  scopes: string[];
  rateLimit: number;
  usageCount: number;
  lastUsed: number;
  expiresAt: number;
}
```

### Rate Limiting

```typescript
import { RateLimiter } from 'limiter';

class MCPRateLimiter {
  private limiters: Map<string, RateLimiter> = new Map();

  async checkLimit(userId: string, limit: number): Promise<void> {
    if (!this.limiters.has(userId)) {
      this.limiters.set(userId, new RateLimiter({
        tokensPerInterval: limit,
        interval: 'minute'
      }));
    }

    const limiter = this.limiters.get(userId)!;
    const allowed = await limiter.removeTokens(1);

    if (!allowed) {
      throw new Error('Rate limit exceeded');
    }
  }
}

// Usage
const rateLimiter = new MCPRateLimiter();

app.post('/mcp/request', async (req, res) => {
  try {
    const authContext = await authHandler.authenticate(req);

    // Check rate limit
    await rateLimiter.checkLimit(
      authContext.userId,
      authContext.rateLimit || 100
    );

    const response = await mcpServer.handleRequest(req.body);
    res.json(response);
  } catch (error) {
    res.status(429).json({ error: error.message });
  }
});
```

## Load Balancing and Scaling

### Horizontal Scaling with Shared State

```typescript
// Redis-backed session storage
import Redis from 'ioredis';

class SharedSessionStore {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  async setSession(
    sessionId: string,
    data: SessionData,
    ttl: number = 3600
  ): Promise<void> {
    await this.redis.setex(
      `session:${sessionId}`,
      ttl,
      JSON.stringify(data)
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }
}

// Use shared session store across instances
const sessionStore = new SharedSessionStore(process.env.REDIS_URL!);

app.post('/mcp/request', async (req, res) => {
  const sessionId = req.headers.get('x-session-id');

  if (sessionId) {
    const session = await sessionStore.getSession(sessionId);
    // Use session data in request processing
  }

  const response = await mcpServer.handleRequest(req.body);
  res.json(response);
});
```

### Load Balancer Configuration (NGINX)

```nginx
# nginx.conf
upstream mcp_servers {
    least_conn;  # Use least connections algorithm

    server mcp1.example.com:3000 weight=1;
    server mcp2.example.com:3000 weight=1;
    server mcp3.example.com:3000 weight=1;

    # Health check
    check interval=3000 rise=2 fall=3 timeout=1000;
}

server {
    listen 443 ssl http2;
    server_name mcp.example.com;

    ssl_certificate /etc/ssl/certs/mcp.crt;
    ssl_certificate_key /etc/ssl/private/mcp.key;

    location /mcp/ {
        proxy_pass http://mcp_servers;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # SSE endpoint
    location /mcp/events {
        proxy_pass http://mcp_servers;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        chunked_transfer_encoding on;
    }
}
```

## Monitoring and Observability

### OpenTelemetry Integration

```typescript
import { trace, metrics } from '@opentelemetry/api';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

// Setup Prometheus metrics
const prometheusExporter = new PrometheusExporter({
  port: 9090
});

// Track MCP metrics
const meter = metrics.getMeter('mcp-server');

const requestCounter = meter.createCounter('mcp_requests_total', {
  description: 'Total number of MCP requests'
});

const requestDuration = meter.createHistogram('mcp_request_duration', {
  description: 'MCP request duration in milliseconds'
});

const activeConnections = meter.createObservableGauge('mcp_active_connections', {
  description: 'Number of active MCP connections'
});

// Usage in MCP server
app.post('/mcp/request', async (req, res) => {
  const startTime = Date.now();

  try {
    requestCounter.add(1, { method: req.body.method });

    const response = await mcpServer.handleRequest(req.body);

    requestDuration.record(Date.now() - startTime, {
      method: req.body.method,
      status: 'success'
    });

    res.json(response);
  } catch (error) {
    requestDuration.record(Date.now() - startTime, {
      method: req.body.method,
      status: 'error'
    });

    res.status(500).json({ error: error.message });
  }
});
```

### Structured Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'mcp-server' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log MCP requests
app.post('/mcp/request', async (req, res) => {
  const requestId = Math.random().toString(36);

  logger.info('MCP request received', {
    requestId,
    method: req.body.method,
    userId: req.authContext?.userId,
    timestamp: Date.now()
  });

  try {
    const response = await mcpServer.handleRequest(req.body);

    logger.info('MCP request completed', {
      requestId,
      duration: Date.now() - startTime,
      status: 'success'
    });

    res.json(response);
  } catch (error) {
    logger.error('MCP request failed', {
      requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({ error: error.message });
  }
});
```

## Best Practices

### 1. Implement Health Checks

```typescript
app.get('/health', async (req, res) => {
  const checks = {
    server: 'ok',
    database: await checkDatabase(),
    cache: await checkCache(),
    timestamp: Date.now()
  };

  const allHealthy = Object.values(checks).every(v =>
    typeof v === 'string' ? v === 'ok' : v
  );

  res.status(allHealthy ? 200 : 503).json(checks);
});
```

### 2. Use Connection Pooling

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### 3. Implement Graceful Shutdown

```typescript
let isShuttingDown = false;

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, starting graceful shutdown');
  isShuttingDown = true;

  // Stop accepting new connections
  server.close(async () => {
    // Wait for in-flight requests to complete
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Close database connections
    await pool.end();

    // Close Redis connections
    await redis.quit();

    process.exit(0);
  });
});

app.use((req, res, next) => {
  if (isShuttingDown) {
    res.set('Connection', 'close');
    res.status(503).send('Server is shutting down');
  } else {
    next();
  }
});
```

### 4. Implement Request Timeouts

```typescript
app.post('/mcp/request', async (req, res) => {
  const timeout = setTimeout(() => {
    res.status(504).json({ error: 'Request timeout' });
  }, 30000);

  try {
    const response = await mcpServer.handleRequest(req.body);
    clearTimeout(timeout);
    res.json(response);
  } catch (error) {
    clearTimeout(timeout);
    res.status(500).json({ error: error.message });
  }
});
```

### 5. Use CORS Properly

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
  maxAge: 86400
}));
```

---

## Conclusion

Remote MCP deployment enables:
- **Multi-user access** to MCP servers
- **Horizontal scaling** for production workloads
- **Centralized management** of tools and resources
- **Global edge distribution** with Cloudflare Workers

Key considerations:
- Choose appropriate transport (HTTP+SSE vs WebSocket)
- Implement robust authentication and authorization
- Use shared state storage for horizontal scaling
- Monitor performance with OpenTelemetry
- Follow security best practices

---

**Next Steps:**
1. Read [MCP_CODE_MODE_2025.md](./MCP_CODE_MODE_2025.md) for Cloudflare's Code Mode approach
2. Review [MCP_ANTI_PATTERNS_2025.md](./MCP_ANTI_PATTERNS_2025.md) for common mistakes
3. Study [MCP_ARCHITECTURE_2025.md](./MCP_ARCHITECTURE_2025.md) for architecture details
