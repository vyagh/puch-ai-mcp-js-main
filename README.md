# Medical Assistant MCP Server (Node.js)

This MCP server takes a short, symptom-style prompt (e.g., "I have a fever") and expands it into structured medical guidance via an LLM. It returns:

-   Intent and explanation
-   Over‑the‑counter (OTC) medicine options with dosage guidance and cautions
-   Nearby chemists (if user location is provided)
-   Home remedies with brief rationales
-   Helpful YouTube videos (with embeddable links)
-   Red flags and disclaimers

## Features

-   MCP stdio server built with `@modelcontextprotocol/sdk`
-   LLM call to OpenAI-compatible API (model configurable)
-   Nearby chemists fetched via OpenStreetMap Overpass API
-   Safe output coercion and video URL normalization
-   **Puch AI compatible** with required `validate` tool for authentication

## Requirements

-   Node.js 18+
-   An OpenAI-compatible API key

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

Create a `.env` file with your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key
# Optional overrides:
# OPENAI_MODEL=gpt-4o-mini
# OPENAI_BASE_URL=https://api.openai.com/v1
```

## Run

```bash
npm start
```

The server runs over stdio and waits for an MCP client connection.

### Web chat (WhatsApp-like)

```bash
OPENAI_API_KEY=your_key node server.js
# Visit http://localhost:5173
```

Type a short symptom message; the page calls the MCP gateway which invokes the `medical_assist` tool and renders structured results.

## Puch AI Deployment

This server is designed to work with [Puch AI's MCP integration](https://puch.ai/mcp). To deploy for the hackathon:

### 1. Deploy to Production

Deploy your server to a hosting platform (Vercel, Railway, Render, etc.) that supports:
- HTTPS (required by Puch AI)
- Node.js 18+
- Environment variables

### 2. Connect to Puch AI

Use the `/mcp connect` command in Puch AI with your deployed server URL:

```
/mcp connect https://your-server-url.com/mcp your_bearer_token
```

### 3. Authentication

The server includes a `validate` tool that:
- Accepts bearer tokens from Puch AI
- Returns user phone numbers in format `{country_code}{number}` (e.g., `919876543210`)
- Currently uses mock authentication (replace with your auth system)

### 4. Available Tools

- `validate`: Authenticates users (required by Puch AI)
- `medical_assist`: Provides medical guidance and recommendations
- `echo`: Simple echo tool for testing

## Test with MCP Inspector

Install Inspector globally (or use npx) and point it at this server command:

```bash
npx @modelcontextprotocol/inspector -- node index.js
```

Or add and run the npm script:

```bash
npm run inspect
```

In the Inspector UI, you should see the tools `validate`, `medical_assist`, and `echo`. Test the validate tool with:

```json
{
    "bearer_token": "your_test_token_here"
}
```

And test medical_assist with:

```json
{
    "query": "I have a fever",
    "userLocation": { "lat": 28.6139, "lon": 77.209 }
}
```

The server will:

-   Ask the LLM to return structured JSON (intent, OTC meds, home remedies, videos, red flags, disclaimers)
-   If `userLocation` is provided, enrich with nearby chemists from Overpass
-   Return the final JSON payload as text

## Use case

This server acts like a cautious, helpful medical assistant. It refines short symptom inputs into actionable guidance for:

-   Quick OTC suggestions with risks/cautions
-   Simple home care tips and curated video links
-   Nearby chemists to purchase OTC items

It is not a substitute for a clinician; red flags and disclaimers are included to encourage timely professional care.

## Environment variables

-   `OPENAI_API_KEY` (required): API key for OpenAI-compatible endpoint
-   `OPENAI_MODEL` (optional): defaults to `gpt-4o-mini`
-   `OPENAI_BASE_URL` (optional): defaults to `https://api.openai.com/v1`

## Notes

-   The Overpass API is public and rate-limited; nearby chemists may be empty if the API is unavailable.
-   The server prints a warning if `OPENAI_API_KEY` is not set; the first tool call will fail in that case.
-   The `validate` tool currently uses mock authentication; replace with your actual auth system for production use.
# puch-ai-mcp-js
