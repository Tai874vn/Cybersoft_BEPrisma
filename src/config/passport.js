import passport from 'passport';
import googleOAuthPkg from 'passport-google-oauth20';
const { Strategy: GoogleStrategy } = googleOAuthPkg;
import prisma from './prisma.js';

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract profile data
        const googleId = profile.id;
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const username = profile.displayName || `google_user_${googleId}`;

        // Check if user exists with this Google ID
        let user = await prisma.user.findUnique({
          where: { googleId },
        });

        if (user) {
          // User exists, return it
          return done(null, user);
        }

        // Check if user exists with this email
        if (email) {
          user = await prisma.user.findUnique({
            where: { email },
          });

          if (user) {
            // Link Google account to existing user
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId },
            });
            return done(null, user);
          }
        }

        // Create new user
        // Generate unique username if needed
        let uniqueUsername = username.replace(/\s+/g, '_').toLowerCase();
        let existingUser = await prisma.user.findUnique({
          where: { username: uniqueUsername },
        });

        let counter = 1;
        while (existingUser) {
          uniqueUsername = `${username.replace(/\s+/g, '_').toLowerCase()}_${counter}`;
          existingUser = await prisma.user.findUnique({
            where: { username: uniqueUsername },
          });
          counter++;
        }

        user = await prisma.user.create({
          data: {
            username: uniqueUsername,
            email,
            googleId,
            password: null, // No password for OAuth users
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
