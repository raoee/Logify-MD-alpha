# Use Node 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# 1. Copy package files first (to cache dependencies)
COPY package.json package-lock.json* ./

# 2. Install dependencies (Crucial Step!)
RUN npm install

# 3. Copy the built website and server code
COPY dist ./dist
COPY server.js .

# 4. Start the server
CMD ["node", "server.js"]