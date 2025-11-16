#!/usr/bin/env node
/**
 * TOON Format Example for MCP Tools
 *
 * Demonstrates how to add TOON format support to tool responses
 * for 30-60% token savings on array-heavy data.
 *
 * See: /TOON_IN_MCP_TOOLS.md for complete implementation guide
 */

import { encode } from '@toon-format/toon';

// ============================================================================
// EXAMPLE DATA
// ============================================================================

interface Task {
  id: number;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

const SAMPLE_TASKS: Task[] = [
  { id: 1, title: 'Fix authentication bug', status: 'pending', priority: 'high', createdAt: '2025-01-15T10:30:00Z' },
  { id: 2, title: 'Add unit tests', status: 'in_progress', priority: 'medium', createdAt: '2025-01-15T11:00:00Z' },
  { id: 3, title: 'Update documentation', status: 'pending', priority: 'low', createdAt: '2025-01-15T11:30:00Z' },
  { id: 4, title: 'Deploy to staging', status: 'completed', priority: 'high', createdAt: '2025-01-14T09:00:00Z' },
  { id: 5, title: 'Code review PR #123', status: 'in_progress', priority: 'high', createdAt: '2025-01-15T08:00:00Z' },
  { id: 6, title: 'Refactor user service', status: 'pending', priority: 'medium', createdAt: '2025-01-15T12:00:00Z' },
  { id: 7, title: 'Add error handling', status: 'pending', priority: 'high', createdAt: '2025-01-15T13:00:00Z' },
  { id: 8, title: 'Update dependencies', status: 'completed', priority: 'low', createdAt: '2025-01-13T14:00:00Z' },
  { id: 9, title: 'Fix mobile layout', status: 'in_progress', priority: 'medium', createdAt: '2025-01-15T09:30:00Z' },
  { id: 10, title: 'Performance optimization', status: 'pending', priority: 'high', createdAt: '2025-01-15T10:00:00Z' },
];

// ============================================================================
// FORMATTERS
// ============================================================================

/**
 * Format as JSON (traditional approach)
 */
function formatAsJSON(tasks: Task[]): string {
  return JSON.stringify(
    {
      success: true,
      tasks,
      count: tasks.length,
    },
    null,
    2
  );
}

/**
 * Format as TOON (optimized approach)
 */
function formatAsTOON(tasks: Task[]): string {
  const data = {
    metadata: {
      success: true,
      count: tasks.length,
    },
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt,
    })),
  };

  return encode(data);
}

/**
 * Calculate token count (approximation)
 * Real tokenizers use different algorithms, this is simplified
 */
function estimateTokens(text: string): number {
  // Rough approximation: ~4 characters per token on average
  return Math.ceil(text.length / 4);
}

// ============================================================================
// COMPARISON DEMO
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('  TOON Format vs JSON - Token Savings Comparison');
console.log('═══════════════════════════════════════════════════════════════\n');

// Generate both formats
const jsonOutput = formatAsJSON(SAMPLE_TASKS);
const toonOutput = formatAsTOON(SAMPLE_TASKS);

// Calculate sizes
const jsonSize = jsonOutput.length;
const toonSize = toonOutput.length;
const jsonTokens = estimateTokens(jsonOutput);
const toonTokens = estimateTokens(toonOutput);
const savings = ((jsonSize - toonSize) / jsonSize * 100).toFixed(1);
const tokenSavings = ((jsonTokens - toonTokens) / jsonTokens * 100).toFixed(1);

// Display JSON output
console.log('📄 JSON FORMAT (Traditional)');
console.log('─────────────────────────────────────────────────────────────');
console.log(jsonOutput);
console.log(`\n📊 Size: ${jsonSize} bytes`);
console.log(`🎫 Estimated Tokens: ${jsonTokens}`);
console.log('─────────────────────────────────────────────────────────────\n\n');

// Display TOON output
console.log('🎨 TOON FORMAT (Optimized)');
console.log('─────────────────────────────────────────────────────────────');
console.log(toonOutput);
console.log(`\n📊 Size: ${toonSize} bytes`);
console.log(`🎫 Estimated Tokens: ${toonTokens}`);
console.log('─────────────────────────────────────────────────────────────\n\n');

// Display savings
console.log('💰 SAVINGS SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Byte Reduction:  ${jsonSize - toonSize} bytes (${savings}% smaller)`);
console.log(`Token Reduction: ${jsonTokens - toonTokens} tokens (${tokenSavings}% fewer)`);
console.log(`\n✨ Result: TOON format achieves ${tokenSavings}% token savings!`);
console.log('═══════════════════════════════════════════════════════════════\n');

// ============================================================================
// MCP TOOL HANDLER EXAMPLE
// ============================================================================

console.log('📝 MCP TOOL HANDLER EXAMPLE');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`// Before: JSON only
const toolHandlers = {
  task_list: async (args: unknown) => {
    const tasks = getTasks();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ tasks, count: tasks.length }, null, 2)
      }]
    };
  }
};

// After: TOON support with format parameter
const toolHandlers = {
  task_list: async (args: unknown) => {
    const format = args?.format || 'json'; // Default to JSON
    const tasks = getTasks();

    if (format === 'toon') {
      return {
        content: [{
          type: 'text',
          text: formatAsTOON(tasks)
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ tasks, count: tasks.length }, null, 2)
      }]
    };
  }
};

// Tool schema with format parameter
{
  name: 'task_list',
  description: 'List all tasks',
  inputSchema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        enum: ['json', 'toon'],
        description: 'Output format (default: json, use toon for ${tokenSavings}% token savings)',
        default: 'json'
      }
    }
  }
}
`);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('📚 For complete implementation guide, see:');
console.log('   /TOON_IN_MCP_TOOLS.md');
console.log('═══════════════════════════════════════════════════════════════\n');
