#!/usr/bin/env node
/**
 * 📚 Example 1: Basic MCP Server
 *
 * Learn the fundamentals:
 * - Server initialization
 * - Simple tool registration
 * - Basic request handling
 * - No validation, no complexity
 *
 * Run: npx tsx examples/01-basic.ts
 * Test: npx @modelcontextprotocol/inspector npx tsx examples/01-basic.ts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Initialize server with name and version
const server = new Server(
  { name: 'basic-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'echo',
      description: 'Echo back the input text',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text to echo' }
        },
        required: ['text']
      }
    },
    {
      name: 'add',
      description: 'Add two numbers together',
      inputSchema: {
        type: 'object',
        properties: {
          a: { type: 'number', description: 'First number' },
          b: { type: 'number', description: 'Second number' }
        },
        required: ['a', 'b']
      }
    }
  ]
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Simple pattern matching - no error handling yet
  switch (name) {
    case 'echo':
      return {
        content: [{ type: 'text', text: `You said: ${args.text}` }]
      };

    case 'add':
      const result = args.a + args.b;
      return {
        content: [{ type: 'text', text: `${args.a} + ${args.b} = ${result}` }]
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
await server.connect(new StdioServerTransport());
console.error('✅ Basic MCP server running!');
