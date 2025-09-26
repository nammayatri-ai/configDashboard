# Backend Dockerfile for Config Dashboard Server
FROM node:20-alpine

# Install git (needed for git operations)
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create configs directory
RUN mkdir -p configs

# Make setup script executable
RUN chmod +x setup-server.sh

# Expose port
EXPOSE 8090

# Start the server
CMD ["sh", "-c", "sh setup-server.sh && node server.js"]
