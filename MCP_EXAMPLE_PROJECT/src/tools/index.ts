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
