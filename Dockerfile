FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 NEXT_TELEMETRY_DISABLED=1 BOOKING_DATA_DIR=/data BOOKING_CONFIG_PATH=/app/config/booking.json
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/scripts ./scripts
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node", "server.js"]
