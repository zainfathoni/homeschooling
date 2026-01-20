# syntax=docker/dockerfile:1

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for better-sqlite3 compilation
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma client (needs dummy DATABASE_URL for build)
RUN DATABASE_URL="file:./dummy.db" npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files and install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Rebuild better-sqlite3 for the target platform
RUN npm rebuild better-sqlite3

# Copy Prisma files and generate client
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL="file:./data/app.db" npx prisma generate

# Copy built application from builder
COPY --from=builder /app/build ./build

# Copy generated Prisma client from builder (since we need it at runtime)
COPY --from=builder /app/generated ./generated

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run database migrations and start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
