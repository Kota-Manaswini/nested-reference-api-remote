#!/bin/bash

# Test the tool call endpoint locally
BASE_URL="${1:-http://localhost:3456}"

echo "=========================================="
echo "Testing MCP Tool Call"
echo "Base URL: $BASE_URL"
echo "=========================================="
echo ""

# Test tool call with payload
echo "Test: Call process_customer_order_with_references tool"
echo "-------------------------------------------------------"
curl -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "process_customer_order_with_references",
      "arguments": {
        "customer": {
          "name": "Jane Smith",
          "email": "jane.smith@email.com",
          "address": {
            "street": "456 Oak Avenue",
            "city": "New York",
            "state": "NY",
            "zipcode": "10001",
            "country": "USA"
          },
          "contact": {
            "phone": "+1-555-0200",
            "mobile": "+1-555-0201"
          },
          "entityType": "INDIVIDUAL",
          "customerId": "CUST-001"
        },
        "order": {
          "order_id": "ORD-2024-002",
          "order_date": "2024-01-16",
          "items": [
            {
              "product": {
                "product_id": "PROD-001",
                "name": "Premium Laptop",
                "details": {
                  "description": "High-performance laptop for professionals",
                  "specifications": {
                    "weight": "1.5 kg",
                    "dimensions": "35cm x 25cm x 2cm",
                    "material": "Aluminum alloy"
                  }
                }
              },
              "quantity": 1,
              "price": 1299.99,
              "delivery_address": [
                {
                  "street": "456 Oak Avenue",
                  "city": "New York",
                  "state": "NY",
                  "zipcode": "10001",
                  "country": "USA"
                }
              ]
            }
          ],
          "shipping_address": {
            "street": "456 Oak Avenue",
            "city": "New York",
            "state": "NY",
            "zipcode": "10001",
            "country": "USA"
          },
          "billing_address": {
            "street": "789 Pine Street",
            "city": "New York",
            "state": "NY",
            "zipcode": "10002",
            "country": "USA"
          },
          "shipping_locations": [
            {
              "location_id": "LOC-001",
              "location_name": "Primary Warehouse",
              "address": [
                {
                  "street": "456 Oak Avenue",
                  "city": "New York",
                  "state": "NY",
                  "zipcode": "10001",
                  "country": "USA"
                }
              ],
              "entityType": "WAREHOUSE"
            }
          ]
        }
      }
    }
  }' | jq '.'

echo ""
echo "=========================================="
echo "Test Complete"
echo "=========================================="

# Made with Bob
