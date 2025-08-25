# Build stage
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
COPY server.js ./
RUN npm install --only=production
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "server.js"]
