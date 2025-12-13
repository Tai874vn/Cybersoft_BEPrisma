FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY prisma ./prisma
COPY src ./src

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node src/index.js"]
