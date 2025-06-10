# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (only production, no devDependencies)
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci --omit=dev

# Copy all source code and config files
COPY . .

# Build the Next.js app (standalone output)
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

# Copy Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy tsconfig.json for runtime path resolution (if needed)
COPY --from=builder /app/tsconfig.json ./

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["node", "server.js"] 