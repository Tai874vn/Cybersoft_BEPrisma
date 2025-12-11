# Architecture Overview

## System Architecture

This backend follows a layered architecture pattern with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
│           (Frontend: React/Vue/Angular/etc.)                │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/HTTPS
                          │ credentials: 'include'
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     Express Server                          │
│                   (Port 4000)                               │
├─────────────────────────────────────────────────────────────┤
│  REST Endpoints         │    GraphQL Endpoint               │
│  /health               │    /graphql                        │
│  /auth/google          │                                    │
│  /auth/google/callback │                                    │
└─────────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
┌──────────────────────┐    ┌──────────────────────┐
│  Passport.js OAuth   │    │  Apollo Server       │
│  (Google Strategy)   │    │  (GraphQL)           │
└──────────────────────┘    └──────────────────────┘
            │                           │
            │                           ▼
            │               ┌──────────────────────┐
            │               │  Auth Middleware     │
            │               │  (JWT Verification)  │
            │               └──────────────────────┘
            │                           │
            └───────────┬───────────────┘
                        │
                        ▼
            ┌──────────────────────┐
            │   GraphQL Resolvers  │
            │   (Business Logic)   │
            └──────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
┌──────────────────────┐    ┌──────────────────────┐
│   Prisma ORM         │    │   Utilities          │
│   (Primary)          │    │   - JWT              │
│                      │    │   - Password Hash    │
│   Sequelize          │    │   - Image Handler    │
│   (Optional)         │    │                      │
└──────────────────────┘    └──────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (Neon)                     │
│                                                             │
│  Tables:                                                    │
│  - User (id, username, email, password, googleId, avatar)  │
│  - RefreshToken (id, token, userId, expiresAt)            │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Authentication Flow (Local)

```
User Input (username, password)
        │
        ▼
   register/login mutation
        │
        ▼
   GraphQL Resolver
        │
        ├──> Hash password (bcrypt)
        │
        ├──> Create/Find user in DB (Prisma)
        │
        ├──> Generate JWT tokens
        │    - Access Token (15m)
        │    - Refresh Token (7d)
        │
        ├──> Store refresh token in DB
        │
        ├──> Set refresh token in HTTP-only cookie
        │
        └──> Return access token to client
                │
                ▼
        Client stores in memory
```

### 2. Authentication Flow (Google OAuth)

```
User clicks "Login with Google"
        │
        ▼
   Redirect to /auth/google
        │
        ▼
   Google OAuth consent screen
        │
        ▼
   User authorizes
        │
        ▼
   Redirect to /auth/google/callback
        │
        ▼
   Passport.js strategy
        │
        ├──> Find/Create user in DB
        │    - Check googleId
        │    - Check email
        │    - Link or create account
        │
        ├──> Generate JWT tokens
        │
        ├──> Store refresh token in DB
        │
        ├──> Set refresh token in cookie
        │
        └──> Redirect to frontend with access token
                │
                ▼
        Frontend stores token in memory
```

### 3. Authenticated Request Flow

```
Client makes request
        │
        ├──> Access Token in Authorization header
        │    OR Access Token in cookie
        │
        └──> Refresh Token in HTTP-only cookie
        
        ▼
   Auth Middleware
        │
        ├──> Extract token
        │
        ├──> Verify JWT signature
        │
        ├──> Check expiration
        │
        └──> Decode userId
        
        ▼
   GraphQL Context { user: { id } }
        │
        ▼
   Resolver executes
        │
        ├──> Check authentication (requireAuth)
        │
        ├──> Fetch/Update data (Prisma)
        │
        └──> Return response
```

### 4. Token Refresh Flow

```
Access token expires
        │
        ▼
   Client calls refreshToken mutation
        │
        ▼
   Resolver reads refresh token from cookie
        │
        ├──> Verify JWT signature
        │
        ├──> Check token exists in DB
        │
        ├──> Check expiration
        │
        ├──> Generate new access token
        │
        └──> Return new access token
                │
                ▼
        Client updates token in memory
```

## Security Architecture

### Token Strategy

1. **Access Token**
   - Short-lived (15 minutes)
   - Stored in memory (client-side)
   - Sent in Authorization header
   - Contains: userId, expiration
   - Purpose: Authorize API requests

2. **Refresh Token**
   - Long-lived (7 days)
   - Stored in database
   - Sent in HTTP-only cookie
   - Cannot be accessed by JavaScript
   - Purpose: Obtain new access tokens

### Cookie Configuration

```javascript
{
  httpOnly: true,        // Prevents XSS attacks
  secure: true,          // HTTPS only (production)
  sameSite: 'strict',    // Prevents CSRF (production)
  maxAge: 7 days         // Auto-expire
}
```

### Password Security

- Bcrypt hashing with salt rounds: 10
- Never stored in plain text
- Only hashed password stored in database

### Database Security

- No sensitive data in tokens
- Refresh tokens can be revoked
- Expired tokens automatically cleaned up
- Cascading delete on user removal

## Component Responsibilities

### 1. Server (`src/index.js`)
- Initialize Express app
- Configure middleware (CORS, cookies, sessions)
- Set up Apollo GraphQL server
- Define REST routes (OAuth)
- Start HTTP server

### 2. GraphQL Layer

#### Type Definitions (`src/graphql/typeDefs/`)
- Define GraphQL schema
- Specify types, queries, mutations
- Document API structure

#### Resolvers (`src/graphql/resolvers/`)
- Implement business logic
- Handle authentication
- Database operations via Prisma
- Input validation
- Error handling

### 3. Authentication

#### Middleware (`src/middleware/auth.js`)
- Extract tokens from request
- Verify JWT signatures
- Populate GraphQL context
- Protect routes

#### Passport Config (`src/config/passport.js`)
- Google OAuth strategy
- User serialization
- Account linking logic
- OAuth callback handling

### 4. Utilities

#### JWT (`src/utils/jwt.js`)
- Generate access/refresh tokens
- Verify token signatures
- Extract user data

#### Password (`src/utils/password.js`)
- Hash passwords with bcrypt
- Compare passwords securely

#### Image Handler (`src/utils/imageHandler.js`)
- Validate base64 images
- Check file size (5MB limit)
- Verify image format
- Process uploads

### 5. Database Layer

#### Prisma (`src/config/prisma.js`)
- Database connection
- Type-safe queries
- Automatic migrations
- Schema management

#### Sequelize (`src/config/sequelize.js`)
- Optional ORM
- Available if needed
- Can coexist with Prisma

## Scalability Considerations

### Current Design Benefits

1. **Stateless API**: JWT tokens allow horizontal scaling
2. **Database-backed sessions**: Refresh tokens in DB for consistency
3. **Separate storage layers**: Easy to switch/scale databases
4. **GraphQL batching**: Efficient data fetching

### Future Enhancements

1. **Redis for sessions**: Cache refresh tokens for performance
2. **CDN for images**: Move base64 to object storage (S3, Cloudinary)
3. **Rate limiting**: Protect against abuse
4. **Load balancing**: Multiple server instances
5. **Database pooling**: Connection management
6. **Caching layer**: Cache frequently accessed data

## Error Handling

### Strategy

1. **GraphQL errors**: Returned in `errors` array
2. **Validation errors**: Clear, actionable messages
3. **Authentication errors**: Generic messages to prevent enumeration
4. **Server errors**: Logged but not exposed to client

### Example Error Response

```json
{
  "errors": [
    {
      "message": "Not authenticated",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

## Testing Strategy

### Unit Tests (Recommended)
- JWT generation/verification
- Password hashing/comparison
- Image validation
- Resolver logic

### Integration Tests (Recommended)
- Authentication flow
- GraphQL mutations
- Database operations
- OAuth callback

### E2E Tests (Recommended)
- Complete user registration
- Login and token refresh
- Profile updates
- Image uploads

## Performance Optimizations

1. **Database Indexes**: On frequently queried fields
2. **Connection Pooling**: Prisma handles automatically
3. **GraphQL DataLoader**: Batch requests (can be added)
4. **Image Compression**: Validate size before upload
5. **Token Caching**: Store in memory for duration

## Security Best Practices

- ✅ Environment variables for secrets
- ✅ HTTP-only cookies for refresh tokens
- ✅ CORS configured properly
- ✅ Password hashing with bcrypt
- ✅ JWT expiration times
- ✅ Refresh token rotation (can be enhanced)
- ✅ HTTPS required in production
- ✅ Input validation
- ⚠️ Rate limiting (should be added)
- ⚠️ CSRF protection (consider for state-changing operations)

## Deployment Architecture

### Development
```
localhost:4000 (Backend)
localhost:3000 (Frontend)
Local/Neon DB
```

### Production
```
                    ┌──────────────┐
                    │   CDN/Edge   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Frontend    │
                    │  (Vercel)    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Backend     │
                    │  (Railway)   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Database    │
                    │  (Neon)      │
                    └──────────────┘
```

## Monitoring & Logging

### Recommended Tools

- **Application**: Winston, Pino
- **Errors**: Sentry
- **Performance**: New Relic, DataDog
- **Database**: Prisma Accelerate
- **Uptime**: UptimeRobot

### Key Metrics

- Request latency
- Error rates
- Token generation rate
- Database query time
- Active sessions
