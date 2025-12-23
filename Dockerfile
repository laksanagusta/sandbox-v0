# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set environment to production
ENV NODE_ENV=production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Copy built assets from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy server files from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/server ./server

# Install only production dependencies + tsx for running TypeScript
# We use --omit=dev but tsx needs to be installed separately
RUN npm ci --omit=dev && npm cache clean --force

# Install tsx globally for running TypeScript files
RUN npm install -g tsx

# Change ownership of node_modules to nodejs user
RUN chown -R nodejs:nodejs /app/node_modules

# Change to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["tsx", "server/index.ts"]