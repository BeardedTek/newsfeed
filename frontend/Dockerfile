# ---- Base Stage ----
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# ---- Dependencies Stage ----
FROM base AS dependencies

# Install dependencies (only production, no devDependencies)
COPY package*.json ./
COPY tsconfig.json ./

# Install production dependencies
RUN npm ci --omit=dev --no-audit --no-fund

# ---- Build Stage ----
FROM dependencies AS builder

# Copy source code
COPY src ./src
COPY public ./public
COPY scripts ./scripts
COPY next.config.js ./
COPY tailwind.config.js ./
COPY tsconfig.json ./

# Build the Next.js app (standalone output)
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy scripts for runtime environment configuration
COPY --from=builder --chown=nextjs:nodejs /app/scripts/generate-env-config.js ./scripts/
COPY --from=builder --chown=nextjs:nodejs /app/scripts/start.sh ./
RUN chmod +x ./start.sh

# Set proper permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the port
EXPOSE 3000

# Use start.sh as entrypoint to configure environment variables at runtime
CMD ["./start.sh"] 