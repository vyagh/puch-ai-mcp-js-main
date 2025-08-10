import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { v4 as uuidv4 } from "uuid";

class McpGateway {
    constructor() {
        this.transport = null;
        this.started = false;
        this.pending = new Map();
    }

    async ensureStarted() {
        if (this.started && this.transport) return;
        this.transport = new StdioClientTransport({
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

        // Setup message routing
        this.transport.onmessage = (msg) => {
            if (!msg || typeof msg !== "object") return;
            if (msg.id && this.pending.has(msg.id)) {
                const { resolve, reject } = this.pending.get(msg.id);
                this.pending.delete(msg.id);
                if (msg.error) reject(new Error(JSON.stringify(msg.error)));
                else resolve(msg.result);
            }
        };
        this.transport.onerror = (e) => {
            for (const { reject } of this.pending.values()) reject(e);
            this.pending.clear();
            this.started = false;
        };

        await this.transport.start();
        await this.request("initialize", {
            protocolVersion: "2024-11-05",
            clientInfo: { name: "web-gateway", version: "0.1.0" },
            capabilities: {},
        });
        await this.transport.send({ jsonrpc: "2.0", method: "initialized" });
        this.started = true;
    }

    async request(method, params) {
        const id = uuidv4();
        await this.transport.send({ jsonrpc: "2.0", id, method, params });
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
        });
    }

    async listTools() {
        await this.ensureStarted();
        return this.request("tools/list", {});
    }

    async callTool(name, args) {
        await this.ensureStarted();
        return this.request("tools/call", { name, arguments: args });
    }

    async handleMcpRequest(request) {
        await this.ensureStarted();
        return this.request(request.method, request.params);
    }
}

export const gateway = new McpGateway();
