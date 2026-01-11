# Use Node.js LTS
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source code
COPY . .

# Expose backend port
EXPOSE 8000

# Start backend
CMD ["node", "index.js"]
