const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    email: String
    avatar: String
    googleId: String
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    accessToken: String!
    user: User!
  }

  type Query {
    me: User
    user(id: ID!): User
  }

  type Mutation {
    # Local Authentication
    register(username: String!, password: String!, email: String): AuthPayload!
    login(username: String!, password: String!): AuthPayload!
    
    # Refresh Token
    refreshToken: AuthPayload!
    
    # Logout
    logout: Boolean!
    
    # Profile Management
    updateProfile(email: String, avatar: String): User!
    updatePassword(oldPassword: String!, newPassword: String!): Boolean!
    
    # Google OAuth (to be handled via REST endpoint, but can link account)
    linkGoogleAccount(googleId: String!, email: String): User!
    
    # Image Upload
    uploadAvatar(imageBase64: String!): User!
  }
`;

module.exports = typeDefs;
