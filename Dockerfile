# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy Prisma schema
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Generate Prisma Client
RUN npx prisma generate

# Copy application source
COPY src ./src

# Expose port
EXPOSE 4000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "src/index.js"]
