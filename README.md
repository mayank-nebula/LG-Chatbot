# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Accept build arguments for NEXT_PUBLIC variables (available in browser)
ARG NEXT_PUBLIC_FILLOUT_SUBSCRIBER_FORM
ARG NEXT_PUBLIC_FILLOUT_WORK_WITH_US_FORM
ARG NEXT_PUBLIC_ELFSIGHT_LINKEDIN_ID

# Set NEXT_PUBLIC environment variables for build time
ENV NEXT_PUBLIC_FILLOUT_SUBSCRIBER_FORM=$NEXT_PUBLIC_FILLOUT_SUBSCRIBER_FORM
ENV NEXT_PUBLIC_FILLOUT_WORK_WITH_US_FORM=$NEXT_PUBLIC_FILLOUT_WORK_WITH_US_FORM
ENV NEXT_PUBLIC_ELFSIGHT_LINKEDIN_ID=$NEXT_PUBLIC_ELFSIGHT_LINKEDIN_ID

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port (Cloud Run uses PORT env var, defaults to 8080)
EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
