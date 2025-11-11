#!/usr/bin/env node
/**
 * ⚙️ Example 2: Intermediate MCP Server
 *
 * Learn production patterns:
 * - Zod schema validation
 * - Proper error handling
 * - Type-safe tool arguments
 * - Multiple tool patterns
 *
 * Run: npx tsx examples/02-intermediate.ts
 * Test: npx @modelcontextprotocol/inspector npx tsx examples/02-intermediate.ts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Initialize server
const server = new Server(
  { name: 'intermediate-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ✨ Define Zod schemas for type-safe validation
const EchoSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty'),
  uppercase: z.boolean().optional().default(false)
});

const CalculatorSchema = z.object({
  operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
  a: z.number(),
  b: z.number()
});

const DataProcessorSchema = z.object({
  data: z.array(z.number()),
  operation: z.enum(['sum', 'average', 'max', 'min'])
});

// Register tools with Zod schemas converted to JSON Schema
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'echo',
      description: 'Echo text with optional transformation',
      inputSchema: zodToJsonSchema(EchoSchema)
    },
    {
      name: 'calculator',
      description: 'Perform mathematical operations',
      inputSchema: zodToJsonSchema(CalculatorSchema)
    },
    {
      name: 'data-processor',
      description: 'Process arrays of numbers',
      inputSchema: zodToJsonSchema(DataProcessorSchema)
    }
  ]
}));

// Handle tool execution with validation and error handling
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'echo': {
        // ✅ Validate input with Zod
        const { text, uppercase } = EchoSchema.parse(args);
        const result = uppercase ? text.toUpperCase() : text;
        return {
          content: [{ type: 'text', text: `Echo: ${result}` }]
        };
      }

      case 'calculator': {
        const { operation, a, b } = CalculatorSchema.parse(args);

        // Handle division by zero
        if (operation === 'divide' && b === 0) {
          throw new McpError(ErrorCode.InvalidParams, 'Cannot divide by zero');
        }

        const operations = {
          add: a + b,
          subtract: a - b,
          multiply: a * b,
          divide: a / b
        };

        return {
          content: [{
            type: 'text',
            text: `${a} ${operation} ${b} = ${operations[operation]}`
          }]
        };
      }

      case 'data-processor': {
        const { data, operation } = DataProcessorSchema.parse(args);

        if (data.length === 0) {
          throw new McpError(ErrorCode.InvalidParams, 'Data array cannot be empty');
        }

        const operations = {
          sum: data.reduce((acc, val) => acc + val, 0),
          average: data.reduce((acc, val) => acc + val, 0) / data.length,
          max: Math.max(...data),
          min: Math.min(...data)
        };

        return {
          content: [{
            type: 'text',
            text: `${operation.toUpperCase()}: ${operations[operation]}`
          }]
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    // ✅ Proper error handling
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Validation failed: ${error.errors.map(e => e.message).join(', ')}`
      );
    }
    throw error;
  }
});

// Start server
await server.connect(new StdioServerTransport());
console.error('✅ Intermediate MCP server running with validation!');
