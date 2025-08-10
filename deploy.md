# Puch AI Hackathon Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended)
1. Fork this repository to your GitHub
2. Go to [Railway](https://railway.app/)
3. Connect your GitHub account
4. Create new project from GitHub repo
5. Add environment variable: `OPENAI_API_KEY=your_key`
6. Deploy! Railway will give you a HTTPS URL

### Option 2: Render
1. Fork this repository to your GitHub
2. Go to [Render](https://render.com/)
3. Create new Web Service
4. Connect your GitHub repo
5. Set build command: `npm install`
6. Set start command: `node server.js`
7. Add environment variable: `OPENAI_API_KEY=your_key`
8. Deploy!

### Option 3: Vercel
1. Fork this repository to your GitHub
2. Go to [Vercel](https://vercel.com/)
3. Import your GitHub repo
4. Add environment variable: `OPENAI_API_KEY=your_key`
5. Deploy!

## Connect to Puch AI

Once deployed, use your server URL in Puch AI:

```
/mcp connect https://your-server-url.com/mcp your_bearer_token
```

## Testing Your Deployment

1. Test the web interface: `https://your-server-url.com`
2. Test MCP Inspector locally: `npx @modelcontextprotocol/inspector -- curl -s https://your-server-url.com/mcp`
3. Test in Puch AI with the connect command

## Important Notes

- ✅ Your server now has the required `validate` tool
- ✅ HTTPS is required by Puch AI
- ✅ The `validate` tool returns mock phone number `919876543210`
- ⚠️ Replace mock authentication with real auth for production
- ⚠️ Make sure `OPENAI_API_KEY` is set in your deployment environment

## Hackathon Submission

For the Puch AI hackathon:
1. Deploy your server
2. Test the connection in Puch AI
3. Share your server URL for others to use
4. Your usage stats will appear on the leaderboard!

Good luck! 🚀
