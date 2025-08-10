#!/bin/bash

# Railway Deployment Script for Puch AI Hackathon
echo "🚀 Railway Deployment Script for Medical Assistant MCP Server"
echo "=============================================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway:"
    railway login
fi

# Create new project
echo "📦 Creating new Railway project..."
railway init

# Add environment variable
echo "🔑 Adding OpenAI API key environment variable..."
echo "Please enter your OpenAI API key:"
read -s OPENAI_API_KEY
railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"

# Deploy
echo "🚀 Deploying to Railway..."
railway up

# Get the URL
echo "🌐 Getting deployment URL..."
DEPLOY_URL=$(railway domain)
echo "✅ Your MCP server is deployed at: $DEPLOY_URL"

echo ""
echo "🎉 Deployment Complete!"
echo "========================="
echo "🌐 Server URL: $DEPLOY_URL"
echo "🔗 Connect to Puch AI with:"
echo "   /mcp connect $DEPLOY_URL/mcp your_bearer_token"
echo ""
echo "📊 Monitor usage at: https://railway.app/dashboard"
echo "🔧 View logs with: railway logs"
echo ""
echo "Good luck in the hackathon! 🚀"
