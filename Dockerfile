FROM node:20-alpine

WORKDIR /app

# Install build dependencies for sqlite3 if compiling
RUN apk add --no-cache python3 make g++

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server/server.js"]
