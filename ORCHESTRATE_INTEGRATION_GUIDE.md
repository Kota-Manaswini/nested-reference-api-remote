# Orchestrate Integration Guide

This guide shows how to expose your MCP server via ngrok and integrate it with the Orchestrate platform.

## Prerequisites

- ngrok installed ([download here](https://ngrok.com/download))
- Orchestrate CLI installed
- Server running locally on port 3456

## Step 1: Start Your MCP Server

```bash
cd /Users/sumanjalisykam/Downloads/inventory-mcp-server-remote/nested-reference-api-remote
npm run dev
```

Server should be running on `http://localhost:3456`

## Step 2: Expose Server via ngrok

Open a new terminal and run:

```bash
ngrok http 3456
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3456
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

## Step 3: Test ngrok URL

Test that your server is accessible:

```bash
# Test health endpoint
curl https://abc123.ngrok.io/health

# Test MCP endpoint with authentication
curl -X POST https://abc123.ngrok.io/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: secret-key" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Step 4: Add Connection to Orchestrate

### 4.1 Add the connection
```bash
orchestrate connections add --app-id nested_reference_mcp
```

### 4.2 Configure for draft environment
```bash
orchestrate connections configure \
  --app-id nested_reference_mcp \
  --env draft \
  --kind api-key \
  --type team
```

### 4.3 Configure for live environment
```bash
orchestrate connections configure \
  --app-id nested_reference_mcp \
  --env live \
  --kind api-key \
  --type team
```

### 4.4 Set credentials for draft
```bash
orchestrate connections set-credentials \
  --app-id nested_reference_mcp \
  --env draft \
  --api_key secret-key
```

### 4.5 Set credentials for live
```bash
orchestrate connections set-credentials \
  --app-id nested_reference_mcp \
  --env live \
  --api_key secret-key
```

## Step 5: Add Toolkit to Orchestrate

Replace `YOUR_NGROK_URL` with your actual ngrok URL:

```bash
orchestrate toolkits add \
  --kind mcp \
  --name nested_reference_mcp \
  --description "Remote MCP tools for Customer Order Processing with Nested References" \
  --url "YOUR_NGROK_URL/mcp" \
  --transport "streamable_http" \
  --tools "*" \
  --app-id "nested_reference_mcp"
```

### Example with actual URL:
```bash
orchestrate toolkits add \
  --kind mcp \
  --name nested_reference_mcp \
  --description "Remote MCP tools for Customer Order Processing with Nested References" \
  --url "https://bba9-2401-4900-977d-a1d1-f560-550d-1dbe-7a64.ngrok-free.app/mcp" \
  --transport "streamable_http" \
  --tools "*" \
  --app-id "nested_reference_mcp"
```

## Step 6: Verify Integration

### 6.1 List toolkits
```bash
orchestrate toolkits list
```

You should see `nested_reference_mcp` in the list.

### 6.2 List tools in the toolkit
```bash
orchestrate toolkits describe --name nested_reference_mcp
```

You should see:
- `process_customer_order_with_references`

## Complete Setup Script

Here's a complete script you can run (replace YOUR_NGROK_URL):

```bash
#!/bin/bash

# Set your ngrok URL here
NGROK_URL="https://abc123.ngrok.io"
APP_ID="nested_reference_mcp"
API_KEY="secret-key"

echo "Setting up Orchestrate integration for Nested Reference MCP..."

# Add connection
echo "1. Adding connection..."
orchestrate connections add --app-id $APP_ID

# Configure draft environment
echo "2. Configuring draft environment..."
orchestrate connections configure \
  --app-id $APP_ID \
  --env draft \
  --kind api-key \
  --type team

# Configure live environment
echo "3. Configuring live environment..."
orchestrate connections configure \
  --app-id $APP_ID \
  --env live \
  --kind api-key \
  --type team

# Set draft credentials
echo "4. Setting draft credentials..."
orchestrate connections set-credentials \
  --app-id $APP_ID \
  --env draft \
  --api_key $API_KEY

# Set live credentials
echo "5. Setting live credentials..."
orchestrate connections set-credentials \
  --app-id $APP_ID \
  --env live \
  --api_key $API_KEY

# Add toolkit
echo "6. Adding toolkit..."
orchestrate toolkits add \
  --kind mcp \
  --name $APP_ID \
  --description "Remote MCP tools for Customer Order Processing with Nested References" \
  --url "$NGROK_URL/mcp" \
  --transport "streamable_http" \
  --tools "*" \
  --app-id $APP_ID

echo "✅ Setup complete!"
echo ""
echo "Verify with:"
echo "  orchestrate toolkits list"
echo "  orchestrate toolkits describe --name $APP_ID"
```

## Authentication Headers

The Orchestrate platform will automatically include the API key in requests using the `x-api-key` header format that we implemented.

When Orchestrate calls your MCP server, it will send:
```
POST YOUR_NGROK_URL/mcp
Headers:
  Content-Type: application/json
  x-api-key: secret-key
```

## Available Tools

Once integrated, you'll have access to:

### `process_customer_order_with_references`
Process customer orders with nested address references demonstrating the $ref pattern from GitHub Issue #45755.

**Example usage in Orchestrate:**
```json
{
  "tool": "process_customer_order_with_references",
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
```

## Troubleshooting

### Issue: "Connection refused"
**Solution**: Make sure your local server is running and ngrok is active

### Issue: "Authentication failed"
**Solution**: Verify the API key is set correctly in Orchestrate credentials

### Issue: "Tool not found"
**Solution**: 
- Check that the toolkit was added successfully
- Verify the ngrok URL is correct and accessible
- Ensure the server is responding to `/mcp` endpoint

### Issue: ngrok URL changes
**Solution**: 
- Free ngrok URLs change on restart
- Update the toolkit URL:
```bash
orchestrate toolkits update \
  --name nested_reference_mcp \
  --url "NEW_NGROK_URL/mcp"
```
- Or use a paid ngrok plan for a static URL

## Production Deployment

For production, instead of ngrok:

1. Deploy to a cloud platform (Render, Heroku, AWS, etc.)
2. Get a permanent URL (e.g., `https://nested-reference-api.onrender.com`)
3. Update the toolkit URL to use the permanent URL

Example for Render deployment:
```bash
orchestrate toolkits update \
  --name nested_reference_mcp \
  --url "https://nested-reference-api-remote.onrender.com/mcp"
```

## Security Notes

- The `x-api-key` header is used for authentication
- Keep your API keys secure and don't commit them to version control
- Use different API keys for draft and live environments
- Rotate API keys regularly
- Monitor access logs for suspicious activity

## Quick Reference

### Start Server
```bash
npm run dev
```

### Start ngrok
```bash
ngrok http 3456
```

### Test Endpoint
```bash
curl -X POST https://YOUR_NGROK_URL/mcp \
  -H "x-api-key: secret-key" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Update Toolkit URL
```bash
orchestrate toolkits update --name nested_reference_mcp --url "NEW_URL/mcp"
```

---

**Need Help?** 
- Check server logs for errors
- Verify ngrok is forwarding correctly
- Test the MCP endpoint directly with curl
- Review AUTHENTICATION.md for authentication details