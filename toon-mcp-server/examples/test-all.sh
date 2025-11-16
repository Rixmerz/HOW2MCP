#!/bin/bash

# Test script for TOON MCP Server
# Demonstrates all available operations

echo "===== TOON MCP Server Test Suite ====="
echo ""

echo "1. Testing Initialize..."
echo "Request:"
cat examples/01-initialize.toon
echo ""
echo "Response:"
(cat examples/01-initialize.toon && echo "") | node dist/index.js 2>/dev/null
echo "========================================"
echo ""

echo "2. Testing Tools List..."
echo "Request:"
cat examples/02-tools-list.toon
echo ""
echo "Response:"
(cat examples/02-tools-list.toon && echo "") | node dist/index.js 2>/dev/null
echo "========================================"
echo ""

echo "3. Testing Get Weather (Tokyo)..."
echo "Request:"
cat examples/03-get-weather.toon
echo ""
echo "Response:"
(cat examples/03-get-weather.toon && echo "") | node dist/index.js 2>/dev/null
echo "========================================"
echo ""

echo "4. Testing Get Weather (New York)..."
cat > /tmp/weather-ny.toon << 'EOF'
jsonrpc: "2.0"
id: 4
method: tools/call
params:
  name: get_weather
  arguments:
    city: New York
EOF
echo "Request:"
cat /tmp/weather-ny.toon
echo ""
echo "Response:"
(cat /tmp/weather-ny.toon && echo "") | node dist/index.js 2>/dev/null
echo "========================================"
echo ""

echo "5. Testing Invalid City..."
cat > /tmp/weather-invalid.toon << 'EOF'
jsonrpc: "2.0"
id: 5
method: tools/call
params:
  name: get_weather
  arguments:
    city: InvalidCity
EOF
echo "Request:"
cat /tmp/weather-invalid.toon
echo ""
echo "Response:"
(cat /tmp/weather-invalid.toon && echo "") | node dist/index.js 2>/dev/null
echo "========================================"
echo ""

echo "All tests completed!"
