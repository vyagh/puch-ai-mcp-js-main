import express from "express";
import path from "path";
import { fileURLToPath } from "url";
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

// OpenAI configuration
const OpenAIModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OpenAIBaseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const OpenAIApiKey = process.env.OPENAI_API_KEY || "";

if (!OpenAIApiKey) {
    console.warn("Warning: OPENAI_API_KEY is not set. Medical guidance will be limited.");
}

// Medical guidance functions
function buildPrompt({ query }) {
    return `You are a cautious, helpful medical assistant. Expand on the user's message and return ALL of the following sections as JSON.

Input: "${query}"

Requirements:
1) Clarify the user intent from the symptom(s).
2) Suggest over-the-counter medicine options (if appropriate), with generic names and typical dosage guidance. Include cautions and when NOT to take.
3) The server will supply nearby chemists separately; set "nearby_chemists" to an empty array.
4) Suggest 3-5 home remedies with short rationales.
5) Provide 3-5 YouTube video LINKS relevant to home remedies or guidance; return as an array of objects with a single key "url" (full https YouTube watch URL, no embeds, no iframes, no placeholders).
6) Add red flags: list symptoms that require immediate medical attention.
7) Disclaimers: not a substitute for professional medical advice; consult a healthcare professional.

Return a single JSON object with exactly these keys:
{
  "intent": string,
  "otc_medicines": [{ "name": string, "dosage_guidance": string, "cautions": string }],
  "nearby_chemists": [],
  "home_remedies": [{ "title": string, "rationale": string }],
  "videos": [{ "url": string }],
  "red_flags": [string],
  "disclaimers": [string]
}
Ensure valid JSON.`;
}

async function callOpenAI(prompt) {
    if (!OpenAIApiKey) {
        throw new Error("OpenAI API key not configured");
    }
    
    const resp = await fetch(`${OpenAIBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${OpenAIApiKey}`,
        },
        body: JSON.stringify({
            model: OpenAIModel,
            messages: [
                {
                    role: "system",
                    content: "You are a careful medical assistant. Always return valid JSON only.",
                },
                { role: "user", content: prompt },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
        }),
    });
    
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`OpenAI API error: ${resp.status} ${resp.statusText} - ${text}`);
    }
    
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return JSON.parse(text);
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
                
                // Get medical guidance from OpenAI
                const prompt = buildPrompt({ query });
                const modelObj = await callOpenAI(prompt);
                
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
        
        // Get medical guidance from OpenAI
        const prompt = buildPrompt({ query });
        const modelObj = await callOpenAI(prompt);
        
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

const port = process.env.PORT || 5173;
app.listen(port, () => {
    console.log(`Web server listening on http://localhost:${port}`);
});
