# Tmux MCP Server - Complete Tools Reference

This document provides comprehensive documentation for all 23 tools available in the tmux-mcp-server, organized by functional category with detailed schemas, examples, and use cases.

## Table of Contents
- [Session Management Tools (6)](#session-management-tools)
- [Log Analysis Tools (5)](#log-analysis-tools)
- [Process Management Tools (6)](#process-management-tools)
- [Error Detection Tools (6)](#error-detection-tools)
- [Usage Patterns](#usage-patterns)
- [Error Handling](#error-handling)
- [Performance Notes](#performance-notes)

---

## Session Management Tools

### 1. `tmux_create_session`

Create a new tmux session with optional windows, panes, and custom configurations.

#### Schema
```typescript
{
  name: string;           // Required: Unique session name
  workingDirectory?: string;  // Optional: Base working directory
  windows?: Array<{
    name: string;         // Window name
    panes?: Array<{
      command?: string;   // Command to run in pane
      workingDirectory?: string; // Pane-specific directory
    }>;
  }>;
  environment?: Record<string, string>; // Environment variables
}
```

#### Example Usage
```typescript
// Create a full-stack development environment
await callTool('tmux_create_session', {
  name: 'fullstack-dev',
  workingDirectory: '/path/to/project',
  windows: [
    {
      name: 'editor',
      panes: [
        { command: 'code .' }
      ]
    },
    {
      name: 'servers',
      panes: [
        { command: 'npm run dev', workingDirectory: './frontend' },
        { command: 'npm run start:dev', workingDirectory: './backend' }
      ]
    },
    {
      name: 'monitoring',
      panes: [
        { command: 'htop' },
        { command: 'tail -f logs/app.log' }
      ]
    }
  ],
  environment: {
    NODE_ENV: 'development',
    DEBUG: '*',
    API_URL: 'http://localhost:3000'
  }
});
```

#### Response
```json
{
  "success": true,
  "session": {
    "name": "fullstack-dev",
    "id": "fullstack-dev-1234567890",
    "windows": 3,
    "panes": 5,
    "created": "2024-01-15T10:30:00.000Z"
  },
  "message": "Session 'fullstack-dev' created successfully with 3 windows"
}
```

### 2. `tmux_create_pane`

Add a new pane to an existing session window.

#### Schema
```typescript
{
  sessionName: string;    // Required: Target session name
  windowIndex?: number;   // Optional: Window index (default: 0)
  command?: string;       // Optional: Command to execute in new pane
}
```

#### Example Usage
```typescript
// Add monitoring pane to existing session
await callTool('tmux_create_pane', {
  sessionName: 'dev-session',
  windowIndex: 1,
  command: 'npm run test:watch'
});
```

### 3. `tmux_execute_command`

Execute a command in a specific pane with output capture.

#### Schema
```typescript
{
  paneId: string;         // Required: Target pane ID (format: "session:window.pane")
  command: string;        // Required: Command to execute
}
```

#### Example Usage
```typescript
// Execute Git status in a specific pane
await callTool('tmux_execute_command', {
  paneId: 'dev-session:0.0',
  command: 'git status'
});

// Restart development server
await callTool('tmux_execute_command', {
  paneId: 'dev-session:servers.1',
  command: 'npm run start:dev'
});
```

### 4. `tmux_list_sessions`

List all active tmux sessions with comprehensive information.

#### Schema
```typescript
{
  includeDetails?: boolean; // Optional: Include detailed session info (default: true)
}
```

#### Example Usage
```typescript
// Get all active sessions
const sessions = await callTool('tmux_list_sessions', {
  includeDetails: true
});

// Quick session list
const quickList = await callTool('tmux_list_sessions', {
  includeDetails: false
});
```

#### Response
```json
{
  "sessions": [
    {
      "name": "dev-session",
      "id": "dev-session-1234567890",
      "attached": true,
      "created": "2024-01-15T10:30:00.000Z",
      "windows": [
        {
          "id": "0",
          "name": "editor",
          "active": true,
          "panes": [
            {
              "id": "dev-session:0.0",
              "title": "editor",
              "command": "code .",
              "pid": 12345,
              "active": true
            }
          ]
        }
      ]
    }
  ],
  "total": 1
}
```

### 5. `tmux_get_session`

Get detailed information about a specific session.

#### Schema
```typescript
{
  sessionName: string;    // Required: Session name to query
}
```

#### Example Usage
```typescript
// Get specific session details
const session = await callTool('tmux_get_session', {
  sessionName: 'fullstack-dev'
});
```

### 6. `tmux_destroy_session`

Clean termination of a tmux session with resource cleanup.

#### Schema
```typescript
{
  sessionName: string;    // Required: Session name to destroy
}
```

#### Example Usage
```typescript
// Destroy session with cleanup
await callTool('tmux_destroy_session', {
  sessionName: 'old-dev-session'
});
```

---

## Log Analysis Tools

### 1. `logs_get_recent`

Retrieve recent log entries from a specific pane with intelligent filtering.

#### Schema
```typescript
{
  paneId: string;         // Required: Source pane ID
  lines?: number;         // Optional: Number of lines (1-1000, default: 50)
}
```

#### Example Usage
```typescript
// Get recent logs from backend server
const logs = await callTool('logs_get_recent', {
  paneId: 'dev-session:backend.0',
  lines: 100
});

// Quick log check
const quickLogs = await callTool('logs_get_recent', {
  paneId: 'dev-session:frontend.0'
});
```

#### Response
```json
{
  "paneId": "dev-session:backend.0",
  "entries": [
    {
      "timestamp": "2024-01-15T10:35:23.456Z",
      "type": "stdout",
      "content": "[INFO] Server started on port 3000"
    },
    {
      "timestamp": "2024-01-15T10:35:24.789Z",
      "type": "stderr",
      "content": "[WARN] Database connection slow"
    }
  ],
  "totalLines": 100,
  "timeRange": {
    "start": "2024-01-15T10:30:00.000Z",
    "end": "2024-01-15T10:35:24.789Z"
  }
}
```

### 2. `logs_summarize`

AI-powered log analysis with error categorization and pattern recognition.

#### Schema
```typescript
{
  paneId: string;         // Required: Source pane ID
  maxLines?: number;      // Optional: Max lines to analyze (100-10000, default: 1000)
}
```

#### Example Usage
```typescript
// Analyze backend logs for issues
const summary = await callTool('logs_summarize', {
  paneId: 'dev-session:backend.0',
  maxLines: 2000
});
```

#### Response
```json
{
  "paneId": "dev-session:backend.0",
  "analysis": {
    "totalLines": 2000,
    "errors": 3,
    "warnings": 12,
    "info": 1985,
    "timeRange": {
      "start": "2024-01-15T09:00:00.000Z",
      "end": "2024-01-15T10:35:24.789Z"
    },
    "errorSamples": [
      {
        "timestamp": "2024-01-15T10:32:15.123Z",
        "message": "Database connection failed: ECONNREFUSED",
        "type": "error",
        "file": "database.js",
        "line": 45
      }
    ],
    "patterns": {
      "database_errors": 2,
      "memory_warnings": 5,
      "performance_info": 15
    },
    "insights": [
      "Database connectivity issues detected",
      "Memory usage trending upward",
      "API response times within normal range"
    ]
  }
}
```

### 3. `logs_search`

Advanced log search with regex patterns and context lines.

#### Schema
```typescript
{
  paneId: string;         // Required: Source pane ID
  pattern: string;        // Required: Regex search pattern
  caseSensitive?: boolean; // Optional: Case sensitivity (default: false)
  maxResults?: number;    // Optional: Max results (1-500, default: 100)
}
```

#### Example Usage
```typescript
// Search for error patterns
const errors = await callTool('logs_search', {
  paneId: 'dev-session:backend.0',
  pattern: '(ERROR|FATAL|Exception)',
  caseSensitive: false,
  maxResults: 50
});

// Search for specific API endpoints
const apiLogs = await callTool('logs_search', {
  paneId: 'dev-session:backend.0',
  pattern: 'POST /api/users.*',
  maxResults: 25
});
```

### 4. `logs_watch`

Start real-time log monitoring with pattern matching and alerts.

#### Schema
```typescript
{
  paneId: string;         // Required: Source pane ID
  duration?: number;      // Optional: Watch duration in seconds (1-300, default: 30)
}
```

#### Example Usage
```typescript
// Monitor logs for 5 minutes
await callTool('logs_watch', {
  paneId: 'dev-session:backend.0',
  duration: 300
});
```

### 5. `logs_generate_report`

Generate comprehensive log analysis reports with trends and insights.

#### Schema
```typescript
{
  sessionName?: string;   // Optional: Analyze entire session
  includeErrorSamples?: boolean; // Optional: Include error examples (default: true)
}
```

#### Example Usage
```typescript
// Generate session-wide log report
const report = await callTool('logs_generate_report', {
  sessionName: 'fullstack-dev',
  includeErrorSamples: true
});
```

---

## Process Management Tools

### 1. `process_list_ports`

List open ports with associated process information.

#### Schema
```typescript
{
  includeProcessInfo?: boolean; // Optional: Include detailed process info (default: true)
  protocol?: 'tcp' | 'udp' | 'all'; // Optional: Protocol filter (default: 'all')
}
```

#### Example Usage
```typescript
// List all open ports with process details
const ports = await callTool('process_list_ports', {
  includeProcessInfo: true,
  protocol: 'tcp'
});
```

#### Response
```json
{
  "ports": [
    {
      "port": 3000,
      "protocol": "tcp",
      "state": "listening",
      "pid": 12345,
      "process": {
        "name": "node",
        "command": "npm run start:dev",
        "cpu": 15.2,
        "memory": 128.5
      }
    }
  ],
  "total": 15,
  "timestamp": "2024-01-15T10:35:24.789Z"
}
```

### 2. `process_multi_kill`

Kill multiple processes matching a pattern with safety checks.

#### Schema
```typescript
{
  pattern: string;        // Required: Process name/command pattern
  dryRun?: boolean;       // Optional: Preview without killing (default: false)
  force?: boolean;        // Optional: Force kill (SIGKILL vs SIGTERM, default: false)
}
```

#### Example Usage
```typescript
// Kill all node processes (dry run first)
const preview = await callTool('process_multi_kill', {
  pattern: 'node.*test',
  dryRun: true
});

// Actually kill the processes
await callTool('process_multi_kill', {
  pattern: 'node.*test',
  force: false
});
```

### 3. `process_monitor`

Real-time process monitoring with resource usage metrics.

#### Schema
```typescript
{
  pattern?: string;       // Optional: Filter by process pattern
  sortBy?: 'cpu' | 'memory' | 'pid' | 'name'; // Optional: Sort criteria (default: 'cpu')
  limit?: number;         // Optional: Max processes to return (1-100, default: 20)
}
```

#### Example Usage
```typescript
// Monitor Node.js processes by CPU usage
const processes = await callTool('process_monitor', {
  pattern: 'node',
  sortBy: 'cpu',
  limit: 10
});

// Monitor all processes by memory
const memoryHogs = await callTool('process_monitor', {
  sortBy: 'memory',
  limit: 15
});
```

### 4. `process_restart`

Intelligently restart processes with health verification.

#### Schema
```typescript
{
  pattern: string;        // Required: Process pattern to restart
  command: string;        // Required: Command to restart with
  waitTime?: number;      // Optional: Wait time between kill and restart (0-30s, default: 2)
}
```

#### Example Usage
```typescript
// Restart development server
await callTool('process_restart', {
  pattern: 'npm run dev',
  command: 'npm run dev',
  waitTime: 3
});
```

### 5. `process_port_monitor`

Monitor specific ports for activity and changes.

#### Schema
```typescript
{
  port: number;           // Required: Port to monitor (1-65535)
  duration?: number;      // Optional: Monitor duration in seconds (5-300, default: 30)
  interval?: number;      // Optional: Check interval in seconds (1-60, default: 5)
}
```

#### Example Usage
```typescript
// Monitor development server port
await callTool('process_port_monitor', {
  port: 3000,
  duration: 300,    // 5 minutes
  interval: 10      // Check every 10 seconds
});
```

### 6. `process_system_load`

Get comprehensive system load information and top processes.

#### Schema
```typescript
{
  includeProcesses?: boolean; // Optional: Include top processes (default: false)
}
```

#### Example Usage
```typescript
// Get system load with top processes
const systemInfo = await callTool('process_system_load', {
  includeProcesses: true
});
```

#### Response
```json
{
  "load": {
    "1min": 1.5,
    "5min": 1.2,
    "15min": 0.9
  },
  "memory": {
    "total": 16777216000,
    "free": 8388608000,
    "used": 8388608000,
    "usage": 50.0
  },
  "uptime": 345600,
  "processes": [
    {
      "pid": 12345,
      "name": "node",
      "cpu": 15.2,
      "memory": 2.5,
      "command": "npm run start:dev"
    }
  ]
}
```

---

## Error Detection Tools

### 1. `errors_watch`

Start real-time error detection for development environments.

#### Schema
```typescript
{
  paneId: string;         // Required: Pane to monitor
  languages?: string[];   // Optional: Language-specific patterns ['javascript', 'typescript', 'python']
  watchDuration?: number; // Optional: Watch duration in seconds (10-3600, default: 300)
}
```

#### Example Usage
```typescript
// Monitor TypeScript development environment
await callTool('errors_watch', {
  paneId: 'dev-session:backend.0',
  languages: ['javascript', 'typescript'],
  watchDuration: 3600 // 1 hour
});

// Monitor Python application
await callTool('errors_watch', {
  paneId: 'python-session:app.0',
  languages: ['python'],
  watchDuration: 1800 // 30 minutes
});
```

### 2. `errors_summary`

Get error statistics, trends, and pattern analysis.

#### Schema
```typescript
{
  paneId?: string;        // Optional: Specific pane ID
  includeWarnings?: boolean; // Optional: Include warnings (default: true)
  timeRange?: 'hour' | 'day' | 'all'; // Optional: Time range (default: 'all')
}
```

#### Example Usage
```typescript
// Get error summary for specific pane
const summary = await callTool('errors_summary', {
  paneId: 'dev-session:backend.0',
  includeWarnings: true,
  timeRange: 'hour'
});

// Get global error summary
const globalSummary = await callTool('errors_summary', {
  includeWarnings: false,
  timeRange: 'day'
});
```

#### Response
```json
{
  "summary": {
    "totalErrors": 15,
    "totalWarnings": 42,
    "timeRange": {
      "start": "2024-01-15T09:35:24.789Z",
      "end": "2024-01-15T10:35:24.789Z"
    },
    "errorsByType": {
      "syntax": 3,
      "runtime": 8,
      "type": 4
    },
    "trends": {
      "errorRate": "decreasing",
      "mostCommonError": "TypeError: Cannot read property",
      "peakErrorTime": "2024-01-15T10:15:00.000Z"
    }
  }
}
```

### 3. `errors_clear`

Clear error cache and reset detection state.

#### Schema
```typescript
{
  paneId?: string;        // Optional: Specific pane (clears all if omitted)
  errorType?: 'errors' | 'warnings' | 'all'; // Optional: Type to clear (default: 'all')
}
```

#### Example Usage
```typescript
// Clear all errors for specific pane
await callTool('errors_clear', {
  paneId: 'dev-session:backend.0',
  errorType: 'all'
});

// Clear only warnings globally
await callTool('errors_clear', {
  errorType: 'warnings'
});
```

### 4. `errors_analyze`

Deep error pattern analysis with actionable insights.

#### Schema
```typescript
{
  paneId: string;         // Required: Pane to analyze
  includePatterns?: boolean; // Optional: Include pattern analysis (default: true)
  includeTrends?: boolean;   // Optional: Include trend analysis (default: true)
}
```

#### Example Usage
```typescript
// Comprehensive error analysis
const analysis = await callTool('errors_analyze', {
  paneId: 'dev-session:backend.0',
  includePatterns: true,
  includeTrends: true
});
```

#### Response
```json
{
  "analysis": {
    "paneId": "dev-session:backend.0",
    "errorPatterns": [
      {
        "pattern": "TypeError: Cannot read property",
        "occurrences": 8,
        "locations": ["auth.js:45", "user.js:123"],
        "suggestion": "Add null checks before property access"
      }
    ],
    "trends": {
      "frequency": "increasing",
      "severity": "medium",
      "correlation": "Database connectivity issues"
    },
    "recommendations": [
      "Implement proper error boundaries",
      "Add input validation",
      "Review database connection handling"
    ]
  }
}
```

### 5. `errors_add_pattern`

Add custom error detection patterns for specific frameworks.

#### Schema
```typescript
{
  name: string;           // Required: Pattern name
  regex: string;          // Required: Regular expression pattern
  type: 'error' | 'warning' | 'info'; // Required: Error type
  language?: string;      // Optional: Target language
  captureGroups: {
    file?: number;        // Optional: Regex group for filename
    line?: number;        // Optional: Regex group for line number
    column?: number;      // Optional: Regex group for column
    message: number;      // Required: Regex group for error message
  };
}
```

#### Example Usage
```typescript
// Add custom API error pattern
await callTool('errors_add_pattern', {
  name: 'custom_api_error',
  regex: 'API Error: (.*?) at (.*?):(\\d+)',
  type: 'error',
  language: 'javascript',
  captureGroups: {
    message: 1,
    file: 2,
    line: 3
  }
});

// Add React-specific warning pattern
await callTool('errors_add_pattern', {
  name: 'react_warning',
  regex: 'Warning: (.*?) in (\\w+)',
  type: 'warning',
  language: 'javascript',
  captureGroups: {
    message: 1
  }
});
```

### 6. `errors_stop_watch`

Stop error monitoring with graceful cleanup.

#### Schema
```typescript
{
  paneId: string;         // Required: Pane to stop monitoring
}
```

#### Example Usage
```typescript
// Stop error monitoring for specific pane
await callTool('errors_stop_watch', {
  paneId: 'dev-session:backend.0'
});
```

---

## Usage Patterns

### Development Environment Setup

```typescript
// 1. Create comprehensive development session
const session = await callTool('tmux_create_session', {
  name: 'project-dev',
  workingDirectory: '/path/to/project',
  windows: [
    { name: 'editor', panes: [{ command: 'code .' }] },
    { name: 'frontend', panes: [{ command: 'npm run dev' }] },
    { name: 'backend', panes: [{ command: 'npm run start:dev' }] },
    { name: 'tests', panes: [{ command: 'npm run test:watch' }] }
  ]
});

// 2. Start comprehensive monitoring
await callTool('errors_watch', {
  paneId: 'project-dev:backend.0',
  languages: ['javascript', 'typescript'],
  watchDuration: 3600
});

// 3. Monitor system resources
const processes = await callTool('process_monitor', {
  pattern: 'node',
  sortBy: 'cpu',
  limit: 10
});

// 4. Check port usage
const ports = await callTool('process_list_ports', {
  includeProcessInfo: true
});
```

### Debugging Workflow

```typescript
// 1. Get recent logs for analysis
const logs = await callTool('logs_get_recent', {
  paneId: 'project-dev:backend.0',
  lines: 200
});

// 2. Search for specific error patterns
const errors = await callTool('logs_search', {
  paneId: 'project-dev:backend.0',
  pattern: '(ERROR|FATAL|Exception)',
  maxResults: 50
});

// 3. Analyze error trends
const analysis = await callTool('errors_analyze', {
  paneId: 'project-dev:backend.0',
  includePatterns: true,
  includeTrends: true
});

// 4. Get comprehensive log report
const report = await callTool('logs_generate_report', {
  sessionName: 'project-dev',
  includeErrorSamples: true
});
```

### Production Monitoring

```typescript
// 1. Monitor system load
const systemLoad = await callTool('process_system_load', {
  includeProcesses: true
});

// 2. Monitor critical ports
await callTool('process_port_monitor', {
  port: 3000,
  duration: 300,
  interval: 10
});

// 3. Get error summary
const errorSummary = await callTool('errors_summary', {
  includeWarnings: false,
  timeRange: 'hour'
});
```

## Error Handling

All tools follow consistent error handling patterns:

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "tool": "tool_name",
    "timestamp": "2024-01-15T10:35:24.789Z"
  }
}
```

### Common Error Codes
- `INVALID_INPUT`: Input validation failed
- `SESSION_NOT_FOUND`: Target session doesn't exist
- `PANE_NOT_FOUND`: Target pane doesn't exist
- `PERMISSION_DENIED`: Insufficient permissions
- `RESOURCE_LIMIT`: Resource limit exceeded
- `TMUX_ERROR`: Tmux command execution failed

## Performance Notes

### Resource Optimization
- **Log Analysis**: Large log files are processed in chunks
- **Process Monitoring**: Results are cached for 5 seconds to reduce system load
- **Error Detection**: Pattern matching is optimized for real-time processing
- **Session Management**: Sessions are cached in memory for fast access

### Recommended Limits
- **Log Lines**: Keep `logs_get_recent` under 1000 lines for best performance
- **Process Monitoring**: Use pattern filtering to reduce result set size
- **Error Watching**: Limit watch duration to prevent resource exhaustion
- **Concurrent Operations**: Limit concurrent tool calls to 10 per session

### Best Practices
1. **Session Naming**: Use descriptive, unique session names
2. **Resource Cleanup**: Always destroy unused sessions
3. **Error Monitoring**: Use appropriate watch durations for your use case
4. **Log Management**: Regularly clear old logs and error caches
5. **Pattern Optimization**: Use specific patterns to reduce processing overhead

---

*This reference covers all 23 production tools available in the tmux-mcp-server. Each tool is designed for reliability, performance, and ease of integration in development workflows.*