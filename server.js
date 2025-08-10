import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import fetch from "cross-fetch";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Add CORS headers for MCP compatibility
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Root endpoint
app.get("/", (req, res) => {
    res.json({ 
        message: "Medical MCP Server is running",
        version: "1.0.0",
        endpoints: {
            health: "/health",
            mcp: "/mcp",
            api: {
                tools: "/api/tools",
                medical: "/api/medical"
            }
        },
        status: "operational"
    });
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// MCP endpoint info (for connection testing)
app.get("/mcp", (req, res) => {
    res.json({ 
        message: "MCP Server is running",
        version: "1.0.0",
        tools: ["validate", "medical_assist"],
        endpoint: "/mcp",
        methods: ["POST"]
    });
});

// Gemini configuration
const GeminiApiKey = process.env.GEMINI_API_KEY || "";
const GeminiModel = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";

if (!GeminiApiKey) {
    console.warn("Warning: GEMINI_API_KEY is not set. Medical guidance will be limited.");
}

// Initialize Gemini
const genAI = GeminiApiKey ? new GoogleGenerativeAI(GeminiApiKey) : null;

// Medical guidance functions
function buildPrompt({ query }) {
    return `You are a cautious, helpful medical assistant. Analyze the user's symptoms and return a JSON response with the following structure.

User Input: "${query}"

Instructions:
1. Analyze the symptoms and provide clear intent
2. Suggest appropriate over-the-counter medicines with dosage and cautions
3. Recommend 3-5 home remedies with explanations
4. Provide 3-5 relevant YouTube video URLs for educational content
5. List red flags that require immediate medical attention
6. Include appropriate medical disclaimers

IMPORTANT: Return ONLY valid JSON. Do not include any markdown formatting, backticks, or explanatory text outside the JSON.

Expected JSON structure:
{
  "intent": "Clear description of the medical concern",
  "otc_medicines": [
    {
      "name": "Medicine name",
      "dosage_guidance": "Typical dosage information",
      "cautions": "Safety warnings and when not to take"
    }
  ],
  "nearby_chemists": [],
  "home_remedies": [
    {
      "title": "Remedy name",
      "rationale": "Why this helps"
    }
  ],
  "videos": [
    {
      "url": "https://www.youtube.com/watch?v=example"
    }
  ],
  "red_flags": [
    "Symptom that requires immediate medical attention"
  ],
  "disclaimers": [
    "This is not medical advice. Consult a healthcare professional."
  ]
}`;
}

async function callGemini(prompt) {
    if (!genAI) {
        throw new Error("Gemini API key not configured");
    }
    
    try {
        const model = genAI.getGenerativeModel({ model: GeminiModel });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean the response - remove markdown formatting if present
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Parse the JSON response
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Gemini API error:", error);
        throw new Error(`Gemini API error: ${error.message}`);
    }
}

// Nearby chemists function
function haversineMeters(lat1, lon1, lat2, lon2) {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function findNearbyChemists(lat, lon, limit = 5) {
    try {
        const radiusMeters = 3000;
        const query = `
[out:json][timeout:10];
(
  node["amenity"="pharmacy"](around:${radiusMeters},${lat},${lon});
  way["amenity"="pharmacy"](around:${radiusMeters},${lat},${lon});
  relation["amenity"="pharmacy"](around:${radiusMeters},${lat},${lon});
);
out center tags;`;
        
        const resp = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ data: query }),
        });
        
        if (!resp.ok) return [];
        
        const data = await resp.json();
        const elements = data.elements || [];
        const withCoords = elements
            .map((el) => {
                const center = el.center || (el.lat && el.lon ? { lat: el.lat, lon: el.lon } : undefined);
                if (!center) return undefined;
                const tags = el.tags || {};
                const name = tags.name || "Pharmacy";
                const addressParts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"], tags["addr:postcode"]].filter(Boolean);
                const address = addressParts.join(", ");
                const dist = haversineMeters(lat, lon, center.lat, center.lon);
                const map_url = `https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lon}#map=18/${center.lat}/${center.lon}`;
                return { name, address, map_url, dist };
            })
            .filter(Boolean);
        
        withCoords.sort((a, b) => a.dist - b.dist);
        return withCoords.slice(0, limit).map(({ name, address, map_url }) => ({ name, address, map_url }));
    } catch (error) {
        console.error("Error finding nearby chemists:", error);
        return [];
    }
}

// MCP tools implementation
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
        description: "Takes a short symptom input and returns structured advice, OTC suggestions, nearby chemists, home remedies, and YouTube links.",
        inputSchema: { 
            query: z.string().min(1),
            userLocation: z.object({ lat: z.number(), lon: z.number() }).optional()
        }
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
                const { query, userLocation } = args;
                
                // Get medical guidance from Gemini
                const prompt = buildPrompt({ query });
                const modelObj = await callGemini(prompt);
                
                // Add nearby chemists if location provided
                if (userLocation) {
                    try {
                        const chemists = await findNearbyChemists(userLocation.lat, userLocation.lon, 5);
                        modelObj.nearby_chemists = chemists;
                    } catch (error) {
                        modelObj.nearby_chemists = [];
                    }
                } else {
                    modelObj.nearby_chemists = [];
                }
                
                res.json({
                    jsonrpc: "2.0",
                    id,
                    result: {
                        content: [{ 
                            type: "text", 
                            text: JSON.stringify(modelObj) 
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
        const { query, userLocation } = req.body || {};
        
        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }
        
        // Get medical guidance from Gemini
        const prompt = buildPrompt({ query });
        const modelObj = await callGemini(prompt);
        
        // Add nearby chemists if location provided
        if (userLocation) {
            try {
                const chemists = await findNearbyChemists(userLocation.lat, userLocation.lon, 5);
                modelObj.nearby_chemists = chemists;
            } catch (error) {
                modelObj.nearby_chemists = [];
            }
        } else {
            modelObj.nearby_chemists = [];
        }
        
        res.json({
            content: [{ 
                type: "text", 
                text: JSON.stringify(modelObj) 
            }]
        });
    } catch (e) {
        console.error("Medical API Error:", e);
        res.status(500).json({ error: String(e?.message || e) });
    }
});

// Start server
const PORT = process.env.PORT || 5173;

try {
    app.listen(PORT, () => {
        console.log(`Web server listening on http://localhost:${PORT}`);
        console.log(`MCP endpoint available at http://localhost:${PORT}/mcp`);
        console.log(`Health check available at http://localhost:${PORT}/health`);
    });
} catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
}
