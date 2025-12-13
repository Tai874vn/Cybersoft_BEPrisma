FROM node:20-alpine

WORKDIR /app

# Enable Yarn
RUN corepack enable

# Copy dependency files
COPY package.json yarn.lock ./

# Install production deps
RUN yarn install --production --frozen-lockfile

# Copy app source (including prisma folder)
COPY . .

EXPOSE 4000

ENV NODE_ENV=production

# IMPORTANT: use yarn start
CMD ["yarn", "start"]
