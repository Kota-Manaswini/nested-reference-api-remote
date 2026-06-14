#!/usr/bin/env node

/**
 * Test script to verify MCP server initialization and list tools
 * Tests the SSE connection and MCP protocol handshake
 */

import EventSource from 'eventsource';
import fetch from 'node-fetch';

const SSE_URL = process.env.TEST_URL || 'http://localhost:3456/sse';
const MESSAGE_URL = process.env.TEST_URL ? process.env.TEST_URL.replace('/sse', '/message') : 'http://localhost:3456/message';

console.log('Testing MCP Server Connection...\n');
console.log('SSE URL:', SSE_URL);
console.log('Message URL:', MESSAGE_URL);
console.log('---\n');

let messageId = 1;
const pendingRequests = new Map();

// Step 1: Connect to SSE endpoint
console.log('Step 1: Connecting to SSE endpoint...');
const eventSource = new EventSource(SSE_URL);

eventSource.onopen = () => {
    console.log('✓ SSE connection established\n');

    // Step 2: Send initialize request
    setTimeout(async () => {
        console.log('Step 2: Sending initialize request...');
        try {
            const initRequest = {
                jsonrpc: '2.0',
                id: messageId++,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        roots: {
                            listChanged: true
                        }
                    },
                    clientInfo: {
                        name: 'test-client',
                        version: '1.0.0'
                    }
                }
            };

            pendingRequests.set(initRequest.id, 'initialize');

            const response = await fetch(MESSAGE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(initRequest)
            });

            console.log('Initialize POST status:', response.status);
            if (response.status !== 202 && response.status !== 200) {
                const text = await response.text();
                console.log('Initialize POST response:', text);
            }

        } catch (error) {
            console.error('✗ Error sending initialize:', error.message);
            eventSource.close();
            process.exit(1);
        }
    }, 1000);
};

eventSource.onerror = (error) => {
    console.error('✗ SSE connection error:', error);
    eventSource.close();
    process.exit(1);
};

eventSource.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log('\n📨 Received SSE message:');
        console.log(JSON.stringify(data, null, 2));

        if (data.id && pendingRequests.has(data.id)) {
            const method = pendingRequests.get(data.id);
            pendingRequests.delete(data.id);

            if (method === 'initialize' && data.result) {
                console.log('\n✓ Initialize successful!');
                console.log('Server capabilities:', JSON.stringify(data.result.capabilities, null, 2));

                // Step 3: Send list tools request
                setTimeout(async () => {
                    console.log('\nStep 3: Sending tools/list request...');
                    try {
                        const listToolsRequest = {
                            jsonrpc: '2.0',
                            id: messageId++,
                            method: 'tools/list',
                            params: {}
                        };

                        pendingRequests.set(listToolsRequest.id, 'tools/list');

                        const toolsResponse = await fetch(MESSAGE_URL, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(listToolsRequest)
                        });

                        console.log('List tools POST status:', toolsResponse.status);
                        if (toolsResponse.status !== 202 && toolsResponse.status !== 200) {
                            const text = await toolsResponse.text();
                            console.log('List tools POST response:', text);
                        }

                    } catch (error) {
                        console.error('✗ Error listing tools:', error.message);
                        eventSource.close();
                        process.exit(1);
                    }
                }, 1000);
            } else if (method === 'tools/list' && data.result) {
                console.log('\n✓ Tools list received!');
                if (data.result.tools) {
                    console.log(`\nFound ${data.result.tools.length} tool(s):`);
                    data.result.tools.forEach((tool, idx) => {
                        console.log(`\n  Tool ${idx + 1}:`);
                        console.log(`    Name: ${tool.name}`);
                        console.log(`    Description: ${tool.description.substring(0, 100)}...`);
                    });
                }

                console.log('\n✅ Test completed successfully!');
                eventSource.close();
                process.exit(0);
            }
        }

        if (data.error) {
            console.error('\n✗ Error response:', data.error);
            eventSource.close();
            process.exit(1);
        }
    } catch (e) {
        console.log('Raw SSE data:', event.data);
    }
};

// Timeout after 30 seconds
setTimeout(() => {
    console.error('\n✗ Test timeout after 30 seconds');
    console.log('Pending requests:', Array.from(pendingRequests.values()));
    eventSource.close();
    process.exit(1);
}, 30000);

// Made with Bob
