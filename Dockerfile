# ============================================
# Stage 1: Dependencies Installation Stage
# ============================================
FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --no-audit --no-fund

# ============================================
# Stage 2: Build Next.js application in standalone mode
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============================================
# Stage 3: Run Next.js application
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --chown=nextjs:nodejs --from=builder /app/public ./public

# Static assets must be readable and directories traversable by the non-root
# nextjs runtime user. Source dirs (e.g. font bundles copied from macOS) can
# land in the image with restrictive 0700 modes, which blocks Next.js from
# scanning /app/public on startup (EACCES crash loop). Normalize regardless
# of the permissions baked into the build context.
RUN chmod -R a+rX /app/public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
