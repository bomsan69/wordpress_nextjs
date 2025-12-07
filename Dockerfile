# 멀티 스테이지 빌드를 위한 베이스 이미지
FROM node:20-alpine AS base

# 의존성 설치 단계
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files first
COPY package.json package-lock.json* ./

# Install dependencies as root, then change ownership
RUN npm ci

# Create non-root user and change ownership
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# 빌드 단계
FROM base AS builder
WORKDIR /app

# Copy dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js 빌드 (as root for write permissions during build)
RUN npm run build

# Create non-root user and change ownership of built files
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# 프로덕션 이미지
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 빌드된 파일 복사
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8003

ENV PORT=8003
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
