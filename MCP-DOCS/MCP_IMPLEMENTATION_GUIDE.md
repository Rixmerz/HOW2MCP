# Model Context Protocol (MCP) Implementation and Architecture Guide

## Table of Contents

1. [Architecture Analysis](#architecture-analysis)
2. [Protocol Documentation](#protocol-documentation)
3. [Implementation Guidelines](#implementation-guidelines)
4. [Technical Standards](#technical-standards)
5. [Project Examples](#project-examples)
6. [Best Practices](#best-practices)
7. [Testing and Validation](#testing-and-validation)
8. [Troubleshooting](#troubleshooting)

## Architecture Analysis

### Core Architectural Patterns

Based on analysis of multiple MCP projects (MEMI, RIXA, RIMA, RIKA, RISA, TOMA, **tmux-mcp-server**), the following architectural patterns emerge:

#### 1. Standard MCP Server Structure

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

class MCPServer {
  private server: Server;
  
  constructor() {
    this.server = new Server(
      { name: 'your-mcp-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
  }
  
  async initialize(): Promise<void> {
    // Initialize core components
    // Register tools
    // Setup error handling
  }
  
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
```

#### 2. Common Project Organization

```
mcp-project/
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── src/
│   ├── index.ts              # Main server entry point
│   ├── tools/
│   │   └── index.ts          # Tool registration and handlers
│   ├── core/                 # Business logic modules
│   ├── types/                # Type definitions
│   ├── utils/                # Utility functions
│   └── storage/              # Data persistence (if needed)
├── dist/                     # Compiled JavaScript output
├── tests/                    # Test files
└── docs/                     # Documentation
```

#### 3. Design Principles

- **Single Responsibility**: Each tool performs one specific function
- **Stateless Operations**: Tools should be stateless when possible
- **Error Resilience**: Comprehensive error handling and recovery
- **Type Safety**: Full TypeScript implementation with strict typing
- **Modular Architecture**: Clear separation of concerns

### Component Interaction Patterns

#### Server Initialization Flow
1. Create Server instance with metadata and capabilities
2. Initialize core business logic components
3. Register tools with request handlers
4. Setup error handling and logging
5. Connect to StdioServerTransport
6. Begin listening for requests

#### Request Processing Flow
1. Receive JSON-RPC 2.0 message via stdin
2. Parse and validate request structure
3. Route to appropriate tool handler
4. Validate input parameters using Zod schemas
5. Execute business logic
6. Format response according to MCP specification
7. Send JSON response via stdout

### Production-Grade Architecture: tmux-mcp-server Analysis

The **tmux-mcp-server** represents the most sophisticated MCP implementation analyzed, demonstrating enterprise-ready patterns and advanced architectural concepts that extend beyond basic MCP requirements.

#### Advanced Architectural Patterns

##### 1. Event-Driven Component Coordination
```typescript
// Event-driven architecture with cross-component communication
export class McpIntegrator extends EventEmitter {
  async handleError(error: ErrorEntry): Promise<void> {
    // Emit events instead of direct coupling
    this.emit('trigger_sequential', {
      analysis: { type: 'error_analysis', error },
      paneId: error.paneId
    });
  }

  // Smart triggering based on thresholds and context
  async triggerSequentialAnalysis(paneId: string, data: any): Promise<void> {
    const triggerKey = `sequential_${paneId}`;
    const lastTrigger = this.lastTriggers.get(triggerKey);

    // Debouncing to prevent spam
    if (lastTrigger && Date.now() - lastTrigger.getTime() < 30000) {
      return;
    }

    // Prevent duplicate analysis
    if (this.activeAnalyses.has(paneId)) {
      return;
    }

    this.activeAnalyses.add(paneId);
    this.emit('trigger_sequential', { paneId, analysis: data });
  }
}
```

##### 2. Modular Component Architecture
```typescript
// Sophisticated component organization with clear separation of concerns
export class TmuxMCPServer {
  // Core business logic components
  private tmuxManager: TmuxManager;           // Session lifecycle management
  private logAnalyzer: LogAnalyzer;           // Intelligent log processing
  private processMonitor: ProcessMonitor;     // System resource monitoring
  private errorWatcher: ErrorWatcher;         // Real-time error detection

  // Advanced coordination components
  private mcpIntegrator: McpIntegrator;       // Cross-MCP orchestration
  private sessionSerializer: SessionSerializer; // State persistence
  private frameworkDetector: FrameworkDetector; // Development framework detection

  // Infrastructure components
  private sessionStore: SessionStore;         // Data persistence layer
  private commandEscaper: CommandEscaper;     // Security and safety
}
```

##### 3. State Management and Persistence
```typescript
// Comprehensive state management with serialization
interface TmuxSession {
  name: string;
  id: string;
  windows: TmuxWindow[];
  created: Date;
  attached: boolean;
}

export class SessionSerializer {
  async serializeSession(session: TmuxSession): Promise<void> {
    const serializedData = {
      session,
      timestamp: new Date(),
      metadata: {
        processCount: session.windows.reduce((acc, w) => acc + w.panes.length, 0),
        totalUptime: Date.now() - session.created.getTime(),
        lastActivity: await this.getLastActivity(session)
      }
    };
    await this.storage.save(session.id, serializedData);
  }
}
```

##### 4. Production Tool Organization (23 Tools)
The tmux-mcp-server demonstrates sophisticated tool organization patterns:

**Category-Based Tool Modules:**
- `session-tools.ts` - Session management (6 tools)
- `log-tools.ts` - Log analysis and monitoring (5 tools)
- `process-tools.ts` - Process and port management (6 tools)
- `error-tools.ts` - Error detection and analysis (6 tools)

**Advanced Tool Registration Pattern:**
```typescript
// Centralized registration with automatic schema conversion
export async function registerTools(server: Server, context: ToolContext) {
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Route to category-specific handlers
    switch (name) {
      case 'tmux_create_session':
        return await handleCreateSession(args, context);
      // ... 22 more production tools
    }
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'tmux_create_session',
          description: 'Create tmux session with custom configurations',
          inputSchema: zodToJsonSchema(CreateSessionSchema), // Automatic conversion
        },
        // ... complete tool registry
      ]
    };
  });
}
```

##### 5. Cross-MCP Integration Architecture
```typescript
// Intelligent coordination with other MCP servers
export interface McpIntegrationConfig {
  sequentialThinking: {
    enabled: boolean;
    triggers: {
      onError: boolean;
      onMultipleErrors: number;
      onProcessCrash: boolean;
      onDependencyFailure: boolean;
    };
  };
  context7Docs: {
    enabled: boolean;
    triggers: {
      onFrameworkDetection: boolean;
      onErrorPattern: boolean;
    };
  };
  rikaTesting: {
    enabled: boolean;
    triggers: {
      onUIChange: boolean;
      onPortChange: boolean;
      onBuildComplete: boolean;
    };
  };
}
```

#### Key Production Features

##### Real-time Monitoring and Analysis
- **File Watching**: Efficient chokidar-based file monitoring for real-time updates
- **Error Detection**: Language-specific error pattern recognition with custom patterns
- **Process Monitoring**: System resource tracking with health assessment
- **Log Analysis**: Intelligent log parsing with trend analysis and insights

##### Security and Safety
```typescript
// Comprehensive command escaping and security measures
export class CommandEscaper {
  async executeTmuxCommand(command: string, args: string[] = []): Promise<string> {
    // 1. Validate against allowlist
    if (!this.isAllowedCommand(command)) {
      throw new Error(`Command not allowed: ${command}`);
    }

    // 2. Escape all arguments
    const escapedArgs = args.map(arg => this.escapeArg(arg));

    // 3. Execute with timeout and resource limits
    return this.executeWithLimits('tmux', [command, ...escapedArgs]);
  }

  private escapeArg(arg: string): string {
    // Comprehensive shell injection prevention
    return arg.replace(/[;&|`$(){}[\]<>?*\\]/g, '\\$&');
  }
}
```

##### Advanced Configuration Management
- **Environment-based Configuration**: Different behaviors for development/production
- **Dynamic Configuration**: Runtime configuration updates with validation
- **Resource Management**: Configurable limits for logs, sessions, and processes

#### Technology Integration Patterns

##### Schema Management with Zod
```typescript
// Type-safe input validation with automatic JSON Schema generation
export const CreateSessionSchema = z.object({
  name: z.string().min(1),
  workingDirectory: z.string().optional(),
  windows: z.array(z.object({
    name: z.string(),
    panes: z.array(z.object({
      command: z.string().optional(),
      workingDirectory: z.string().optional(),
    })).optional(),
  })).optional(),
  environment: z.record(z.string()).optional(),
});

// Automatic JSON Schema conversion for MCP tool registry
inputSchema: zodToJsonSchema(CreateSessionSchema)
```

##### Dependency Integration
The tmux-mcp-server demonstrates sophisticated dependency management:
- **@modelcontextprotocol/sdk**: Core MCP protocol implementation
- **zod + zod-to-json-schema**: Runtime validation with automatic schema conversion
- **chokidar**: Efficient file watching for real-time monitoring
- **uuid**: Session and error ID generation for tracking
- **TypeScript**: Full type safety with comprehensive type definitions

#### Scalability Patterns

##### Resource Management
```typescript
// Configurable resource limits and cleanup
interface TmuxManagerOptions {
  logDirectory: string;
  maxLogSize: number;        // 100MB default
  sessionTimeout: number;    // 24 hours default
  enableLogging: boolean;
}

// Automatic cleanup and garbage collection
export class SessionStore {
  private async cleanupExpiredSessions(): Promise<void> {
    const expired = await this.getExpiredSessions();
    for (const session of expired) {
      await this.tmuxManager.destroySession(session.name);
      await this.storage.delete(session.id);
    }
  }
}
```

##### Performance Optimization
- **Caching Strategy**: Session data cached for fast access
- **Debounced Events**: Prevent spam from rapid consecutive events
- **Rate Limiting**: Protect against overwhelming the system
- **Efficient Pattern Matching**: Optimized regex compilation and reuse

#### Development and Production Deployment

##### Docker Container Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
COPY scripts/ ./scripts/
RUN chmod +x scripts/tmux/*.sh
CMD ["node", "dist/index.js"]
```

##### Systemd Service Integration
```ini
[Unit]
Description=Tmux MCP Server
After=network.target

[Service]
Type=simple
User=mcp-server
WorkingDirectory=/opt/tmux-mcp-server
ExecStart=/usr/bin/node dist/index.js
Environment=NODE_ENV=production
Restart=always
RestartSec=5
```

This production-grade example demonstrates how MCP servers can be architected for enterprise use with sophisticated features like cross-MCP coordination, real-time monitoring, intelligent error detection, and comprehensive state management.

## Protocol Documentation

### JSON-RPC 2.0 Implementation

MCP uses JSON-RPC 2.0 as the underlying communication protocol over stdin/stdout.

#### Standard Request Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "tool-name",
    "arguments": {
      "param1": "value1",
      "param2": "value2"
    }
  }
}
```

#### Standard Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Tool execution result"
      }
    ]
  }
}
```

#### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "details": "Parameter validation failed"
    }
  }
}
```

### Core MCP Methods

#### 1. tools/list
Lists all available tools and their schemas.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "example-tool",
        "description": "Example tool description",
        "inputSchema": {
          "type": "object",
          "properties": {
            "param1": {
              "type": "string",
              "description": "Parameter description"
            }
          },
          "required": ["param1"]
        }
      }
    ]
  }
}
```

#### 2. tools/call
Executes a specific tool with provided arguments.

#### 3. initialize
Initializes the MCP session with client capabilities.

### Error Handling Standards

#### Standard Error Codes
- `-32700`: Parse error
- `-32600`: Invalid Request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error

#### Custom Error Implementation

```typescript
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Throw standardized errors
throw new McpError(
  ErrorCode.InvalidParams,
  `Parameter validation failed: ${error.message}`
);
```

## Implementation Guidelines

### Step 1: Project Setup

#### Initialize Project Structure
```bash
mkdir my-mcp-server
cd my-mcp-server
npm init -y
npm install @modelcontextprotocol/sdk zod
npm install -D typescript @types/node tsx
```

#### Configure TypeScript
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 2: Core Server Implementation

#### Main Server Class (src/index.ts)
```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools/index.js';

class MyMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: 'my-mcp-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
  }

  async initialize(): Promise<void> {
    // Register all tools
    await registerTools(this.server);
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  async shutdown(): Promise<void> {
    // Cleanup resources
  }
}

// Main execution
async function main(): Promise<void> {
  const server = new MyMCPServer();
  
  // Graceful shutdown handling
  process.on('SIGINT', async () => {
    await server.shutdown();
    process.exit(0);
  });

  try {
    await server.initialize();
    await server.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
```

### Step 3: Tool Registration

#### Tool Registration System (src/tools/index.ts)
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schemas
const ExampleToolSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  count: z.number().int().min(1).optional().default(1),
});

export async function registerTools(server: Server): Promise<void> {
  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'example-tool':
        return await handleExampleTool(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  });

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'example-tool',
          description: 'Example tool that processes messages',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Message to process',
              },
              count: {
                type: 'number',
                description: 'Number of times to repeat',
                default: 1,
              },
            },
            required: ['message'],
          },
        },
      ],
    };
  });
}

async function handleExampleTool(args: any) {
  const validated = ExampleToolSchema.parse(args);
  
  const result = Array(validated.count)
    .fill(validated.message)
    .join(' ');

  return {
    content: [
      {
        type: 'text',
        text: `Processed: ${result}`,
      },
    ],
  };
}
```

## Technical Standards

### Required Dependencies

#### Core Dependencies
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.7.4",
    "typescript": "^5.6.2",
    "tsx": "^4.19.1"
  }
}
```

#### Optional Dependencies (by use case)
- `sqlite3`: For local data storage
- `openai`: For AI integrations
- `axios`: For HTTP requests
- `uuid`: For unique identifiers
- `winston`: For advanced logging

### Configuration Standards

#### MCP Client Configuration
```json
{
  "mcpServers": {
    "my-server": {
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

#### Environment Variables
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging level (error/warn/info/debug)
- `*_DB_PATH`: Database file paths
- `*_API_KEY`: API keys for external services

### Build and Development Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint src/",
    "clean": "rm -rf dist/"
  }
}
```

## Project Examples

### Example 1: MEMI - Memory Management MCP Server

MEMI demonstrates a sophisticated graph-based memory system with 19 tools for AI agents.

**Key Features:**
- Project-based memory organization
- Semantic search with TF-IDF embeddings
- SQLite storage with relationship management
- Comprehensive CRUD operations

**Architecture Highlights:**
```typescript
// Core components initialization
this.storage = new MemoryStorage();
this.graph = new MemoryGraph(this.storage);
this.ingestion = new MemoryIngestion(this.graph);
this.retrieval = new MemoryRetrieval(this.graph);
this.projects = new ProjectManager(this.storage);
```

**Tool Example:**
```typescript
{
  name: 'mem-store',
  description: 'Store text content as memory fragments',
  inputSchema: {
    type: 'object',
    properties: {
      content: { type: 'string', description: 'Text content to store' },
      source: { type: 'string', description: 'Source identifier' },
      tags: { type: 'array', items: { type: 'string' } }
    },
    required: ['content', 'source']
  }
}
```

### Example 2: RIXA - Universal Debugging MCP Server

RIXA provides comprehensive debugging capabilities across multiple programming languages.

**Key Features:**
- Multi-language debugging support (Java, Python, Go, Rust, etc.)
- Framework-specific tools (React, Django, Laravel, etc.)
- Advanced debugging features (breakpoints, stack traces, profiling)
- 400+ specialized debugging tools

**Architecture Pattern:**
```typescript
// Language dispatcher for unified debugging
const languageDispatcher = new LanguageDispatcher(logger);

// Specialized components for different languages
const javaDebugger = new JavaDebugger();
const pythonDebugger = new PythonDebugger();
```

### Example 3: RIMA - Web Scraping MCP Server

RIMA demonstrates specialized web scraping capabilities for e-commerce sites.

**Key Features:**
- Multi-store scraping (Líder, Santa Isabel)
- Product comparison and search
- Rate limiting and error recovery
- Efficient data storage and retrieval

**Tool Implementation Pattern:**
```typescript
const ScrapingToolSchema = z.object({
  store: z.enum(['lider', 'santa-isabel', 'both']),
  query: z.string().min(1),
  maxProducts: z.number().int().min(1).max(100).optional().default(20)
});

async function handleScraping(args: any) {
  const validated = ScrapingToolSchema.parse(args);
  // Implementation with error handling and rate limiting
}
```

## Best Practices

### 1. Input Validation

Always use Zod schemas for input validation:

```typescript
const ToolInputSchema = z.object({
  requiredParam: z.string().min(1, 'Cannot be empty'),
  optionalParam: z.number().optional().default(10),
  enumParam: z.enum(['option1', 'option2']),
});

// In tool handler
const validated = ToolInputSchema.parse(args);
```

### 2. Error Handling

Implement comprehensive error handling:

```typescript
try {
  const result = await riskyOperation();
  return { content: [{ type: 'text', text: result }] };
} catch (error) {
  if (error instanceof ValidationError) {
    throw new McpError(ErrorCode.InvalidParams, error.message);
  }
  throw new McpError(ErrorCode.InternalError, 'Operation failed');
}
```

### 3. Logging Strategy

Use structured logging without interfering with stdio:

```typescript
// For stdio mode, log to stderr only
const logger = {
  error: (msg: string, meta?: any) => console.error(JSON.stringify({ level: 'error', msg, meta })),
  info: (msg: string, meta?: any) => console.error(JSON.stringify({ level: 'info', msg, meta })),
};
```

### 4. Resource Management

Implement proper cleanup:

```typescript
class MCPServer {
  private resources: Resource[] = [];

  async shutdown(): Promise<void> {
    await Promise.all(this.resources.map(r => r.cleanup()));
  }
}
```

### 5. Tool Design Principles

- **Single Purpose**: Each tool should do one thing well
- **Idempotent**: Tools should be safe to call multiple times
- **Descriptive**: Clear names and descriptions
- **Validated**: Always validate inputs
- **Documented**: Comprehensive input schemas

## Testing and Validation

### Unit Testing

```typescript
import { describe, it, expect } from '@jest/globals';
import { handleExampleTool } from '../src/tools/example.js';

describe('Example Tool', () => {
  it('should process message correctly', async () => {
    const result = await handleExampleTool({ message: 'test', count: 2 });
    expect(result.content[0].text).toBe('Processed: test test');
  });

  it('should validate required parameters', async () => {
    await expect(handleExampleTool({})).rejects.toThrow();
  });
});
```

### Integration Testing

```typescript
// Test MCP protocol compliance
async function testMCPProtocol() {
  const server = spawn('node', ['dist/index.js']);

  // Test tools/list
  const listRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  };

  server.stdin.write(JSON.stringify(listRequest) + '\n');

  // Validate response format
  const response = await readResponse(server.stdout);
  expect(response.jsonrpc).toBe('2.0');
  expect(response.id).toBe(1);
  expect(response.result.tools).toBeInstanceOf(Array);
}
```

### Manual Testing

```bash
# Test server startup
npm run build
node dist/index.js

# In another terminal, test with echo
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

## Troubleshooting

### Common Issues

#### 1. "Module not found" errors
- Ensure proper TypeScript configuration
- Check import paths and file extensions
- Verify dist/ directory is built correctly

#### 2. JSON-RPC parsing errors
- Validate JSON format with tools like jq
- Ensure proper newline termination
- Check for stdout contamination (use stderr for logs)

#### 3. Tool registration failures
- Verify schema definitions match implementation
- Check for duplicate tool names
- Ensure proper error handling in tool handlers

#### 4. Client connection issues
- Verify MCP client configuration
- Check file paths and permissions
- Ensure server executable is built and accessible

### Debugging Techniques

#### 1. Enable Debug Logging
```typescript
const DEBUG = process.env.DEBUG === 'true';
if (DEBUG) {
  console.error('Debug:', JSON.stringify(request, null, 2));
}
```

#### 2. Test Individual Tools
```typescript
// Create standalone test script
import { handleExampleTool } from './src/tools/example.js';

async function test() {
  try {
    const result = await handleExampleTool({ message: 'test' });
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
```

#### 3. Validate Protocol Compliance
```bash
# Use jq to validate JSON responses
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  node dist/index.js | \
  jq '.result.tools[0].inputSchema'
```

### Performance Optimization

#### 1. Lazy Loading
```typescript
// Load heavy dependencies only when needed
async function handleHeavyTool(args: any) {
  const { HeavyLibrary } = await import('./heavy-library.js');
  return new HeavyLibrary().process(args);
}
```

#### 2. Caching
```typescript
const cache = new Map<string, any>();

async function handleCachedTool(args: any) {
  const key = JSON.stringify(args);
  if (cache.has(key)) {
    return cache.get(key);
  }

  const result = await expensiveOperation(args);
  cache.set(key, result);
  return result;
}
```

#### 3. Resource Pooling
```typescript
class ConnectionPool {
  private connections: Connection[] = [];

  async getConnection(): Promise<Connection> {
    return this.connections.pop() || new Connection();
  }

  releaseConnection(conn: Connection): void {
    this.connections.push(conn);
  }
}
```

## Advanced Patterns

### 1. Multi-Tool Workflows

```typescript
// Coordinate multiple tools for complex operations
async function handleWorkflow(args: any) {
  const step1Result = await handleTool1(args.step1Params);
  const step2Result = await handleTool2({
    ...args.step2Params,
    input: step1Result
  });

  return {
    content: [{
      type: 'text',
      text: `Workflow completed: ${step2Result}`
    }]
  };
}
```

### 2. Streaming Responses

```typescript
// For long-running operations, consider progress updates
async function handleLongOperation(args: any) {
  const total = args.items.length;
  const results = [];

  for (let i = 0; i < total; i++) {
    const result = await processItem(args.items[i]);
    results.push(result);

    // Progress indication (if supported by client)
    if (i % 10 === 0) {
      console.error(`Progress: ${i}/${total}`);
    }
  }

  return { content: [{ type: 'text', text: JSON.stringify(results) }] };
}
```

### 3. Configuration Management

```typescript
interface ServerConfig {
  maxConcurrency: number;
  timeout: number;
  retryAttempts: number;
}

const config: ServerConfig = {
  maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '5'),
  timeout: parseInt(process.env.TIMEOUT || '30000'),
  retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
};
```

---

## Conclusion

This guide provides a comprehensive foundation for implementing MCP-compliant applications. The patterns and examples shown here are derived from real-world MCP implementations and represent current best practices in the ecosystem.

Key takeaways:
- Follow the standard architectural patterns for consistency
- Implement comprehensive error handling and validation
- Use TypeScript for type safety and better development experience
- Test thoroughly at both unit and integration levels
- Follow MCP protocol specifications exactly
- Design tools to be single-purpose and well-documented

For additional examples and advanced patterns, refer to the specific project implementations mentioned throughout this guide.
