# Build Stage - Admin Frontend
FROM node:22-alpine AS admin-builder
WORKDIR /usr/src/app/admin
COPY admin/package*.json ./
RUN npm ci
COPY admin/ ./
RUN npm run build

# Build Stage - NestJS Backend
FROM node:22-alpine AS builder
WORKDIR /usr/src/app

# Install native build dependencies first
RUN apk add --no-cache python3 make g++

# Install dependencies before copying source code to leverage cache
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN yes | npx prisma generate

# Copy the rest of the source code and build
COPY . ./
RUN npm run build

# Runtime Stage
FROM node:22-alpine AS runtime
WORKDIR /usr/src/app

# Copy backend results
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/static ./static

# Copy admin frontend results
COPY --from=admin-builder /usr/src/app/admin/dist ./admin/dist

# Install curl for healthcheck
RUN apk add --no-cache curl

# Healthcheck to enable Docker-level container monitoring
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/healthcheck || exit 1

# Expose the application port (adjust if necessary)
EXPOSE 3000

CMD ["node", "dist/src/main.js"]