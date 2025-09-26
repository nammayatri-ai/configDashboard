# Frontend Dockerfile for Config Dashboard
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the development server (disable auto-open browser)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000", "--open", "false"]
