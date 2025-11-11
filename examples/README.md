# MCP Examples - Progressive Learning Path

This directory contains progressive examples from simple to production-ready MCP servers.

## 📚 Learning Path

### 1️⃣ Quickstart (5 minutes)
**File:** `quickstart.ts`

The absolute simplest MCP server - just 15 lines of actual code!

```bash
npx tsx examples/quickstart.ts
```

**What you'll learn:**
- Basic MCP server structure
- Tool registration
- Request handling
- Transport connection

---

### 2️⃣ Basic Server (15 minutes)
**File:** `01-basic.ts`

A simple server with multiple tools and basic patterns.

```bash
npx tsx examples/01-basic.ts
```

**What you'll learn:**
- Multiple tool registration
- Simple pattern matching
- Basic JSON Schema definitions
- Standard MCP response format

**Tools included:**
- `echo` - Text echo
- `add` - Number addition

---

### 3️⃣ Intermediate Server (30 minutes)
**File:** `02-intermediate.ts`

Production patterns with validation and error handling.

```bash
npx tsx examples/02-intermediate.ts
```

**What you'll learn:**
- Zod schema validation
- Type-safe tool arguments
- Proper error handling with McpError
- Multiple tool patterns

**Tools included:**
- `echo` - Text echo with transformations
- `calculator` - Mathematical operations
- `data-processor` - Array processing

---

### 4️⃣ Advanced Server (45 minutes)
**File:** `03-advanced.ts`

2025 patterns: streaming, resources, async operations.

```bash
npx tsx examples/03-advanced.ts
```

**What you'll learn:**
- Streaming progress notifications
- Resource management
- Async operations with timeout
- Error recovery patterns
- System status resources

**Tools included:**
- `streaming-task` - Multi-step task with progress
- `async-fetch` - HTTP requests with error handling

**Resources included:**
- `system://status` - Server health and metrics

---

### 5️⃣ Production Server (See MCP_EXAMPLE_PROJECT)
**Location:** `../MCP_EXAMPLE_PROJECT/`

Full production-ready implementation with:
- Multi-layer caching
- Rate limiting
- Comprehensive logging
- Testing suite
- CI/CD integration

---

## 🧪 Testing Your Servers

### Method 1: MCP Inspector (Visual)
```bash
# Install inspector globally
npm install -g @modelcontextprotocol/inspector

# Test any example
npx @modelcontextprotocol/inspector npx tsx examples/quickstart.ts
npx @modelcontextprotocol/inspector npx tsx examples/01-basic.ts
npx @modelcontextprotocol/inspector npx tsx examples/02-intermediate.ts
npx @modelcontextprotocol/inspector npx tsx examples/03-advanced.ts
```

### Method 2: MCP CLI (Command Line)
```bash
# Install CLI globally
npm install -g @modelcontextprotocol/cli

# Test any example
npx @modelcontextprotocol/cli npx tsx examples/quickstart.ts
```

### Method 3: Claude Desktop Integration
Add to your Claude Desktop config (`~/.config/claude-desktop/config.json`):

```json
{
  "mcpServers": {
    "quickstart": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/examples/quickstart.ts"]
    },
    "basic": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/examples/01-basic.ts"]
    },
    "intermediate": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/examples/02-intermediate.ts"]
    },
    "advanced": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/examples/03-advanced.ts"]
    }
  }
}
```

---

## 📦 Dependencies

All examples require:

```bash
npm install @modelcontextprotocol/sdk zod zod-to-json-schema
npm install -D typescript @types/node tsx
```

---

## 🎯 Quick Comparison

| Example | Lines of Code | Features | Best For |
|---------|--------------|----------|----------|
| Quickstart | ~15 | Basic tool | Learning MCP basics |
| Basic | ~50 | Multiple tools | Understanding patterns |
| Intermediate | ~100 | Validation, errors | Building real servers |
| Advanced | ~150 | Streaming, resources | Production features |
| Production | ~700 | Full stack | Enterprise deployment |

---

## 💡 Pro Tips

1. **Start with Quickstart** - Get familiar with MCP concepts
2. **Build on Basic** - Add your own tools to learn patterns
3. **Master Intermediate** - Validation is crucial for production
4. **Explore Advanced** - 2025 patterns like streaming are powerful
5. **Study Production** - Learn from complete implementation

---

## 🐛 Common Issues

### Server won't start
- Check Node.js version (18+ required)
- Verify all dependencies are installed
- Ensure file has executable permissions

### Tools not showing in Claude Desktop
- Verify absolute paths in config
- Check server logs for errors
- Restart Claude Desktop after config changes

### Validation errors
- Review Zod schema definitions
- Check JSON Schema conversion
- Test with MCP Inspector first

---

## 🔗 Next Steps

After completing these examples:

1. Read `/MCP-DOCS/MCP_ARCHITECTURE_2025.md` for architecture deep dive
2. Review `/MCP-DOCS/MCP_ADVANCED_PATTERNS_2025.md` for production patterns
3. Explore `/MCP_EXAMPLE_PROJECT/` for complete implementation
4. Check `/MCP-DOCS/MCP_CHECKLIST_2025.md` before production deployment

---

## 🤝 Contributing

Found these examples helpful? Have suggestions for improvements?
- Submit a PR with new examples
- Report issues or unclear explanations
- Share your own MCP server implementations

---

**Happy MCP Building! 🚀**
