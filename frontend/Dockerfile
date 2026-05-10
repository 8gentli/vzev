# We use dev-mode in Phase 3 for scaffolding to test hot-reloading easily. 
# Production build later will use nginx.
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV VITE_DEV_PORT=5173
ENV VITE_API_PROXY=http://backend:8000

EXPOSE 5173

# Vite dev server (see vite.config.js)
CMD ["npm", "run", "dev"]
