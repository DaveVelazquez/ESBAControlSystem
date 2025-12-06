FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY src ./src
COPY run-migration.js ./
COPY migrations ./migrations

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
