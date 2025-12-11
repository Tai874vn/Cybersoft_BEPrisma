# Quick Start Guide

Get the backend running in 5 minutes!

## Prerequisites
- Node.js 18+
- A Neon PostgreSQL database (free tier works)
- Google OAuth credentials (optional, for OAuth login)

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Random secret (e.g., `openssl rand -base64 32`)
- `JWT_REFRESH_SECRET` - Another random secret
- `GOOGLE_CLIENT_ID` - From Google Cloud Console (optional)
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console (optional)

**Minimum .env for testing:**
```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
JWT_ACCESS_SECRET="your-secret-here"
JWT_REFRESH_SECRET="another-secret-here"
SESSION_SECRET="session-secret-here"
FRONTEND_URL="http://localhost:3000"
```

### 3. Setup Database
```bash
npm run prisma:generate
npm run prisma:push
```

### 4. Start Server
```bash
npm run dev
```

Server runs on `http://localhost:4000`

## Quick Test

### 1. Health Check
```bash
curl http://localhost:4000/health
```

### 2. Register User (GraphQL)

Open `http://localhost:4000/graphql` in browser and run:

```graphql
mutation {
  register(
    username: "testuser"
    password: "TestPass123!"
    email: "test@example.com"
  ) {
    accessToken
    user {
      id
      username
      email
    }
  }
}
```

### 3. Login
```graphql
mutation {
  login(username: "testuser", password: "TestPass123!") {
    accessToken
    user {
      id
      username
    }
  }
}
```

### 4. Get Profile (use token from login)
```graphql
query {
  me {
    id
    username
    email
  }
}
```

Add header: `Authorization: Bearer YOUR_ACCESS_TOKEN`

## Common Issues

**Connection Error?**
- Check DATABASE_URL is correct
- Verify Neon database is running
- Check network connectivity

**GraphQL Errors?**
- Make sure Prisma client is generated: `npm run prisma:generate`
- Check all required env variables are set
- Restart the server

**Google OAuth Not Working?**
- Google OAuth is optional
- Can use local authentication without it
- Set up later if needed

## Next Steps

- Read [API.md](./API.md) for complete API docs
- Check [SETUP.md](./SETUP.md) for detailed setup
- See [examples/graphql-queries.md](./examples/graphql-queries.md) for more queries

## Key Endpoints

- GraphQL API: `http://localhost:4000/graphql`
- Health Check: `http://localhost:4000/health`
- Google OAuth: `http://localhost:4000/auth/google`

## Essential Commands

```bash
npm run dev              # Start in development mode
npm start                # Start in production mode
npm run prisma:studio    # Open database GUI
npm run prisma:migrate   # Create migration
npm run health           # Check if server is running
```

## Frontend Integration

```javascript
// Register/Login
const response = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important!
  body: JSON.stringify({
    query: `mutation { login(username: "user", password: "pass") { accessToken user { id } } }`
  })
});

// Authenticated Request
const meResponse = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  credentials: 'include',
  body: JSON.stringify({
    query: `query { me { id username email } }`
  })
});
```

## Need Help?

- Check [README.md](./README.md) for overview
- Read [SETUP.md](./SETUP.md) for detailed instructions
- Review [API.md](./API.md) for API documentation
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design

## Production Deployment

When deploying to production:

1. Set `NODE_ENV=production`
2. Set `COOKIE_SECURE=true`
3. Use strong secrets
4. Enable HTTPS
5. Update CORS origin

See [SETUP.md](./SETUP.md) for full production checklist.
