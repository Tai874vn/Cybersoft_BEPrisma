# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Enable Corepack for yarn
RUN corepack enable

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --production --frozen-lockfile

# Copy Prisma schema
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Generate Prisma Client
# RUN yarn prisma:generate

# Copy application source
COPY src ./src

# Expose port
EXPOSE 4000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "src/index.js"]
