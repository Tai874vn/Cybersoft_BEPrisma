import prisma from '../../config/prisma.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { requireAuth } from '../../middleware/auth.js';
import { processImageUpload } from '../../utils/imageHandler.js';

const requireAdmin = (context) => {
  const user = requireAuth(context);
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  return user;
};

const resolvers = {
  Query: {
    /**
     * Get current authenticated user
     */
    me: async (_, __, context) => {
      const user = requireAuth(context);

      return await prisma.user.findUnique({
        where: { id: user.id },
      });
    },

    /**
     * Get user by ID
     */
    user: async (_, { id }, context) => {
      requireAuth(context);

      return await prisma.user.findUnique({
        where: { id },
      });
    },

    /**
     * Get all users with pagination (admin only)
     */
    users: async (_, { page = 1, limit = 20 }, context) => {
      const user = requireAuth(context);
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (fullUser.role !== 'ADMIN') {
        throw new Error('Admin access required');
      }

      const skip = (page - 1) * limit;
      return await prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    },

    /**
     * Get all posts with pagination
     */
    getPosts: async (_, { page = 1, limit = 20 }) => {
      const skip = (page - 1) * limit;

      const [posts, totalCount] = await Promise.all([
        prisma.post.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: true,
            comments: {
              include: {
                user: true,
              },
            },
          },
        }),
        prisma.post.count(),
      ]);

      return {
        posts,
        totalCount,
        hasMore: skip + posts.length < totalCount,
        page,
      };
    },

    /**
     * Search posts by title, description with pagination
     */
    searchPosts: async (_, { query, page = 1, limit = 20 }) => {
      const skip = (page - 1) * limit;

      const where = {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      };

      const [posts, totalCount] = await Promise.all([
        prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: true,
            comments: {
              include: {
                user: true,
              },
            },
          },
        }),
        prisma.post.count({ where }),
      ]);

      return {
        posts,
        totalCount,
        hasMore: skip + posts.length < totalCount,
        page,
      };
    },

    /**
     * Get single post by ID
     */
    getPost: async (_, { id }) => {
      return await prisma.post.findUnique({
        where: { id },
        include: {
          user: true,
          comments: {
            include: {
              user: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    },

    /**
     * Get posts by user ID with pagination
     */
    getUserPosts: async (_, { userId, page = 1, limit = 20 }) => {
      const skip = (page - 1) * limit;

      const where = { userId };

      const [posts, totalCount] = await Promise.all([
        prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: true,
            comments: {
              include: {
                user: true,
              },
            },
          },
        }),
        prisma.post.count({ where }),
      ]);

      return {
        posts,
        totalCount,
        hasMore: skip + posts.length < totalCount,
        page,
      };
    },

    /**
     * Get comments for a post with pagination
     */
    getComments: async (_, { postId, page = 1, limit = 20 }) => {
      const skip = (page - 1) * limit;

      const where = { postId };

      const [comments, totalCount] = await Promise.all([
        prisma.comment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: true,
            post: true,
          },
        }),
        prisma.comment.count({ where }),
      ]);

      return {
        comments,
        totalCount,
        hasMore: skip + comments.length < totalCount,
        page,
      };
    },
  },

  Mutation: {
    /**
     * Register a new user with username and password
     */
    register: async (_, { username, password, email }, context) => {
      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Check if email exists (if provided)
      if (email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email },
        });

        if (existingEmail) {
          throw new Error('Email already exists');
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          email: email || null,
        },
      });

      // Generate tokens
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Store refresh token in database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt,
        },
      });

      // Set refresh token in HTTP-only cookie
      context.res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: process.env.COOKIE_SAME_SITE || 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return {
        accessToken,
        user,
      };
    },

    /**
     * Login with username and password
     */
    login: async (_, { username, password }, context) => {
      // Find user
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user || !user.password) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValid = await comparePassword(password, user.password);

      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Store refresh token in database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt,
        },
      });

      // Set refresh token in HTTP-only cookie
      context.res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: process.env.COOKIE_SAME_SITE || 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return {
        accessToken,
        user,
      };
    },

    /**
     * Refresh access token using refresh token from cookie
     */
    refreshToken: async (_, __, context) => {
      const refreshToken = context.req.cookies.refreshToken;

      if (!refreshToken) {
        throw new Error('No refresh token provided');
      }

      // Verify refresh token
      try {
        verifyRefreshToken(refreshToken);
      } catch (_error) {
        throw new Error('Invalid refresh token');
      }

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken) {
        throw new Error('Refresh token not found');
      }

      // Check if token is expired
      if (new Date() > storedToken.expiresAt) {
        // Delete expired token
        await prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
        throw new Error('Refresh token expired');
      }

      // Generate new access token
      const accessToken = generateAccessToken(storedToken.userId);

      return {
        accessToken,
        user: storedToken.user,
      };
    },

    /**
     * Logout - remove refresh token
     */
    logout: async (_, __, context) => {
      const refreshToken = context.req.cookies.refreshToken;

      if (refreshToken) {
        // Delete refresh token from database
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
      }

      // Clear cookie
      context.res.clearCookie('refreshToken');

      return true;
    },

    /**
     * Update user profile
     */
    updateProfile: async (_, { email, avatar }, context) => {
      const user = requireAuth(context);

      // Check if email is taken by another user
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            NOT: { id: user.id },
          },
        });

        if (existingUser) {
          throw new Error('Email already in use');
        }
      }

      // Validate avatar if provided
      if (avatar) {
        processImageUpload(avatar);
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(email !== undefined && { email }),
          ...(avatar !== undefined && { avatar }),
        },
      });

      return updatedUser;
    },

    /**
     * Update password
     */
    updatePassword: async (_, { oldPassword, newPassword }, context) => {
      const user = requireAuth(context);

      // Get user with password
      const userWithPassword = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!userWithPassword.password) {
        throw new Error('Cannot update password for OAuth users');
      }

      // Verify old password
      const isValid = await comparePassword(oldPassword, userWithPassword.password);

      if (!isValid) {
        throw new Error('Invalid old password');
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return true;
    },

    /**
     * Link Google account to existing user
     */
    linkGoogleAccount: async (_, { googleId, email }, context) => {
      const user = requireAuth(context);

      // Check if Google ID is already linked to another account
      const existingGoogleUser = await prisma.user.findFirst({
        where: {
          googleId,
          NOT: { id: user.id },
        },
      });

      if (existingGoogleUser) {
        throw new Error('Google account already linked to another user');
      }

      // Update user with Google ID
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          ...(email && !user.email && { email }), // Add email if not set
        },
      });

      return updatedUser;
    },

    /**
     * Upload avatar (base64 image)
     */
    uploadAvatar: async (_, { imageBase64 }, context) => {
      const user = requireAuth(context);

      // Validate and process image
      const processedImage = processImageUpload(imageBase64);

      // Update user avatar
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { avatar: processedImage },
      });

      return updatedUser;
    },

    /**
     * Create a new post
     */
    createPost: async (_, { title, description, imageBase64 }, context) => {
      const user = requireAuth(context);

      // Validate and process image
      const processedImage = processImageUpload(imageBase64);

      // Create post
      const post = await prisma.post.create({
        data: {
          title,
          description,
          image: processedImage,
          userId: user.id,
        },
        include: {
          user: true,
          comments: true,
        },
      });

      return post;
    },

    /**
     * Update a post (only owner or admin)
     */
    updatePost: async (_, { id, title, description, imageBase64 }, context) => {
      const user = requireAuth(context);

      // Get post to check ownership
      const post = await prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new Error('Post not found');
      }

      // Get user with role
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      // Check if user is owner or admin
      if (post.userId !== user.id && fullUser.role !== 'ADMIN') {
        throw new Error('Not authorized to update this post');
      }

      // Prepare update data
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (imageBase64) {
        updateData.image = processImageUpload(imageBase64);
      }

      // Update post
      const updatedPost = await prisma.post.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          comments: {
            include: {
              user: true,
            },
          },
        },
      });

      return updatedPost;
    },

    /**
     * Delete a post (only owner or admin)
     */
    deletePost: async (_, { id }, context) => {
      const user = requireAuth(context);

      // Get post to check ownership
      const post = await prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new Error('Post not found');
      }

      // Get user with role
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      // Check if user is owner or admin
      if (post.userId !== user.id && fullUser.role !== 'ADMIN') {
        throw new Error('Not authorized to delete this post');
      }

      // Delete post (comments will be cascade deleted)
      await prisma.post.delete({
        where: { id },
      });

      return true;
    },

    /**
     * Create a comment on a post
     */
    createComment: async (_, { postId, content }, context) => {
      const user = requireAuth(context);

      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new Error('Post not found');
      }

      // Create comment
      const comment = await prisma.comment.create({
        data: {
          content,
          userId: user.id,
          postId,
        },
        include: {
          user: true,
          post: true,
        },
      });

      return comment;
    },

    /**
     * Delete a comment (only owner or admin)
     */
    deleteComment: async (_, { id }, context) => {
      const user = requireAuth(context);

      // Get comment to check ownership
      const comment = await prisma.comment.findUnique({
        where: { id },
      });

      if (!comment) {
        throw new Error('Comment not found');
      }

      // Get user with role
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      // Check if user is owner or admin
      if (comment.userId !== user.id && fullUser.role !== 'ADMIN') {
        throw new Error('Not authorized to delete this comment');
      }

      // Delete comment
      await prisma.comment.delete({
        where: { id },
      });

      return true;
    },

    /**
     * Update user role (admin only)
     */
    updateUserRole: async (_, { userId, role }, context) => {
      const user = requireAuth(context);

      // Get admin user
      const adminUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (adminUser.role !== 'ADMIN') {
        throw new Error('Admin access required');
      }

      // Update user role
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
      });

      return updatedUser;
    },

    /**
     * Delete user (admin only)
     */
    deleteUser: async (_, { userId }, context) => {
      const user = requireAuth(context);

      // Get admin user
      const adminUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (adminUser.role !== 'ADMIN') {
        throw new Error('Admin access required');
      }

      // Prevent admin from deleting themselves
      if (userId === user.id) {
        throw new Error('Cannot delete your own account');
      }

      // Delete user (cascade will delete posts, comments, tokens)
      await prisma.user.delete({
        where: { id: userId },
      });

      return true;
    },

    /**
     * Admin delete any post
     */
    adminDeletePost: async (_, { postId }, context) => {
      const user = requireAuth(context);

      // Get admin user
      const adminUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (adminUser.role !== 'ADMIN') {
        throw new Error('Admin access required');
      }

      // Delete post
      await prisma.post.delete({
        where: { id: postId },
      });

      return true;
    },

    /**
     * Admin delete any comment
     */
    adminDeleteComment: async (_, { commentId }, context) => {
      const user = requireAuth(context);

      // Get admin user
      const adminUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (adminUser.role !== 'ADMIN') {
        throw new Error('Admin access required');
      }

      // Delete comment
      await prisma.comment.delete({
        where: { id: commentId },
      });

      return true;
    },
  },

  User: {
    posts: async (parent) => {
      return await prisma.post.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: 'desc' },
      });
    },
    comments: async (parent) => {
      return await prisma.comment.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Post: {
    user: async (parent) => {
      return await prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
    comments: async (parent) => {
      return await prisma.comment.findMany({
        where: { postId: parent.id },
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
        },
      });
    },
  },

  Comment: {
    user: async (parent) => {
      return await prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
    post: async (parent) => {
      return await prisma.post.findUnique({
        where: { id: parent.postId },
      });
    },
  },
};

export default resolvers;
