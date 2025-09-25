# Production MCP Server Example

This repository provides a comprehensive example of a production-grade Model Context Protocol (MCP) server based on the **tmux-mcp-server** - an intelligent terminal orchestrator that demonstrates advanced MCP patterns, real-world architecture, and sophisticated tool implementations.

## Why This Example?

The tmux-mcp-server represents one of the most sophisticated MCP implementations available, featuring:
- **23 production-ready tools** across 4 distinct categories
- **Event-driven architecture** with cross-MCP integration
- **Real-time monitoring** and intelligent error detection
- **Session persistence** and state management
- **Modular design** suitable for enterprise deployments

## 🎯 Core Capabilities

### Intelligent Terminal Orchestration
- **Persistent Terminal Management**: Create and manage tmux sessions that survive MCP restarts
- **Real-time Log Capture**: Automatic log capture with intelligent analysis and pattern matching
- **Process & Port Monitoring**: Monitor system resources, ports, and process health
- **Automated Error Detection**: Language-specific error detection with real-time alerts
- **Cross-MCP Integration**: Intelligent triggers for other MCP servers based on events

### Production Features
- **Structured JSON-RPC 2.0 API**: Clean, well-documented API for AI agent integration
- **Event-driven Architecture**: EventEmitter-based coordination between components
- **Session Persistence**: Automatic session serialization and recovery
- **Framework Detection**: Automatic detection of development frameworks
- **Resource Monitoring**: System load, process health, and port activity monitoring

## 🛠️ Complete Tool Suite (23 Tools)

### Session Management (`tmux_*`)
- `tmux_create_session` - Create tmux sessions with custom configurations and windows
- `tmux_create_pane` - Add panes to existing sessions with command execution
- `tmux_execute_command` - Run commands in specific panes with output capture
- `tmux_list_sessions` - Get comprehensive session information and health status
- `tmux_get_session` - Detailed information about specific sessions and their panes
- `tmux_destroy_session` - Clean session termination with resource cleanup

### Log Analysis (`logs_*`)
- `logs_get_recent` - Retrieve recent log entries with context and filtering
- `logs_summarize` - AI-powered log analysis with error/warning categorization
- `logs_search` - Advanced log search with regex patterns and context
- `logs_watch` - Real-time log monitoring with pattern matching
- `logs_generate_report` - Comprehensive log analysis reports with trends

### Process Management (`process_*`)
- `process_list_ports` - Show open ports with associated process information
- `process_multi_kill` - Kill multiple processes by pattern with safety checks
- `process_monitor` - Real-time process monitoring with resource usage metrics
- `process_restart` - Intelligent process restart with health verification
- `process_port_monitor` - Monitor specific ports for activity and changes
- `process_system_load` - System load averages and top resource consumers

### Error Detection (`errors_*`)
- `errors_watch` - Start real-time error detection for development environments
- `errors_summary` - Get error statistics, trends, and pattern analysis
- `errors_clear` - Clear error cache and reset detection state
- `errors_analyze` - Deep error pattern analysis with actionable insights
- `errors_add_pattern` - Add custom error detection patterns for specific frameworks
- `errors_stop_watch` - Stop error monitoring with graceful cleanup

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18 or higher
- tmux 2.0 or higher
- Unix-like operating system (macOS, Linux)

### Quick Install
```bash
# Clone the tmux-mcp-server
git clone https://github.com/your-org/tmux-mcp-server
cd tmux-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Make scripts executable
chmod +x scripts/tmux/*.sh scripts/install.sh

# Create directories
mkdir -p logs storage
```

### MCP Client Configuration

Add to your Claude Desktop or MCP client configuration:

```json
{
  "mcpServers": {
    "tmux-mcp-server": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "/absolute/path/to/tmux-mcp-server",
      "env": {
        "LOG_LEVEL": "info",
        "LOG_DIRECTORY": "./logs",
        "MAX_LOG_SIZE": "104857600",
        "SESSION_TIMEOUT": "86400000",
        "ENABLE_LOGGING": "true",
        "STORAGE_DIRECTORY": "./storage"
      }
    }
  }
}
```

### Alternative Configurations

#### Development Mode
```json
{
  "mcpServers": {
    "tmux-dev": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/path/to/tmux-mcp-server",
      "env": {
        "LOG_LEVEL": "debug",
        "NODE_ENV": "development"
      }
    }
  }
}
```

#### Production Mode
```json
{
  "mcpServers": {
    "tmux-prod": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "/path/to/tmux-mcp-server",
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info",
        "LOG_DIRECTORY": "/var/log/tmux-mcp-server",
        "STORAGE_DIRECTORY": "/var/lib/tmux-mcp-server"
      }
    }
  }
}
```

## 📊 Environment Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `LOG_DIRECTORY` | `./logs` | Directory for persistent log storage |
| `MAX_LOG_SIZE` | `104857600` | Maximum log file size (100MB default) |
| `SESSION_TIMEOUT` | `86400000` | Session timeout in milliseconds (24 hours) |
| `ENABLE_LOGGING` | `true` | Enable automatic log capture and analysis |
| `STORAGE_DIRECTORY` | `./storage` | Session persistence and state storage |
| `NODE_ENV` | `development` | Runtime environment mode |

## 🏗️ Architecture Overview

### Modular Component Design
```
src/
├── index.ts                 # Server entry point with configuration
├── server.ts                # Main TmuxMCPServer class with initialization
├── core/                    # Core business logic components
│   ├── tmux-manager.ts      # Tmux session lifecycle management
│   ├── log-analyzer.ts      # Intelligent log parsing and analysis
│   ├── process-monitor.ts   # System process and resource monitoring
│   ├── error-watcher.ts     # Real-time error detection and classification
│   ├── session-serializer.ts # Session persistence and recovery
│   └── mcp-integrator.ts    # Cross-MCP server coordination and triggers
├── tools/                   # MCP tool implementations
│   ├── session-tools.ts     # Session management tool handlers
│   ├── log-tools.ts         # Log analysis and monitoring tools
│   ├── process-tools.ts     # Process and port management tools
│   ├── error-tools.ts       # Error detection and analysis tools
│   └── index.ts            # Tool registration with JSON Schema conversion
├── utils/                   # Shared utilities and helpers
│   ├── logger.ts           # Structured logging with levels
│   ├── errors.ts           # Error handling and standardization
│   ├── command-escaper.ts  # Safe command execution utilities
│   ├── pane-id-resolver.ts # Tmux pane ID management
│   └── framework-detector.ts # Development framework detection
├── storage/                 # Data persistence layer
│   └── session-store.ts    # Session state management and recovery
└── types/                   # Comprehensive TypeScript definitions
    └── index.ts            # All interfaces and type definitions
```

### Key Architectural Patterns

#### 1. Event-Driven Coordination
```typescript
// Cross-component communication using EventEmitter
export class McpIntegrator extends EventEmitter {
  async handleError(error: ErrorEntry) {
    // Trigger sequential thinking for complex errors
    this.emit('trigger_sequential', {
      analysis: { type: 'error_analysis', error },
      paneId: error.paneId
    });
  }
}
```

#### 2. Modular Tool Registration
```typescript
// Automatic tool registration with schema validation
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'tmux_create_session':
      return await handleCreateSession(args, context);
    // ... 22 more production tools
  }
});
```

#### 3. Type-Safe Input Validation
```typescript
// Zod schemas with automatic JSON Schema conversion
export const CreateSessionSchema = z.object({
  name: z.string().min(1),
  workingDirectory: z.string().optional(),
  windows: z.array(WindowSchema).optional(),
  environment: z.record(z.string()).optional(),
});

// Automatic conversion for MCP tool schemas
inputSchema: zodToJsonSchema(CreateSessionSchema)
```

#### 4. Session Persistence
```typescript
// Automatic session serialization and recovery
export class SessionSerializer {
  async serializeSession(session: TmuxSession): Promise<void> {
    const serializedData = {
      session,
      timestamp: new Date(),
      metadata: await this.collectMetadata(session)
    };
    await this.storage.save(session.id, serializedData);
  }
}
```

## 🎯 Usage Examples

### Basic Development Environment Setup
```typescript
// Create a full development environment
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
      name: 'frontend',
      panes: [
        { command: 'cd frontend && npm run dev' },
        { command: 'cd frontend && npm run test:watch' }
      ]
    },
    {
      name: 'backend',
      panes: [
        { command: 'cd backend && npm run start:dev' },
        { command: 'cd backend && npm run db:watch' }
      ]
    },
    {
      name: 'monitoring',
      panes: [
        { command: 'htop' },
        { command: 'tail -f logs/*.log' }
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

### Advanced Process Monitoring
```typescript
// Monitor system resources and processes
const processes = await callTool('process_monitor', {
  pattern: 'node',
  sortBy: 'cpu',
  limit: 10
});

// Monitor specific development ports
await callTool('process_port_monitor', {
  port: 3000,
  duration: 300, // 5 minutes
  interval: 10   // Check every 10 seconds
});

// Get comprehensive system load information
const systemLoad = await callTool('process_system_load', {
  includeProcesses: true
});
```

### Intelligent Log Analysis
```typescript
// Get recent logs with intelligent analysis
const logs = await callTool('logs_get_recent', {
  paneId: 'dev-session:frontend.0',
  lines: 100
});

// Generate comprehensive log analysis report
const report = await callTool('logs_generate_report', {
  sessionName: 'fullstack-dev',
  includeErrorSamples: true
});

// Search for specific error patterns
const errorLogs = await callTool('logs_search', {
  paneId: 'dev-session:backend.0',
  pattern: '(ERROR|FATAL|Exception)',
  caseSensitive: false,
  maxResults: 50
});
```

### Real-time Error Detection
```typescript
// Start intelligent error monitoring
await callTool('errors_watch', {
  paneId: 'dev-session:backend.0',
  languages: ['javascript', 'typescript'],
  watchDuration: 3600 // 1 hour
});

// Add custom error patterns for your framework
await callTool('errors_add_pattern', {
  name: 'custom_api_error',
  regex: 'API Error: (.*?) at line (\\d+)',
  type: 'error',
  language: 'javascript',
  captureGroups: {
    message: 1,
    line: 2
  }
});

// Get error analysis and trends
const errorAnalysis = await callTool('errors_analyze', {
  paneId: 'dev-session:backend.0',
  includePatterns: true,
  includeTrends: true
});
```

## 🔗 Cross-MCP Integration

The tmux-mcp-server demonstrates sophisticated cross-MCP server integration patterns:

### Sequential Thinking Integration
```typescript
// Automatic triggers for complex problem analysis
this.mcpIntegrator.on('trigger_sequential', (data) => {
  // Trigger sequential-thinking MCP for complex debugging
  // when multiple errors detected or process crashes occur
});
```

### Context7 Documentation Lookup
```typescript
// Automatic framework detection and documentation lookup
this.mcpIntegrator.on('trigger_context7', (data) => {
  // Trigger Context7 MCP when new frameworks detected
  // or framework-specific errors encountered
});
```

### RIKA UI Testing Integration
```typescript
// Trigger UI testing when development servers change
this.mcpIntegrator.on('trigger_rika', (data) => {
  // Trigger RIKA MCP for automated UI testing
  // when ports change or build processes complete
});
```

## 🔍 Key Dependencies & Technologies

### Core MCP SDK
- **@modelcontextprotocol/sdk**: Official MCP SDK for protocol implementation
- **JSON-RPC 2.0**: Standardized remote procedure call protocol

### Input Validation & Schema Management
- **zod**: Runtime type validation with TypeScript integration
- **zod-to-json-schema**: Automatic JSON Schema generation from Zod schemas

### System Integration
- **chokidar**: Efficient file watching for real-time monitoring
- **uuid**: Unique identifier generation for sessions and errors

### Development & Quality
- **TypeScript**: Full type safety and modern development experience
- **vitest**: Fast unit testing framework
- **eslint**: Code quality and consistency enforcement

## 📚 Additional Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Detailed architectural analysis and design decisions
- **[TOOLS_REFERENCE.md](./TOOLS_REFERENCE.md)**: Complete reference for all 23 tools with examples
- **[INTEGRATION_PATTERNS.md](./INTEGRATION_PATTERNS.md)**: Cross-MCP integration patterns and best practices

## 🧪 Testing & Development

### Manual Testing Commands
```bash
# List all available tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js

# Create development session
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"tmux_create_session","arguments":{"name":"test-session","workingDirectory":"./"}}}' | node dist/index.js

# Monitor system processes
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"process_monitor","arguments":{"pattern":"node","limit":5}}}' | node dist/index.js

# Start error watching
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"errors_watch","arguments":{"paneId":"test-session:0.0","languages":["javascript"]}}}' | node dist/index.js
```

### Automated Testing
```bash
# Run comprehensive test suite
npm test

# Run specific test categories
npm run test:tools       # Test all tool implementations
npm run test:integration # Test cross-component integration
npm run test:e2e        # End-to-end MCP communication tests

# Development mode with watch
npm run test:watch
```

## 🚀 Production Deployment

### Docker Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
COPY scripts/ ./scripts/
RUN chmod +x scripts/tmux/*.sh
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Systemd Service
```ini
[Unit]
Description=Tmux MCP Server
After=network.target

[Service]
Type=simple
User=mcp-server
WorkingDirectory=/opt/tmux-mcp-server
ExecStart=/usr/bin/node dist/index.js
Environment=NODE_ENV=production
Environment=LOG_LEVEL=info
Environment=LOG_DIRECTORY=/var/log/tmux-mcp-server
Environment=STORAGE_DIRECTORY=/var/lib/tmux-mcp-server
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## 🛡️ Security Considerations

### Command Execution Safety
- **Command Escaping**: All tmux commands are properly escaped to prevent injection
- **Allowlist Validation**: Only permitted command patterns are executed
- **Process Isolation**: Each session runs in isolated tmux environments

### Data Protection
- **Log Sanitization**: Sensitive data automatically filtered from logs
- **Session Isolation**: Cross-session access controls and validation
- **Resource Limits**: Configurable limits on log sizes and session counts

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.

---

*This example demonstrates production-grade MCP server development with real-world complexity, sophisticated architecture patterns, and enterprise-ready features. Use it as a foundation for building your own advanced MCP servers.*