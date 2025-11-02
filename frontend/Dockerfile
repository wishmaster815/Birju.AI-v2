# Use Node.js 20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies for build
RUN npm install

# Copy all source code
COPY . .

# -----------------------------
# 🔹 Inject build-time env vars
# -----------------------------
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

# Build the Next.js app
RUN npm run build

# Install only production dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 8080

# Define runtime environment
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Start the app
CMD ["npm", "start"]
