import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { v4 as uuidv4 } from "uuid";

async function request(transport, method, params) {
    const id = uuidv4();
    await transport.send({ jsonrpc: "2.0", id, method, params });
    return new Promise((resolve, reject) => {
        const onmessage = (msg) => {
            if (msg.id === id) {
                transport.onmessage = null;
                if (msg.error) reject(new Error(JSON.stringify(msg.error)));
                else resolve(msg.result);
            }
        };
        transport.onerror = (e) => reject(e);
        transport.onmessage = onmessage;
    });
}

async function main() {
    const transport = new StdioClientTransport({
        command: "node",
        args: ["index.js"],
        env: {
            OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
            OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
            OPENAI_BASE_URL:
                process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
        },
        stderr: "inherit",
    });

    await transport.start();

    // Initialize (MCP initialize handshake)
    const init = await request(transport, "initialize", {
        protocolVersion: "2024-11-05",
        clientInfo: { name: "local-test-client", version: "0.1.0" },
        capabilities: {},
    });
    // Notify initialized
    await transport.send({ jsonrpc: "2.0", method: "initialized" });

    // List tools
    const tools = await request(transport, "tools/list", {});
    console.error("Tools:", JSON.stringify(tools, null, 2));

    // Invoke echo tool
    if (tools.tools?.some((t) => t.name === "echo")) {
        const echo = await request(transport, "tools/call", {
            name: "echo",
            arguments: { text: "hello" },
        });
        console.error("echo result:", JSON.stringify(echo, null, 2));
    }

    // Invoke medical_assist tool
    if (tools.tools?.some((t) => t.name === "medical_assist")) {
        const med = await request(transport, "tools/call", {
            name: "medical_assist",
            arguments: {
                query: "I have a fever",
                userLocation: { lat: 28.6139, lon: 77.209 },
            },
        });
        console.error("medical_assist result:", JSON.stringify(med, null, 2));
    }

    await transport.close();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
