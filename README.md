# Medical Assistant MCP Server

A Model Context Protocol (MCP) server that provides intelligent medical guidance by expanding short symptom descriptions into comprehensive, structured advice.

## Features

- **Symptom Analysis**: Takes brief symptom inputs and expands them into detailed medical guidance
- **OTC Recommendations**: Suggests over-the-counter medicines with dosage and safety information
- **Nearby Chemists**: Finds nearby pharmacies using OpenStreetMap data (when location provided)
- **Home Remedies**: Provides natural treatment options with explanations
- **Educational Videos**: Curates relevant YouTube videos for home care guidance
- **Safety Alerts**: Highlights red flags that require immediate medical attention
- **Puch AI Compatible**: Includes required `validate` tool for authentication

## Requirements

- Node.js 18+
- OpenAI API key

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
# Create .env file with your OpenAI API key
OPENAI_API_KEY=your_openai_api_key
```

## Usage

### Local Development
```bash
# Start MCP server
npm start

# Start web interface
node server.js
# Visit http://localhost:5173
```

### Production Deployment
Deploy to any platform supporting Node.js (Vercel, Railway, Render, etc.) with HTTPS.

## Available Tools

### `validate`
Authenticates users for MCP clients. Returns phone number in format `{country_code}{number}`.

**Input**: `{ "bearer_token": "string" }`
**Output**: `{ "phone_number": "919876543210" }`

### `medical_assist`
Provides comprehensive medical guidance based on symptoms.

**Input**: 
```json
{
  "query": "I have a fever",
  "userLocation": { "lat": 28.6139, "lon": 77.209 }
}
```

**Output**: Structured JSON with:
- Intent and explanation
- OTC medicine suggestions
- Nearby chemists (if location provided)
- Home remedies
- Educational videos
- Red flags and disclaimers

### `echo`
Simple echo tool for testing connectivity.

**Input**: `{ "text": "Hello" }`
**Output**: `{ "text": "Hello" }`

## MCP Protocol Support

This server implements the Model Context Protocol with:
- Core protocol messages
- Tool definitions and calls
- Bearer token authentication
- Error handling
- HTTPS requirement compliance

## Environment Variables

- `OPENAI_API_KEY` (required): API key for OpenAI-compatible endpoint
- `OPENAI_MODEL` (optional): defaults to `gpt-4o-mini`
- `OPENAI_BASE_URL` (optional): defaults to `https://api.openai.com/v1`

## Security & Safety

- HTTPS required for production deployment
- Input validation with Zod schemas
- Safe output coercion
- Medical disclaimers included
- Red flag warnings for serious conditions
- **Not a substitute for professional medical care**

## License

ISC
