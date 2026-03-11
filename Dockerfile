
# Build  Stage
FROM node:22-alpine AS builder


WORKDIR /usr/src/app

COPY package*.json ./

COPY . ./

# Install native build dependencies for bcrypt and other gyp packages on Alpine
RUN apk add --no-cache python3 make g++

RUN npm ci

RUN yes | npx prisma generate

RUN npm run build anzu-info

# Runtime Stage
FROM node:22-alpine AS runtime
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma

# Install curl for healthcheck
RUN apk add --no-cache curl

# Healthcheck to enable Docker-level container monitoring
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/healthcheck || exit 1

# Expose the application port (adjust if necessary)
EXPOSE 3000


CMD ["node", "dist/src/main.js"]