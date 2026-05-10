# We use dev-mode in Phase 3 for scaffolding to test hot-reloading easily.
# Production build later will use nginx.
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Start the Vite development server (exposed on port 80 based on vite.config.js)
CMD ["npm", "run", "dev"]
