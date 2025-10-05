/**
 * MCP Tools Registration
 * 
 * Demonstrates proper tool registration following MCP best practices
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema, 
  ErrorCode, 
  McpError, 
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { Logger } from '../utils/logger.js';
import type { ErrorHandler } from '../utils/errors.js';

interface ToolContext {
  logger: Logger;
  errorHandler: ErrorHandler;
}

// Input validation schemas following best practices
const EchoToolSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  repeat: z.number().int().min(1).max(10).optional().default(1),
});

const CalculatorToolSchema = z.object({
  operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
  a: z.number(),
  b: z.number(),
});

const DataProcessorSchema = z.object({
  data: z.array(z.string()),
  operation: z.enum(['count', 'sort', 'unique', 'reverse']),
  caseSensitive: z.boolean().optional().default(true),
});

const StatusToolSchema = z.object({
  includeSystemInfo: z.boolean().optional().default(false),
});

// 🆕 2025 Pattern Tools

const StreamingTaskSchema = z.object({
  taskName: z.string().min(1, 'Task name is required'),
  steps: z.number().int().min(1).max(100).default(10),
  delayMs: z.number().int().min(10).max(2000).default(100),
});

const CachedSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  useCache: z.boolean().optional().default(true),
  cacheTTL: z.number().int().min(60).max(3600).optional().default(300),
});

const VersionedApiSchema = z.object({
  action: z.enum(['get-user', 'list-users', 'create-user']),
  userId: z.string().optional(),
  apiVersion: z.enum(['v1', 'v2']).optional().default('v2'),
});

export async function registerTools(server: Server, context: ToolContext): Promise<void> {
  const { logger, errorHandler } = context;

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      logger.info(`Executing tool: ${name}`, { args });

      switch (name) {
        case 'echo':
          return await handleEcho(args, context);
        case 'calculator':
          return await handleCalculator(args, context);
        case 'data-processor':
          return await handleDataProcessor(args, context);
        case 'status':
          return await handleStatus(args, context);
        // 🆕 2025 Pattern Tools
        case 'streaming-task':
          return await handleStreamingTask(args, context);
        case 'cached-search':
          return await handleCachedSearch(args, context);
        case 'versioned-api':
          return await handleVersionedApi(args, context);
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error) {
      logger.error(`Error in tool ${name}:`, error);
      return errorHandler.handleToolError(error, name);
    }
  });

  // Register tool definitions
  // CRITICAL: Use JSON Schema format, NOT Zod schemas for Claude Desktop compatibility
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.info('Listing available tools');

    return {
      tools: [
        {
          name: 'echo',
          description: 'Echo a message with optional repetition',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Message to echo',
              },
              repeat: {
                type: 'number',
                description: 'Number of times to repeat the message',
                default: 1,
                minimum: 1,
                maximum: 10,
              },
            },
            required: ['message'],
          },
        },
        {
          name: 'calculator',
          description: 'Perform basic mathematical operations',
          inputSchema: {
            type: 'object',
            properties: {
              operation: {
                type: 'string',
                enum: ['add', 'subtract', 'multiply', 'divide'],
                description: 'Mathematical operation to perform',
              },
              a: {
                type: 'number',
                description: 'First operand',
              },
              b: {
                type: 'number',
                description: 'Second operand',
              },
            },
            required: ['operation', 'a', 'b'],
          },
        },
        {
          name: 'data-processor',
          description: 'Process arrays of string data with various operations',
          inputSchema: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of strings to process',
              },
              operation: {
                type: 'string',
                enum: ['count', 'sort', 'unique', 'reverse'],
                description: 'Operation to perform on the data',
              },
              caseSensitive: {
                type: 'boolean',
                description: 'Whether operations should be case sensitive',
                default: true,
              },
            },
            required: ['data', 'operation'],
          },
        },
        {
          name: 'status',
          description: 'Get server status and health information',
          inputSchema: {
            type: 'object',
            properties: {
              includeSystemInfo: {
                type: 'boolean',
                description: 'Include system information in the response',
                default: false,
              },
            },
          },
        },
        // 🆕 2025 Pattern Tools
        {
          name: 'streaming-task',
          description: '🆕 2025 Pattern: Demonstrates streaming responses with progress notifications',
          inputSchema: {
            type: 'object',
            properties: {
              taskName: {
                type: 'string',
                description: 'Name of the task to execute',
              },
              steps: {
                type: 'number',
                description: 'Number of steps to process',
                default: 10,
                minimum: 1,
                maximum: 100,
              },
              delayMs: {
                type: 'number',
                description: 'Delay between steps in milliseconds',
                default: 100,
                minimum: 10,
                maximum: 2000,
              },
            },
            required: ['taskName'],
          },
        },
        {
          name: 'cached-search',
          description: '🆕 2025 Pattern: Demonstrates multi-layer caching (Memory → Redis → Database)',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query to execute',
              },
              useCache: {
                type: 'boolean',
                description: 'Whether to use caching',
                default: true,
              },
              cacheTTL: {
                type: 'number',
                description: 'Cache time-to-live in seconds',
                default: 300,
                minimum: 60,
                maximum: 3600,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'versioned-api',
          description: '🆕 2025 Pattern: Demonstrates API versioning with backward compatibility',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['get-user', 'list-users', 'create-user'],
                description: 'API action to perform',
              },
              userId: {
                type: 'string',
                description: 'User ID (required for get-user action)',
              },
              apiVersion: {
                type: 'string',
                enum: ['v1', 'v2'],
                description: 'API version to use',
                default: 'v2',
              },
            },
            required: ['action'],
          },
        },
      ],
    };
  });

  logger.info('MCP tools registered successfully');
}

// Tool handlers implementing best practices

async function handleEcho(args: any, context: ToolContext) {
  const validated = EchoToolSchema.parse(args);
  const { logger } = context;

  logger.debug('Echo tool executed', { message: validated.message, repeat: validated.repeat });

  const result = Array(validated.repeat)
    .fill(validated.message)
    .join(' ');

  return {
    content: [
      {
        type: 'text',
        text: `Echo result: ${result}`,
      },
    ],
  };
}

async function handleCalculator(args: any, context: ToolContext) {
  const validated = CalculatorToolSchema.parse(args);
  const { logger } = context;

  // Validate division by zero
  if (validated.operation === 'divide' && validated.b === 0) {
    throw new McpError(ErrorCode.InvalidParams, 'Division by zero is not allowed');
  }

  let result: number;
  switch (validated.operation) {
    case 'add':
      result = validated.a + validated.b;
      break;
    case 'subtract':
      result = validated.a - validated.b;
      break;
    case 'multiply':
      result = validated.a * validated.b;
      break;
    case 'divide':
      result = validated.a / validated.b;
      break;
  }

  logger.debug('Calculator tool executed', { 
    operation: validated.operation, 
    a: validated.a, 
    b: validated.b, 
    result 
  });

  return {
    content: [
      {
        type: 'text',
        text: `${validated.a} ${validated.operation} ${validated.b} = ${result}`,
      },
    ],
  };
}

async function handleDataProcessor(args: any, context: ToolContext) {
  const validated = DataProcessorSchema.parse(args);
  const { logger } = context;

  let processedData: string[] = [...validated.data];
  let resultDescription: string;

  switch (validated.operation) {
    case 'count':
      const count = processedData.length;
      resultDescription = `Count: ${count} items`;
      break;
    
    case 'sort':
      processedData = validated.caseSensitive 
        ? processedData.sort()
        : processedData.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      resultDescription = `Sorted ${processedData.length} items`;
      break;
    
    case 'unique':
      const uniqueSet = validated.caseSensitive
        ? new Set(processedData)
        : new Set(processedData.map(item => item.toLowerCase()));
      processedData = Array.from(uniqueSet);
      resultDescription = `Found ${processedData.length} unique items`;
      break;
    
    case 'reverse':
      processedData = processedData.reverse();
      resultDescription = `Reversed ${processedData.length} items`;
      break;
  }

  logger.debug('Data processor tool executed', { 
    operation: validated.operation, 
    inputCount: validated.data.length,
    outputCount: processedData.length
  });

  return {
    content: [
      {
        type: 'text',
        text: `${resultDescription}\nResult: ${JSON.stringify(processedData, null, 2)}`,
      },
    ],
  };
}

async function handleStatus(args: any, context: ToolContext) {
  const validated = StatusToolSchema.parse(args);
  const { logger } = context;

  const status = {
    server: 'Example MCP Server',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    requestId: uuidv4(),
  };

  if (validated.includeSystemInfo) {
    Object.assign(status, {
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    });
  }

  logger.debug('Status tool executed', { includeSystemInfo: validated.includeSystemInfo });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(status, null, 2),
      },
    ],
  };
}

// 🆕 2025 Pattern Tool Handlers

/**
 * Streaming Task Handler
 * Demonstrates: Streaming responses with progress notifications for long-running operations
 * Pattern: Progressive enhancement with incremental updates
 */
async function handleStreamingTask(args: any, context: ToolContext) {
  const validated = StreamingTaskSchema.parse(args);
  const { logger } = context;

  const results: string[] = [];
  const startTime = Date.now();

  logger.info(`Starting streaming task: ${validated.taskName}`, {
    steps: validated.steps,
    delayMs: validated.delayMs,
  });

  for (let i = 1; i <= validated.steps; i++) {
    // Simulate processing step
    await new Promise(resolve => setTimeout(resolve, validated.delayMs));

    const stepResult = `Step ${i}/${validated.steps} completed`;
    results.push(stepResult);

    // Log progress (in production, this would send progress notifications)
    if (i % 10 === 0 || i === validated.steps) {
      const progress = (i / validated.steps) * 100;
      logger.info(`Progress update: ${progress.toFixed(1)}%`, {
        taskName: validated.taskName,
        step: i,
        total: validated.steps,
      });
    }
  }

  const duration = Date.now() - startTime;

  logger.info(`Streaming task completed: ${validated.taskName}`, {
    steps: validated.steps,
    duration: `${duration}ms`,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          taskName: validated.taskName,
          status: 'completed',
          steps: validated.steps,
          duration: `${duration}ms`,
          averageStepTime: `${(duration / validated.steps).toFixed(2)}ms`,
          results: results.slice(-5), // Last 5 steps
          pattern: '2025: Streaming with progressive enhancement',
        }, null, 2),
      },
    ],
  };
}

/**
 * Cached Search Handler
 * Demonstrates: Multi-layer caching strategy (Memory → Redis → Database)
 * Pattern: Performance optimization with intelligent cache invalidation
 */

// Simple in-memory cache for demonstration
const searchCache = new Map<string, { value: any; expiresAt: number }>();

async function handleCachedSearch(args: any, context: ToolContext) {
  const validated = CachedSearchSchema.parse(args);
  const { logger } = context;

  const cacheKey = `search:${validated.query}`;
  const now = Date.now();

  // Layer 1: Memory cache check (fastest)
  if (validated.useCache && searchCache.has(cacheKey)) {
    const cached = searchCache.get(cacheKey)!;
    if (cached.expiresAt > now) {
      logger.info('Cache HIT (memory)', { query: validated.query });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ...cached.value,
              cacheLayer: 'memory',
              pattern: '2025: Multi-layer caching - Memory hit (fastest)',
            }, null, 2),
          },
        ],
      };
    } else {
      // Expired entry, remove it
      searchCache.delete(cacheKey);
      logger.info('Cache EXPIRED', { query: validated.query });
    }
  }

  // Layer 2 & 3: Simulated Redis/Database miss - fetch fresh data
  logger.info('Cache MISS - fetching fresh data', { query: validated.query });

  // Simulate expensive search operation
  await new Promise(resolve => setTimeout(resolve, 500));

  const searchResults = {
    query: validated.query,
    results: [
      { id: 1, title: `Result 1 for "${validated.query}"`, score: 0.95 },
      { id: 2, title: `Result 2 for "${validated.query}"`, score: 0.87 },
      { id: 3, title: `Result 3 for "${validated.query}"`, score: 0.76 },
    ],
    totalResults: 3,
    executionTime: '500ms',
  };

  // Populate cache if enabled
  if (validated.useCache) {
    const ttlMs = validated.cacheTTL * 1000;
    searchCache.set(cacheKey, {
      value: searchResults,
      expiresAt: now + ttlMs,
    });

    logger.info('Cache POPULATED', {
      query: validated.query,
      ttl: `${validated.cacheTTL}s`,
      cacheSize: searchCache.size,
    });
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          ...searchResults,
          cacheLayer: validated.useCache ? 'fresh (now cached)' : 'no cache',
          cacheTTL: validated.useCache ? `${validated.cacheTTL}s` : 'N/A',
          pattern: '2025: Multi-layer caching - Fresh data with cache population',
        }, null, 2),
      },
    ],
  };
}

/**
 * Versioned API Handler
 * Demonstrates: API versioning with backward compatibility
 * Pattern: Graceful evolution with feature detection
 */
async function handleVersionedApi(args: any, context: ToolContext) {
  const validated = VersionedApiSchema.parse(args);
  const { logger } = context;

  logger.info(`API ${validated.apiVersion} request`, {
    action: validated.action,
    userId: validated.userId,
  });

  // Version-specific response structure
  const isV2 = validated.apiVersion === 'v2';

  let result: any;

  switch (validated.action) {
    case 'get-user':
      if (!validated.userId) {
        throw new McpError(ErrorCode.InvalidParams, 'userId is required for get-user action');
      }

      result = isV2 ? {
        // V2: Enhanced response with additional fields
        id: validated.userId,
        username: `user_${validated.userId}`,
        email: `user_${validated.userId}@example.com`,
        profile: {
          displayName: `User ${validated.userId}`,
          avatar: `https://api.example.com/avatars/${validated.userId}`,
          joinedAt: '2025-01-01T00:00:00Z',
        },
        metadata: {
          lastActive: new Date().toISOString(),
          tier: 'premium',
        },
      } : {
        // V1: Basic response (backward compatible)
        id: validated.userId,
        username: `user_${validated.userId}`,
        email: `user_${validated.userId}@example.com`,
      };
      break;

    case 'list-users':
      const users = Array.from({ length: 3 }, (_, i) => {
        const userId = (i + 1).toString();
        return isV2 ? {
          id: userId,
          username: `user_${userId}`,
          email: `user_${userId}@example.com`,
          profile: {
            displayName: `User ${userId}`,
            avatar: `https://api.example.com/avatars/${userId}`,
          },
          metadata: {
            lastActive: new Date().toISOString(),
          },
        } : {
          id: userId,
          username: `user_${userId}`,
          email: `user_${userId}@example.com`,
        };
      });

      result = isV2 ? {
        users,
        pagination: {
          page: 1,
          pageSize: 10,
          totalUsers: 3,
          hasMore: false,
        },
      } : { users };
      break;

    case 'create-user':
      result = isV2 ? {
        success: true,
        user: {
          id: uuidv4(),
          username: 'new_user',
          email: 'new_user@example.com',
          profile: {
            displayName: 'New User',
            joinedAt: new Date().toISOString(),
          },
        },
        message: 'User created successfully',
      } : {
        success: true,
        userId: uuidv4(),
      };
      break;
  }

  logger.debug(`${validated.apiVersion} response`, {
    action: validated.action,
    hasEnhancedFields: isV2,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          apiVersion: validated.apiVersion,
          action: validated.action,
          data: result,
          compatibility: isV2
            ? '2025: V2 with enhanced features'
            : 'V1 backward compatible mode',
          pattern: '2025: Versioning with graceful degradation',
        }, null, 2),
      },
    ],
  };
}
