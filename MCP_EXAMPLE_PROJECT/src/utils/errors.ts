/**
 * Error handling utilities for MCP servers
 * 
 * Provides standardized error handling and recovery mechanisms
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { ZodError } from 'zod';
import type { Logger } from './logger.js';

export class ErrorHandler {
  constructor(private logger: Logger) {}

  handleToolError(error: unknown, toolName: string): never {
    this.logger.error(`Tool ${toolName} failed:`, { error: this.serializeError(error) });

    if (error instanceof McpError) {
      throw error;
    }

    if (error instanceof ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Parameter validation failed: ${this.formatZodError(error)}`
      );
    }

    if (error instanceof Error) {
      // Check for specific error types
      if (error.name === 'TypeError') {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Type error: ${error.message}`
        );
      }

      if (error.name === 'RangeError') {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Range error: ${error.message}`
        );
      }

      // Generic error handling
      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error.message}`
      );
    }

    // Unknown error type
    throw new McpError(
      ErrorCode.InternalError,
      `Unknown error occurred in tool ${toolName}`
    );
  }

  private formatZodError(error: ZodError): string {
    return error.errors
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
  }

  private serializeError(error: unknown): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    if (error instanceof ZodError) {
      return {
        name: 'ZodError',
        issues: error.errors,
      };
    }

    return { error: String(error) };
  }

  // Utility method for retrying operations
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.logger.warn(`Operation failed, attempt ${attempt}/${maxRetries}`, {
          error: this.serializeError(error)
        });

        if (attempt < maxRetries) {
          await this.delay(delayMs * attempt); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Custom error types for specific use cases
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ResourceNotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'ResourceNotFoundError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}
