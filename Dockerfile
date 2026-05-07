FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY src/ ./src/

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./
CMD ["node", "src/entrypoint.js"]
