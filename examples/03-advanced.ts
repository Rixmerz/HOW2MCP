#!/usr/bin/env node
/**
 * 🚀 Example 3: Advanced MCP Server (2025 Patterns)
 *
 * Production-ready features:
 * - Streaming responses (SSE pattern)
 * - Progress notifications
 * - Resource management
 * - Advanced error recovery
 * - Logging and observability
 *
 * Run: npx tsx examples/03-advanced.ts
 * Test: npx @modelcontextprotocol/inspector npx tsx examples/03-advanced.ts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
  ErrorCode
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Initialize server with resources capability
const server = new Server(
  { name: 'advanced-server', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

// Schemas
const StreamingTaskSchema = z.object({
  taskName: z.string(),
  steps: z.number().int().positive().max(10)
});

const AsyncOperationSchema = z.object({
  url: z.string().url(),
  timeout: z.number().int().positive().default(5000)
});

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'streaming-task',
      description: 'Execute a task with streaming progress updates',
      inputSchema: zodToJsonSchema(StreamingTaskSchema)
    },
    {
      name: 'async-fetch',
      description: 'Fetch data asynchronously with error recovery',
      inputSchema: zodToJsonSchema(AsyncOperationSchema)
    }
  ]
}));

// Register resources (2025 pattern for providing data)
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'system://status',
      name: 'System Status',
      description: 'Current server status and metrics',
      mimeType: 'application/json'
    }
  ]
}));

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === 'system://status') {
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
});

// Handle tool execution with streaming
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'streaming-task': {
        const { taskName, steps } = StreamingTaskSchema.parse(args);

        // Simulate a multi-step task with progress updates
        let progress = 0;
        const results: string[] = [];

        for (let i = 1; i <= steps; i++) {
          progress = Math.round((i / steps) * 100);

          // Send progress notification (2025 streaming pattern)
          server.notification({
            method: 'notifications/progress',
            params: {
              progressToken: request.params._meta?.progressToken,
              progress,
              total: 100
            }
          });

          // Simulate work
          await new Promise(resolve => setTimeout(resolve, 500));
          results.push(`Step ${i} of ${steps} completed`);
        }

        return {
          content: [{
            type: 'text',
            text: `✅ ${taskName} completed!\n\nSteps:\n${results.join('\n')}`
          }]
        };
      }

      case 'async-fetch': {
        const { url, timeout } = AsyncOperationSchema.parse(args);

        try {
          // Fetch with timeout and error recovery
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'MCP-Server/1.0' }
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.text();

          return {
            content: [{
              type: 'text',
              text: `✅ Successfully fetched ${url}\n\nSize: ${data.length} bytes\nStatus: ${response.status}`
            }]
          };

        } catch (error) {
          // Error recovery pattern
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              throw new McpError(
                ErrorCode.InternalError,
                `Request timeout after ${timeout}ms`
              );
            }
            throw new McpError(ErrorCode.InternalError, error.message);
          }
          throw error;
        }
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
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
console.error('✅ Advanced MCP server running with streaming and resources!');
