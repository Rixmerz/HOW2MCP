# MCP Anti-Patterns 2025: Common Mistakes and How to Avoid Them

## Table of Contents

1. [Introduction](#introduction)
2. [Tool Design Anti-Patterns](#tool-design-anti-patterns)
3. [Architecture Anti-Patterns](#architecture-anti-patterns)
4. [Security Anti-Patterns](#security-anti-patterns)
5. [Performance Anti-Patterns](#performance-anti-patterns)
6. [Code Mode Anti-Patterns](#code-mode-anti-patterns)
7. [Documentation Anti-Patterns](#documentation-anti-patterns)
8. [Deployment Anti-Patterns](#deployment-anti-patterns)

## Introduction

This guide documents common mistakes and anti-patterns in MCP server development, based on real-world implementations and Cloudflare's best practices. Each anti-pattern includes:

- ❌ What NOT to do (the anti-pattern)
- ✅ What to do instead (the correct pattern)
- 🔍 Why it matters (explanation)

## Tool Design Anti-Patterns

### Anti-Pattern 1: API Wrapper Syndrome

❌ **Wrong: Wrapping entire third-party APIs**

```typescript
// DON'T: Creating 100+ tools that just wrap Stripe API
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: 'stripe_create_customer', ... },
    { name: 'stripe_retrieve_customer', ... },
    { name: 'stripe_update_customer', ... },
    { name: 'stripe_delete_customer', ... },
    { name: 'stripe_list_customers', ... },
    { name: 'stripe_create_charge', ... },
    { name: 'stripe_retrieve_charge', ... },
    { name: 'stripe_update_charge', ... },
    { name: 'stripe_capture_charge', ... },
    { name: 'stripe_list_charges', ... },
    // ... 90+ more tools
  ]
}));
```

✅ **Correct: Goal-oriented tools**

```typescript
// DO: Design tools around user goals, not API endpoints
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'process_payment',
      description: 'Process a customer payment. Handles customer creation, payment method, and charge automatically.',
      inputSchema: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Amount in cents' },
          currency: { type: 'string', description: 'Currency code (e.g., usd)' },
          customerEmail: { type: 'string', description: 'Customer email' },
          description: { type: 'string', description: 'Payment description' }
        },
        required: ['amount', 'currency', 'customerEmail']
      }
    },
    {
      name: 'refund_payment',
      description: 'Refund a previous payment',
      inputSchema: {
        type: 'object',
        properties: {
          transactionId: { type: 'string' },
          amount: { type: 'number', description: 'Optional partial refund amount' },
          reason: { type: 'string' }
        },
        required: ['transactionId']
      }
    },
    {
      name: 'get_payment_status',
      description: 'Check status of a payment',
      inputSchema: {
        type: 'object',
        properties: {
          transactionId: { type: 'string' }
        },
        required: ['transactionId']
      }
    }
  ]
}));
```

🔍 **Why it matters:**
- **Context Overload**: LLMs can't handle 100+ tools effectively
- **Poor Composition**: Many API calls needed for single user goal
- **Complexity**: Users must understand API internals, not just goals
- **Cloudflare Best Practice**: "MCP servers should NOT be wrappers around full API schemas"

---

### Anti-Pattern 2: Tool Explosion

❌ **Wrong: Too many granular tools**

```typescript
// DON'T: Create separate tools for every minor variation
tools: [
  'create_user',
  'create_admin_user',
  'create_guest_user',
  'create_premium_user',
  'update_user_name',
  'update_user_email',
  'update_user_password',
  'update_user_avatar',
  'delete_user_soft',
  'delete_user_hard',
  'restore_deleted_user',
  // 20+ more user tools...
]
```

✅ **Correct: Unified, flexible tools**

```typescript
// DO: Create fewer, more powerful tools with parameters
tools: [
  {
    name: 'manage_user',
    description: 'Create, update, or delete users with flexible options',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'update', 'delete'],
          description: 'Operation to perform'
        },
        userId: {
          type: 'string',
          description: 'User ID (required for update/delete)'
        },
        data: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'guest', 'premium']
            },
            // ... other user fields
          }
        },
        options: {
          type: 'object',
          properties: {
            softDelete: { type: 'boolean', description: 'Soft delete (default true)' },
            sendEmail: { type: 'boolean', description: 'Send notification email' }
          }
        }
      },
      required: ['action']
    }
  }
]
```

🔍 **Why it matters:**
- **Scalability**: Fewer tools = better LLM performance
- **Maintainability**: One tool to maintain instead of 20+
- **Flexibility**: Parameters allow customization without new tools
- **Cloudflare Best Practice**: "Fewer well-designed tools often outperform many granular ones"

---

### Anti-Pattern 3: Missing Parameter Constraints

❌ **Wrong: Vague parameter descriptions**

```typescript
// DON'T: Minimal documentation
{
  name: 'create_user',
  description: 'Create a user',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string' },
      age: { type: 'number' }
    },
    required: ['name', 'email']
  }
}
```

✅ **Correct: Detailed constraints and validation**

```typescript
// DO: Document all constraints clearly
{
  name: 'create_user',
  description: 'Create a new user account with validation',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        pattern: '^[a-zA-Z\\s\'-]+$',
        description: 'User full name. Must be 2-100 characters. Only letters, spaces, hyphens, and apostrophes allowed.'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address. Must be valid email format. Must be unique across all users.'
      },
      age: {
        type: 'number',
        minimum: 13,
        maximum: 120,
        description: 'User age in years. Must be between 13 and 120. Users under 18 require parental consent flag.'
      },
      requireParentalConsent: {
        type: 'boolean',
        description: 'Required if age < 18. Indicates parental consent obtained.'
      }
    },
    required: ['name', 'email', 'age']
  }
}
```

🔍 **Why it matters:**
- **Error Prevention**: LLMs understand constraints and avoid invalid inputs
- **Better UX**: Clear errors when validation fails
- **Self-Documentation**: API is self-explanatory
- **Cloudflare Best Practice**: "Detailed parameter descriptions help agents understand how to use tools correctly"

---

## Architecture Anti-Patterns

### Anti-Pattern 4: Monolithic God Server

❌ **Wrong: One server does everything**

```typescript
// DON'T: Single server with 50+ tools for everything
const server = new Server({
  name: 'everything-server',
  version: '1.0.0'
});

// Database tools
server.registerTool('db_query', ...);
server.registerTool('db_execute', ...);

// Email tools
server.registerTool('send_email', ...);
server.registerTool('send_sms', ...);

// File tools
server.registerTool('read_file', ...);
server.registerTool('write_file', ...);

// API tools
server.registerTool('http_get', ...);
server.registerTool('http_post', ...);

// Auth tools
server.registerTool('login', ...);
server.registerTool('logout', ...);

// Payment tools
server.registerTool('process_payment', ...);

// ... 40+ more tools
```

✅ **Correct: Modular, domain-specific servers**

```typescript
// DO: Separate servers by domain
// database-server.ts
const databaseServer = new Server({
  name: 'database-server',
  version: '1.0.0'
});
databaseServer.registerTool('query', ...);
databaseServer.registerTool('execute', ...);

// email-server.ts
const emailServer = new Server({
  name: 'email-server',
  version: '1.0.0'
});
emailServer.registerTool('send', ...);
emailServer.registerTool('send_bulk', ...);

// file-server.ts
const fileServer = new Server({
  name: 'file-server',
  version: '1.0.0'
});
fileServer.registerTool('read', ...);
fileServer.registerTool('write', ...);
fileServer.registerTool('list', ...);

// payment-server.ts
const paymentServer = new Server({
  name: 'payment-server',
  version: '1.0.0'
});
paymentServer.registerTool('process', ...);
paymentServer.registerTool('refund', ...);
```

🔍 **Why it matters:**
- **Single Responsibility**: Each server has one clear purpose
- **Scalability**: Scale services independently
- **Maintainability**: Easier to understand, test, and debug
- **Deployment**: Deploy/update servers independently

---

### Anti-Pattern 5: Stateful Chaos

❌ **Wrong: Unmanaged server-side state**

```typescript
// DON'T: Store state without proper management
let currentUser: User | null = null;
let openFiles: Map<string, FileHandle> = new Map();
let activeTransactions: Set<string> = new Set();

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'set_user') {
    // State leaks between users/sessions!
    currentUser = request.params.arguments.user;
  }

  if (request.params.name === 'query_database') {
    // Uses global state - not safe!
    const userId = currentUser?.id;
    // ...
  }
});
```

✅ **Correct: Stateless or session-managed**

```typescript
// DO: Pass context explicitly or use proper session management
interface RequestContext {
  sessionId: string;
  userId: string;
  permissions: string[];
}

class SessionManager {
  private sessions: Map<string, SessionData> = new Map();

  getSession(sessionId: string): SessionData | null {
    return this.sessions.get(sessionId) || null;
  }

  createSession(userId: string): string {
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, {
      userId,
      createdAt: Date.now(),
      data: {}
    });
    return sessionId;
  }
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Extract session from request metadata
  const sessionId = request.params._meta?.sessionId;
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    throw new Error('Invalid or expired session');
  }

  // Use session context for all operations
  if (request.params.name === 'query_database') {
    const results = await db.query(
      'SELECT * FROM data WHERE user_id = ?',
      [session.userId]
    );
    // ...
  }
});
```

🔍 **Why it matters:**
- **Security**: Prevents data leakage between users
- **Concurrency**: Multiple requests don't interfere
- **Scalability**: Enables horizontal scaling
- **Debugging**: Clear request isolation

---

## Security Anti-Patterns

### Anti-Pattern 6: Missing Input Validation

❌ **Wrong: Trusting user input**

```typescript
// DON'T: Execute user input directly
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'database_query') {
    const sql = request.params.arguments.query;

    // SQL Injection vulnerability!
    const results = await db.query(sql);

    return { content: [{ type: 'text', text: JSON.stringify(results) }] };
  }

  if (request.params.name === 'read_file') {
    const path = request.params.arguments.path;

    // Path traversal vulnerability!
    const content = await fs.readFile(path, 'utf-8');

    return { content: [{ type: 'text', text: content }] };
  }
});
```

✅ **Correct: Validate and sanitize all inputs**

```typescript
// DO: Use prepared statements and validate paths
import { z } from 'zod';
import path from 'path';

const QuerySchema = z.object({
  query: z.string().max(10000),
  parameters: z.array(z.any()).optional()
});

const ReadFileSchema = z.object({
  path: z.string()
    .regex(/^[a-zA-Z0-9_\-\/\.]+$/, 'Invalid characters in path')
    .refine(p => !p.includes('..'), 'Path traversal not allowed')
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'database_query') {
    // Validate input
    const validated = QuerySchema.parse(request.params.arguments);

    // Use prepared statements (prevents SQL injection)
    const results = await db.prepare(validated.query)
      .bind(...(validated.parameters || []))
      .all();

    return { content: [{ type: 'text', text: JSON.stringify(results) }] };
  }

  if (request.params.name === 'read_file') {
    // Validate and sanitize path
    const validated = ReadFileSchema.parse(request.params.arguments);

    // Restrict to allowed directory
    const allowedDir = '/safe/data/directory';
    const safePath = path.resolve(allowedDir, validated.path);

    if (!safePath.startsWith(allowedDir)) {
      throw new Error('Access denied: Path outside allowed directory');
    }

    const content = await fs.readFile(safePath, 'utf-8');
    return { content: [{ type: 'text', text: content }] };
  }
});
```

🔍 **Why it matters:**
- **Prevents Injection**: SQL, command, path traversal attacks
- **Data Integrity**: Only valid data processed
- **Security Compliance**: Meets security standards
- **Cloudflare Best Practice**: "Implement appropriate access controls and data protections"

---

### Anti-Pattern 7: Hardcoded Secrets

❌ **Wrong: Secrets in code**

```typescript
// DON'T: Hardcode sensitive credentials
const databaseUrl = 'postgresql://admin:SuperSecret123@db.example.com:5432/mydb';
const apiKey = 'sk_live_abc123xyz789';
const jwtSecret = 'my-secret-key-12345';

const db = new Database(databaseUrl);
const stripe = new Stripe(apiKey);
```

✅ **Correct: Use environment variables and secret management**

```typescript
// DO: Load secrets from environment or secret manager
import { config } from 'dotenv';
config();

// Validate required secrets exist
const requiredSecrets = ['DATABASE_URL', 'STRIPE_API_KEY', 'JWT_SECRET'];
for (const secret of requiredSecrets) {
  if (!process.env[secret]) {
    throw new Error(`Missing required secret: ${secret}`);
  }
}

const db = new Database(process.env.DATABASE_URL!);
const stripe = new Stripe(process.env.STRIPE_API_KEY!);
const jwtSecret = process.env.JWT_SECRET!;

// Or use secret manager (AWS Secrets Manager, etc.)
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

async function getSecret(secretName: string): Promise<string> {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return response.SecretString!;
}

const databaseUrl = await getSecret('mcp/database-url');
const apiKey = await getSecret('mcp/stripe-api-key');
```

🔍 **Why it matters:**
- **Security**: Secrets not exposed in code/git
- **Rotation**: Easy to rotate secrets without code changes
- **Environment Separation**: Different secrets for dev/staging/prod
- **Compliance**: Required for security certifications

---

## Performance Anti-Patterns

### Anti-Pattern 8: N+1 Query Problem

❌ **Wrong: Multiple sequential queries**

```typescript
// DON'T: Query in a loop
async function getUsersWithOrders() {
  const users = await db.query('SELECT * FROM users');

  // N+1 query problem - one query per user!
  for (const user of users) {
    user.orders = await db.query(
      'SELECT * FROM orders WHERE user_id = ?',
      [user.id]
    );
  }

  return users;
}
```

✅ **Correct: Batch queries or JOIN**

```typescript
// DO: Use JOIN or batch queries
async function getUsersWithOrders() {
  // Option 1: JOIN query
  const results = await db.query(`
    SELECT
      u.*,
      o.id as order_id,
      o.total as order_total,
      o.created_at as order_created
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
  `);

  // Group results by user
  const userMap = new Map();
  for (const row of results) {
    if (!userMap.has(row.id)) {
      userMap.set(row.id, {
        id: row.id,
        name: row.name,
        email: row.email,
        orders: []
      });
    }
    if (row.order_id) {
      userMap.get(row.id).orders.push({
        id: row.order_id,
        total: row.order_total,
        created: row.order_created
      });
    }
  }

  return Array.from(userMap.values());

  // Option 2: Batch query
  const users = await db.query('SELECT * FROM users');
  const userIds = users.map(u => u.id);

  const orders = await db.query(
    `SELECT * FROM orders WHERE user_id IN (${userIds.map(() => '?').join(',')})`,
    userIds
  );

  // Group orders by user_id
  const ordersByUser = new Map();
  for (const order of orders) {
    if (!ordersByUser.has(order.user_id)) {
      ordersByUser.set(order.user_id, []);
    }
    ordersByUser.get(order.user_id).push(order);
  }

  // Attach orders to users
  for (const user of users) {
    user.orders = ordersByUser.get(user.id) || [];
  }

  return users;
}
```

🔍 **Why it matters:**
- **Performance**: 1 query vs 1001 queries
- **Database Load**: Reduces connection overhead
- **Latency**: Much faster response times

---

### Anti-Pattern 9: No Caching

❌ **Wrong: Fetching same data repeatedly**

```typescript
// DON'T: No caching for expensive operations
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'get_product_catalog') {
    // Queries database every single time!
    const products = await db.query('SELECT * FROM products');
    return { content: [{ type: 'text', text: JSON.stringify(products) }] };
  }

  if (request.params.name === 'get_exchange_rates') {
    // Hits external API every time!
    const rates = await fetch('https://api.exchange.com/rates');
    return { content: [{ type: 'text', text: await rates.text() }] };
  }
});
```

✅ **Correct: Multi-layer caching**

```typescript
// DO: Implement caching with TTL
import NodeCache from 'node-cache';
import Redis from 'ioredis';

const memoryCache = new NodeCache({ stdTTL: 60 }); // 1 minute
const redis = new Redis(process.env.REDIS_URL);

async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Check memory cache first (fastest)
  const memoryCached = memoryCache.get<T>(key);
  if (memoryCached) return memoryCached;

  // Check Redis cache (fast)
  const redisCached = await redis.get(key);
  if (redisCached) {
    const parsed = JSON.parse(redisCached) as T;
    memoryCache.set(key, parsed, ttl);
    return parsed;
  }

  // Fetch from source (slow)
  const fresh = await fetcher();

  // Store in both caches
  memoryCache.set(key, fresh, ttl);
  await redis.setex(key, ttl, JSON.stringify(fresh));

  return fresh;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'get_product_catalog') {
    const products = await getCached(
      'product_catalog',
      () => db.query('SELECT * FROM products'),
      300 // 5 minute TTL
    );

    return { content: [{ type: 'text', text: JSON.stringify(products) }] };
  }

  if (request.params.name === 'get_exchange_rates') {
    const rates = await getCached(
      'exchange_rates',
      async () => {
        const response = await fetch('https://api.exchange.com/rates');
        return await response.json();
      },
      3600 // 1 hour TTL
    );

    return { content: [{ type: 'text', text: JSON.stringify(rates) }] };
  }
});
```

🔍 **Why it matters:**
- **Performance**: 100x faster for cached data
- **Cost Reduction**: Fewer database/API calls
- **Reliability**: Reduces dependency on external services
- **Scalability**: Handle more requests with same resources

---

## Code Mode Anti-Patterns

### Anti-Pattern 10: Returning Values Instead of Logging

❌ **Wrong: Returning results (doesn't work in Code Mode)**

```typescript
// DON'T: Return values - they won't be captured!
const users = await database.query("SELECT * FROM users");
return users; // This won't work in Code Mode sandbox!

const count = users.length;
return `Found ${count} users`; // This also won't work!
```

✅ **Correct: Use console.log() for all output**

```typescript
// DO: Use console.log for results
const users = await database.query("SELECT * FROM users");
console.log(`Found ${users.length} users`);
console.log(JSON.stringify(users, null, 2));

// Or format nicely
console.log('User Summary:');
for (const user of users) {
  console.log(`- ${user.name} (${user.email})`);
}
```

🔍 **Why it matters:**
- **Code Mode Requirement**: Only console.log() output is captured
- **AI Understanding**: Logs provide context for AI agent
- **Debugging**: Helps understand what happened in sandbox

---

### Anti-Pattern 11: Ignoring Async/Await

❌ **Wrong: Not awaiting promises**

```typescript
// DON'T: Forget await - promises won't resolve!
const users = database.query("SELECT * FROM users"); // Missing await!
console.log(users); // Logs: [object Promise]

// Loop executes instantly, emails don't send
for (const user of users) {
  email.send({ to: user.email, subject: "Hello" }); // Missing await!
}
console.log("Done!"); // Executes before emails send
```

✅ **Correct: Properly await async operations**

```typescript
// DO: Await all async operations
const users = await database.query("SELECT * FROM users");
console.log(`Retrieved ${users.length} users`);

// Sequential execution
for (const user of users) {
  await email.send({ to: user.email, subject: "Hello" });
  console.log(`Sent email to ${user.email}`);
}

// Or parallel execution for better performance
const emailPromises = users.map(user =>
  email.send({ to: user.email, subject: "Hello" })
);
await Promise.all(emailPromises);
console.log(`Sent ${emailPromises.length} emails`);
```

🔍 **Why it matters:**
- **Correctness**: Operations actually complete
- **Timing**: Control execution order
- **Error Handling**: Catch errors properly

---

## Documentation Anti-Patterns

### Anti-Pattern 12: Minimal or Missing Documentation

❌ **Wrong: No usage examples or constraints**

```typescript
// DON'T: Minimal documentation
/**
 * database.query() - Run SQL query
 */
interface Database {
  query(sql: string, params?: any[]): Promise<any[]>;
}
```

✅ **Correct: Comprehensive documentation with examples**

```typescript
// DO: Document everything with examples
/**
 * Database API
 *
 * Provides SQL database access with automatic connection pooling,
 * prepared statements, and transaction support.
 */
interface Database {
  /**
   * Execute a SQL query and return results.
   *
   * Uses prepared statements to prevent SQL injection. Parameters
   * are automatically escaped and bound safely.
   *
   * @param sql - SQL query with ? placeholders for parameters
   * @param params - Optional array of parameters to bind to placeholders
   *
   * @returns Promise resolving to array of result rows. Each row is
   *          an object with column names as keys.
   *
   * **Constraints:**
   * - Query must be valid SQL syntax
   * - Maximum query length: 10,000 characters
   * - Maximum 1000 parameters per query
   * - Query timeout: 30 seconds
   * - Read-only queries recommended (SELECT)
   *
   * **Examples:**
   *
   * Basic query:
   * ```typescript
   * const users = await database.query("SELECT * FROM users");
   * console.log(`Found ${users.length} users`);
   * ```
   *
   * Query with parameters:
   * ```typescript
   * const adults = await database.query(
   *   "SELECT * FROM users WHERE age >= ?",
   *   [18]
   * );
   * console.log(`Found ${adults.length} adult users`);
   * ```
   *
   * Complex query:
   * ```typescript
   * const results = await database.query(`
   *   SELECT u.name, COUNT(o.id) as order_count
   *   FROM users u
   *   LEFT JOIN orders o ON u.id = o.user_id
   *   WHERE u.created_at > ?
   *   GROUP BY u.id
   *   ORDER BY order_count DESC
   *   LIMIT ?
   * `, [new Date('2024-01-01'), 10]);
   *
   * for (const row of results) {
   *   console.log(`${row.name}: ${row.order_count} orders`);
   * }
   * ```
   *
   * @throws {ValidationError} If SQL syntax is invalid
   * @throws {TimeoutError} If query exceeds 30 second timeout
   * @throws {PermissionError} If query attempts unauthorized operation
   */
  query(sql: string, params?: any[]): Promise<any[]>;
}
```

🔍 **Why it matters:**
- **Self-Documentation**: API explains itself
- **Error Prevention**: Clear constraints prevent mistakes
- **Learning**: Examples show proper usage
- **Cloudflare Best Practice**: "Provide clear documentation of security implications"

---

## Deployment Anti-Patterns

### Anti-Pattern 13: No Health Checks

❌ **Wrong: No monitoring or health endpoints**

```typescript
// DON'T: Deploy without health checks
const server = express();
server.post('/mcp/request', handleMCPRequest);
server.listen(3000);
// Load balancer can't tell if server is healthy!
```

✅ **Correct: Implement comprehensive health checks**

```typescript
// DO: Add health check endpoints
const server = express();

server.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      cache: await checkCache(),
      memory: checkMemory(),
      cpu: checkCPU()
    }
  };

  const allHealthy = Object.values(health.checks).every(c => c.status === 'ok');

  res.status(allHealthy ? 200 : 503).json(health);
});

server.get('/ready', async (req, res) => {
  // Check if server is ready to accept traffic
  const ready = await checkDependencies();
  res.status(ready ? 200 : 503).json({ ready });
});

server.post('/mcp/request', handleMCPRequest);
server.listen(3000);

async function checkDatabase(): Promise<HealthCheck> {
  try {
    await db.query('SELECT 1');
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

async function checkCache(): Promise<HealthCheck> {
  try {
    await redis.ping();
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
```

🔍 **Why it matters:**
- **Monitoring**: Know when service is unhealthy
- **Load Balancing**: Route traffic to healthy instances
- **Auto-Recovery**: Restart unhealthy containers automatically
- **Debugging**: Identify issues faster

---

### Anti-Pattern 14: No Graceful Shutdown

❌ **Wrong: Abrupt process termination**

```typescript
// DON'T: Kill process immediately
process.on('SIGTERM', () => {
  process.exit(0); // In-flight requests are killed!
});
```

✅ **Correct: Graceful shutdown with cleanup**

```typescript
// DO: Graceful shutdown
let isShuttingDown = false;
const activeRequests = new Set<string>();

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, starting graceful shutdown...');
  isShuttingDown = true;

  // Stop accepting new requests
  server.close(async () => {
    console.log('HTTP server closed');

    // Wait for in-flight requests (max 30 seconds)
    const startTime = Date.now();
    while (activeRequests.size > 0 && Date.now() - startTime < 30000) {
      console.log(`Waiting for ${activeRequests.size} requests to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Close database connections
    await db.close();
    console.log('Database connections closed');

    // Close Redis connections
    await redis.quit();
    console.log('Redis connections closed');

    // Cleanup complete
    console.log('Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 35 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 35000);
});

// Track active requests
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.set('Connection', 'close');
    return res.status(503).send('Server is shutting down');
  }

  const requestId = Math.random().toString(36);
  activeRequests.add(requestId);

  res.on('finish', () => {
    activeRequests.delete(requestId);
  });

  next();
});
```

🔍 **Why it matters:**
- **Data Integrity**: Requests complete successfully
- **User Experience**: No failed requests during deployment
- **Resource Cleanup**: Connections properly closed
- **Zero-Downtime**: Enables rolling deployments

---

## Conclusion

Avoiding these anti-patterns leads to:

✅ **Better Performance**: Caching, batching, efficient queries
✅ **Enhanced Security**: Input validation, secret management, access control
✅ **Improved Scalability**: Stateless design, modular architecture
✅ **Higher Quality**: Proper documentation, error handling, testing
✅ **Easier Maintenance**: Clean code, clear responsibilities, good practices

**Key Takeaways:**
1. Design tools for **user goals**, not API wrappers
2. **Fewer, powerful tools** > many granular ones
3. **Document constraints** clearly for AI agents
4. **Validate all inputs** to prevent security issues
5. **Cache expensive operations** for performance
6. **Use console.log()** for Code Mode output
7. Implement **health checks** and graceful shutdown

---

**Next Steps:**
1. Review your MCP servers against this checklist
2. Refactor anti-patterns you find
3. Read [MCP_CODE_MODE_2025.md](./MCP_CODE_MODE_2025.md) for Code Mode best practices
4. Study [MCP_ARCHITECTURE_2025.md](./MCP_ARCHITECTURE_2025.md) for proper architecture
