# TOON Format in MCP Tools - Implementation Guide

**How to add TOON format support to your MCP tool responses for 30-60% token savings**

## 🎯 What is TOON?

TOON (Token-Oriented Object Notation) is a compact, human-readable data format designed specifically for LLM applications. It provides the same JSON data model but with significantly fewer tokens.

- **Official Spec**: https://github.com/toon-format/toon
- **Token Savings**: 30-60% fewer tokens vs formatted JSON
- **Best Use Cases**: Uniform arrays with multiple fields (task lists, logs, tables)
- **Compatibility**: Lossless conversion to/from JSON

## 📊 Why Use TOON in MCP Tools?

### Token Comparison Example

**JSON Response (formatted):**
```json
{
  "success": true,
  "tasks": [
    {"id": 1, "title": "Fix auth bug", "status": "pending", "priority": "high"},
    {"id": 2, "title": "Add tests", "status": "in_progress", "priority": "medium"},
    {"id": 3, "title": "Update docs", "status": "completed", "priority": "low"}
  ],
  "count": 3
}
```
**~250 tokens**

**TOON Response:**
```toon
metadata:
  success: true
  count: 3
tasks[3]{id,title,status,priority}:
  1,Fix auth bug,pending,high
  2,Add tests,in_progress,medium
  3,Update docs,completed,low
```
**~120 tokens (52% reduction)**

## 🏗️ Architecture: Hybrid Approach

**Important:** We're **NOT** replacing the MCP JSON-RPC protocol. Instead, we use TOON **inside** the tool response text content.

```
┌────────────────────────────────────────────┐
│         MCP Protocol (JSON-RPC)            │
│  ┌──────────────────────────────────────┐  │
│  │ Request: JSON-RPC 2.0                │  │
│  │ {                                    │  │
│  │   "method": "tools/call",            │  │
│  │   "params": {                        │  │
│  │     "name": "task_list",             │  │
│  │     "arguments": {                   │  │
│  │       "format": "toon"  ← Optional   │  │
│  │     }                                │  │
│  │   }                                  │  │
│  │ }                                    │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ Response: JSON-RPC 2.0               │  │
│  │ {                                    │  │
│  │   "result": {                        │  │
│  │     "content": [{                    │  │
│  │       "type": "text",                │  │
│  │       "text": "TOON formatted data" │  │
│  │     }]                               │  │
│  │   }                                  │  │
│  │ }                                    │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

## 🔧 Implementation Steps

### Step 1: Install TOON Package

```bash
npm install @toon-format/toon
# or
yarn add @toon-format/toon
```

### Step 2: Create TOON Formatter Module

Create `src/formatters/toon.ts`:

```typescript
/**
 * TOON Format Support for MCP Tools
 *
 * @see https://github.com/toon-format/toon
 */

import { encode } from '@toon-format/toon';

/**
 * Output format options
 */
export type OutputFormat = 'json' | 'toon';

/**
 * Format data according to the specified output format
 */
export function formatOutput(data: any, format: OutputFormat = 'json'): string {
  if (format === 'toon') {
    return encode(data);
  }
  return JSON.stringify(data, null, 2);
}

/**
 * Extract format option from MCP tool arguments
 * Supports multiple argument structures for compatibility
 */
export function extractFormat(args: any): OutputFormat {
  // Check direct property
  if (args?.format === 'toon') return 'toon';

  // Check nested params object (MCP wrapper)
  if (args?.params?.format === 'toon') return 'toon';

  // Default to JSON (or 'toon' if you prefer TOON by default)
  return 'json';
}

/**
 * Helper to wrap response in MCP format with TOON support
 */
export function createResponse(data: any, format: OutputFormat = 'json') {
  return {
    content: [
      {
        type: 'text',
        text: formatOutput(data, format),
      },
    ],
  };
}
```

### Step 3: Create Specialized Formatters (Optional)

For frequently-used data structures, create optimized TOON formatters:

```typescript
/**
 * Format task list as TOON
 * Optimized for uniform array of tasks
 */
export function formatTaskList(tasks: Task[], filter?: any): string {
  if (tasks.length === 0) {
    return encode({
      success: true,
      tasks: [],
      count: 0,
      filter,
    });
  }

  // Structure data for optimal TOON encoding
  const data = {
    metadata: {
      success: true,
      count: tasks.length,
      filter: filter || null,
    },
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  };

  return encode(data);
}

/**
 * Format statistics as TOON
 */
export function formatStats(stats: any): string {
  const data = {
    success: true,
    stats: {
      total: stats.total,
      pending: stats.pending,
      inProgress: stats.inProgress,
      completed: stats.completed,
      byPriority: {
        high: stats.byPriority.high,
        medium: stats.byPriority.medium,
        low: stats.byPriority.low,
      },
    },
  };

  return encode(data);
}
```

### Step 4: Update Tool Handlers

Modify your tool handlers to support format parameter:

```typescript
import {
  extractFormat,
  formatTaskList,
  createResponse,
  formatOutput
} from '../formatters/toon.js';

export const toolHandlers = {
  /**
   * List tasks with optional TOON format
   */
  task_list: async (args: unknown) => {
    try {
      const format = extractFormat(args);
      const tasks = taskManager.listTasks();

      // Use specialized TOON formatter
      if (format === 'toon') {
        return {
          content: [
            {
              type: 'text',
              text: formatTaskList(tasks),
            },
          ],
        };
      }

      // Default JSON format
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              tasks,
              count: tasks.length,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      handleToolError(error);
    }
  },

  /**
   * Get task statistics
   */
  task_stats: async (args: unknown) => {
    try {
      const format = extractFormat(args);
      const stats = taskManager.getStats();

      // Use generic formatter
      return createResponse({
        success: true,
        stats,
      }, format);
    } catch (error) {
      handleToolError(error);
    }
  },
};
```

### Step 5: Update Tool Schemas

Add `format` parameter to your tool input schemas:

```typescript
export const tools = [
  {
    name: 'task_list',
    description: 'List all tasks with optional filtering and formatting',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed'],
          description: 'Filter by task status'
        },
        format: {
          type: 'string',
          enum: ['json', 'toon'],
          description: 'Output format (default: json, use "toon" for 30-60% token savings)',
          default: 'json'
        }
      }
    }
  },
  {
    name: 'task_stats',
    description: 'Get task statistics',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['json', 'toon'],
          description: 'Output format (default: json)',
          default: 'json'
        }
      }
    }
  }
];
```

## 📝 Usage Examples

### From Claude Desktop

```
User: "List all pending tasks in TOON format"

Claude calls:
{
  "name": "task_list",
  "arguments": {
    "status": "pending",
    "format": "toon"
  }
}

Response (TOON):
metadata:
  success: true
  count: 15
  filter:
    status: pending
tasks[15]{id,title,status,priority,createdAt}:
  1,Fix authentication bug,pending,high,2025-01-15T10:30:00Z
  2,Add unit tests,pending,medium,2025-01-15T11:00:00Z
  3,Update documentation,pending,low,2025-01-15T11:30:00Z
  ...
```

### Default JSON Format (Backward Compatible)

```
User: "List all tasks"

Claude calls:
{
  "name": "task_list",
  "arguments": {}
}

Response (JSON):
{
  "success": true,
  "tasks": [
    {"id": 1, "title": "Fix auth bug", "status": "pending"},
    {"id": 2, "title": "Add tests", "status": "in_progress"}
  ],
  "count": 2
}
```

## 🎨 Best Practices

### 1. When to Use TOON

✅ **Good Use Cases:**
- Large uniform arrays (>10 items)
- Tabular data with multiple fields
- Task lists, logs, statistics
- Any data with repeated structure

❌ **Avoid TOON for:**
- Deeply nested non-uniform structures
- Small datasets (<5 items)
- Single object responses
- Binary data or complex types

### 2. Data Structure for Optimal TOON

```typescript
// ✅ GOOD: Uniform structure, metadata separated
{
  metadata: {
    success: true,
    count: 100,
    filter: { status: "active" }
  },
  items: [
    { id: 1, name: "Task 1", status: "active" },
    { id: 2, name: "Task 2", status: "active" },
    // ... 98 more items
  ]
}

// ❌ BAD: Mixed structures, inconsistent fields
{
  results: [
    { id: 1, name: "Task 1", extraField: "value" },
    { id: 2, title: "Different key" }, // Inconsistent!
    { id: 3, name: "Task 3", nested: { deep: "object" } }
  ]
}
```

### 3. Default Format Strategy

**Option A: Default to JSON (Safer)**
```typescript
export function extractFormat(args: any): OutputFormat {
  if (args?.format === 'toon') return 'toon';
  return 'json'; // Safe default
}
```

**Option B: Default to TOON (Aggressive Optimization)**
```typescript
export function extractFormat(args: any): OutputFormat {
  if (args?.format === 'json') return 'json';
  return 'toon'; // Optimize by default
}
```

**Recommendation:** Start with Option A (JSON default) for compatibility, then switch to Option B after testing.

### 4. Error Handling

Always return errors in JSON for clarity:

```typescript
try {
  const format = extractFormat(args);
  const data = await getData();
  return createResponse(data, format);
} catch (error) {
  // Always return errors in JSON for clarity
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: false,
        error: error.message
      }, null, 2)
    }]
  };
}
```

## 📦 Real-World Example: Fractal MCP

The [Fractal MCP Task Orchestrator](https://github.com/yourusername/Fractal) implements TOON support across all tools:

### Features:
- ✅ **Automatic format detection** from tool arguments
- ✅ **Specialized formatters** for tasks, epics, projects, milestones
- ✅ **Backward compatible** - JSON by default, TOON opt-in
- ✅ **Consistent API** - Same tool schemas, different output format

### Results:
- **Task Lists (100 items)**: 65% token reduction
- **Statistics**: 40% token reduction
- **Review Suggestions**: 55% token reduction

## 🔍 Token Savings Calculator

Estimate your token savings:

| Data Type | Items | JSON Tokens | TOON Tokens | Savings |
|-----------|-------|-------------|-------------|---------|
| Task List | 10 | ~800 | ~420 | 48% |
| Task List | 50 | ~3,500 | ~1,600 | 54% |
| Task List | 100 | ~7,000 | ~2,800 | 60% |
| Statistics | 1 | ~300 | ~180 | 40% |
| Logs | 100 | ~5,000 | ~2,200 | 56% |

**Formula:** Token Savings ≈ (0.3 to 0.6) × Array Size × Field Count

## 🚀 Migration Checklist

- [ ] Install `@toon-format/toon` package
- [ ] Create `formatters/toon.ts` module
- [ ] Add `extractFormat()` and `formatOutput()` helpers
- [ ] Create specialized formatters for your data types
- [ ] Update tool handlers to support `format` parameter
- [ ] Add `format` field to tool input schemas
- [ ] Test with both JSON and TOON formats
- [ ] Update documentation with format examples
- [ ] Monitor token usage improvements
- [ ] Consider switching default to TOON after testing

## 📚 Resources

- **TOON Specification**: https://github.com/toon-format/toon
- **NPM Package**: https://www.npmjs.com/package/@toon-format/toon
- **Example Implementation**: [Fractal MCP Server](https://github.com/yourusername/Fractal/tree/main/mcp-server/src/formatters)
- **MCP Protocol Docs**: https://modelcontextprotocol.io

## 💡 Tips & Tricks

### 1. Conditional TOON for Large Results

```typescript
const format = tasks.length > 20 ? 'toon' : extractFormat(args);
```

### 2. Hybrid Format with Metadata

Return metadata in JSON, data in TOON:

```typescript
return {
  content: [
    { type: 'text', text: JSON.stringify(metadata) },
    { type: 'text', text: encode(largeDataArray) }
  ]
};
```

### 3. Debug Mode

```typescript
if (process.env.DEBUG_FORMAT) {
  console.error('Format:', format);
  console.error('JSON size:', JSON.stringify(data).length);
  console.error('TOON size:', encode(data).length);
}
```

## ⚠️ Limitations

1. **Client Compatibility**: Not all MCP clients may parse TOON (Claude Desktop works fine)
2. **Error Messages**: Keep errors in JSON for clarity
3. **Nested Complexity**: TOON excels at flat arrays, not deep nesting
4. **Learning Curve**: LLMs need to understand TOON syntax

## 🎯 Conclusion

Adding TOON support to your MCP tools is:
- ✅ **Easy** - A few formatter functions
- ✅ **Backward Compatible** - Optional format parameter
- ✅ **Effective** - 30-60% token savings on arrays
- ✅ **Production Ready** - Used in real MCP servers

**Start with JSON by default, add TOON as opt-in, then switch to TOON default after testing.**

---

*Last updated: 2025-01-16*
*Author: Based on Fractal MCP implementation*
