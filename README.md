# Medical MCP Server

A Model Context Protocol (MCP) server that provides intelligent medical guidance using Google's Gemini AI. This server offers comprehensive medical assistance including symptom analysis, OTC medicine suggestions, home remedies, and nearby pharmacy locations.

## Features

- **🤖 AI-Powered Medical Guidance** - Uses Google Gemini for intelligent medical responses
- **💊 OTC Medicine Suggestions** - Safe over-the-counter medication recommendations
- **🏠 Home Remedies** - Natural treatment options with rationales
- **📍 Nearby Chemists** - Location-based pharmacy finder using OpenStreetMap
- **📹 Educational Videos** - Curated YouTube links for medical education
- **🚨 Red Flag Detection** - Identifies symptoms requiring immediate attention
- **🔐 MCP Protocol** - Full Model Context Protocol compliance for AI assistants
- **🌐 Web Interface** - Beautiful chat interface for direct interaction

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vyagh/puch-ai-mcp-js-main.git
   cd puch-ai-mcp-js-main
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env and add your Gemini API key
   ```

4. **Get a Gemini API key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env` file as `GEMINI_API_KEY`

## Usage

### Start the server:
```bash
npm start
```

The server will be available at `http://localhost:5173`

### Web Interface
Visit `http://localhost:5173` to use the chat interface for medical queries.

### API Endpoints

- `GET /health` - Health check
- `GET /api/tools` - List available MCP tools
- `POST /api/medical` - Medical assistance endpoint
- `POST /mcp` - MCP protocol endpoint

### MCP Tools

1. **validate** - Validates bearer tokens for Puch AI authentication
2. **medical_assist** - Provides comprehensive medical guidance

## Testing

Test the MCP protocol:
```bash
# List available tools
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  http://localhost:5173/mcp

# Test medical assistance
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"medical_assist","arguments":{"query":"I have a fever"}}}' \
  http://localhost:5173/mcp
```

## Deployment

This server is designed to work with platforms that support long-running Node.js applications:

- **Railway** (Recommended)
- **Render**
- **Heroku**

### Railway Deployment
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically

## Technical Details

- **Framework:** Express.js
- **AI Model:** Google Gemini 1.5 Flash
- **Location Services:** OpenStreetMap Overpass API
- **Protocol:** Model Context Protocol (MCP)
- **Language:** JavaScript (ES Modules)

## License

ISC
