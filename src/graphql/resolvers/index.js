const prisma = require('../../config/prisma');
const { hashPassword, comparePassword } = require('../../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { requireAuth } = require('../../middleware/auth');
const { processImageUpload } = require('../../utils/imageHandler');

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
      let decoded;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch (error) {
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
  },
};

module.exports = resolvers;
