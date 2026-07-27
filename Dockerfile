# Stage 1: Build static frontend assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY server ./server
COPY sample_images ./sample_images
RUN mkdir -p /app/server/uploads && chmod -R 777 /app/server/uploads

EXPOSE 3000
CMD ["node", "server/index.js"]
