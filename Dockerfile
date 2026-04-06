# ── Stage: Base image ──────────────────────────────────────────────────────────
# Use official Node.js on Alpine Linux (Alpine = tiny Linux, only ~5MB)
FROM node:18-alpine

# ── Working directory ──────────────────────────────────────────────────────────
# All commands below run inside /app folder inside the container
WORKDIR /app

# ── Install dependencies ───────────────────────────────────────────────────────
# Copy package.json FIRST (before copying app code)
# Why? Docker caches this layer — if package.json doesn't change,
# it won't re-run npm install on every build (saves time!)
COPY package.json .
RUN npm install

# ── Copy app code ──────────────────────────────────────────────────────────────
# Copy everything else (app.js, etc.) into the container
COPY . .

#dfdfss
# ── Port ───────────────────────────────────────────────────────────────────────
# Tell Docker this container listens on port 3000
EXPOSE 3000

# ── Start command ──────────────────────────────────────────────────────────────
# This runs when the container starts
CMD ["node", "app.js"]
