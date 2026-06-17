FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/postgres"
ENV NEXTAUTH_SECRET="placeholder-build-secret"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV SUPABASE_URL="https://placeholder.supabase.co"
ENV SUPABASE_ANON_KEY="placeholder"
ENV SUPABASE_SERVICE_ROLE_KEY="placeholder"
ENV OPENROUTER_API_KEY="placeholder"
ENV OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
RUN npx prisma generate 2>/dev/null || true
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy 2>/dev/null || true && npx next start -p ${PORT:-3000} -H 0.0.0.0"]
