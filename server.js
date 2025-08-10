import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Simple MCP tools implementation
const tools = [
    {
        name: "validate",
        title: "Validate Bearer Token",
        description: "Validates bearer token and returns user phone number for Puch AI authentication.",
        inputSchema: { bearer_token: z.string() }
    },
    {
        name: "medical_assist",
        title: "Medical Assistant",
        description: "Takes a short symptom input and returns structured advice.",
        inputSchema: { query: z.string().min(1) }
    }
];

// MCP endpoint for Puch AI connections
app.post("/mcp", async (req, res) => {
    try {
        const { method, params, id } = req.body;
        
        if (method === "tools/list") {
            res.json({
                jsonrpc: "2.0",
                id,
                result: { tools }
            });
        } else if (method === "tools/call") {
            const { name, arguments: args } = params;
            
            if (name === "validate") {
                const { bearer_token } = args;
                if (!bearer_token || bearer_token.length < 3) {
                    throw new Error("Invalid bearer token");
                }
                res.json({
                    jsonrpc: "2.0",
                    id,
                    result: {
                        content: [{ 
                            type: "text", 
                            text: JSON.stringify({ phone_number: "919876543210" }) 
                        }]
                    }
                });
            } else if (name === "medical_assist") {
                const { query } = args;
                res.json({
                    jsonrpc: "2.0",
                    id,
                    result: {
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
                    }
                });
            } else {
                throw new Error(`Unknown tool: ${name}`);
            }
        } else {
            throw new Error(`Unknown method: ${method}`);
        }
    } catch (e) {
        console.error("MCP Error:", e);
        res.status(500).json({ 
            jsonrpc: "2.0",
            id: req.body.id,
            error: { message: String(e?.message || e) }
        });
    }
});

app.get("/api/tools", async (req, res) => {
    try {
        res.json({ tools });
    } catch (e) {
        console.error("API Error:", e);
        res.status(500).json({ error: String(e?.message || e) });
    }
});

app.post("/api/medical", async (req, res) => {
    try {
        const { query } = req.body || {};
        res.json({
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
        });
    } catch (e) {
        console.error("Medical API Error:", e);
        res.status(500).json({ error: String(e?.message || e) });
    }
});

const port = process.env.PORT || 5173;
app.listen(port, () => {
    console.log(`Web server listening on http://localhost:${port}`);
});
