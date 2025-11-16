# HOW2MCP - Model Context Protocol 2025

> **The definitive 2025 resource** for understanding and implementing Model Context Protocol (MCP) servers with modern architecture, real examples, and production-ready patterns.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-0.5.0-blue)](https://github.com/modelcontextprotocol/typescript-sdk)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)

---

## ⚡ 5-Minute Quickstart

Get a working MCP server running in 5 minutes:

### 1. Install Dependencies
```bash
npm install @modelcontextprotocol/sdk zod
npm install -D typescript @types/node tsx
```

### 2. Create Your Server (`server.ts`)
```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'my-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'greet',
    description: 'Say hello to someone',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name']
    }
  }]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => ({
  content: [{ type: 'text', text: `Hello, ${request.params.arguments.name}! 👋` }]
}));

await server.connect(new StdioServerTransport());
```

### 3. Run Your Server
```bash
npx tsx server.ts
```

### 4. Test with MCP Inspector
```bash
npx @modelcontextprotocol/inspector npx tsx server.ts
```

**🎉 That's it!** You have a working MCP server.

➡️ **Next:** Check out [progressive examples](./examples/README.md) to learn more patterns.

---

## 🤔 When to Use HOW2MCP

### ✅ Choose HOW2MCP if you want to:
- **Understand MCP deeply** - Comprehensive architecture and protocol documentation
- **Build production servers** - 2025 best practices, streaming, caching, versioning
- **Deploy to Cloudflare** - Workers, Code Mode, edge distribution patterns
- **Enterprise scale** - Multi-layer caching, rate limiting, observability
- **Learn by example** - Progressive examples from 15 lines to 700+ line production server

### 🔄 Compare with FastMCP Framework
**FastMCP** is excellent for rapid development with opinionated abstractions.
**HOW2MCP** teaches you the underlying patterns and 2025 production features.

**Use both together:**
1. Start with FastMCP for quick prototyping
2. Reference HOW2MCP for 2025 patterns (streaming, caching, versioning)
3. Use HOW2MCP Cloudflare guides for edge deployment

---

## 📚 Progressive Learning Path

### 🚀 Fast Track (1-2 hours)
1. **Quickstart** → [5-minute example above](#-5-minute-quickstart)
2. **Examples** → [`/examples/`](./examples/README.md) - Learn by building
3. **Quick Reference** → [`MCP_QUICK_REFERENCE.md`](./MCP-DOCS/MCP_QUICK_REFERENCE.md) - Essential patterns

### 🎓 Complete Path (4-6 hours)
1. **Architecture** → [`MCP_ARCHITECTURE_2025.md`](./MCP-DOCS/MCP_ARCHITECTURE_2025.md) - Modern design patterns
2. **Tech Stack** → [`MCP_TECH_STACK_2025.md`](./MCP-DOCS/MCP_TECH_STACK_2025.md) - Tool selection
3. **Implementation** → [`MCP_IMPLEMENTATION_GUIDE.md`](./MCP-DOCS/MCP_IMPLEMENTATION_GUIDE.md) - Step-by-step guide
4. **Advanced Patterns** → [`MCP_ADVANCED_PATTERNS_2025.md`](./MCP-DOCS/MCP_ADVANCED_PATTERNS_2025.md) - Streaming, caching, versioning
5. **Production Checklist** → [`MCP_CHECKLIST_2025.md`](./MCP-DOCS/MCP_CHECKLIST_2025.md) - 100+ validation items

### ☁️ Cloudflare Path (2-3 hours)
1. **Code Mode** → [`MCP_CODE_MODE_2025.md`](./MCP-DOCS/MCP_CODE_MODE_2025.md) - Revolutionary TypeScript API
2. **Remote Deployment** → [`MCP_REMOTE_DEPLOYMENT_2025.md`](./MCP-DOCS/MCP_REMOTE_DEPLOYMENT_2025.md) - Workers deployment
3. **Anti-Patterns** → [`MCP_ANTI_PATTERNS_2025.md`](./MCP-DOCS/MCP_ANTI_PATTERNS_2025.md) - Avoid common mistakes

---

## 🎯 What's Included

### 📂 Examples (`/examples/`)
Progressive learning from simple to production-ready:

| Example | Lines | Features | Time |
|---------|-------|----------|------|
| `quickstart.ts` | ~15 | Basic tool | 5 min |
| `01-basic.ts` | ~50 | Multiple tools | 15 min |
| `02-intermediate.ts` | ~100 | Validation, errors | 30 min |
| `03-advanced.ts` | ~150 | Streaming, resources | 45 min |
| `MCP_EXAMPLE_PROJECT/` | ~700 | Full production | 2 hours |

### 📖 Documentation (`/MCP-DOCS/`)

**2025 Guides** (Modern patterns and architecture)
- `MCP_ARCHITECTURE_2025.md` - Component layers, modular design, capabilities
- `MCP_TECH_STACK_2025.md` - Languages, databases, caching, observability
- `MCP_ADVANCED_PATTERNS_2025.md` - Streaming, caching, versioning, multi-tenant
- `MCP_WORKFLOWS_2025.md` - Connection flows, tool execution, deployment
- `MCP_EMERGING_TRENDS_2025.md` - Code2MCP, MCP Bridge, AutoMCP, MCP-Bench
- `MCP_CHECKLIST_2025.md` - 100+ production readiness items

**Cloudflare Integration** (Edge deployment and Code Mode)
- `MCP_CODE_MODE_2025.md` - TypeScript API approach, goal-oriented tools
- `MCP_REMOTE_DEPLOYMENT_2025.md` - Workers, HTTP+SSE, WebSocket, scaling
- `MCP_ANTI_PATTERNS_2025.md` - Common mistakes and best practices

**Core Documentation** (Technical reference)
- `MCP_IMPLEMENTATION_GUIDE.md` - Complete technical reference
- `MCP_QUICK_REFERENCE.md` - Essential patterns and cheat sheet
- `MCP_DOCUMENTATION_INDEX.md` - Navigation guide

**Token Optimization** (Efficiency and cost reduction)
- `TOON_IN_MCP_TOOLS.md` - Add TOON format to tool responses (30-60% token savings)
- `toon-mcp-server/` - Example full TOON-native MCP server (proof-of-concept)

---

## 🆕 What's New in 2025

### Modern Architecture
✨ **Modular Servers** - Single responsibility principle for maintainability
🔐 **Capability-Based Access** - Fine-grained security control
📡 **Streaming Responses** - SSE/WebSocket for incremental output
⚡ **Multi-Layer Caching** - Memory → Redis → Database optimization
🔄 **Versioning Strategies** - Backward compatibility and API evolution

### Technology Stack
- **TypeScript/Node.js** (primary), Go, Rust, Python support
- **Zod + JSON Schema** for type-safe validation
- **Vector Databases** - Qdrant, Chroma, Weaviate, pgvector
- **Redis/SQLite/LevelDB** for caching and persistence
- **OpenTelemetry + Prometheus** for observability

### Emerging Innovations
- **Code2MCP** - Auto-generate MCP servers from code repositories
- **MCP Bridge** - RESTful proxy for universal access
- **AutoMCP** - Generate servers from OpenAPI specs
- **MCP-Bench** - Benchmark suite with 250+ evaluation tasks

### Cloudflare Integration
- **Code Mode** - Revolutionary TypeScript API approach for AI agents
- **Remote Deployment** - Host MCP servers on Cloudflare Workers
- **Edge Distribution** - Global MCP server deployment at the edge
- **Best Practices** - Cloudflare-validated patterns and anti-patterns

### Token Optimization
- **TOON Format** - 30-60% token savings for tool responses
- **Hybrid Approach** - TOON inside JSON-RPC for optimal efficiency
- **Production Example** - Real implementation in Fractal MCP
- **Implementation Guide** - [`TOON_IN_MCP_TOOLS.md`](./TOON_IN_MCP_TOOLS.md)

---

## 🧪 Testing Your MCP Server

### Method 1: MCP Inspector (Visual Interface)
```bash
npm install -g @modelcontextprotocol/inspector
npx @modelcontextprotocol/inspector npx tsx your-server.ts
```

### Method 2: MCP CLI (Command Line)
```bash
npm install -g @modelcontextprotocol/cli
npx @modelcontextprotocol/cli npx tsx your-server.ts
```

### Method 3: Claude Desktop Integration
Add to `~/.config/claude-desktop/config.json`:
```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/your-server.ts"]
    }
  }
}
```

Then restart Claude Desktop and your server will be available!

---

## 🌟 Showcase - Built with HOW2MCP

Real-world MCP servers using these patterns:

> 💡 **Want to showcase your MCP server?** Submit a PR adding your project here!

<!--
Add your project:
- **[Your Project Name](github-link)** - Brief description of what it does
-->

---

## 🛠️ Example Tools Patterns

The example project demonstrates different MCP tool patterns:

1. **Simple Processing** (`echo`) - Text manipulation with parameters
2. **Mathematical Operations** (`calculator`) - Operations with validation
3. **Data Processing** (`data-processor`) - Array operations with transformations
4. **System Information** (`status`) - Health checks and metrics
5. **Streaming Tasks** (`streaming-task`) - Progress notifications
6. **Async Operations** (`async-fetch`) - HTTP requests with error recovery

---

## 🏗️ Core Architecture Patterns

### Server Initialization
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  { name: 'server-name', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {}, prompts: {} } }
);
```

### Tool Registration
```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'tool-name',
    description: 'What the tool does',
    inputSchema: zodToJsonSchema(YourZodSchema)
  }]
}));
```

### Validation with Zod
```typescript
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const ToolSchema = z.object({
  param: z.string().min(1),
  optional: z.number().default(10)
});

const validated = ToolSchema.parse(args); // Type-safe!
```

### Error Handling
```typescript
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

throw new McpError(
  ErrorCode.InvalidParams,
  'Detailed error message'
);
```

---

## 📊 Key Stats

- 📄 **9 Comprehensive 2025 Guides** - Modern architecture and patterns
- ☁️ **3 Cloudflare Integration Guides** - Code Mode and remote deployment
- 📚 **3 Core Documentation Files** - Technical reference
- 💻 **5 Progressive Examples** - 15 lines to 700+ line production server
- ✅ **100+ Checklist Items** - Production readiness validation
- 🔬 **Latest Research** - Code2MCP, AutoMCP, MCP-Bench, Cloudflare Code Mode

---

## 🤝 Contributing

This project is designed as a learning resource. We welcome:

- 📝 Documentation improvements
- 🔧 Additional example tools and patterns
- 🌟 Showcase submissions of your MCP servers
- 🐛 Issue reports for unclear explanations
- 💡 Suggestions for new examples or guides

---

## 📄 License

MIT License - Feel free to use this for learning and building your own MCP servers.

---

## 🔗 Additional Resources

### Official Links
- [Official MCP Documentation](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Desktop](https://claude.ai/download)

### 2025 Innovations
- [Code2MCP](https://github.com/code2mcp) - Auto-generate MCP servers
- [MCP Bridge](https://github.com/mcp-bridge) - RESTful proxy
- [AutoMCP](https://github.com/automcp) - OpenAPI to MCP
- [MCP-Bench](https://github.com/mcp-bench) - Evaluation benchmark

### Community
- [Discord](https://discord.gg/modelcontextprotocol) - Community support
- [MCP Marketplace](https://modelcontextprotocol.io/marketplace) - Discover MCP servers
- [GitHub Discussions](https://github.com/modelcontextprotocol/discussions) - Q&A and examples

### Other Frameworks
- [FastMCP](https://github.com/punkpeye/fastmcp) - Rapid MCP server development
- [MCP Langchain](https://github.com/langchain/mcp) - Langchain integration
- [MCP Go SDK](https://github.com/modelcontextprotocol/go-sdk) - Go implementation

---

## ❓ FAQ

### How do I test my MCP server?
Use the MCP Inspector for visual testing or MCP CLI for command line:
```bash
npx @modelcontextprotocol/inspector npx tsx your-server.ts
```

### Why aren't my tools showing up in Claude Desktop?
1. Verify absolute paths in config file
2. Check server logs for errors
3. Restart Claude Desktop after config changes
4. Ensure Zod schemas are properly converted to JSON Schema

### How do I implement streaming responses?
See the advanced example (`examples/03-advanced.ts`) for streaming patterns with progress notifications.

### What's the difference between Tools, Resources, and Prompts?
- **Tools** - Actions the LLM can execute (functions)
- **Resources** - Data the LLM can read (files, databases)
- **Prompts** - Templates the LLM can use (pre-written prompts)

### Should I use FastMCP or HOW2MCP?
Use **FastMCP** for rapid development with abstractions.
Use **HOW2MCP** to learn deep patterns and 2025 production features.
Best: Use both together! FastMCP for speed, HOW2MCP for production patterns.

---

**Build Production-Ready MCP Servers with 2025 Best Practices! 🚀**

[Get Started](#-5-minute-quickstart) | [Examples](./examples/README.md) | [Documentation](./MCP-DOCS/) | [Contributing](#-contributing)
