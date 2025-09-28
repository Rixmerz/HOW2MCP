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

Based on analysis of multiple MCP projects (MEMI, RIXA, RIMA, RIKA, RISA, TOMA), the following architectural patterns emerge:

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

### Critical Claude Desktop Integration Issues

#### 1. "No tools are being exposed" - JSON Schema Conversion Fix

**Problem**: Claude Desktop shows "could not attach server" or reports no tools available.

**Root Cause**: Zod schemas don't serialize correctly for MCP tool registration. Claude Desktop requires proper JSON Schema format.

**Solution**: Convert all Zod schemas to JSON Schema format in tool registration:

```typescript
// ❌ WRONG - Using Zod schema directly
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [{
      name: 'example-tool',
      description: 'Example tool',
      inputSchema: ExampleToolSchema // Zod schema - won't work!
    }]
  };
});

// ✅ CORRECT - Convert to JSON Schema
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [{
      name: 'example-tool',
      description: 'Example tool',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Message to process'
          },
          count: {
            type: 'number',
            description: 'Number of times to repeat',
            default: 1
          }
        },
        required: ['message']
      }
    }]
  };
});
```

#### 2. Claude Desktop Configuration - Absolute Paths Required

**Problem**: Server fails to start with "command not found" or path resolution errors.

**Solution**: Use absolute paths for Node.js executable and server script:

```json
{
  "mcpServers": {
    "flow-mcp-server": {
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

**Find your Node.js path**:
```bash
which node
# or for nvm users:
nvm which current
```

#### 3. Server Startup and --stdio Transport

**Problem**: Server appears to start but doesn't respond to requests.

**Solution**: Ensure proper --stdio argument handling and transport setup:

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

class FlowMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: 'flow-mcp-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
  }

  async start(): Promise<void> {
    // Check for --stdio argument
    const useStdio = process.argv.includes('--stdio');

    if (useStdio) {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
    } else {
      throw new Error('Only stdio transport is supported');
    }
  }
}

// Main execution with proper error handling
async function main(): Promise<void> {
  const server = new FlowMCPServer();

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

### Framework-Specific Integration Fixes

#### 4. Fastify False Positives in Express Projects

**Problem**: Fastify extractor incorrectly processes Express routes, causing false positive detections.

**Solution**: Implement intelligent framework detection:

```typescript
class FastifyExtractor {
  private hasFastifyIndicators(): boolean {
    for (const [, info] of this.fileIndex) {
      // Check for Fastify imports
      for (const src of (info.imports?.values() || [])) {
        if (src === 'fastify') return true;
      }
      // Check for actual Fastify instances
      if (info.fastifyInstances && info.fastifyInstances.length > 0) return true;
    }
    return false;
  }

  async extract(): Promise<FlowExtractionResult> {
    // Early return if no Fastify indicators found
    if (!this.hasFastifyIndicators()) {
      this.context.logger.info('No Fastify indicators found, skipping extraction');
      return { flows: [], summary: { totalFlows: 0, frameworks: [], endpoints: 0, services: 0, repositories: 0 } };
    }

    // Only process routes on actual Fastify instances
    for (const route of routes) {
      if (this.isValidFastifyInstance(route.object)) {
        // Process route
      }
    }
  }
}
```

#### 5. Spring Boot Graceful Fallback for Missing Dependencies

**Problem**: Spring extractor throws hard errors when Java dependencies are missing.

**Solution**: Implement graceful fallback with informative logging:

```typescript
async extract(): Promise<FlowExtractionResult> {
  const pomPath = path.join(this.context.srcPath, 'pom.xml');
  const gradlePath = path.join(this.context.srcPath, 'build.gradle');

  // Check if this is actually a Java project
  if (!(await fs.pathExists(pomPath)) && !(await fs.pathExists(gradlePath))) {
    this.context.logger.warn('No Java project detected. Returning empty result.');
    return {
      flows: [],
      summary: {
        totalFlows: 0,
        frameworks: ['spring'],
        endpoints: 0,
        services: 0,
        repositories: 0
      }
    };
  }

  try {
    // Attempt Java flow mapping
    return await this.executeJavaFlowMapper();
  } catch (error) {
    this.context.logger.warn(`Java flow mapper failed: ${error.message}. Returning empty result.`);
    return {
      flows: [],
      summary: {
        totalFlows: 0,
        frameworks: ['spring'],
        endpoints: 0,
        services: 0,
        repositories: 0
      }
    };
  }
}
```

#### 6. API Surface Analysis Enhancement

**Problem**: API surface analyzer returns 0 endpoints for projects without package.json.

**Solution**: Implement heuristic framework detection by scanning source code:

```typescript
private async detectFrameworksFromSource(): Promise<string[]> {
  const frameworks: string[] = [];
  const srcDir = path.join(this.context.srcPath, 'src');

  if (await fs.pathExists(srcDir)) {
    const files = await this.getAllFiles(srcDir, ['.js', '.ts', '.jsx', '.tsx']);

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');

      // Detect Express
      if (!frameworks.includes('express') &&
          (content.includes("from 'express'") || content.includes("require('express')"))) {
        frameworks.push('express');
      }

      // Detect Fastify
      if (!frameworks.includes('fastify') &&
          (content.includes("from 'fastify'") || content.includes("require('fastify')"))) {
        frameworks.push('fastify');
      }

      // Detect NestJS
      if (!frameworks.includes('nestjs') &&
          (content.includes("@nestjs/") || content.includes("@Controller"))) {
        frameworks.push('nestjs');
      }
    }
  }

  return frameworks;
}
```

### Common Issues

#### 7. "Module not found" errors
- Ensure proper TypeScript configuration
- Check import paths and file extensions
- Verify dist/ directory is built correctly

#### 8. JSON-RPC parsing errors
- Validate JSON format with tools like jq
- Ensure proper newline termination
- Check for stdout contamination (use stderr for logs)

#### 9. Tool registration failures
- Verify schema definitions match implementation
- Check for duplicate tool names
- Ensure proper error handling in tool handlers

#### 10. Client connection issues
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

#### 4. Test Claude Desktop Integration
```bash
# Test server startup
npm run build
node dist/index.js --stdio

# In another terminal, test MCP protocol
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js --stdio

# Test specific tool
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"your-tool","arguments":{"param":"value"}}}' | node dist/index.js --stdio
```

#### 5. Validate JSON Schema Conversion
```typescript
// Test that your schemas serialize correctly
const toolSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', description: 'Message to process' }
  },
  required: ['message']
};

console.error('Schema test:', JSON.stringify(toolSchema, null, 2));
```

#### 6. Framework Detection Testing
```typescript
// Test framework detection logic
async function testFrameworkDetection() {
  const extractor = new YourExtractor(context);
  const hasFramework = await extractor.hasFrameworkIndicators();
  console.error('Framework detected:', hasFramework);
}
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

## Production-Ready Server Implementation

### Multi-Framework Flow Extraction Server

Based on our real-world implementation and troubleshooting experience, here's a production-ready server architecture for multi-framework flow extraction:

#### Server Architecture
```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export class FlowMCPServer {
  private server: Server;
  private extractors: Map<string, any> = new Map();
  private logger: any;

  constructor() {
    this.server = new Server(
      { name: 'flow-mcp-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.logger = {
      info: (msg: string, meta?: any) => console.error(JSON.stringify({ level: 'info', msg, meta })),
      warn: (msg: string, meta?: any) => console.error(JSON.stringify({ level: 'warn', msg, meta })),
      error: (msg: string, meta?: any) => console.error(JSON.stringify({ level: 'error', msg, meta }))
    };
  }

  async initialize(): Promise<void> {
    // Initialize extractors with graceful fallback
    await this.initializeExtractors();

    // Register tools with proper JSON Schema format
    await this.registerTools();

    this.logger.info('Flow MCP Server initialized successfully');
  }

  private async initializeExtractors(): Promise<void> {
    // Initialize each extractor with error handling
    try {
      const { ExpressExtractor } = await import('./extractors/express.js');
      this.extractors.set('express', ExpressExtractor);
    } catch (error) {
      this.logger.warn('Express extractor failed to load', { error: error.message });
    }

    try {
      const { FastifyExtractor } = await import('./extractors/fastify.js');
      this.extractors.set('fastify', FastifyExtractor);
    } catch (error) {
      this.logger.warn('Fastify extractor failed to load', { error: error.message });
    }

    // Continue for other frameworks...
  }

  async start(): Promise<void> {
    const useStdio = process.argv.includes('--stdio');

    if (!useStdio) {
      throw new Error('Server requires --stdio argument for Claude Desktop integration');
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('Flow MCP Server started with stdio transport');
  }
}
```

#### Tool Registration with JSON Schema
```typescript
private async registerTools(): Promise<void> {
  // Tools list handler with proper JSON Schema format
  this.server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'extract_express_flows',
          description: 'Extract flow information from Express.js applications',
          inputSchema: {
            type: 'object',
            properties: {
              srcPath: {
                type: 'string',
                description: 'Path to the source code directory'
              },
              options: {
                type: 'object',
                properties: {
                  excludePaths: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Paths to exclude from analysis'
                  }
                }
              }
            },
            required: ['srcPath']
          }
        },
        {
          name: 'extract_fastify_flows',
          description: 'Extract flow information from Fastify applications',
          inputSchema: {
            type: 'object',
            properties: {
              srcPath: { type: 'string', description: 'Path to source code' },
              options: {
                type: 'object',
                properties: {
                  excludePaths: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                }
              }
            },
            required: ['srcPath']
          }
        }
        // Additional tools...
      ]
    };
  });

  // Tool call handler with comprehensive error handling
  this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'extract_express_flows':
          return await this.handleExpressExtraction(args);
        case 'extract_fastify_flows':
          return await this.handleFastifyExtraction(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      this.logger.error('Tool execution failed', { tool: name, error: error.message });
      throw error;
    }
  });
}
```

### Framework Detection Best Practices

#### Intelligent Framework Detection
```typescript
class FrameworkDetector {
  static async detectFrameworks(srcPath: string): Promise<string[]> {
    const frameworks: string[] = [];

    // Check package.json first
    const packageJsonPath = path.join(srcPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (deps.express) frameworks.push('express');
      if (deps.fastify) frameworks.push('fastify');
      if (deps['@nestjs/core']) frameworks.push('nestjs');
    }

    // Fallback to source code scanning
    if (frameworks.length === 0) {
      frameworks.push(...await this.scanSourceCode(srcPath));
    }

    return frameworks;
  }

  private static async scanSourceCode(srcPath: string): Promise<string[]> {
    const frameworks: string[] = [];
    const srcDir = path.join(srcPath, 'src');

    if (await fs.pathExists(srcDir)) {
      const files = await this.getAllFiles(srcDir, ['.js', '.ts', '.jsx', '.tsx']);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');

        if (content.includes("from 'express'") || content.includes("require('express')")) {
          if (!frameworks.includes('express')) frameworks.push('express');
        }

        if (content.includes("from 'fastify'") || content.includes("require('fastify')")) {
          if (!frameworks.includes('fastify')) frameworks.push('fastify');
        }

        if (content.includes("@nestjs/") || content.includes("@Controller")) {
          if (!frameworks.includes('nestjs')) frameworks.push('nestjs');
        }
      }
    }

    return frameworks;
  }
}
```

### Error Handling and Graceful Degradation

#### Extractor Base Class with Error Handling
```typescript
abstract class BaseExtractor {
  protected context: ExtractionContext;
  protected logger: any;

  constructor(context: ExtractionContext) {
    this.context = context;
    this.logger = context.logger;
  }

  abstract hasFrameworkIndicators(): Promise<boolean>;
  abstract extractFlows(): Promise<FlowExtractionResult>;

  async extract(): Promise<FlowExtractionResult> {
    try {
      // Check if framework is present
      if (!(await this.hasFrameworkIndicators())) {
        this.logger.info(`No ${this.getFrameworkName()} indicators found, skipping extraction`);
        return this.getEmptyResult();
      }

      // Perform extraction
      return await this.extractFlows();
    } catch (error) {
      this.logger.warn(`${this.getFrameworkName()} extraction failed: ${error.message}`);
      return this.getEmptyResult();
    }
  }

  protected getEmptyResult(): FlowExtractionResult {
    return {
      flows: [],
      summary: {
        totalFlows: 0,
        frameworks: [this.getFrameworkName()],
        endpoints: 0,
        services: 0,
        repositories: 0
      }
    };
  }

  abstract getFrameworkName(): string;
}
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
