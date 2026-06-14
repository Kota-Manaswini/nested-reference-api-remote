#!/bin/bash

# Test Authentication for Nested Reference API Remote MCP Server
# This script tests various authentication scenarios

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_URL="${SERVER_URL:-http://localhost:3456}"
API_KEY="${API_KEY:-secret-key}"

echo "=========================================="
echo "Authentication Test Suite"
echo "=========================================="
echo "Server URL: $SERVER_URL"
echo "API Key: $API_KEY"
echo ""

# Test 1: Health check (should work without auth)
echo -e "${YELLOW}Test 1: Health Check (No Auth Required)${NC}"
response=$(curl -s -w "\n%{http_code}" "$SERVER_URL/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Health check accessible without authentication"
    echo "Response: $body"
else
    echo -e "${RED}✗ FAILED${NC} - Expected 200, got $http_code"
fi
echo ""

# Test 2: Root endpoint (should work without auth)
echo -e "${YELLOW}Test 2: Root Endpoint (No Auth Required)${NC}"
response=$(curl -s -w "\n%{http_code}" "$SERVER_URL/")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Root endpoint accessible without authentication"
    echo "Response: $body"
else
    echo -e "${RED}✗ FAILED${NC} - Expected 200, got $http_code"
fi
echo ""

# Test 3: MCP endpoint without authentication (should fail if auth enabled)
echo -e "${YELLOW}Test 3: MCP Endpoint Without Authentication${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$SERVER_URL/mcp" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "401" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Authentication required (401 Unauthorized)"
    echo "Response: $body"
elif [ "$http_code" = "200" ]; then
    echo -e "${YELLOW}⚠ WARNING${NC} - Authentication is disabled (200 OK)"
    echo "Response: $body"
else
    echo -e "${RED}✗ FAILED${NC} - Unexpected status code: $http_code"
fi
echo ""

# Test 4: MCP endpoint with invalid API key (should fail)
echo -e "${YELLOW}Test 4: MCP Endpoint With Invalid API Key${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$SERVER_URL/mcp" \
    -H "Content-Type: application/json" \
    -H "x-api-key: invalid-key-xyz" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "403" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Invalid API key rejected (403 Forbidden)"
    echo "Response: $body"
elif [ "$http_code" = "200" ]; then
    echo -e "${YELLOW}⚠ WARNING${NC} - Authentication is disabled (200 OK)"
    echo "Response: $body"
else
    echo -e "${RED}✗ FAILED${NC} - Unexpected status code: $http_code"
fi
echo ""

# Test 5: MCP endpoint with valid API key - tools/list
echo -e "${YELLOW}Test 5: Tools List With Valid API Key${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$SERVER_URL/mcp" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Tools list accessible with valid API key"
    echo "Response preview: $(echo "$body" | head -c 200)..."
else
    echo -e "${RED}✗ FAILED${NC} - Expected 200, got $http_code"
    echo "Response: $body"
fi
echo ""

# Test 6: MCP endpoint with valid API key - initialize
echo -e "${YELLOW}Test 6: Initialize With Valid API Key${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$SERVER_URL/mcp" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Initialize successful with valid API key"
    echo "Response: $body"
else
    echo -e "${RED}✗ FAILED${NC} - Expected 200, got $http_code"
    echo "Response: $body"
fi
echo ""

# Test 7: Tool call with valid API key
echo -e "${YELLOW}Test 7: Tool Call With Valid API Key${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$SERVER_URL/mcp" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d @- << 'EOF'
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "process_customer_order_with_references",
    "arguments": {
      "customer": {
        "name": "Test User",
        "email": "test@example.com",
        "address": {
          "street": "123 Test St",
          "city": "Test City",
          "state": "TS",
          "zipcode": "12345",
          "country": "USA"
        }
      },
      "order": {
        "order_id": "TEST-001",
        "items": [
          {
            "product": {
              "product_id": "PROD-001",
              "name": "Test Product"
            },
            "quantity": 1,
            "price": 99.99
          }
        ]
      }
    }
  }
}
EOF
)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Tool call successful with valid API key"
    echo "Response preview: $(echo "$body" | head -c 200)..."
else
    echo -e "${RED}✗ FAILED${NC} - Expected 200, got $http_code"
    echo "Response: $body"
fi
echo ""

# Summary
echo "=========================================="
echo "Test Suite Complete"
echo "=========================================="
echo ""
echo "Usage:"
echo "  Default: ./test-authentication.sh"
echo "  Custom:  SERVER_URL=https://your-server.com API_KEY=your-key ./test-authentication.sh"
echo ""

# Made with Bob
