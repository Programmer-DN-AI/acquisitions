# Multi-stage build for optimal image size and security
FROM node:20-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S app -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN npm ci --include=dev
COPY . .
RUN chown -R app:nodejs /app
USER app
EXPOSE 3000
CMD ["dumb-init", "npm", "run", "dev"]

# Build stage for production
FROM base AS build
ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force

# Copy source code
COPY . .

# Remove development files
RUN rm -rf .git .github .vscode \
    *.md \
    .env.example \
    .prettierrc \
    .prettierignore \
    eslint.config.js

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Copy built application
COPY --from=build --chown=app:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=app:nodejs /app/src ./src
COPY --from=build --chown=app:nodejs /app/package.json ./package.json

USER app
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').request('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1)).end()"

CMD ["dumb-init", "node", "src/index.js"]