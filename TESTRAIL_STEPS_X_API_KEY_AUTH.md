# TestRail Steps: Runtime Authentication - X-Api-Key Based Authentication

## Test Case: Verify support for X-Api-Key based authentication with Remote MCP Server

---

## Streamable HTTP Transport

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create a Remote MCP connection and configure X-Api-Key authentication for both Draft and Live environments using the following commands:<br><br>`orchestrate connections add --app-id nested_reference_mcp`<br>`orchestrate connections configure --app-id nested_reference_mcp --env draft --kind api-key --type team`<br>`orchestrate connections set-credentials --app-id nested_reference_mcp --env draft --api_key <valid_api_key>`<br>`orchestrate connections configure --app-id nested_reference_mcp --env live --kind api-key --type team`<br>`orchestrate connections set-credentials --app-id nested_reference_mcp --env live --api_key <valid_api_key>`<br><br>Verify using:<br>`orchestrate connections list` | Connection `nested_reference_mcp` is created successfully and configured with X-Api-Key authentication for both Draft and Live environments. The connection is listed successfully. |
| 2 | Import the Remote MCP toolkit using streamable HTTP transport:<br><br>`orchestrate toolkits add --kind mcp --name nested_reference_mcp --description "Remote MCP tools for Customer Order Processing with Nested References" --url "<mcp_server_url>/mcp" --transport "streamable_http" --tools "*" --app-id "nested_reference_mcp"`<br><br>Verify using:<br>`orchestrate toolkits list` | Toolkit `nested_reference_mcp` is imported successfully. The toolkit is listed and contains the tool `process_customer_order_with_references`. |
| 3 | Go to the Watson Orchestrate UI, navigate to Manage Agents, and create a new agent named `Customer_Order_Agent`. | A new agent named `Customer_Order_Agent` is created successfully. |
| 4 | Add the imported tool `process_customer_order_with_references` from toolkit `nested_reference_mcp` to the agent and save the configuration. | The tool is added successfully and is available for invocation by the agent. |
| 5 | Test execution by entering the following request in chat:<br><br>`Process a customer order for John Doe with email john@example.com, address 123 Main St, Boston, MA 02101, USA. Order ID: ORD-2024-001 with 1 Premium Laptop at $1299.99` | The agent invokes the `process_customer_order_with_references` tool. The MCP server receives the request with a valid `x-api-key` header. Authentication succeeds, the tool executes successfully, and the processed order details are displayed in the chat response. |
| 6 | Deploy the agent. | Agent should be deployed successfully. |
| 7 | Execute the same query in Live Chat:<br><br>`Process a customer order for John Doe with email john@example.com, address 123 Main St, Boston, MA 02101, USA. Order ID: ORD-2024-001 with 1 Premium Laptop at $1299.99` | The agent invokes the `process_customer_order_with_references` tool. The MCP server receives the request with a valid `x-api-key` header. Authentication succeeds, the tool executes successfully, and the processed order details are displayed in the chat response. |
| 8 | Update the Draft environment credentials with an invalid API key:<br><br>`orchestrate connections set-credentials --app-id nested_reference_mcp --env draft --api_key invalid-key-xyz`<br><br>Execute the same customer order request again. | Authentication fails, tool execution is blocked, and an appropriate authentication error message is displayed. Server logs indicate authentication failure. |
| 9 | Restore the valid API key credentials:<br><br>`orchestrate connections set-credentials --app-id nested_reference_mcp --env draft --api_key <valid_api_key>`<br><br>Execute the same customer order request again. | Authentication succeeds and the tool executes successfully. |

---

## SSE Transport

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create a Remote MCP connection and configure X-Api-Key authentication for both Draft and Live environments using the following commands:<br><br>`orchestrate connections add --app-id inventory_mcp_remote`<br>`orchestrate connections configure --app-id inventory_mcp_remote --env draft --kind api-key --type team`<br>`orchestrate connections set-credentials --app-id inventory_mcp_remote --env draft --api_key <valid_api_key>`<br>`orchestrate connections configure --app-id inventory_mcp_remote --env live --kind api-key --type team`<br>`orchestrate connections set-credentials --app-id inventory_mcp_remote --env live --api_key <valid_api_key>`<br><br>Verify using:<br>`orchestrate connections list` | Connection `inventory_mcp_remote` is created successfully and configured with X-Api-Key authentication for both Draft and Live environments. The connection is listed successfully. |
| 2 | Import the Remote MCP toolkit using SSE transport:<br><br>`orchestrate toolkits add --kind mcp --name inventory_mcp_remote --description "Remote MCP tools for Inventory Management (SSE)" --url "<mcp_server_url>/sse" --transport "sse" --tools "*" --app-id "inventory_mcp_remote"`<br><br>Verify using:<br>`orchestrate toolkits list` | Toolkit `inventory_mcp_remote` is imported successfully. The toolkit is listed and contains the tool `get_products_list`. |
| 3 | Go to the Watson Orchestrate UI, navigate to Manage Agents, and create a new agent named `Inventory_Agent`. | A new agent named `Inventory_Agent` is created successfully. |
| 4 | Add the imported tool `get_products_list` from toolkit `inventory_mcp_remote` to the agent and save the configuration. | The tool is added successfully and is available for invocation by the agent. |
| 5 | Test execution by entering the following request in chat:<br><br>`Get the list of products from inventory` | The agent invokes the `get_products_list` tool. The MCP server receives the request with a valid `x-api-key` header via SSE transport. Authentication succeeds, the tool executes successfully, and the inventory product list (Wireless Mouse and Mechanical Keyboard) is displayed in the chat response. |
| 6 | Deploy the agent. | Agent should be deployed successfully. |
| 7 | Execute the same query in Live Chat:<br><br>`Get the list of products from inventory` | The agent invokes the `get_products_list` tool. The MCP server receives the request with a valid `x-api-key` header via SSE transport. Authentication succeeds, the tool executes successfully, and the inventory product list is displayed in the chat response. |
| 8 | Update the Draft environment credentials with an invalid API key:<br><br>`orchestrate connections set-credentials --app-id inventory_mcp_remote --env draft --api_key invalid-key-xyz`<br><br>Execute the same inventory query again. | Authentication fails, tool execution is blocked, and an appropriate authentication error message is displayed. Server logs indicate authentication failure with "Invalid API key" message. |
| 9 | Restore the valid API key credentials:<br><br>`orchestrate connections set-credentials --app-id inventory_mcp_remote --env draft --api_key <valid_api_key>`<br><br>Execute the same inventory query again. | Authentication succeeds and the tool executes successfully, returning the inventory product list. |

---

## Acceptance Criteria

- ✅ X-Api-Key authentication can be configured via Orchestrate CLI for both Draft and Live environments
- ✅ Remote MCP toolkit can be imported with both `streamable_http` and `sse` transports
- ✅ Tools execute successfully with valid API key via both transport methods
- ✅ Invalid API keys are rejected with proper authentication error messages
- ✅ Authentication works consistently across Draft and Live environments
- ✅ MCP server properly validates `x-api-key` header for all authenticated endpoints
- ✅ Agents can successfully invoke tools with proper authentication in both test and live chat

---

Made with Bob