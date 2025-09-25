#!/usr/bin/env node

/**
 * Example MCP Server Implementation
 * 
 * This demonstrates a complete MCP server following best practices
 * extracted from real-world MCP implementations.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools/index.js';
import { Logger } from './utils/logger.js';
import { ErrorHandler } from './utils/errors.js';

class ExampleMCPServer {
  private server: Server;
  private logger: Logger;
  private errorHandler: ErrorHandler;

  constructor() {
    this.server = new Server(
      {
        name: 'example-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.logger = new Logger();
    this.errorHandler = new ErrorHandler(this.logger);
    this.setupErrorHandling();
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Starting Example MCP Server initialization...');

      // Register all tools
      this.logger.info('Registering MCP tools...');
      await registerTools(this.server, {
        logger: this.logger,
        errorHandler: this.errorHandler,
      });

      this.logger.info('Example MCP Server initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize server:', error);
      throw error;
    }
  }

  private setupErrorHandling(): void {
    // Global error handlers
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('Example MCP Server started and listening on stdio');
  }

  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down Example MCP Server...');
      // Cleanup resources here
      this.logger.info('Example MCP Server shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
    }
  }
}

// Main execution
async function main(): Promise<void> {
  const server = new ExampleMCPServer();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.error('Received SIGINT, shutting down gracefully...');
    await server.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Received SIGTERM, shutting down gracefully...');
    await server.shutdown();
    process.exit(0);
  });

  try {
    await server.initialize();
    await server.start();
  } catch (error) {
    console.error('Failed to start Example MCP Server:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error in main:', error);
    process.exit(1);
  });
}

export { ExampleMCPServer };
