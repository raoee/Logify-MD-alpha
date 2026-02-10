# 1. THE BUILD STAGE (Compiling the Frontend)
# We use a Node.js image to build the React app
FROM node:18-alpine as build-stage

# Create a folder for the build
WORKDIR /app

# Copy the package.json to install libraries
COPY package*.json ./

# Install the libraries
RUN npm install

# Copy the rest of your app code
COPY . .

# Build the React App (Creates the 'dist' folder)
RUN npm run build

# ---------------------------------------------------

# 2. THE PRODUCTION STAGE (Running the Server)
# We start fresh to keep the final box small
FROM node:18-alpine as production-stage

WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build-stage /app/package*.json ./
COPY --from=build-stage /app/server.js ./
COPY --from=build-stage /app/dist ./dist

# Install ONLY production libraries (keeps it fast)
RUN npm install --production

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]