# GraphQL Query Examples

This file contains ready-to-use GraphQL queries and mutations for testing the API.

## Authentication

### 1. Register a New User

```graphql
mutation Register {
  register(
    username: "john_doe"
    password: "SecurePass123!"
    email: "john@example.com"
  ) {
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

### 2. Login

```graphql
mutation Login {
  login(
    username: "john_doe"
    password: "SecurePass123!"
  ) {
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

### 3. Refresh Access Token

```graphql
mutation RefreshToken {
  refreshToken {
    accessToken
    user {
      id
      username
    }
  }
}
```

### 4. Logout

```graphql
mutation Logout {
  logout
}
```

## User Queries (Requires Authentication)

### 5. Get Current User Profile

```graphql
query GetMe {
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

**Headers Required:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 6. Get User by ID

```graphql
query GetUser($userId: ID!) {
  user(id: $userId) {
    id
    username
    email
    avatar
    createdAt
  }
}
```

## Profile Management (Requires Authentication)

### 7. Update Email

```graphql
mutation UpdateEmail {
  updateProfile(email: "newemail@example.com") {
    id
    username
    email
    updatedAt
  }
}
```

### 8. Update Password

```graphql
mutation UpdatePassword {
  updatePassword(
    oldPassword: "SecurePass123!"
    newPassword: "NewSecurePass456!"
  )
}
```

### 9. Upload Avatar (Base64)

```graphql
mutation UploadAvatar($image: String!) {
  uploadAvatar(imageBase64: $image) {
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
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

## Testing with JavaScript

```javascript
// Registration
const response = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    query: `mutation { register(username: "test", password: "Test123!") { accessToken user { id } } }`
  })
});

const data = await response.json();
const accessToken = data.data.register.accessToken;

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
