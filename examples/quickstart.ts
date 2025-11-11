#!/usr/bin/env node
/**
 * 🚀 5-Minute MCP Quickstart
 *
 * This is the simplest possible MCP server - just 15 lines of actual code!
 * Perfect for learning MCP basics or starting a new project.
 *
 * Run with: npx tsx examples/quickstart.ts
 * Test with: npx @modelcontextprotocol/inspector npx tsx examples/quickstart.ts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// 1. Create server with metadata
const server = new Server(
  { name: 'quickstart-server', version: '1.0.0' },
  { capabilities: { tools: {} } }  // Enable tools capability
);

// 2. Register available tools (what the LLM can discover)
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'greet',
    description: 'Say hello to someone',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name to greet' }
      },
      required: ['name']
    }
  }]
}));

// 3. Handle tool execution (what happens when LLM calls the tool)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'greet') {
    return {
      content: [{
        type: 'text',
        text: `Hello, ${args.name}! 👋 Welcome to MCP!`
      }]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// 4. Start server with stdio transport (Claude Desktop uses this)
await server.connect(new StdioServerTransport());
console.error('✅ Quickstart MCP server running!');
