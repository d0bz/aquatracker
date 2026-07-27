FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install native build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY dist ./dist
COPY server ./server
COPY sample_images ./sample_images

RUN mkdir -p /app/server/uploads && chmod -R 777 /app/server/uploads

EXPOSE 3000
CMD ["node", "server/index.js"]
