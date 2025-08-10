import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fetch from "cross-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Direct MCP server instance
const mcpServer = new McpServer({
    name: "medical-mcp-server",
    version: "0.1.0",
    instructions: "Medical assistant MCP: expand user symptom into structured advice via LLM.",
});

// Register tools directly
mcpServer.registerTool(
    "validate",
    {
        title: "Validate Bearer Token",
        description: "Validates bearer token and returns user phone number for Puch AI authentication.",
        inputSchema: { bearer_token: z.string() },
    },
    async ({ bearer_token }) => {
        if (!bearer_token || bearer_token.length < 3) {
            throw new Error("Invalid bearer token");
        }
        return { 
            content: [{ 
                type: "text", 
                text: JSON.stringify({ phone_number: "919876543210" }) 
            }] 
        };
    }
);

mcpServer.registerTool(
    "medical_assist",
    {
        title: "Medical Assistant",
        description: "Takes a short symptom input and returns structured advice.",
        inputSchema: { query: z.string().min(1) },
    },
    async ({ query }) => {
        return {
            content: [{ 
                type: "text", 
                text: JSON.stringify({
                    intent: "Medical guidance for: " + query,
                    otc_medicines: [],
                    home_remedies: [{ title: "Rest", rationale: "Get plenty of rest" }],
                    videos: [],
                    red_flags: ["Seek medical attention if symptoms worsen"],
                    disclaimers: ["This is not medical advice. Consult a healthcare professional."]
                }) 
            }]
        };
    }
);

// MCP endpoint for Puch AI connections
app.post("/mcp", async (req, res) => {
    try {
        const result = await mcpServer.handleRequest(req.body);
        res.json(result);
    } catch (e) {
        console.error("MCP Error:", e);
        res.status(500).json({ error: String(e?.message || e) });
    }
});

app.get("/api/tools", async (req, res) => {
    try {
        const tools = await mcpServer.listTools();
        res.json(tools);
    } catch (e) {
        console.error("API Error:", e);
        res.status(500).json({ error: String(e?.message || e) });
    }
});

app.post("/api/medical", async (req, res) => {
    try {
        const { query } = req.body || {};
        const result = await mcpServer.callTool("medical_assist", { query });
        res.json(result);
    } catch (e) {
        console.error("Medical API Error:", e);
        res.status(500).json({ error: String(e?.message || e) });
    }
});

const port = process.env.PORT || 5173;
app.listen(port, () => {
    console.log(`Web server listening on http://localhost:${port}`);
});
