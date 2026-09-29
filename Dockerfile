ARG PREVIOUS_IMAGE=nginx:stable-alpine

FROM node:26 AS build-stage
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build:ssg && node scripts/ssg-shell.mjs && \
    mkdir /app/current-assets && cp -a /app/dist/assets/. /app/current-assets/ && \
    (cd /app/current-assets && find . -type f -printf '%P\n' | LC_ALL=C sort) > /app/release-assets && \
    test "$(wc -l < /app/release-assets)" -le 4000 && \
    test "$(du -sb /app/current-assets | cut -f1)" -le 268435456

FROM nginx:stable-alpine AS runtime-base
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf

FROM runtime-base AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY --from=build-stage /app/release-assets /opt/acedata/release-assets
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM ${PREVIOUS_IMAGE} AS bridge
RUN rm -rf /usr/share/nginx/html/assets && mkdir -p /usr/share/nginx/html/assets
COPY .previous-assets/ /usr/share/nginx/html/assets/
COPY --from=build-stage /app/current-assets/ /tmp/current-assets/
RUN set -eu; \
    cd /tmp/current-assets; \
    find . -type f -print | while IFS= read -r asset; do \
      destination="/usr/share/nginx/html/assets/${asset#./}"; \
      if [ -f "$destination" ]; then cmp -s "$asset" "$destination" || { echo "conflicting immutable asset: ${asset#./}" >&2; exit 1; }; \
      else mkdir -p "$(dirname "$destination")"; cp "$asset" "$destination"; fi; \
    done; \
    rm -rf /tmp/current-assets; \
    test "$(find /usr/share/nginx/html/assets -type f | wc -l)" -le 8000; \
    test "$(du -sb /usr/share/nginx/html/assets | cut -f1)" -le 536870912
COPY .previous-release-assets /opt/acedata/release-assets

FROM runtime-base AS final
COPY .previous-assets/ /tmp/previous-assets/
COPY --from=build-stage /app/dist /usr/share/nginx/html
RUN set -eu; \
    cd /tmp/previous-assets; \
    find . -type f -print | while IFS= read -r asset; do \
      destination="/usr/share/nginx/html/assets/${asset#./}"; \
      if [ -f "$destination" ]; then cmp -s "$asset" "$destination" || { echo "conflicting immutable asset: ${asset#./}" >&2; exit 1; }; \
      else mkdir -p "$(dirname "$destination")"; cp "$asset" "$destination"; fi; \
    done; \
    rm -rf /tmp/previous-assets; \
    test "$(find /usr/share/nginx/html/assets -type f | wc -l)" -le 8000; \
    test "$(du -sb /usr/share/nginx/html/assets | cut -f1)" -le 536870912
COPY --from=build-stage /app/release-assets /opt/acedata/release-assets
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM production-stage AS default-stage
