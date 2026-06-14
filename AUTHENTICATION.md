# Authentication Guide

This document explains how to configure and use authentication for the Nested Reference API Remote MCP Server.

## Overview

The MCP server supports API key-based authentication using the `x-api-key` header to secure access to tools. Authentication is applied to:
- **tools/list** endpoint - Lists available tools
- **tools/call** endpoint - Executes tool calls

Public endpoints (health check and root) remain accessible without authentication.

## Configuration

### Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Configure the following variables:

```env
# Enable authentication
MCP_AUTH_ENABLED=true

# API Keys (comma-separated)
MCP_API_KEYS=secret-key
```

For production, replace `secret-key` with a secure generated key.

### Generating Secure API Keys

Generate cryptographically secure API keys using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example output:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### Multiple API Keys

You can configure multiple API keys for different clients:

```env
MCP_API_KEYS=key1-for-client-a,key2-for-client-b,key3-for-client-c
```

## Authentication Behavior

### Development Mode

When `NODE_ENV` is not set to `production` and no API keys are configured:
- A temporary API key is automatically generated
- The key is displayed in the console on startup
- This is for development convenience only

### Production Mode

In production (`NODE_ENV=production`):
- You **must** configure `MCP_API_KEYS`
- No automatic key generation occurs
- All MCP endpoints require valid authentication

### Disabling Authentication

To disable authentication entirely:

```env
MCP_AUTH_ENABLED=false
```

Or simply don't set `MCP_API_KEYS` in development mode.

## Using Authentication

### HTTP Request Format

Include the API key in the `x-api-key` header:

```bash
curl -X POST https://your-server.com/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: secret-key" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### MCP Client Configuration

Configure your MCP client with authentication:

```json
{
  "mcpServers": {
    "nested-reference-api": {
      "url": "https://your-server.com/mcp",
      "transport": "http",
      "headers": {
        "x-api-key": "secret-key"
      }
    }
  }
}
```

### JavaScript/TypeScript Example

```typescript
import axios from 'axios';

const response = await axios.post('https://your-server.com/mcp', {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list'
}, {
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'secret-key'
  }
});
```

### Python Example

```python
import requests

response = requests.post(
    'https://your-server.com/mcp',
    json={
        'jsonrpc': '2.0',
        'id': 1,
        'method': 'tools/list'
    },
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'secret-key'
    }
)
```

## Error Responses

### Missing API Key Header

**Status Code:** 401 Unauthorized

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

### Invalid API Key

**Status Code:** 403 Forbidden

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

## Checking Authentication Status

### Health Check Endpoint

The health check endpoint shows authentication configuration:

```bash
curl https://your-server.com/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-16T10:30:00.000Z",
  "service": "nested-reference-api-remote",
  "transport": "HTTP",
  "authentication": {
    "enabled": true,
    "configured_keys": 3
  }
}
```

### Root Endpoint

The root endpoint provides authentication information:

```bash
curl https://your-server.com/
```

Response:
```json
{
  "message": "Customer Order API with Nested References - Remote MCP Server",
  "version": "1.0.0",
  "transport": "HTTP",
  "authentication": {
    "enabled": true,
    "required": true,
    "header_format": "Authorization: Bearer <api-key>"
  },
  "endpoints": {
    "health": "/health",
    "mcp": "/mcp (requires authentication)"
  }
}
```

## Security Best Practices

1. **Use Strong Keys**: Generate keys with at least 32 bytes of entropy
2. **Rotate Keys Regularly**: Change API keys periodically
3. **Use HTTPS**: Always use HTTPS in production to protect keys in transit
4. **Environment Variables**: Never commit `.env` files to version control
5. **Separate Keys**: Use different keys for different environments (dev, staging, prod)
6. **Monitor Access**: Log authentication attempts and monitor for suspicious activity
7. **Revoke Compromised Keys**: Immediately remove compromised keys from `MCP_API_KEYS`

## Deployment Considerations

### Render.com

Set environment variables in the Render dashboard:

1. Go to your service settings
2. Navigate to "Environment" tab
3. Add environment variables:
   - `MCP_AUTH_ENABLED=true`
   - `MCP_API_KEYS=your-production-keys`

### Docker

Pass environment variables when running the container:

```bash
docker run -e MCP_AUTH_ENABLED=true \
  -e MCP_API_KEYS=key1,key2 \
  -p 3456:3456 \
  nested-reference-api-remote
```

Or use a `.env` file:

```bash
docker run --env-file .env \
  -p 3456:3456 \
  nested-reference-api-remote
```

## Troubleshooting

### Authentication Not Working

1. Check that `MCP_AUTH_ENABLED=true` is set
2. Verify API keys are correctly configured in `MCP_API_KEYS`
3. Ensure no extra spaces in the comma-separated key list
4. Check that the Authorization header is being sent correctly

### Keys Not Loading

1. Verify `.env` file is in the project root
2. Check that dotenv is properly configured
3. Restart the server after changing environment variables
4. Check server logs for configuration warnings

### Development Key Not Showing

1. Ensure `NODE_ENV` is not set to `production`
2. Check that `MCP_API_KEYS` is empty or not set
3. Look for the warning message in console output

## Support

For issues or questions about authentication:
- Check the server logs for detailed error messages
- Review the health endpoint for configuration status
- Ensure your client is sending the Authorization header correctly

---

Made with Bob