FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Copy postgres schema as the active schema in Docker
RUN cp ./prisma/schema.postgres.prisma ./prisma/schema.prisma

RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY data ./data

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/data ./data

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push && (npx tsx prisma/seed.ts || true) && node dist/server.js"]
