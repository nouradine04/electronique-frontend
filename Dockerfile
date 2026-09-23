# Build context: frontend/
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Vite embeds these public values at build time. Never put secrets here.
ARG VITE_BACKEND_URL
ARG VITE_ENABLE_CLOUD_SYNC=true
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_ANDROID_APK_URL
ARG VITE_IOS_TESTFLIGHT_URL
ARG VITE_MACOS_DOWNLOAD_URL=/downloads/NStock-macOS-Apple-Silicon.dmg
ARG VITE_WINDOWS_DOWNLOAD_URL
ARG VITE_LINUX_DOWNLOAD_URL

COPY index.html vite.config.js jsconfig.json ./
COPY scripts ./scripts
COPY src ./src
COPY public ./public
RUN test -n "$VITE_BACKEND_URL" || (echo 'VITE_BACKEND_URL est obligatoire au build.' >&2; exit 1)
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
