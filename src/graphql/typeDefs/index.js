const typeDefs = `#graphql
  enum Role {
    USER
    ADMIN
  }

  type User {
    id: ID!
    username: String!
    email: String
    avatar: String
    googleId: String
    role: Role!
    createdAt: String!
    updatedAt: String!
    posts: [Post!]
    comments: [Comment!]
    savedPosts: [SavedPost!]
  }

  type Post {
    id: ID!
    title: String!
    description: String
    image: String!
    userId: String!
    user: User!
    comments: [Comment!]
    isSaved: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Comment {
    id: ID!
    content: String!
    userId: String!
    postId: String!
    user: User!
    post: Post!
    isSaved: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type SavedPost {
    id: ID!
    userId: String!
    postId: String!
    user: User!
    post: Post!
    createdAt: String!
  }

  type SavedComment {
    id: ID!
    userId: String!
    commentId: String!
    user: User!
    comment: Comment!
    createdAt: String!
  }

  type AuthPayload {
    accessToken: String!
    user: User!
  }

  type PostConnection {
    posts: [Post!]!
    totalCount: Int!
    totalPages: Int!
    hasMore: Boolean!
    page: Int!
  }

  type CommentConnection {
    comments: [Comment!]!
    totalCount: Int!
    hasMore: Boolean!
    page: Int!
  }

  type SavedPostConnection {
    savedPosts: [SavedPost!]!
    totalCount: Int!
    totalPages: Int!
    hasMore: Boolean!
    page: Int!
  }

  type SavedCommentConnection {
    savedComments: [SavedComment!]!
    totalCount: Int!
    totalPages: Int!
    hasMore: Boolean!
    page: Int!
  }

  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users(page: Int, limit: Int): [User!]!
    isAdmin: Boolean!

    # Post queries
    getPosts(page: Int, limit: Int): PostConnection!
    searchPosts(query: String!, page: Int, limit: Int): PostConnection!
    getPost(id: ID!): Post
    getUserPosts(userId: ID!, page: Int, limit: Int): PostConnection!

    # Comment queries
    getComments(postId: ID!, page: Int, limit: Int): CommentConnection!
    getAllComments(page: Int, limit: Int): CommentConnection!

    # Saved post queries
    getSavedPosts(page: Int, limit: Int): SavedPostConnection!
    isPostSaved(postId: ID!): Boolean!

    # Saved comment queries
    getSavedComments(page: Int, limit: Int): SavedCommentConnection!
    isCommentSaved(commentId: ID!): Boolean!
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

    # Post mutations
    createPost(title: String!, description: String, imageBase64: String!): Post!
    updatePost(id: ID!, title: String, description: String, imageBase64: String): Post!
    deletePost(id: ID!): Boolean!

    # Comment mutations
    createComment(postId: ID!, content: String!): Comment!
    deleteComment(id: ID!): Boolean!

    # Saved post mutations
    savePost(postId: ID!): SavedPost!
    unsavePost(postId: ID!): Boolean!

    # Saved comment mutations
    saveComment(commentId: ID!): SavedComment!
    unsaveComment(commentId: ID!): Boolean!

    # Admin mutations
    updateUserRole(userId: ID!, role: Role!): User!
    deleteUser(userId: ID!): Boolean!
    adminDeletePost(postId: ID!): Boolean!
    adminDeleteComment(commentId: ID!): Boolean!
  }
`;

export default typeDefs;
