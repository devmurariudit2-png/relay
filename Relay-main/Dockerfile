FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --omit=dev

# Copy all source files
COPY . .

# Expose the correct port
EXPOSE 5000

# Start server using node runtime
CMD ["node", "server.js"]
