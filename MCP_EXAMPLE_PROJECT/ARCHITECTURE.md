# Tmux MCP Server Architecture

This document provides a comprehensive architectural analysis of the tmux-mcp-server, demonstrating production-grade MCP server design patterns and architectural principles.

## Table of Contents
- [Architectural Overview](#architectural-overview)
- [Core Components](#core-components)
- [Tool Organization](#tool-organization)
- [Data Flow](#data-flow)
- [Event-Driven Architecture](#event-driven-architecture)
- [State Management](#state-management)
- [Security Architecture](#security-architecture)
- [Performance Considerations](#performance-considerations)
- [Cross-MCP Integration](#cross-mcp-integration)

## Architectural Overview

The tmux-mcp-server follows a **modular, event-driven architecture** designed for:
- **Scalability**: Component separation enables independent scaling
- **Maintainability**: Clear boundaries and responsibilities
- **Extensibility**: Plugin-style tool architecture
- **Reliability**: Comprehensive error handling and recovery
- **Performance**: Efficient resource management and monitoring

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Client (Claude)                      │
└─────────────────────────┬───────────────────────────────────┘
                         │ JSON-RPC 2.0 / stdio
┌─────────────────────────▼───────────────────────────────────┐
│                 TmuxMCPServer                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │   Tool Router   │ │  Event Handler  │ │ Error Handler │ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                         │
┌─────────────────────────▼───────────────────────────────────┐
│                    Core Components                          │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│ │TmuxManager   │ │LogAnalyzer   │ │ProcessMonitor        │ │
│ └──────────────┘ └──────────────┘ └──────────────────────┘ │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│ │ErrorWatcher  │ │McpIntegrator │ │SessionSerializer     │ │
│ └──────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                         │
┌─────────────────────────▼───────────────────────────────────┐
│                 Utility & Storage Layer                     │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│ │Logger        │ │SessionStore  │ │CommandEscaper        │ │
│ └──────────────┘ └──────────────┘ └──────────────────────┘ │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│ │PaneIdResolver│ │FrameworkDet. │ │FileWatcher           │ │
│ └──────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. TmuxMCPServer (Main Server Class)

**Location**: `src/server.ts`
**Responsibility**: Server orchestration, component initialization, and lifecycle management

```typescript
export class TmuxMCPServer {
  private server: Server;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private tmuxManager: TmuxManager;
  private logAnalyzer: LogAnalyzer;
  private processMonitor: ProcessMonitor;
  private errorWatcher: ErrorWatcher;
  private sessionStore: SessionStore;
  private sessionSerializer: SessionSerializer;
  private mcpIntegrator: McpIntegrator;
  private frameworkDetector: FrameworkDetector;
}
```

**Key Features**:
- **Configuration Management**: Environment-based configuration with sensible defaults
- **Component Orchestration**: Manages initialization and shutdown of all components
- **Error Recovery**: Graceful error handling and service recovery
- **Health Monitoring**: Component health checks and status reporting

### 2. TmuxManager (Core Session Management)

**Location**: `src/core/tmux-manager.ts`
**Responsibility**: Tmux session lifecycle management and command execution

```typescript
export class TmuxManager {
  private options: TmuxManagerOptions;
  private commandEscaper: CommandEscaper;
  private paneIdResolver: PaneIdResolver;
  private frameworkDetector: FrameworkDetector;

  async createSession(config: SessionConfig): Promise<TmuxSession>;
  async executeCommand(paneId: string, command: string): Promise<void>;
  async destroySession(sessionName: string): Promise<void>;
}
```

**Architecture Highlights**:
- **Command Security**: All commands passed through CommandEscaper for safety
- **ID Management**: Structured pane ID system with PaneIdResolver
- **Framework Integration**: Automatic detection of development frameworks
- **Resource Tracking**: Session resource monitoring and cleanup

### 3. LogAnalyzer (Intelligent Log Processing)

**Location**: `src/core/log-analyzer.ts`
**Responsibility**: Log parsing, analysis, and pattern recognition

**Capabilities**:
- **Pattern Recognition**: Identifies error patterns, warnings, and critical events
- **Context Analysis**: Understands log context and relationships
- **Trend Analysis**: Identifies patterns over time
- **Smart Summarization**: Generates actionable log summaries

### 4. ProcessMonitor (System Resource Monitoring)

**Location**: `src/core/process-monitor.ts`
**Responsibility**: System process and resource monitoring

**Features**:
- **Real-time Monitoring**: Continuous process and resource tracking
- **Port Management**: Open port identification and monitoring
- **Resource Metrics**: CPU, memory, and system load tracking
- **Health Assessment**: Process health evaluation and alerting

### 5. ErrorWatcher (Real-time Error Detection)

**Location**: `src/core/error-watcher.ts`
**Responsibility**: Language-aware error detection and classification

**Architecture**:
- **File Watching**: Uses chokidar for efficient file monitoring
- **Pattern Engine**: Extensible error pattern recognition system
- **Language Detection**: Framework-specific error pattern matching
- **Event Emission**: EventEmitter-based error notifications

### 6. McpIntegrator (Cross-MCP Coordination)

**Location**: `src/core/mcp-integrator.ts`
**Responsibility**: Intelligent coordination with other MCP servers

```typescript
export class McpIntegrator extends EventEmitter {
  async handleError(error: ErrorEntry): Promise<void>;
  async triggerSequentialAnalysis(paneId: string, data: any): Promise<void>;
  async triggerContext7Lookup(library: string): Promise<void>;
  async triggerRikaTesting(port: number): Promise<void>;
}
```

**Integration Patterns**:
- **Sequential Thinking**: Triggers for complex error analysis
- **Context7**: Framework-specific documentation lookup
- **RIKA**: UI testing automation triggers
- **Conditional Logic**: Smart triggering based on context and thresholds

## Tool Organization

### Tool Categories and Structure

The 23 tools are organized into 4 logical categories, each with its own module:

#### 1. Session Management Tools (`session-tools.ts`)
```typescript
// Tools: tmux_create_session, tmux_create_pane, tmux_execute_command,
//        tmux_list_sessions, tmux_get_session, tmux_destroy_session

export const CreateSessionSchema = z.object({
  name: z.string().min(1),
  workingDirectory: z.string().optional(),
  windows: z.array(WindowSchema).optional(),
  environment: z.record(z.string()).optional(),
});

export async function handleCreateSession(args: any, context: ToolContext) {
  const validated = CreateSessionSchema.parse(args);
  // Implementation with comprehensive error handling
}
```

#### 2. Log Analysis Tools (`log-tools.ts`)
```typescript
// Tools: logs_get_recent, logs_summarize, logs_search,
//        logs_watch, logs_generate_report

export const GetRecentLogsSchema = z.object({
  paneId: z.string().min(1),
  lines: z.number().int().min(1).max(1000).default(50),
});
```

#### 3. Process Management Tools (`process-tools.ts`)
```typescript
// Tools: process_list_ports, process_multi_kill, process_monitor,
//        process_restart, process_port_monitor, process_system_load

export const ProcessMonitorSchema = z.object({
  pattern: z.string().optional(),
  sortBy: z.enum(['cpu', 'memory', 'pid', 'name']).default('cpu'),
  limit: z.number().int().min(1).max(100).default(20),
});
```

#### 4. Error Detection Tools (`error-tools.ts`)
```typescript
// Tools: errors_watch, errors_summary, errors_clear,
//        errors_analyze, errors_add_pattern, errors_stop_watch

export const ErrorWatchSchema = z.object({
  paneId: z.string().min(1),
  languages: z.array(z.string()).optional(),
  watchDuration: z.number().int().min(10).max(3600).default(300),
});
```

### Tool Registration Pattern

```typescript
// Central tool registration with automatic schema conversion
export async function registerTools(server: Server, context: ToolContext) {
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'tmux_create_session':
        return await handleCreateSession(args, context);
      // ... all 23 tools
    }
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'tmux_create_session',
          description: 'Create a new tmux session with optional windows and panes',
          inputSchema: zodToJsonSchema(CreateSessionSchema), // Automatic conversion
        },
        // ... all tool definitions
      ]
    };
  });
}
```

## Data Flow

### Request Processing Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MCP Client    │───▶│  TmuxMCPServer   │───▶│   Tool Router   │
│   (JSON-RPC)    │    │   (stdio)        │    │   (switch)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Tool Handler  │◀───│ Schema Validator │◀───│   Zod Parser    │
│   (execute)     │    │  (validate)      │    │   (parse)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Core Component │───▶│  Business Logic  │───▶│   Result        │
│  (tmux, logs,   │    │  (process, ana-  │    │  (formatted)    │
│   process, etc) │    │   lyze, monitor) │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Event Flow Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  File Watcher   │───▶│  Error Watcher   │───▶│ Event Emitter   │
│  (chokidar)     │    │  (pattern match) │    │  (emit error)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ MCP Integrator  │◀───│   Event Router   │◀───│  Error Handler  │
│ (cross-MCP)     │    │   (distribute)   │    │  (standardize)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│Sequential MCP   │    │   Context7 MCP   │    │    RIKA MCP     │
│(complex analysis│    │ (documentation)  │    │  (UI testing)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Event-Driven Architecture

### EventEmitter Integration

The tmux-mcp-server uses Node.js EventEmitter pattern for loose coupling between components:

```typescript
// Error Watcher emits events
errorWatcher.on('error', async (error: ErrorEntry) => {
  logger.warn(`Error detected in pane ${error.paneId}: ${error.message}`);
  await mcpIntegrator.handleError(error);
});

// MCP Integrator handles and routes events
mcpIntegrator.on('trigger_sequential', (data) => {
  logger.info(`Sequential thinking triggered: ${data.analysis.type}`);
  // In production: call sequential-thinking MCP
});
```

### Event Types and Handling

| Event Type | Source | Handler | Action |
|------------|--------|---------|--------|
| `error_detected` | ErrorWatcher | McpIntegrator | Trigger sequential analysis |
| `process_crashed` | ProcessMonitor | McpIntegrator | Health check and restart |
| `framework_detected` | FrameworkDetector | McpIntegrator | Context7 documentation lookup |
| `port_changed` | ProcessMonitor | McpIntegrator | RIKA UI testing |
| `session_created` | TmuxManager | SessionStore | Persistence and logging |
| `session_destroyed` | TmuxManager | SessionStore | Cleanup and archival |

## State Management

### Session State Architecture

```typescript
// Hierarchical session state management
interface TmuxSession {
  name: string;
  id: string;
  windows: TmuxWindow[];
  created: Date;
  attached: boolean;
}

interface TmuxWindow {
  id: string;
  name: string;
  panes: TmuxPane[];
  active: boolean;
}

interface TmuxPane {
  id: string;           // Structured: "session:window.pane"
  nativeId?: string;    // Tmux native ID: "%3"
  windowId: string;
  sessionName: string;
  index: number;
  title: string;
  command: string;
  pid: number;
  logFile?: string;
  active: boolean;
}
```

### Persistence Strategy

```typescript
// Session serialization and recovery
export class SessionSerializer {
  async serializeSession(session: TmuxSession): Promise<void> {
    const serialized = {
      session,
      timestamp: new Date(),
      metadata: {
        processCount: session.windows.reduce((acc, w) => acc + w.panes.length, 0),
        totalUptime: Date.now() - session.created.getTime(),
        lastActivity: await this.getLastActivity(session)
      }
    };

    await this.storage.save(session.id, serialized);
  }

  async deserializeSession(sessionId: string): Promise<TmuxSession | null> {
    const data = await this.storage.load(sessionId);
    if (!data) return null;

    // Validate session is still valid in tmux
    const isValid = await this.validateTmuxSession(data.session);
    return isValid ? data.session : null;
  }
}
```

### State Consistency

- **Atomic Operations**: All state changes are atomic to prevent inconsistency
- **Validation**: State is validated against actual tmux session state
- **Recovery**: Automatic recovery from state corruption or tmux disconnection
- **Cleanup**: Automatic cleanup of orphaned sessions and resources

## Security Architecture

### Command Execution Security

```typescript
export class CommandEscaper {
  private options: CommandEscaperOptions;

  async executeTmuxCommand(command: string, args: string[] = []): Promise<string> {
    // 1. Validate command against allowlist
    if (!this.isAllowedCommand(command)) {
      throw new Error(`Command not allowed: ${command}`);
    }

    // 2. Escape all arguments
    const escapedArgs = args.map(arg => this.escapeArg(arg));

    // 3. Execute with timeout and resource limits
    return this.executeWithLimits('tmux', [command, ...escapedArgs]);
  }

  private escapeArg(arg: string): string {
    // Comprehensive escaping for shell safety
    return arg.replace(/[;&|`$(){}[\]<>?*\\]/g, '\\$&');
  }
}
```

### Resource Protection

- **Memory Limits**: Configurable limits on log file sizes and session counts
- **Process Isolation**: Each tmux session runs in isolated environment
- **File Access Control**: Restricted file system access patterns
- **Input Validation**: Comprehensive Zod schema validation for all inputs

### Data Sanitization

```typescript
// Log sanitization to prevent data leaks
export class LogAnalyzer {
  private sanitizeLogEntry(entry: string): string {
    return entry
      .replace(/password[=:]\s*\S+/gi, 'password=***')
      .replace(/token[=:]\s*\S+/gi, 'token=***')
      .replace(/api[_-]?key[=:]\s*\S+/gi, 'api_key=***');
  }
}
```

## Performance Considerations

### Efficient Resource Management

```typescript
// Configurable resource limits
interface TmuxManagerOptions {
  logDirectory: string;
  maxLogSize: number;        // 100MB default
  enableLogging: boolean;
  sessionTimeout: number;    // 24 hours default
}

// Session cleanup and garbage collection
export class SessionStore {
  private async cleanupExpiredSessions(): Promise<void> {
    const expired = await this.getExpiredSessions();

    for (const session of expired) {
      await this.tmuxManager.destroySession(session.name);
      await this.storage.delete(session.id);
      this.logger.info(`Cleaned up expired session: ${session.name}`);
    }
  }
}
```

### Monitoring and Metrics

```typescript
// Built-in performance monitoring
export class ProcessMonitor {
  async getSystemLoad(): Promise<SystemLoad> {
    return {
      load: os.loadavg(),
      memory: process.memoryUsage(),
      uptime: os.uptime(),
      processes: await this.getTopProcesses()
    };
  }
}
```

### Caching Strategy

- **Session Caching**: Active sessions cached in memory for fast access
- **Log Analysis**: Parsed log results cached to avoid reprocessing
- **Process Information**: System process information cached with TTL
- **Framework Detection**: Framework detection results cached per session

## Cross-MCP Integration

### Integration Architecture

The tmux-mcp-server demonstrates sophisticated patterns for coordinating with other MCP servers:

```typescript
export interface McpIntegrationConfig {
  sequentialThinking: {
    enabled: boolean;
    triggers: {
      onError: boolean;
      onMultipleErrors: number;
      onProcessCrash: boolean;
    };
  };
  rikaTesting: {
    enabled: boolean;
    triggers: {
      onUIChange: boolean;
      onPortChange: boolean;
      onBuildComplete: boolean;
    };
  };
  context7Docs: {
    enabled: boolean;
    triggers: {
      onFrameworkDetection: boolean;
      onErrorPattern: boolean;
    };
  };
}
```

### Smart Triggering Logic

```typescript
export class McpIntegrator {
  async handleError(error: ErrorEntry): Promise<void> {
    // Count errors for threshold-based triggering
    const errorCount = await this.countRecentErrors(error.paneId);

    if (errorCount >= this.config.sequentialThinking.triggers.onMultipleErrors) {
      await this.triggerSequentialAnalysis(error.paneId, {
        type: 'multiple_error_analysis',
        context: `${errorCount} errors detected in development environment`,
        errors: await this.getRecentErrors(error.paneId, 5)
      });
    }
  }

  async handleFrameworkDetection(paneId: string, framework: string): Promise<void> {
    if (this.config.context7Docs.enabled) {
      this.emit('trigger_context7', {
        library: framework,
        paneId,
        context: 'Framework detected in development environment'
      });
    }
  }
}
```

### Event Coordination Patterns

1. **Threshold-based Triggering**: Multiple errors trigger deep analysis
2. **Context-aware Integration**: Framework detection triggers documentation lookup
3. **State-change Monitoring**: Port changes trigger UI testing
4. **Debounced Events**: Prevent spam from rapid consecutive events
5. **Conditional Logic**: Smart triggering based on environment and context

This architecture demonstrates how MCP servers can work together intelligently, creating a coordinated development environment that responds dynamically to changing conditions and provides proactive assistance.