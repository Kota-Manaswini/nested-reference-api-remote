import dotenv from "dotenv";
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from "@modelcontextprotocol/sdk/types.js";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import axios from "axios";
import crypto from "crypto";

// API Configuration
const API_BASE_URL = "https://complex-tools-openapi.onrender.com/api/v1";
const PORT = process.env.PORT || 3456;

// Authentication Configuration
const API_KEYS = new Set(
    (process.env.MCP_API_KEYS || "").split(",").filter(key => key.trim().length > 0)
);
const AUTH_ENABLED = process.env.MCP_AUTH_ENABLED === "true" || API_KEYS.size > 0;

// Generate a default API key if none provided (for development)
if (!AUTH_ENABLED && process.env.NODE_ENV !== "production") {
    const defaultKey = crypto.randomBytes(32).toString("hex");
    API_KEYS.add(defaultKey);
    console.warn("⚠️  WARNING: No API keys configured. Generated temporary key for development:");
    console.warn(`   API Key: ${defaultKey}`);
    console.warn("   Set MCP_API_KEYS environment variable for production use.");
}

// Tool definition with nested $ref patterns
const TOOLS: Tool[] = [
    {
        name: "process_customer_order_with_references",
        description: `Process customer orders with nested address references demonstrating the $ref pattern from GitHub Issue #45755.

This tool showcases nested schema references where:
- order.shipping_address references customer.address using $ref
- order.billing_address references customer.address using $ref  
- order.shipping_locations[].address references customer.address using $ref
- order.items[].delivery_address references customer.address using $ref

This recreates the Moody's MCP tools pattern where alerts.address referenced inquiry.address, which caused serialization issues and LLM confusion.

Returns a formatted order confirmation with customer details, itemized products, and address information.`,
        inputSchema: {
            type: "object",
            properties: {
                customer: {
                    type: "object",
                    description: "Customer information with primary address that will be referenced by other fields",
                    required: ["name", "email", "address"],
                    properties: {
                        name: {
                            type: "string",
                            description: "Customer full name",
                        },
                        email: {
                            type: "string",
                            description: "Customer email address",
                        },
                        address: {
                            type: "object",
                            description: "Primary customer address (referenced by shipping/billing addresses)",
                            properties: {
                                street: { type: "string" },
                                city: { type: "string" },
                                state: { type: "string" },
                                zipcode: { type: "string" },
                                country: { type: "string" },
                            },
                        },
                        contact: {
                            type: "object",
                            description: "Contact information",
                            properties: {
                                phone: { type: "string" },
                                mobile: { type: "string" },
                            },
                        },
                        entityType: {
                            type: "string",
                            description: "Customer entity type",
                        },
                        customerId: {
                            type: "string",
                            description: "Unique customer identifier",
                        },
                    },
                },
                order: {
                    type: "object",
                    description: "Order details with nested address references",
                    required: ["order_id", "items"],
                    properties: {
                        order_id: {
                            type: "string",
                            description: "Unique order identifier",
                        },
                        order_date: {
                            type: "string",
                            description: "Order date (YYYY-MM-DD format)",
                        },
                        items: {
                            type: "array",
                            description: "Order items",
                            items: {
                                type: "object",
                                required: ["product", "quantity", "price"],
                                properties: {
                                    product: {
                                        type: "object",
                                        properties: {
                                            product_id: { type: "string" },
                                            name: { type: "string" },
                                            details: {
                                                type: "object",
                                                properties: {
                                                    description: { type: "string" },
                                                    specifications: {
                                                        type: "object",
                                                        properties: {
                                                            weight: { type: "string" },
                                                            dimensions: { type: "string" },
                                                            material: { type: "string" },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    quantity: {
                                        type: "integer",
                                        minimum: 1,
                                    },
                                    price: {
                                        type: "number",
                                        minimum: 0,
                                    },
                                    delivery_address: {
                                        type: "array",
                                        description: "Delivery addresses (references customer.address schema)",
                                        items: {
                                            type: "object",
                                            properties: {
                                                street: { type: "string" },
                                                city: { type: "string" },
                                                state: { type: "string" },
                                                zipcode: { type: "string" },
                                                country: { type: "string" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        shipping_address: {
                            type: "object",
                            description: "Shipping address (references customer.address via $ref in OpenAPI)",
                            properties: {
                                street: { type: "string" },
                                city: { type: "string" },
                                state: { type: "string" },
                                zipcode: { type: "string" },
                                country: { type: "string" },
                            },
                        },
                        billing_address: {
                            type: "object",
                            description: "Billing address (references customer.address via $ref in OpenAPI)",
                            properties: {
                                street: { type: "string" },
                                city: { type: "string" },
                                state: { type: "string" },
                                zipcode: { type: "string" },
                                country: { type: "string" },
                            },
                        },
                        shipping_locations: {
                            type: "array",
                            description: "Shipping locations with address arrays",
                            items: {
                                type: "object",
                                properties: {
                                    location_id: { type: "string" },
                                    location_name: { type: "string" },
                                    address: {
                                        type: "array",
                                        description: "Location addresses (references customer.address)",
                                        items: {
                                            type: "object",
                                            properties: {
                                                street: { type: "string" },
                                                city: { type: "string" },
                                                state: { type: "string" },
                                                zipcode: { type: "string" },
                                                country: { type: "string" },
                                            },
                                        },
                                    },
                                    entityType: { type: "string" },
                                },
                            },
                        },
                    },
                },
            },
            required: ["customer", "order"],
        },
    },
];

// Create MCP Server instance
const server = new Server(
    {
        name: "nested-reference-api-remote",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.log('Handling ListTools request');
    return {
        tools: TOOLS,
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    console.log('Handling CallTool request:', request.params.name);
    const { name, arguments: args } = request.params;

    if (name === "process_customer_order_with_references") {
        try {
            // Make API call to the deployed endpoint
            const response = await axios.post(
                `${API_BASE_URL}/orders/process`,
                args,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    timeout: 30000, // 30 second timeout
                }
            );

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(response.data, null, 2),
                    },
                ],
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorResponse = error.response?.data;
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                {
                                    error: errorResponse?.error || error.message,
                                    code: errorResponse?.code || "API_ERROR",
                                    details: errorResponse?.details || error.response?.statusText,
                                    status: error.response?.status,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                    isError: true,
                };
            }

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                error: "Failed to process order",
                                code: "UNKNOWN_ERROR",
                                details: error instanceof Error ? error.message : String(error),
                            },
                            null,
                            2
                        ),
                    },
                ],
                isError: true,
            };
        }
    }

    return {
        content: [
            {
                type: "text",
                text: `Unknown tool: ${name}`,
            },
        ],
        isError: true,
    };
});

// Authentication Middleware
interface AuthRequest extends Request {
    authenticated?: boolean;
    apiKey?: string;
}

const authenticateRequest = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Skip authentication for health check and root endpoints
    if (req.path === '/health' || req.path === '/') {
        return next();
    }

    // If authentication is disabled, allow all requests
    if (!AUTH_ENABLED) {
        req.authenticated = true;
        return next();
    }

    // Extract API key from x-api-key header
    const apiKeyHeader = req.headers['x-api-key'];
    const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
    
    if (!apiKey) {
        return res.status(401).json({
            jsonrpc: '2.0',
            error: {
                code: -32001,
                message: 'Authentication required',
                data: {
                    details: 'Missing x-api-key header. Use: x-api-key: <your-api-key>'
                }
            }
        });
    }

    // Validate API key
    if (!API_KEYS.has(apiKey)) {
        return res.status(403).json({
            jsonrpc: '2.0',
            error: {
                code: -32002,
                message: 'Invalid API key',
                data: {
                    details: 'The provided API key is not valid'
                }
            }
        });
    }

    // Authentication successful
    req.authenticated = true;
    req.apiKey = apiKey;
    next();
};

// Create Express app for HTTP transport
const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key'],
    credentials: true,
    exposedHeaders: ['X-Auth-Status']
}));
app.use(express.json());
app.use(authenticateRequest);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'nested-reference-api-remote',
        transport: 'HTTP',
        authentication: {
            enabled: AUTH_ENABLED,
            configured_keys: API_KEYS.size
        }
    });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Customer Order API with Nested References - Remote MCP Server',
        version: '1.0.0',
        transport: 'HTTP',
        authentication: {
            enabled: AUTH_ENABLED,
            required: AUTH_ENABLED,
            header_format: 'x-api-key: <your-api-key>'
        },
        endpoints: {
            health: '/health',
            mcp: '/mcp (requires authentication)'
        },
        documentation: 'Based on GitHub Issue #45755 - Nested Schema Reference Pattern'
    });
});

// MCP endpoint - handles all MCP protocol messages via HTTP POST
app.post('/mcp', async (req: Request, res: Response) => {
    console.log('Received MCP request:', req.body.method);

    try {
        // Handle the JSON-RPC request
        const request = req.body;

        if (request.method === 'initialize') {
            res.json({
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        tools: {}
                    },
                    serverInfo: {
                        name: 'nested-reference-api-remote',
                        version: '1.0.0'
                    }
                }
            });
        } else if (request.method === 'tools/list') {
            res.json({
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    tools: TOOLS
                }
            });
        } else if (request.method === 'notifications/initialized') {
            // Handle initialized notification - just acknowledge it
            console.log('Client initialized notification received');
            res.status(200).json({
                jsonrpc: '2.0',
                result: {}
            });
        } else if (request.method === 'tools/call') {
            // Call the tool directly through the handler
            const { name, arguments: args } = request.params;

            if (name === "process_customer_order_with_references") {
                try {
                    // Make API call to the deployed endpoint
                    const response = await axios.post(
                        `${API_BASE_URL}/orders/process`,
                        args,
                        {
                            headers: {
                                "Content-Type": "application/json",
                            },
                            timeout: 30000,
                        }
                    );

                    res.json({
                        jsonrpc: '2.0',
                        id: request.id,
                        result: {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(response.data, null, 2),
                                },
                            ],
                        }
                    });
                } catch (error) {
                    if (axios.isAxiosError(error)) {
                        const errorResponse = error.response?.data;
                        res.json({
                            jsonrpc: '2.0',
                            id: request.id,
                            result: {
                                content: [
                                    {
                                        type: "text",
                                        text: JSON.stringify(
                                            {
                                                error: errorResponse?.error || error.message,
                                                code: errorResponse?.code || "API_ERROR",
                                                details: errorResponse?.details || error.response?.statusText,
                                                status: error.response?.status,
                                            },
                                            null,
                                            2
                                        ),
                                    },
                                ],
                                isError: true,
                            }
                        });
                    } else {
                        res.json({
                            jsonrpc: '2.0',
                            id: request.id,
                            result: {
                                content: [
                                    {
                                        type: "text",
                                        text: JSON.stringify(
                                            {
                                                error: "Failed to process order",
                                                code: "UNKNOWN_ERROR",
                                                details: error instanceof Error ? error.message : String(error),
                                            },
                                            null,
                                            2
                                        ),
                                    },
                                ],
                                isError: true,
                            }
                        });
                    }
                }
            } else {
                res.status(400).json({
                    jsonrpc: '2.0',
                    id: request.id,
                    error: {
                        code: -32602,
                        message: `Unknown tool: ${name}`
                    }
                });
            }
        } else {
            console.log(`Unknown method: ${request.method}`);
            res.status(400).json({
                jsonrpc: '2.0',
                id: request.id,
                error: {
                    code: -32601,
                    message: `Method not found: ${request.method}`
                }
            });
        }
    } catch (error) {
        console.error('Error handling MCP request:', error);
        res.status(500).json({
            jsonrpc: '2.0',
            id: req.body.id,
            error: {
                code: -32603,
                message: 'Internal error',
                data: error instanceof Error ? error.message : String(error)
            }
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Nested Reference API Remote MCP Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`Transport: HTTP (JSON-RPC over HTTP POST)`);
});

// Made with Bob
