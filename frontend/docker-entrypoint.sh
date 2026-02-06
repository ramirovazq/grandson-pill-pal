#!/bin/sh
# docker-entrypoint.sh - Inject environment variables into built assets at runtime

set -e

# Default values if not provided
: ${VITE_API_URL:=/api/v1}
: ${VITE_EXTRACTOR_URL:=http://localhost:8001}

echo "Injecting environment variables into frontend..."
echo "VITE_API_URL: $VITE_API_URL"
echo "VITE_EXTRACTOR_URL: $VITE_EXTRACTOR_URL"

# Find all JavaScript files in the build output
# Replace placeholder values with actual environment variables
find /usr/share/nginx/html -type f -name '*.js' -exec sed -i \
    -e "s|__VITE_API_URL__|$VITE_API_URL|g" \
    -e "s|__VITE_EXTRACTOR_URL__|$VITE_EXTRACTOR_URL|g" \
    {} +

echo "Environment variables injected successfully"

# Start nginx
echo "Starting nginx..."
exec nginx -g 'daemon off;'
