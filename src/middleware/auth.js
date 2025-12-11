const { verifyAccessToken } = require('../utils/jwt');

/**
 * Authentication middleware for GraphQL context
 * Extracts user from request cookies or authorization header
 */
const authenticate = async (req) => {
  try {
    // Try to get token from Authorization header first
    let token = null;
    
    if (req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }
    
    // Fallback to cookie if no Authorization header
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    
    if (!token) {
      return { user: null };
    }
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    return {
      user: {
        id: decoded.userId,
      },
    };
  } catch (error) {
    console.error('Authentication error:', error.message);
    return { user: null };
  }
};

/**
 * Require authentication - throws error if not authenticated
 */
const requireAuth = (context) => {
  if (!context.user) {
    throw new Error('Not authenticated');
  }
  return context.user;
};

module.exports = {
  authenticate,
  requireAuth,
};
