# Dockerfile for Frontend Web
FROM node:18-alpine as build

WORKDIR /app

# Copy all project files
COPY . .

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Fix permissions for all binaries
RUN find node_modules/.bin -type f -exec chmod 755 {} +

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
