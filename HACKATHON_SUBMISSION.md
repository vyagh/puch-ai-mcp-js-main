# 🏥 Medical Assistant MCP Server - Puch AI Hackathon Submission

## 🎯 Project Overview

A **Model Context Protocol (MCP) server** that provides intelligent medical guidance by expanding short symptom descriptions into comprehensive, structured advice. Built for the [Puch AI Hackathon](https://puch.ai/hack).

## ✨ Features

- **🔍 Symptom Analysis**: Takes brief symptom inputs and expands them into detailed medical guidance
- **💊 OTC Recommendations**: Suggests over-the-counter medicines with dosage and safety information
- **🏥 Nearby Chemists**: Finds nearby pharmacies using OpenStreetMap data (when location provided)
- **🏠 Home Remedies**: Provides natural treatment options with explanations
- **📺 Educational Videos**: Curates relevant YouTube videos for home care guidance
- **⚠️ Safety Alerts**: Highlights red flags that require immediate medical attention
- **🔐 Puch AI Compatible**: Includes required `validate` tool for authentication

## 🛠️ Technical Stack

- **Node.js 18+** with ES modules
- **@modelcontextprotocol/sdk** for MCP implementation
- **OpenAI API** for intelligent medical guidance
- **OpenStreetMap Overpass API** for pharmacy locations
- **Express.js** for web interface
- **Zod** for input validation

## 🚀 Quick Deploy

### Option 1: Railway (Recommended)
```bash
# 1. Fork this repository
# 2. Go to https://railway.app/
# 3. Connect GitHub and create new project
# 4. Add environment variable: OPENAI_API_KEY=your_key
# 5. Deploy!
```

### Option 2: Render
```bash
# 1. Fork this repository  
# 2. Go to https://render.com/
# 3. Create Web Service from GitHub repo
# 4. Set build: npm install, start: node server.js
# 5. Add OPENAI_API_KEY environment variable
# 6. Deploy!
```

## 🔗 Connect to Puch AI

Once deployed, connect your server to Puch AI:

```
/mcp connect https://your-server-url.com/mcp your_bearer_token
```

## 🧪 Testing

### Local Testing
```bash
# Install dependencies
npm install

# Set your OpenAI API key
export OPENAI_API_KEY=your_key

# Test MCP Inspector
npm run inspect

# Test web interface
node server.js
# Visit http://localhost:5173
```

### Tool Testing
Test the three available tools:

1. **validate** - Authentication (required by Puch AI)
2. **medical_assist** - Main medical guidance tool
3. **echo** - Simple echo for testing

## 📋 Available Tools

### 1. validate
**Purpose**: Authenticates users for Puch AI (REQUIRED)
**Input**: `{ "bearer_token": "string" }`
**Output**: `{ "phone_number": "919876543210" }`

### 2. medical_assist  
**Purpose**: Provides comprehensive medical guidance
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

### 3. echo
**Purpose**: Simple echo for connectivity testing
**Input**: `{ "text": "Hello" }`
**Output**: `{ "text": "Hello" }`

## 🏆 Hackathon Impact

This MCP server addresses a real need for accessible, immediate medical guidance while maintaining safety through:
- Clear disclaimers about professional medical advice
- Red flag warnings for serious symptoms
- Structured, actionable recommendations
- Educational content through curated videos

## 🔒 Security & Safety

- ✅ HTTPS required for Puch AI deployment
- ✅ Input validation with Zod schemas
- ✅ Safe output coercion
- ✅ Medical disclaimers included
- ✅ Red flag warnings for serious conditions
- ⚠️ **Not a substitute for professional medical care**

## 📊 Usage Tracking

Once deployed and connected to Puch AI, your server's usage will be tracked on the hackathon leaderboard. The more users connect and use your medical assistant, the higher your ranking!

## 🎉 Ready for Submission!

Your MCP server is now:
- ✅ **Puch AI Compatible** with required `validate` tool
- ✅ **Production Ready** with proper error handling
- ✅ **Well Documented** with clear setup instructions
- ✅ **Tested** and verified working
- ✅ **Deployable** to multiple platforms

**Good luck in the hackathon! 🚀**

---

*Built with ❤️ for the Puch AI Hackathon*
