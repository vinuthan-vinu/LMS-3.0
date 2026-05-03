# Production image for Railway / Render / Fly.io
FROM node:20-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache tini

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN mkdir -p uploads && chown -R node:node /app

ENV NODE_ENV=production
EXPOSE 5000

USER node

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
