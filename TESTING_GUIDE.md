# Testing Guide - Authentication Implementation

This guide provides step-by-step instructions to test the authentication implementation.

## Prerequisites

- Node.js 18+ installed
- Terminal/Command line access
- curl installed (for manual testing)

## Step 1: Setup Environment

### 1.1 Navigate to the project directory
```bash
cd /Users/sumanjalisykam/Downloads/inventory-mcp-server-remote/nested-reference-api-remote
```

### 1.2 Install dependencies
```bash
npm install
```

This will install:
- dotenv (for environment variables)
- All other required dependencies

### 1.3 Create environment file
```bash
cp .env.example .env
```

Your `.env` file should contain:
```env
MCP_AUTH_ENABLED=true
MCP_API_KEYS=secret-key
PORT=3456
NODE_ENV=development
```

## Step 2: Start the Server

### Option A: Development Mode (with auto-reload)
```bash
npm run dev
```

### Option B: Production Mode
```bash
npm run build
npm start
```

You should see output like:
```
Nested Reference API Remote MCP Server running on port 3456
Health check: http://localhost:3456/health
MCP endpoint: http://localhost:3456/mcp
Transport: HTTP (JSON-RPC over HTTP POST)
```

## Step 3: Test Using the Automated Test Suite

### 3.1 Open a new terminal window
Keep the server running in the first terminal, open a second terminal.

### 3.2 Navigate to the project directory
```bash
cd /Users/sumanjalisykam/Downloads/inventory-mcp-server-remote/nested-reference-api-remote
```

### 3.3 Run the test suite
```bash
./test-authentication.sh
```

Expected output:
```
==========================================
Authentication Test Suite
==========================================
Server URL: http://localhost:3456
API Key: secret-key

Test 1: Health Check (No Auth Required)
✓ PASSED - Health check accessible without authentication

Test 2: Root Endpoint (No Auth Required)
✓ PASSED - Root endpoint accessible without authentication

Test 3: MCP Endpoint Without Authentication
✓ PASSED - Authentication required (401 Unauthorized)

Test 4: MCP Endpoint With Invalid API Key
✓ PASSED - Invalid API key rejected (403 Forbidden)

Test 5: Tools List With Valid API Key
✓ PASSED - Tools list accessible with valid API key

Test 6: Initialize With Valid API Key
✓ PASSED - Initialize successful with valid API key

Test 7: Tool Call With Valid API Key
✓ PASSED - Tool call successful with valid API key

==========================================
Test Suite Complete
==========================================
```

## Step 4: Manual Testing with curl

### 4.1 Test Health Endpoint (No Auth Required)
```bash
curl http://localhost:3456/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-16T10:30:00.000Z",
  "service": "nested-reference-api-remote",
  "transport": "HTTP",
  "authentication": {
    "enabled": true,
    "configured_keys": 1
  }
}
```

### 4.2 Test Root Endpoint (No Auth Required)
```bash
curl http://localhost:3456/
```

Expected response:
```json
{
  "message": "Customer Order API with Nested References - Remote MCP Server",
  "version": "1.0.0",
  "transport": "HTTP",
  "authentication": {
    "enabled": true,
    "required": true,
    "header_format": "x-api-key: <your-api-key>"
  },
  "endpoints": {
    "health": "/health",
    "mcp": "/mcp (requires authentication)"
  }
}
```

### 4.3 Test MCP Endpoint WITHOUT Authentication (Should Fail)
```bash
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Expected response (401 Error):
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "Authentication required",
    "data": {
      "details": "Missing x-api-key header. Use: x-api-key: <your-api-key>"
    }
  }
}
```

### 4.4 Test MCP Endpoint WITH Invalid API Key (Should Fail)
```bash
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: wrong-key" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Expected response (403 Error):
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32002,
    "message": "Invalid API key",
    "data": {
      "details": "The provided API key is not valid"
    }
  }
}
```

### 4.5 Test MCP Endpoint WITH Valid API Key (Should Succeed)
```bash
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: secret-key" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Expected response (200 Success):
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "process_customer_order_with_references",
        "description": "Process customer orders with nested address references...",
        "inputSchema": { ... }
      }
    ]
  }
}
```

### 4.6 Test Tool Call WITH Valid API Key
```bash
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: secret-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "process_customer_order_with_references",
      "arguments": {
        "customer": {
          "name": "Jane Smith",
          "email": "jane@example.com",
          "address": {
            "street": "456 Oak Avenue",
            "city": "New York",
            "state": "NY",
            "zipcode": "10001",
            "country": "USA"
          }
        },
        "order": {
          "order_id": "ORD-2024-001",
          "items": [
            {
              "product": {
                "product_id": "PROD-001",
                "name": "Premium Laptop"
              },
              "quantity": 1,
              "price": 1299.99
            }
          ]
        }
      }
    }
  }'
```

## Step 5: Test with Different API Keys

### 5.1 Add multiple API keys to .env
```env
MCP_API_KEYS=secret-key,another-key,third-key
```

### 5.2 Restart the server
Press `Ctrl+C` in the server terminal, then:
```bash
npm run dev
```

### 5.3 Test with different keys
```bash
# Test with first key
curl -X POST http://localhost:3456/mcp \
  -H "x-api-key: secret-key" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Test with second key
curl -X POST http://localhost:3456/mcp \
  -H "x-api-key: another-key" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Test with third key
curl -X POST http://localhost:3456/mcp \
  -H "x-api-key: third-key" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

All three should succeed!

## Step 6: Test Authentication Disabled

### 6.1 Disable authentication in .env
```env
MCP_AUTH_ENABLED=false
```

### 6.2 Restart the server
```bash
npm run dev
```

### 6.3 Test without API key (should now work)
```bash
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

This should now return a successful response without requiring authentication.

## Step 7: Test with Postman (Optional)

### 7.1 Open Postman

### 7.2 Create a new POST request
- URL: `http://localhost:3456/mcp`
- Method: POST

### 7.3 Add Headers
- `Content-Type`: `application/json`
- `x-api-key`: `secret-key`

### 7.4 Add Body (raw JSON)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

### 7.5 Send Request
You should receive a successful response with the tools list.

## Troubleshooting

### Issue: "Cannot find module 'dotenv'"
**Solution**: Run `npm install` to install dependencies

### Issue: "Port 3456 already in use"
**Solution**: 
- Kill the existing process: `lsof -ti:3456 | xargs kill -9`
- Or change the port in `.env`: `PORT=3457`

### Issue: Authentication not working
**Solution**: 
- Check `.env` file exists and has correct values
- Restart the server after changing `.env`
- Verify `MCP_AUTH_ENABLED=true` is set

### Issue: Test script not executable
**Solution**: 
```bash
chmod +x test-authentication.sh
```

### Issue: curl command not found
**Solution**: 
- macOS: curl is pre-installed
- Windows: Use Git Bash or install curl
- Linux: `sudo apt-get install curl`

## Quick Test Commands

### All-in-One Test
```bash
# Start server in background
npm run dev &

# Wait for server to start
sleep 3

# Run tests
./test-authentication.sh

# Stop server
pkill -f "node.*index"
```

### Single Command Test
```bash
# Test with valid key
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: secret-key" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq
```

(Note: `jq` is optional for pretty-printing JSON)

## Success Criteria

✅ Health endpoint accessible without authentication  
✅ Root endpoint accessible without authentication  
✅ MCP endpoint returns 401 without API key  
✅ MCP endpoint returns 403 with invalid API key  
✅ MCP endpoint returns 200 with valid API key  
✅ Tools list works with authentication  
✅ Tool calls work with authentication  

---

**Need Help?** Check the AUTHENTICATION.md file for detailed documentation.