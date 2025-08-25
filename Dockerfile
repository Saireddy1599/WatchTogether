# Simple Dockerfile for running the Express backend
FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "server.js"]
