# HOW2MCP - Model Context Protocol Learning Resource

A comprehensive guide and example project for understanding and implementing Model Context Protocol (MCP) servers.

## 📋 Overview

This repository provides everything you need to learn about and implement MCP servers, including:

- **Complete Documentation Suite** - Comprehensive guides and references
- **Working Example Project** - Production-ready MCP server implementation
- **Best Practices** - Patterns extracted from real-world MCP projects

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Basic understanding of TypeScript/JavaScript

### Getting Started

1. **Clone and explore the documentation:**
   ```bash
   cd MCP-DOCS/
   # Read the implementation guide for comprehensive understanding
   cat MCP_IMPLEMENTATION_GUIDE.md
   # Check quick reference for essential patterns
   cat MCP_QUICK_REFERENCE.md
   ```

2. **Run the example project:**
   ```bash
   cd MCP_EXAMPLE_PROJECT/
   npm install
   npm run build
   npm run test:mcp
   ```

3. **Configure with Claude Desktop:**
   ```bash
   # Copy the configuration example
   cp claude-desktop-config.json ~/.config/claude-desktop/
   ```

## 📚 Documentation Structure

### Core Documentation (`/MCP-DOCS/`)

| File | Purpose | Lines | Content |
|------|---------|-------|---------|
| **MCP_IMPLEMENTATION_GUIDE.md** | Complete technical reference | 831 | Architecture analysis, protocol details, implementation guidelines |
| **MCP_QUICK_REFERENCE.md** | Essential patterns | 130 | Implementation checklist, common patterns, error codes |
| **MCP_DOCUMENTATION_INDEX.md** | Navigation guide | 150 | Overview of all documentation and resources |

### Example Implementation (`/MCP_EXAMPLE_PROJECT/`)

- **Complete MCP Server** - TypeScript implementation with 4 example tools
- **Configuration Examples** - Claude Desktop and generic MCP client configs
- **Development Setup** - Testing, building, and development scripts
- **Best Practices** - Error handling, logging, validation patterns

## 🛠️ Example Tools Included

The example project demonstrates 4 different MCP tool patterns:

1. **echo** - Simple text processing with parameters
2. **calculator** - Mathematical operations with validation
3. **data-processor** - Array processing with multiple operations
4. **status** - System information and health checks

## 🏗️ Key Architectural Patterns

### Standard MCP Server Structure
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  { name: 'server-name', version: '1.0.0' },
  { capabilities: { tools: {} } }
);
```

### Tool Registration Pattern
```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'tool-name',
      description: 'Tool description',
      inputSchema: { /* Zod schema */ }
    }
  ]
}));
```

## 🔧 Development Workflow

### Testing Your MCP Server
```bash
# Install MCP Inspector for testing
npm install -g @modelcontextprotocol/inspector

# Test your server
npx @modelcontextprotocol/inspector node dist/index.js
```

### Integration with Claude Desktop
```json
{
  "mcpServers": {
    "your-server": {
      "command": "node",
      "args": ["path/to/your/server/dist/index.js"]
    }
  }
}
```

## 📖 Learning Path

1. **Start with Quick Reference** - Get familiar with essential patterns
2. **Read Implementation Guide** - Understand architecture and best practices
3. **Explore Example Project** - See patterns in action
4. **Build Your Own** - Create a custom MCP server using the patterns

## 🤝 Contributing

This project is designed as a learning resource. Feel free to:

- Suggest improvements to documentation
- Add more example tools
- Share your own MCP implementations
- Report issues or unclear explanations

## 📄 License

MIT License - Feel free to use this for learning and building your own MCP servers.

## 🔗 Additional Resources

- [Official MCP Documentation](https://modelcontextprotocol.io/)
- [MCP SDK on GitHub](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Desktop Configuration Guide](https://claude.ai/docs)

---

**Happy MCP Development! 🚀**