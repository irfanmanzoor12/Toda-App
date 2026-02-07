# MCP HTTP Server Dockerfile
# Express server exposing MCP tools via HTTP

FROM node:20-alpine

WORKDIR /app

# Copy package files first for caching
COPY package.json package-lock.json* ./

# Install all dependencies (need devDependencies for tsx)
RUN npm ci

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY mcp-server/ ./mcp-server/

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 mcpuser
RUN chown -R mcpuser:nodejs /app
USER mcpuser

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3003/health || exit 1

# Run MCP HTTP server with tsx
CMD ["npx", "tsx", "mcp-server/http-server.ts"]
