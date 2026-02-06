# Frontend Dockerfile
# ====================
# Multi-stage build for React frontend with nginx

# Stage 1: Builder
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
# Use placeholders that will be replaced at runtime
ARG VITE_API_URL=__VITE_API_URL__
ARG VITE_EXTRACTOR_URL=__VITE_EXTRACTOR_URL__
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_EXTRACTOR_URL=$VITE_EXTRACTOR_URL

RUN npm run build

# Stage 2: Production with nginx
FROM nginx:alpine as production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy entrypoint script for runtime env variable injection
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create non-root user (nginx already runs as nginx user by default)
# But we need to adjust permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Use custom entrypoint to inject environment variables at runtime
ENTRYPOINT ["/docker-entrypoint.sh"]
