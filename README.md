# Cybersoft Backend with Prisma

A robust backend API built with Express.js, GraphQL, Prisma ORM, and Neon PostgreSQL. Features JWT-based authentication, Google OAuth, and base64 image storage.

## Features

- ✅ **Dual Authentication**: Local account login and Google OAuth
- ✅ **JWT Token Management**: Access tokens (memory) + Refresh tokens (database)
- ✅ **GraphQL API**: Type-safe queries and mutations
- ✅ **Base64 Image Storage**: Store images directly in database
- ✅ **Cookie-based Auth**: Secure HTTP-only cookies for refresh tokens
- ✅ **Optional Email**: Email field is optional for users
- ✅ **Account Linking**: Link Google account to existing users
- ✅ **Prisma ORM**: Type-safe database operations
- ✅ **Neon PostgreSQL**: Serverless PostgreSQL database

## Tech Stack

- **Framework**: Express.js
- **API**: GraphQL (Apollo Server)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: JWT, Passport.js, Google OAuth 2.0
- **Image Storage**: Base64 encoding

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Google OAuth credentials

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Cybersoft_BEPrisma
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`: Random secure strings
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
- Other settings as needed

4. Generate Prisma Client:
```bash
npm run prisma:generate
```

5. Push database schema:
```bash
npm run prisma:push
```

Or run migrations:
```bash
npm run prisma:migrate
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Prisma Studio (Database GUI)
```bash
npm run prisma:studio
```

## API Endpoints

### REST Endpoints

- `GET /health` - Health check
- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback

### GraphQL Endpoint

`POST /graphql` - GraphQL API endpoint

## GraphQL Schema

### Queries

```graphql
# Get current authenticated user
me: User

# Get user by ID
user(id: ID!): User
```

### Mutations

```graphql
# Register new user
register(username: String!, password: String!, email: String): AuthPayload!

# Login with credentials
login(username: String!, password: String!): AuthPayload!

# Refresh access token
refreshToken: AuthPayload!

# Logout
logout: Boolean!

# Update profile
updateProfile(email: String, avatar: String): User!

# Update password
updatePassword(oldPassword: String!, newPassword: String!): Boolean!

# Link Google account
linkGoogleAccount(googleId: String!, email: String): User!

# Upload avatar (base64)
uploadAvatar(imageBase64: String!): User!
```

## Authentication Flow

### Local Registration/Login

1. Client calls `register` or `login` mutation
2. Server returns access token and sets refresh token cookie
3. Client stores access token in memory
4. Client includes access token in Authorization header for subsequent requests

### Google OAuth

1. Client redirects to `/auth/google`
2. User authenticates with Google
3. Server creates/links account and generates tokens
4. Server redirects to frontend with access token
5. Client stores access token in memory

### Token Refresh

1. When access token expires, client calls `refreshToken` mutation
2. Server validates refresh token from cookie
3. Server returns new access token
4. Client updates access token in memory

### Frontend Integration

Frontend must use `credentials: 'include'` in fetch/axios requests:

```javascript
// GraphQL request example
fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}` // Access token from memory
  },
  credentials: 'include', // Important: Include cookies
  body: JSON.stringify({
    query: '...',
    variables: {}
  })
})
```

## Image Upload

Images are stored as base64-encoded strings in the database. Max size: 5MB.

Format: `data:image/png;base64,iVBORw0KGgoAAAANS...`

```graphql
mutation {
  uploadAvatar(imageBase64: "data:image/png;base64,...") {
    id
    avatar
  }
}
```

## Database Schema

### User Model
- `id`: UUID primary key
- `username`: Unique username
- `email`: Optional unique email
- `password`: Hashed password (null for OAuth users)
- `googleId`: Google account ID (null for local users)
- `avatar`: Base64 encoded image
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp

### RefreshToken Model
- `id`: UUID primary key
- `token`: JWT refresh token
- `userId`: Foreign key to User
- `expiresAt`: Expiration timestamp
- `createdAt`: Creation timestamp

## Security Features

- ✅ Password hashing with bcrypt
- ✅ HTTP-only cookies for refresh tokens
- ✅ CORS configured for frontend origin
- ✅ JWT token expiration
- ✅ Refresh token rotation
- ✅ Secure cookie settings for production

## Project Structure

```
src/
├── config/
│   ├── passport.js       # Google OAuth configuration
│   └── prisma.js         # Prisma client setup
├── controllers/
│   └── authController.js # OAuth callback handlers
├── graphql/
│   ├── resolvers/
│   │   └── index.js      # GraphQL resolvers
│   └── typeDefs/
│       └── index.js      # GraphQL schema
├── middleware/
│   └── auth.js           # Authentication middleware
├── utils/
│   ├── imageHandler.js   # Base64 image utilities
│   ├── jwt.js            # JWT token utilities
│   └── password.js       # Password hashing utilities
└── index.js              # Express server setup
```

## Environment Variables

See `.env.example` for all available environment variables.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC