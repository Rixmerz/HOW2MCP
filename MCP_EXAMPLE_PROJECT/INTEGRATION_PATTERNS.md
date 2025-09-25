# Cross-MCP Integration Patterns

This document demonstrates sophisticated patterns for MCP server coordination, using the tmux-mcp-server as a comprehensive example of intelligent cross-MCP integration architecture.

## Table of Contents
- [Integration Architecture Overview](#integration-architecture-overview)
- [Event-Driven Coordination](#event-driven-coordination)
- [Smart Triggering Patterns](#smart-triggering-patterns)
- [MCP Server Combinations](#mcp-server-combinations)
- [Configuration Management](#configuration-management)
- [Real-World Use Cases](#real-world-use-cases)
- [Implementation Guidelines](#implementation-guidelines)

---

## Integration Architecture Overview

The tmux-mcp-server demonstrates a **hub-and-spoke integration model** where a central orchestrator (tmux-mcp-server) intelligently coordinates with specialized MCP servers based on context, events, and thresholds.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Claude Desktop                             │
└─────────────────────────┬───────────────────────────────────────┘
                         │ Primary MCP Communication
┌─────────────────────────▼───────────────────────────────────────┐
│                 Tmux MCP Server                                 │
│                 (Integration Hub)                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              McpIntegrator                                  ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   ││
│  │  │Event Router │ │Condition    │ │Threshold Manager    │   ││
│  │  │             │ │Evaluator    │ │                     │   ││
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────┬───────────┬───────────┬───────────┬─────────────────────┘
          │           │           │           │
          ▼           ▼           ▼           ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│Sequential    │ │Context7  │ │  RIKA    │ │   Magic      │
│Thinking MCP  │ │   MCP    │ │   MCP    │ │    MCP       │
│              │ │          │ │          │ │              │
│Complex       │ │Framework │ │UI Testing│ │Component     │
│Analysis      │ │  Docs    │ │          │ │Generation    │
└──────────────┘ └──────────┘ └──────────┘ └──────────────┘
```

### Core Integration Components

#### McpIntegrator Class
```typescript
export class McpIntegrator extends EventEmitter {
  private lastTriggers = new Map<string, Date>();
  private activeAnalyses = new Set<string>();
  private config: McpIntegrationConfig;

  constructor(logger: Logger, config: McpIntegrationConfig) {
    super();
    this.config = config;
    this.setupEventHandlers();
  }

  // Primary integration methods
  async handleError(error: ErrorEntry): Promise<void>;
  async handleFrameworkDetection(paneId: string, framework: string): Promise<void>;
  async handlePortChange(port: number, state: string): Promise<void>;
  async handleProcessCrash(process: ProcessInfo): Promise<void>;
}
```

---

## Event-Driven Coordination

### Event Types and Sources

The integration system responds to various event types from different components:

| Event Type | Source Component | Trigger Conditions | Target MCP |
|------------|------------------|-------------------|------------|
| `error_detected` | ErrorWatcher | Language-specific errors | Sequential |
| `multiple_errors` | ErrorWatcher | Error threshold exceeded | Sequential |
| `process_crashed` | ProcessMonitor | Process termination | Sequential |
| `framework_detected` | FrameworkDetector | New framework identified | Context7 |
| `port_changed` | ProcessMonitor | Port state changes | RIKA |
| `build_complete` | LogAnalyzer | Build process completion | RIKA |
| `ui_change` | FileWatcher | Frontend file modifications | Magic |
| `dependency_failure` | LogAnalyzer | Package/import errors | Context7 |

### Event Processing Pipeline

```typescript
// 1. Event Generation
errorWatcher.on('error', async (error: ErrorEntry) => {
  await mcpIntegrator.handleError(error);
});

// 2. Event Processing with Context
export class McpIntegrator extends EventEmitter {
  async handleError(error: ErrorEntry): Promise<void> {
    // Context analysis
    const context = await this.analyzeErrorContext(error);

    // Threshold checking
    const errorCount = await this.countRecentErrors(error.paneId, 300); // 5 minutes

    // Smart triggering
    if (errorCount >= this.config.sequentialThinking.triggers.onMultipleErrors) {
      await this.triggerSequentialAnalysis(error.paneId, {
        type: 'multiple_error_analysis',
        errors: await this.getRecentErrors(error.paneId, 5),
        context: context
      });
    }

    // Framework-specific handling
    if (error.language && this.config.context7Docs.enabled) {
      await this.triggerContext7Lookup(error.language, error);
    }
  }
}

// 3. Cross-MCP Communication (Conceptual)
this.emit('trigger_sequential', {
  analysis: { type: 'error_analysis', error },
  paneId: error.paneId,
  priority: 'high'
});
```

---

## Smart Triggering Patterns

### 1. Threshold-Based Triggering

Intelligent triggering based on frequency, severity, and context:

```typescript
export interface ThresholdConfig {
  errorCount: number;        // Trigger after N errors
  timeWindow: number;        // Within N milliseconds
  severity: 'low' | 'medium' | 'high';
  debounceMs: number;        // Prevent spam
}

// Implementation
async triggerSequentialAnalysis(paneId: string, data: any): Promise<void> {
  const triggerKey = `sequential_${paneId}`;
  const lastTrigger = this.lastTriggers.get(triggerKey);

  // Debouncing
  if (lastTrigger && Date.now() - lastTrigger.getTime() < 30000) {
    return; // Skip if triggered within last 30 seconds
  }

  // Prevent duplicate analysis
  if (this.activeAnalyses.has(paneId)) {
    return;
  }

  this.activeAnalyses.add(paneId);
  this.lastTriggers.set(triggerKey, new Date());

  this.emit('trigger_sequential', {
    paneId,
    analysis: data,
    timestamp: new Date()
  });

  // Cleanup after reasonable time
  setTimeout(() => {
    this.activeAnalyses.delete(paneId);
  }, 300000); // 5 minutes
}
```

### 2. Context-Aware Triggering

Framework and language-specific triggering logic:

```typescript
async handleFrameworkDetection(paneId: string, framework: string): Promise<void> {
  if (!this.config.context7Docs.enabled) return;

  const frameworkMappings = {
    'react': 'React documentation lookup',
    'vue': 'Vue.js documentation lookup',
    'angular': 'Angular documentation lookup',
    'express': 'Express.js documentation lookup',
    'fastify': 'Fastify documentation lookup',
    'nestjs': 'NestJS documentation lookup'
  };

  const context = frameworkMappings[framework.toLowerCase()];
  if (context) {
    this.emit('trigger_context7', {
      library: framework,
      paneId,
      context,
      priority: 'medium'
    });
  }
}
```

### 3. Cascade Triggering

One event can trigger multiple MCP servers in sequence:

```typescript
async handleBuildComplete(paneId: string, buildType: string): Promise<void> {
  // 1. First trigger RIKA for UI testing
  if (buildType === 'frontend' && this.config.rikaTesting.enabled) {
    this.emit('trigger_rika', {
      type: 'build_validation',
      paneId,
      testSuite: 'ui_regression'
    });
  }

  // 2. Then trigger Context7 for documentation updates
  if (this.config.context7Docs.enabled) {
    const frameworks = await this.frameworkDetector.detectFrameworks(paneId);
    for (const framework of frameworks) {
      this.emit('trigger_context7', {
        library: framework,
        context: 'Post-build documentation sync'
      });
    }
  }

  // 3. Finally trigger Sequential for build analysis
  const buildErrors = await this.getBuildErrors(paneId);
  if (buildErrors.length > 0) {
    this.emit('trigger_sequential', {
      paneId,
      analysis: {
        type: 'build_analysis',
        errors: buildErrors,
        buildType
      }
    });
  }
}
```

---

## MCP Server Combinations

### Development Environment Orchestration

#### Full-Stack Development Setup
```typescript
// Configuration for comprehensive development environment
const devConfig: McpIntegrationConfig = {
  sequentialThinking: {
    enabled: true,
    triggers: {
      onError: true,
      onMultipleErrors: 3,
      onProcessCrash: true,
      onDependencyFailure: true
    }
  },
  context7Docs: {
    enabled: true,
    triggers: {
      onFrameworkDetection: true,
      onErrorPattern: true,
      onNewDependency: true
    }
  },
  rikaTesting: {
    enabled: true,
    triggers: {
      onUIChange: true,
      onPortChange: true,
      onBuildComplete: true
    }
  },
  magicUI: {
    enabled: true,
    triggers: {
      onReactError: true,
      onComponentRequest: true
    }
  }
};
```

#### Production Monitoring Setup
```typescript
// Configuration for production environment monitoring
const prodConfig: McpIntegrationConfig = {
  sequentialThinking: {
    enabled: true,
    triggers: {
      onError: false,        // Reduced noise
      onMultipleErrors: 5,   // Higher threshold
      onProcessCrash: true,
      onDependencyFailure: true
    }
  },
  context7Docs: {
    enabled: false,          // Not needed in production
    triggers: {
      onFrameworkDetection: false,
      onErrorPattern: false,
      onNewDependency: false
    }
  },
  rikaTesting: {
    enabled: true,
    triggers: {
      onUIChange: false,     // No UI changes expected
      onPortChange: true,    // Monitor service health
      onBuildComplete: false
    }
  }
};
```

### Specialized Workflows

#### Testing Pipeline Integration
```typescript
async setupTestingPipeline(sessionName: string): Promise<void> {
  // 1. Create comprehensive test session
  await this.tmuxManager.createSession({
    name: sessionName,
    windows: [
      { name: 'unit-tests', panes: [{ command: 'npm run test:unit:watch' }] },
      { name: 'integration-tests', panes: [{ command: 'npm run test:integration' }] },
      { name: 'e2e-tests', panes: [{ command: 'npm run test:e2e' }] }
    ]
  });

  // 2. Start error monitoring for all test panes
  const panes = [`${sessionName}:unit-tests.0`, `${sessionName}:integration-tests.0`, `${sessionName}:e2e-tests.0`];

  for (const paneId of panes) {
    await this.errorWatcher.startWatching(paneId, {
      languages: ['javascript', 'typescript'],
      customPatterns: [
        /Test failed: (.*)/,
        /Assertion error: (.*)/,
        /Timeout: (.*)/
      ]
    });
  }

  // 3. Configure specialized triggers
  this.mcpIntegrator.configure({
    sequentialThinking: {
      enabled: true,
      triggers: {
        onTestFailure: true,
        onMultipleTestFailures: 2, // Lower threshold for tests
        onTimeoutErrors: true
      }
    },
    rikaTesting: {
      enabled: true,
      triggers: {
        onE2EFailure: true,
        onUITestFailure: true
      }
    }
  });
}
```

---

## Configuration Management

### Environment-Based Configuration

```typescript
export class McpIntegrator {
  private loadConfiguration(): McpIntegrationConfig {
    const env = process.env.NODE_ENV || 'development';

    switch (env) {
      case 'development':
        return this.getDevConfig();
      case 'testing':
        return this.getTestConfig();
      case 'production':
        return this.getProdConfig();
      default:
        return this.getDefaultConfig();
    }
  }

  private getDevConfig(): McpIntegrationConfig {
    return {
      sequentialThinking: {
        enabled: true,
        triggers: {
          onError: true,
          onMultipleErrors: 2,        // Lower threshold for development
          onProcessCrash: true,
          onDependencyFailure: true
        }
      },
      context7Docs: {
        enabled: true,
        triggers: {
          onFrameworkDetection: true,
          onErrorPattern: true,
          onNewDependency: true
        }
      },
      rikaTesting: {
        enabled: false,               // Usually disabled during active dev
        triggers: {
          onUIChange: false,
          onPortChange: false,
          onBuildComplete: false
        }
      }
    };
  }
}
```

### Dynamic Configuration Updates

```typescript
// Runtime configuration updates
async updateIntegrationConfig(updates: Partial<McpIntegrationConfig>): Promise<void> {
  this.config = { ...this.config, ...updates };

  // Emit configuration change event
  this.emit('config_updated', {
    previous: this.config,
    current: updates,
    timestamp: new Date()
  });

  // Re-evaluate active watches and triggers
  await this.reapplyConfiguration();
}

// Environment-specific overrides
private applyEnvironmentOverrides(): void {
  const overrides = {
    CI: {
      sequentialThinking: { enabled: false }, // Reduce CI noise
      rikaTesting: { enabled: true }          // Enable CI testing
    },
    DEBUGGING: {
      sequentialThinking: {
        enabled: true,
        triggers: { onError: true }           // Enable for debugging
      }
    }
  };

  Object.entries(process.env).forEach(([key, value]) => {
    if (value === 'true' && overrides[key]) {
      this.config = { ...this.config, ...overrides[key] };
    }
  });
}
```

---

## Real-World Use Cases

### 1. Microservices Development Environment

```typescript
async setupMicroservicesEnvironment(): Promise<void> {
  // Create sessions for each service
  const services = ['auth-service', 'user-service', 'order-service', 'gateway'];

  for (const service of services) {
    await this.tmuxManager.createSession({
      name: service,
      windows: [
        { name: 'dev', panes: [{ command: `cd ${service} && npm run dev` }] },
        { name: 'logs', panes: [{ command: `cd ${service} && tail -f logs/app.log` }] },
        { name: 'tests', panes: [{ command: `cd ${service} && npm run test:watch` }] }
      ]
    });

    // Service-specific monitoring
    await this.errorWatcher.startWatching(`${service}:dev.0`, {
      languages: ['javascript'],
      customPatterns: [
        /Service error: (.*)/,
        /Database connection failed/,
        /API timeout: (.*)/
      ]
    });
  }

  // Cross-service dependency monitoring
  this.mcpIntegrator.configure({
    sequentialThinking: {
      enabled: true,
      triggers: {
        onServiceCommunicationError: true,
        onDatabaseConnectionFailure: true,
        onCircuitBreakerOpen: true
      }
    },
    context7Docs: {
      enabled: true,
      triggers: {
        onAPIDocumentationNeeded: true,
        onServiceSchemaChange: true
      }
    }
  });
}
```

### 2. CI/CD Pipeline Integration

```typescript
async setupCIPipelineIntegration(): Promise<void> {
  // Monitor CI/CD processes
  await this.tmuxManager.createSession({
    name: 'ci-pipeline',
    windows: [
      { name: 'build', panes: [{ command: 'npm run build' }] },
      { name: 'test', panes: [{ command: 'npm run test:ci' }] },
      { name: 'deploy', panes: [{ command: 'npm run deploy:staging' }] }
    ]
  });

  // Pipeline-specific triggers
  this.mcpIntegrator.configure({
    sequentialThinking: {
      enabled: true,
      triggers: {
        onBuildFailure: true,
        onTestFailure: true,
        onDeploymentFailure: true
      }
    },
    rikaTesting: {
      enabled: true,
      triggers: {
        onStagingDeployment: true,
        onUIRegressionDetected: true
      }
    }
  });

  // Custom event handlers for CI events
  this.mcpIntegrator.on('build_failure', async (data) => {
    // Analyze build logs and provide intelligent insights
    await this.triggerSequentialAnalysis(data.paneId, {
      type: 'ci_build_analysis',
      buildLogs: data.logs,
      failureType: data.failureType
    });
  });
}
```

### 3. Machine Learning Development Workflow

```typescript
async setupMLDevelopmentWorkflow(): Promise<void> {
  await this.tmuxManager.createSession({
    name: 'ml-dev',
    windows: [
      { name: 'jupyter', panes: [{ command: 'jupyter lab' }] },
      { name: 'training', panes: [{ command: 'python train.py' }] },
      { name: 'tensorboard', panes: [{ command: 'tensorboard --logdir=./logs' }] },
      { name: 'monitoring', panes: [{ command: 'watch nvidia-smi' }] }
    ]
  });

  // ML-specific error patterns
  await this.errorWatcher.addCustomPatterns([
    {
      name: 'cuda_error',
      regex: /CUDA error: (.*)/,
      type: 'error',
      language: 'python'
    },
    {
      name: 'memory_error',
      regex: /OutOfMemoryError: (.*)/,
      type: 'error',
      language: 'python'
    },
    {
      name: 'convergence_warning',
      regex: /Model not converging: (.*)/,
      type: 'warning',
      language: 'python'
    }
  ]);

  // ML-specific integrations
  this.mcpIntegrator.configure({
    sequentialThinking: {
      enabled: true,
      triggers: {
        onTrainingFailure: true,
        onModelPerformanceDrop: true,
        onResourceExhaustion: true
      }
    }
  });
}
```

---

## Implementation Guidelines

### 1. Design Principles

#### Loose Coupling
```typescript
// Use events instead of direct coupling
class McpIntegrator extends EventEmitter {
  // Don't directly call other MCP servers
  // Instead, emit events that can be handled by clients

  async handleError(error: ErrorEntry): Promise<void> {
    // Emit event instead of direct call
    this.emit('trigger_sequential', {
      analysis: { type: 'error_analysis', error }
    });
  }
}
```

#### Smart Defaults
```typescript
// Provide sensible defaults that work in most scenarios
const DEFAULT_CONFIG: McpIntegrationConfig = {
  sequentialThinking: {
    enabled: true,
    triggers: {
      onError: false,           // Avoid noise
      onMultipleErrors: 3,      // Reasonable threshold
      onProcessCrash: true,     // Always important
      onDependencyFailure: true
    }
  },
  debounceMs: 30000,           // 30 second debounce
  maxConcurrentTriggers: 5     // Prevent overwhelm
};
```

### 2. Error Handling and Resilience

```typescript
export class McpIntegrator extends EventEmitter {
  private async safeEmit(event: string, data: any): Promise<void> {
    try {
      this.emit(event, data);
    } catch (error) {
      this.logger.error(`Failed to emit ${event}:`, error);
      // Continue operation even if one integration fails
    }
  }

  private async withFallback<T>(
    operation: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logger.warn('Operation failed, using fallback:', error);
      return fallback;
    }
  }
}
```

### 3. Performance Optimization

```typescript
// Rate limiting and resource management
export class McpIntegrator extends EventEmitter {
  private rateLimiter = new Map<string, number>();
  private readonly MAX_TRIGGERS_PER_MINUTE = 10;

  private async isRateLimited(triggerType: string): Promise<boolean> {
    const key = `${triggerType}_${Math.floor(Date.now() / 60000)}`;
    const count = this.rateLimiter.get(key) || 0;

    if (count >= this.MAX_TRIGGERS_PER_MINUTE) {
      this.logger.warn(`Rate limit exceeded for ${triggerType}`);
      return true;
    }

    this.rateLimiter.set(key, count + 1);
    return false;
  }

  // Cleanup old rate limit entries
  private cleanupRateLimiter(): void {
    const currentMinute = Math.floor(Date.now() / 60000);
    for (const [key] of this.rateLimiter) {
      const keyMinute = parseInt(key.split('_').pop()!);
      if (currentMinute - keyMinute > 5) { // Keep 5 minutes of history
        this.rateLimiter.delete(key);
      }
    }
  }
}
```

### 4. Testing Integration Patterns

```typescript
// Mock MCP integrations for testing
export class MockMcpIntegrator extends EventEmitter {
  private triggeredEvents: Array<{event: string, data: any, timestamp: Date}> = [];

  emit(event: string, data: any): boolean {
    this.triggeredEvents.push({ event, data, timestamp: new Date() });
    return super.emit(event, data);
  }

  getTriggeredEvents(eventType?: string): typeof this.triggeredEvents {
    return eventType
      ? this.triggeredEvents.filter(e => e.event === eventType)
      : this.triggeredEvents;
  }

  clearEventHistory(): void {
    this.triggeredEvents = [];
  }
}

// Integration tests
describe('MCP Integration Patterns', () => {
  it('should trigger sequential analysis after multiple errors', async () => {
    const mockIntegrator = new MockMcpIntegrator();

    // Simulate multiple errors
    for (let i = 0; i < 3; i++) {
      await mockIntegrator.handleError({
        paneId: 'test:0.0',
        message: `Error ${i}`,
        type: 'error'
      });
    }

    const events = mockIntegrator.getTriggeredEvents('trigger_sequential');
    expect(events).toHaveLength(1);
    expect(events[0].data.analysis.type).toBe('multiple_error_analysis');
  });
});
```

---

This comprehensive integration pattern documentation demonstrates how sophisticated MCP servers can work together to create intelligent, responsive development environments. The tmux-mcp-server serves as a practical example of these patterns in production use.