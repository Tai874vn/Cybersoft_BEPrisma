# Setup Guide

This guide will walk you through setting up the backend from scratch.

## Step 1: Prerequisites

Make sure you have:
- Node.js 18+ installed
- A Neon PostgreSQL database (or any PostgreSQL database)
- Google Cloud Console project for OAuth

## Step 2: Database Setup (Neon)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy your connection string (it looks like):
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this for the `.env` file

## Step 3: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:4000/auth/google/callback` (for development)
     - `https://yourdomain.com/auth/google/callback` (for production)
   - Click "Create"

5. Copy your:
   - Client ID
   - Client Secret

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and fill in your values:

```env
# Database - Paste your Neon connection string
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# JWT Secrets - Generate random strings (use: openssl rand -base64 32)
JWT_ACCESS_SECRET="your-random-access-secret-here"
JWT_REFRESH_SECRET="your-random-refresh-secret-here"

# Google OAuth - From Google Cloud Console
GOOGLE_CLIENT_ID="123456789-abcdefg.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4000/auth/google/callback"

# Session Secret - Generate random string
SESSION_SECRET="your-random-session-secret"

# Server Config
PORT=4000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# Cookie Settings (use 'true' and 'strict' in production)
COOKIE_SECURE="false"
COOKIE_SAME_SITE="lax"
```

### Generating Secure Secrets

Use this command to generate random secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 6: Initialize Database

Generate Prisma client:
```bash
npm run prisma:generate
```

Push schema to database:
```bash
npm run prisma:push
```

Or create a migration:
```bash
npm run prisma:migrate
```

## Step 7: Start the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server should start on `http://localhost:4000`

## Step 8: Verify Installation

1. Check health endpoint:
```bash
curl http://localhost:4000/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

2. Open GraphQL playground:
   - Go to `http://localhost:4000/graphql` in your browser
   - You should see the Apollo Server interface

3. Test registration:
```graphql
mutation {
  register(username: "testuser", password: "TestPass123!") {
    accessToken
    user {
      id
      username
    }
  }
}
```

## Step 9: View Database (Optional)

Open Prisma Studio to view and edit data:
```bash
npm run prisma:studio
```

This opens a GUI at `http://localhost:5555`

## Step 10: Frontend Integration

Update your frontend to:

1. Set the API URL to `http://localhost:4000`
2. Use `credentials: 'include'` in all fetch/axios requests
3. Store access tokens in memory (React state/context)
4. Implement token refresh logic

See `API.md` for detailed integration examples.

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

**Solution:** 
- Check your DATABASE_URL is correct
- Verify your Neon database is running
- Check if IP is whitelisted (Neon allows all by default)

### Google OAuth Not Working

**Error:** `redirect_uri_mismatch`

**Solution:**
- Check GOOGLE_CALLBACK_URL matches exactly with Google Console
- Make sure you added the redirect URI in Google Console
- Include the protocol (http:// or https://)

### CORS Errors

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution:**
- Check FRONTEND_URL in .env matches your frontend URL
- Make sure you're using `credentials: 'include'` in frontend requests
- Verify the frontend is running on the URL specified in FRONTEND_URL

### Cookie Not Being Set

**Problem:** Refresh token cookie not appearing

**Solution:**
- Make sure you're using `credentials: 'include'` in requests
- Check COOKIE_SECURE and COOKIE_SAME_SITE settings
- In development, use `COOKIE_SECURE="false"`
- In production with HTTPS, use `COOKIE_SECURE="true"`

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Find and kill the process using port 4000
# On macOS/Linux:
lsof -ti:4000 | xargs kill

# On Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

## Production Deployment

### Environment Variables for Production

```env
NODE_ENV="production"
COOKIE_SECURE="true"
COOKIE_SAME_SITE="strict"
DATABASE_URL="your-production-database-url"
FRONTEND_URL="https://yourdomain.com"
GOOGLE_CALLBACK_URL="https://yourdomain.com/auth/google/callback"
```

### Deployment Checklist

- [ ] Update all environment variables for production
- [ ] Use strong, unique secrets for JWT and session
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Update Google OAuth redirect URIs
- [ ] Update CORS origin to production frontend URL
- [ ] Run database migrations
- [ ] Test all authentication flows
- [ ] Set up monitoring and logging

### Recommended Platforms

- **Database:** Neon, Supabase, or any PostgreSQL hosting
- **Backend:** Vercel, Railway, Render, or AWS
- **Considerations:** Make sure your platform supports:
  - Node.js 18+
  - Environment variables
  - HTTP-only cookies
  - Long-running connections (for sessions)

## Additional Commands

```bash
# Generate Prisma client after schema changes
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Push schema changes without migration
npm run prisma:push

# Open Prisma Studio
npm run prisma:studio

# Start in development mode
npm run dev

# Start in production mode
npm start
```

## Next Steps

- Read `API.md` for complete API documentation
- Implement frontend authentication
- Set up error handling and logging
- Add rate limiting for production
- Implement refresh token rotation
- Add email verification (optional)
- Set up monitoring and alerts

## Support

For issues or questions:
- Check the API documentation in `API.md`
- Review the README.md
- Check GitHub issues
