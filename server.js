import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { gateway } from "./mcpGateway.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// MCP endpoint for Puch AI connections
app.post("/mcp", async (req, res) => {
    try {
        const result = await gateway.handleMcpRequest(req.body);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: String(e?.message || e) });
    }
});

app.get("/api/tools", async (req, res) => {
    try {
        const tools = await gateway.listTools();
        res.json(tools);
    } catch (e) {
        res.status(500).json({ error: String(e?.message || e) });
    }
});

app.post("/api/medical", async (req, res) => {
    try {
        const { query, userLocation } = req.body || {};
        const result = await gateway.callTool("medical_assist", {
            query,
            userLocation,
        });
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: String(e?.message || e) });
    }
});

const port = process.env.PORT || 5173;
app.listen(port, () => {
    console.log(`Web server listening on http://localhost:${port}`);
});
