# API Documentation

## Base URL
`http://localhost:4000`

## Authentication

The API uses JWT-based authentication with two types of tokens:

1. **Access Token**: Short-lived (15 minutes), stored in memory on client
2. **Refresh Token**: Long-lived (7 days), stored in HTTP-only cookie

### Headers

For authenticated requests, include the access token:
```
Authorization: Bearer <access_token>
```

### Cookies

The refresh token is automatically sent in cookies with `credentials: 'include'`

## REST Endpoints

### Health Check

**GET** `/health`

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Google OAuth

**GET** `/auth/google`

Initiates Google OAuth flow. Redirects to Google login.

**GET** `/auth/google/callback`

Google OAuth callback. Handles the OAuth response and redirects to frontend with access token.

## GraphQL Endpoint

**POST** `/graphql`

Main GraphQL endpoint for all queries and mutations.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <access_token> (for authenticated requests)
```

**Body:**
```json
{
  "query": "mutation { ... }",
  "variables": {}
}
```

---

## GraphQL Operations

### Authentication

#### Register

Create a new user account.

```graphql
mutation Register($username: String!, $password: String!, $email: String) {
  register(username: $username, password: $password, email: $email) {
    accessToken
    user {
      id
      username
      email
      createdAt
    }
  }
}
```

**Variables:**
```json
{
  "username": "johndoe",
  "password": "SecurePassword123!",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "data": {
    "register": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "username": "johndoe",
        "email": "john@example.com",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    }
  }
}
```

#### Login

Login with username and password.

```graphql
mutation Login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    accessToken
    user {
      id
      username
      email
      avatar
    }
  }
}
```

**Variables:**
```json
{
  "username": "johndoe",
  "password": "SecurePassword123!"
}
```

#### Refresh Token

Get a new access token using the refresh token from cookies.

```graphql
mutation RefreshToken {
  refreshToken {
    accessToken
    user {
      id
      username
      email
    }
  }
}
```

**Note:** No variables needed. Refresh token is read from HTTP-only cookie.

#### Logout

Logout and invalidate refresh token.

```graphql
mutation Logout {
  logout
}
```

**Response:**
```json
{
  "data": {
    "logout": true
  }
}
```

---

### User Queries

#### Get Current User

Get the authenticated user's profile.

```graphql
query Me {
  me {
    id
    username
    email
    avatar
    googleId
    createdAt
    updatedAt
  }
}
```

**Note:** Requires authentication (access token in header).

#### Get User by ID

Get any user's profile by ID.

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    username
    email
    avatar
    createdAt
  }
}
```

**Variables:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

### Profile Management

#### Update Profile

Update user's email or avatar.

```graphql
mutation UpdateProfile($email: String, $avatar: String) {
  updateProfile(email: $email, avatar: $avatar) {
    id
    username
    email
    avatar
    updatedAt
  }
}
```

**Variables:**
```json
{
  "email": "newemail@example.com",
  "avatar": "data:image/png;base64,iVBORw0KGgo..."
}
```

#### Update Password

Change user's password.

```graphql
mutation UpdatePassword($oldPassword: String!, $newPassword: String!) {
  updatePassword(oldPassword: $oldPassword, newPassword: $newPassword)
}
```

**Variables:**
```json
{
  "oldPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

#### Upload Avatar

Upload a profile picture as base64.

```graphql
mutation UploadAvatar($imageBase64: String!) {
  uploadAvatar(imageBase64: $imageBase64) {
    id
    username
    avatar
    updatedAt
  }
}
```

**Variables:**
```json
{
  "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Image Requirements:**
- Format: PNG, JPG, JPEG, GIF, or WEBP
- Max size: 5MB
- Must be base64 encoded with data URI prefix

#### Link Google Account

Link a Google account to existing user.

```graphql
mutation LinkGoogleAccount($googleId: String!, $email: String) {
  linkGoogleAccount(googleId: $googleId, email: $email) {
    id
    username
    email
    googleId
    updatedAt
  }
}
```

**Variables:**
```json
{
  "googleId": "google-user-id-12345",
  "email": "user@gmail.com"
}
```

---

## Error Handling

Errors are returned in the standard GraphQL format:

```json
{
  "errors": [
    {
      "message": "Not authenticated",
      "locations": [{"line": 2, "column": 3}],
      "path": ["me"]
    }
  ]
}
```

### Common Error Messages

- `"Not authenticated"` - No valid access token provided
- `"Invalid or expired access token"` - Token is invalid or expired
- `"Invalid or expired refresh token"` - Refresh token is invalid
- `"Username already exists"` - Username is taken
- `"Email already exists"` - Email is already registered
- `"Invalid credentials"` - Wrong username or password
- `"Invalid image format"` - Image must be valid base64 data URI
- `"Image size exceeds 5MB limit"` - Image is too large

---

## Complete Authentication Flow

### 1. Registration Flow

```javascript
// Step 1: Register
const registerMutation = `
  mutation Register($username: String!, $password: String!, $email: String) {
    register(username: $username, password: $password, email: $email) {
      accessToken
      user { id username email }
    }
  }
`;

const response = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important!
  body: JSON.stringify({
    query: registerMutation,
    variables: {
      username: 'johndoe',
      password: 'SecurePass123!',
      email: 'john@example.com'
    }
  })
});

const data = await response.json();
const accessToken = data.data.register.accessToken;

// Step 2: Store access token in memory (NOT localStorage)
// Use a state management solution or React context
```

### 2. Login Flow

```javascript
// Same as registration, but use login mutation
const loginMutation = `
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      accessToken
      user { id username email }
    }
  }
`;
```

### 3. Making Authenticated Requests

```javascript
const meQuery = `
  query Me {
    me {
      id
      username
      email
      avatar
    }
  }
`;

const response = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}` // From memory
  },
  credentials: 'include',
  body: JSON.stringify({ query: meQuery })
});
```

### 4. Token Refresh Flow

```javascript
// When access token expires (401/authentication error)
const refreshMutation = `
  mutation RefreshToken {
    refreshToken {
      accessToken
      user { id username }
    }
  }
`;

const response = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Sends refresh token cookie
  body: JSON.stringify({ query: refreshMutation })
});

const data = await response.json();
const newAccessToken = data.data.refreshToken.accessToken;
// Update access token in memory
```

### 5. Google OAuth Flow

```javascript
// Step 1: Redirect to Google OAuth
window.location.href = 'http://localhost:4000/auth/google';

// Step 2: Handle callback (in your frontend route)
// URL will be: http://localhost:3000/auth/callback?token=<access_token>
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('token');

// Step 3: Store access token in memory
// The refresh token is already set in cookies
```

---

## Best Practices

1. **Never store access tokens in localStorage** - Use memory only
2. **Always use `credentials: 'include'`** - Required for cookie-based refresh tokens
3. **Implement token refresh logic** - Automatically refresh when access token expires
4. **Handle errors gracefully** - Check for authentication errors and redirect to login
5. **Validate images client-side** - Check size and format before upload
6. **Use HTTPS in production** - Required for secure cookies

---

## Example Frontend Integration (React)

```javascript
// authContext.js
import { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);

  const login = async (username, password) => {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        query: `
          mutation Login($username: String!, $password: String!) {
            login(username: $username, password: $password) {
              accessToken
              user { id username email }
            }
          }
        `,
        variables: { username, password }
      })
    });

    const data = await response.json();
    if (data.data?.login) {
      setAccessToken(data.data.login.accessToken);
      setUser(data.data.login.user);
    }
  };

  const logout = async () => {
    await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        query: 'mutation { logout }'
      })
    });
    setAccessToken(null);
    setUser(null);
  };

  const refreshToken = async () => {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        query: 'mutation { refreshToken { accessToken user { id username } } }'
      })
    });

    const data = await response.json();
    if (data.data?.refreshToken) {
      setAccessToken(data.data.refreshToken.accessToken);
      setUser(data.data.refreshToken.user);
    }
  };

  return (
    <AuthContext.Provider value={{ accessToken, user, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```
