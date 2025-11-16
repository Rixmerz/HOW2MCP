#!/usr/bin/env node

import { encode, decode } from '@toon-format/toon';
import * as readline from 'readline';

// ============================================================================
// HARDCODED DATA
// ============================================================================

const WEATHER_DATA: Record<string, { temp: number; condition: string; humidity: number }> = {
  'New York': { temp: 72, condition: 'Sunny', humidity: 65 },
  'London': { temp: 58, condition: 'Rainy', humidity: 82 },
  'Tokyo': { temp: 68, condition: 'Cloudy', humidity: 70 },
  'Paris': { temp: 63, condition: 'Partly Cloudy', humidity: 68 },
  'Sydney': { temp: 75, condition: 'Clear', humidity: 60 }
};

const TOOLS = [
  {
    name: 'get_weather',
    description: 'Get current weather information for a city',
    inputSchema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'City name (e.g., New York, London, Tokyo, Paris, Sydney)'
        }
      },
      required: ['city']
    }
  }
];

// ============================================================================
// TOON MCP SERVER
// ============================================================================

class ToonMCPServer {
  private rl: readline.Interface;

  constructor() {
    // Set up readline interface for stdin/stdout
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr, // Debug/error messages go to stderr
      terminal: false
    });

    this.log('TOON MCP Server starting...');
  }

  private log(message: string): void {
    // All debug logs go to stderr so they don't interfere with TOON protocol on stdout
    console.error(`[TOON-MCP] ${message}`);
  }

  private async handleRequest(request: any): Promise<any> {
    const method = request.method;
    this.log(`Handling method: ${method}`);

    switch (method) {
      case 'initialize':
        return this.handleInitialize(request);

      case 'initialized':
        // Acknowledge initialization complete
        return null; // No response needed for notification

      case 'tools/list':
        return this.handleToolsList();

      case 'tools/call':
        return this.handleToolCall(request.params);

      case 'ping':
        return { status: 'pong' };

      default:
        return {
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          }
        };
    }
  }

  private handleInitialize(request: any): any {
    this.log('Initialize request received');
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'toon-mcp-server',
        version: '1.0.0'
      }
    };
  }

  private handleToolsList(): any {
    this.log('Tools list requested');
    return {
      tools: TOOLS
    };
  }

  private handleToolCall(params: any): any {
    const toolName = params?.name;
    const args = params?.arguments || {};

    this.log(`Tool call: ${toolName} with args: ${JSON.stringify(args)}`);

    if (toolName === 'get_weather') {
      return this.getWeather(args.city);
    }

    return {
      error: {
        code: -32602,
        message: `Unknown tool: ${toolName}`
      }
    };
  }

  private getWeather(city: string): any {
    const weather = WEATHER_DATA[city];

    if (!weather) {
      const availableCities = Object.keys(WEATHER_DATA).join(', ');
      return {
        content: [
          {
            type: 'text',
            text: `City "${city}" not found. Available cities: ${availableCities}`
          }
        ]
      };
    }

    // Return weather data in TOON-friendly format
    const weatherText = `Weather in ${city}:\n` +
                       `Temperature: ${weather.temp}°F\n` +
                       `Condition: ${weather.condition}\n` +
                       `Humidity: ${weather.humidity}%`;

    return {
      content: [
        {
          type: 'text',
          text: weatherText
        }
      ]
    };
  }

  public start(): void {
    this.log('Server ready to accept TOON requests on stdin');
    this.log('Send TOON messages followed by an empty line to process');

    let buffer = '';

    this.rl.on('line', async (line: string) => {
      try {
        // Empty line means end of TOON message
        if (!line.trim()) {
          if (!buffer.trim()) {
            return; // Skip multiple empty lines
          }

          this.log(`Received complete TOON message`);
          this.log(`Buffer: ${buffer.substring(0, 200)}...`);

          // Parse TOON message
          const request = decode(buffer) as any;
          this.log(`Parsed request: ${JSON.stringify(request).substring(0, 100)}...`);

          // Clear buffer for next message
          buffer = '';

          // Handle the request
          const result = await this.handleRequest(request);

          // Build response
          let response: any;
          if (result === null) {
            // Notification - no response
            return;
          } else if (result.error) {
            response = {
              jsonrpc: '2.0',
              id: request?.id ?? null,
              error: result.error
            };
          } else {
            response = {
              jsonrpc: '2.0',
              id: request?.id ?? null,
              result: result
            };
          }

          // Encode response → TOON
          const toonResponse = encode(response);
          this.log(`Sending TOON response`);

          // Write TOON to stdout with empty line delimiter
          process.stdout.write(toonResponse + '\n\n');

        } else {
          // Accumulate lines for multi-line TOON messages
          buffer += line + '\n';
        }

      } catch (error) {
        this.log(`Error processing request: ${error}`);

        // Clear buffer on error
        buffer = '';

        // Send error response in TOON format
        const errorResponse = {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: `Parse error: ${error instanceof Error ? error.message : String(error)}`
          }
        };

        const toonError = encode(errorResponse);
        process.stdout.write(toonError + '\n\n');
      }
    });

    this.rl.on('close', () => {
      this.log('stdin closed, shutting down server');
      process.exit(0);
    });
  }
}

// ============================================================================
// START SERVER
// ============================================================================

const server = new ToonMCPServer();
server.start();
