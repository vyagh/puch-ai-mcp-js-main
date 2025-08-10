# 🚀 Vercel Deployment Guide for Puch AI Hackathon

## Quick Deploy to Vercel

### Option 1: Deploy Button (Easiest)
1. **Fork this repository** to your GitHub account
2. **Click the Deploy Button** below:
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/puch-ai-mcp-js-main)
3. **Add Environment Variable**:
   - Name: `OPENAI_API_KEY`
   - Value: `your_actual_openai_api_key`
4. **Deploy!**

### Option 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# Add environment variable
vercel env add OPENAI_API_KEY

# Deploy to production
vercel --prod
```

### Option 3: GitHub Integration
1. **Push your code to GitHub**
2. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Add environment variable**: `OPENAI_API_KEY=your_key`
6. **Deploy!**

## 🔧 Configuration

### Environment Variables
Set these in your Vercel project settings:

| Variable | Value | Required |
|----------|-------|----------|
| `OPENAI_API_KEY` | `your_openai_api_key` | ✅ Yes |
| `OPENAI_MODEL` | `gpt-4o-mini` | ❌ No (default) |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | ❌ No (default) |

### How to Add Environment Variables
1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add each variable with its value
4. Redeploy if needed

## 🌐 Your Deployed URLs

After deployment, you'll get:
- **Production URL**: `https://your-project.vercel.app`
- **Preview URLs**: For each git push/PR

## 🔗 Connect to Puch AI

Once deployed, connect your MCP server to Puch AI:

```
/mcp connect https://your-project.vercel.app/mcp your_bearer_token
```

## 🧪 Testing Your Deployment

### 1. Test Web Interface
Visit: `https://your-project.vercel.app`
- Should show the medical chat interface
- Try typing a symptom like "I have a fever"

### 2. Test MCP Endpoint
Visit: `https://your-project.vercel.app/api/tools`
- Should return JSON with available tools

### 3. Test in Puch AI
- Use the `/mcp connect` command
- Test the `medical_assist` tool with a symptom

## 📊 Monitor Your Deployment

### Vercel Dashboard
- **Analytics**: Track visits and performance
- **Functions**: Monitor serverless function usage
- **Logs**: View real-time logs

### Usage Tracking
- Your MCP server usage will appear on the Puch AI hackathon leaderboard
- More connections = higher ranking!

## 🔧 Troubleshooting

### Common Issues

**1. Environment Variables Not Set**
- Go to Vercel Dashboard → Settings → Environment Variables
- Add `OPENAI_API_KEY` with your actual key
- Redeploy the project

**2. MCP Server Not Responding**
- Check Vercel function logs
- Verify the `server.js` file is in the root directory
- Ensure `vercel.json` is properly configured

**3. CORS Issues**
- Vercel handles CORS automatically
- If issues persist, check the `vercel.json` routes

### Debug Commands
```bash
# View deployment logs
vercel logs

# Check deployment status
vercel ls

# Redeploy
vercel --prod
```

## 🎉 Success!

Your MCP server is now:
- ✅ **Deployed on Vercel** with HTTPS
- ✅ **Production Ready** with proper routing
- ✅ **Scalable** with serverless functions
- ✅ **Monitored** with Vercel analytics
- ✅ **Ready for Puch AI** connection

## 📈 Next Steps

1. **Test thoroughly** with different symptoms
2. **Share your URL** in hackathon channels
3. **Monitor usage** on the leaderboard
4. **Iterate** based on feedback

**Good luck in the hackathon! Your medical assistant is ready to help people! 🏥🚀**

---

*Deploy with confidence - Vercel makes it easy!*
