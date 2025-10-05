#!/usr/bin/env node

/**
 * Simple TODO MCP Server
 * Validation test following HOW2MCP documentation exactly
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// ============================================================================
// SCHEMAS - Following 2025 Pattern from documentation
// ============================================================================

const AddTaskSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').describe('Task title'),
  description: z.string().optional().describe('Task description'),
  priority: z.enum(['low', 'medium', 'high']).default('medium').describe('Task priority'),
});

const ListTasksSchema = z.object({
  status: z.enum(['all', 'pending', 'completed']).default('all').describe('Filter by status'),
  priority: z.enum(['all', 'low', 'medium', 'high']).default('all').describe('Filter by priority'),
});

const CompleteTaskSchema = z.object({
  taskId: z.number().int().min(1).describe('Task ID to complete'),
});

const DeleteTaskSchema = z.object({
  taskId: z.number().int().min(1).describe('Task ID to delete'),
});

// ============================================================================
// IN-MEMORY STORAGE - Simple implementation
// ============================================================================

interface Task {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
}

let tasks: Task[] = [];
let nextId = 1;

// ============================================================================
// MCP SERVER - Following documentation pattern exactly
// ============================================================================

class TodoMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: 'todo-mcp-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
  }

  async initialize(): Promise<void> {
    // Register tool handlers
    this.registerToolHandlers();

    // Log initialization
    console.error('TODO MCP Server initialized successfully');
  }

  private registerToolHandlers(): void {
    // Tool call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'add-task':
            return await this.handleAddTask(args);
          case 'list-tasks':
            return await this.handleListTasks(args);
          case 'complete-task':
            return await this.handleCompleteTask(args);
          case 'delete-task':
            return await this.handleDeleteTask(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error in tool ${name}:`, error);
        throw error;
      }
    });

    // Tool list handler - Following 2025 JSON Schema pattern
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'add-task',
            description: 'Add a new task to the TODO list',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Task title',
                },
                description: {
                  type: 'string',
                  description: 'Task description',
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  description: 'Task priority',
                  default: 'medium',
                },
              },
              required: ['title'],
            },
          },
          {
            name: 'list-tasks',
            description: 'List all tasks with optional filters',
            inputSchema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['all', 'pending', 'completed'],
                  description: 'Filter by status',
                  default: 'all',
                },
                priority: {
                  type: 'string',
                  enum: ['all', 'low', 'medium', 'high'],
                  description: 'Filter by priority',
                  default: 'all',
                },
              },
            },
          },
          {
            name: 'complete-task',
            description: 'Mark a task as completed',
            inputSchema: {
              type: 'object',
              properties: {
                taskId: {
                  type: 'number',
                  description: 'Task ID to complete',
                },
              },
              required: ['taskId'],
            },
          },
          {
            name: 'delete-task',
            description: 'Delete a task from the list',
            inputSchema: {
              type: 'object',
              properties: {
                taskId: {
                  type: 'number',
                  description: 'Task ID to delete',
                },
              },
              required: ['taskId'],
            },
          },
        ],
      };
    });
  }

  // ============================================================================
  // TOOL HANDLERS - Following best practices
  // ============================================================================

  private async handleAddTask(args: any) {
    const validated = AddTaskSchema.parse(args);

    const task: Task = {
      id: nextId++,
      title: validated.title,
      description: validated.description,
      priority: validated.priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    tasks.push(task);

    console.error(`Task added: ${task.id} - ${task.title}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            task,
            message: 'Task added successfully',
          }, null, 2),
        },
      ],
    };
  }

  private async handleListTasks(args: any) {
    const validated = ListTasksSchema.parse(args);

    let filteredTasks = tasks;

    // Filter by status
    if (validated.status !== 'all') {
      filteredTasks = filteredTasks.filter(t => t.status === validated.status);
    }

    // Filter by priority
    if (validated.priority !== 'all') {
      filteredTasks = filteredTasks.filter(t => t.priority === validated.priority);
    }

    console.error(`Listed ${filteredTasks.length} tasks (status: ${validated.status}, priority: ${validated.priority})`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            total: filteredTasks.length,
            filters: {
              status: validated.status,
              priority: validated.priority,
            },
            tasks: filteredTasks,
          }, null, 2),
        },
      ],
    };
  }

  private async handleCompleteTask(args: any) {
    const validated = CompleteTaskSchema.parse(args);

    const task = tasks.find(t => t.id === validated.taskId);

    if (!task) {
      throw new McpError(ErrorCode.InvalidParams, `Task ${validated.taskId} not found`);
    }

    if (task.status === 'completed') {
      throw new McpError(ErrorCode.InvalidParams, `Task ${validated.taskId} is already completed`);
    }

    task.status = 'completed';
    task.completedAt = new Date().toISOString();

    console.error(`Task completed: ${task.id} - ${task.title}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            task,
            message: 'Task completed successfully',
          }, null, 2),
        },
      ],
    };
  }

  private async handleDeleteTask(args: any) {
    const validated = DeleteTaskSchema.parse(args);

    const index = tasks.findIndex(t => t.id === validated.taskId);

    if (index === -1) {
      throw new McpError(ErrorCode.InvalidParams, `Task ${validated.taskId} not found`);
    }

    const [deletedTask] = tasks.splice(index, 1);

    console.error(`Task deleted: ${deletedTask.id} - ${deletedTask.title}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            deletedTask,
            message: 'Task deleted successfully',
          }, null, 2),
        },
      ],
    };
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('TODO MCP Server started with stdio transport');
  }

  async shutdown(): Promise<void> {
    console.error('Shutting down TODO MCP Server...');
    // Cleanup resources if needed
  }
}

// ============================================================================
// MAIN - Following documentation pattern
// ============================================================================

async function main(): Promise<void> {
  const server = new TodoMCPServer();

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
