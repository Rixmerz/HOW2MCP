# TOON MCP Server

A Model Context Protocol (MCP) server that **natively consumes and returns TOON format** instead of JSON, demonstrating 30-60% token savings for LLM interactions.

## What is TOON?

TOON (Token-Oriented Object Notation) is a compact, human-readable data format designed for LLM applications. It provides the same data model as JSON but with significantly fewer tokens.

- **Official Spec**: https://github.com/toon-format/toon
- **Token Savings**: 30-60% fewer tokens vs formatted JSON
- **Compatibility**: Lossless conversion to/from JSON

## Features

- ✅ **100% TOON Native** - Both input and output use TOON format
- ✅ **MCP Compliant** - Follows Model Context Protocol specification
- ✅ **Simple Example** - Hardcoded weather data for demonstration
- ✅ **Token Efficient** - Demonstrates TOON's efficiency benefits

## Installation

```bash
cd toon-mcp-server
npm install
npm run build
```

## Usage

### Start the Server

```bash
npm start
```

The server runs on stdio, accepting TOON-formatted messages on stdin and returning TOON-formatted responses on stdout.

### Manual Testing

The server reads TOON-formatted messages from stdin. **Important:** Each message must be followed by an empty line to signal the end of the message.

#### Quick Test with Examples

Run the complete test suite:

```bash
./examples/test-all.sh
```

#### 1. Initialize

**Input (TOON):**
```bash
(cat examples/01-initialize.toon && echo "") | npm start
```

**Response:**
```toon
jsonrpc: "2.0"
id: 1
result:
  protocolVersion: 2024-11-05
  capabilities:
    tools:
  serverInfo:
    name: toon-mcp-server
    version: 1.0.0
```

#### 2. List Tools

**Input (TOON):**
```bash
(cat examples/02-tools-list.toon && echo "") | npm start
```

**Response:**
```toon
jsonrpc: "2.0"
id: 2
result:
  tools[1]:
    - name: get_weather
      description: Get current weather information for a city
      inputSchema:
        type: object
        properties:
          city:
            type: string
            description: "City name (e.g., New York, London, Tokyo, Paris, Sydney)"
        required[1]: city
```

#### 3. Call Weather Tool

**Input (TOON):**
```bash
(cat examples/03-get-weather.toon && echo "") | npm start
```

**Response:**
```toon
jsonrpc: "2.0"
id: 3
result:
  content[1]{type,text}:
    text,"Weather in Tokyo:\nTemperature: 68°F\nCondition: Cloudy\nHumidity: 70%"
```

## Available Tools

### `get_weather`

Get current weather information for a city.

**Input Schema:**
```toon
type: object
properties:
  city:
    type: string
    description: City name
required[1]:
  city
```

**Supported Cities:**
- New York
- London
- Tokyo
- Paris
- Sydney

**Example Request:**
```toon
jsonrpc: "2.0"
id: 1
method: tools/call
params:
  name: get_weather
  arguments:
    city: Tokyo
```

**Example Response:**
```toon
jsonrpc: "2.0"
id: 1
result:
  content[1]:
    type: text
    text: "Weather in Tokyo:
Temperature: 68°F
Condition: Cloudy
Humidity: 70%"
```

## TOON Format Benefits

### Token Comparison

**JSON Request (formatted):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": {
      "city": "New York"
    }
  }
}
```
**~140 tokens**

**TOON Request:**
```toon
jsonrpc: "2.0"
id: 1
method: tools/call
params:
  name: get_weather
  arguments:
    city: New York
```
**~70 tokens (50% reduction)**

## Development

### Watch Mode

```bash
npm run watch
```

### Project Structure

```
toon-mcp-server/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

1. **TOON Parser**: Reads TOON from stdin using `@toon-format/toon`
2. **MCP Protocol**: Handles standard MCP methods (initialize, tools/list, tools/call)
3. **TOON Serializer**: Converts responses back to TOON format
4. **Stdio Transport**: Writes TOON to stdout

## Limitations

- **Claude Desktop Compatibility**: This server uses custom TOON transport and won't work with standard MCP clients expecting JSON-RPC
- **Ecosystem Support**: TOON is not yet widely adopted in the MCP ecosystem
- **Proof of Concept**: This is a demonstration of TOON's potential, not production-ready

## Use Cases

- **Research**: Demonstrate token efficiency benefits of TOON
- **Benchmarking**: Compare token usage between JSON and TOON
- **Education**: Learn about TOON format and MCP protocol
- **Experimentation**: Test custom transport layers in MCP

## Technical Details

### TOON Library

This server uses the official `@toon-format/toon` package:
- **Version**: 2.0.3+
- **Repository**: https://github.com/toon-format/toon
- **API**: `encode()` (JS → TOON), `decode()` (TOON → JS)

### MCP Protocol Version

- **Protocol**: Model Context Protocol 2024-11-05
- **Transport**: stdio (TOON-formatted)
- **Capabilities**: Tools only (no resources/prompts)

## Future Enhancements

- [ ] Add more example tools with array-heavy responses (shows TOON's strength)
- [ ] Implement resources with TOON format
- [ ] Add prompts support
- [ ] Performance benchmarking suite
- [ ] JSON-RPC fallback mode for compatibility
- [ ] HTTP+SSE transport with TOON

## Contributing

This is an experimental proof-of-concept. Contributions and feedback welcome!

## License

MIT

## References

- [TOON Format Specification](https://github.com/toon-format/toon)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
