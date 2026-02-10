# Use Node 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# 1. Copy ALL source code (App.tsx, public, package.json, etc.)
COPY . .

# 2. Install ALL tools (including Vite)
RUN npm install

# 3. BUILD THE APP (This creates the 'dist' folder on the server)
RUN npm run build

# 4. Start the server
CMD ["node", "server.js"]