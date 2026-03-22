#!/bin/sh
set -e

# Validate required environment variables
: "${PRERENDER_URL:?PRERENDER_URL is required}"
: "${PRERENDER_TOKEN:?PRERENDER_TOKEN is required}"
: "${NGINX_RESOLVER:=8.8.8.8}"

# Substitute environment variables in nginx config template
envsubst '${NGINX_RESOLVER} ${PRERENDER_URL} ${PRERENDER_TOKEN}' \
    < /etc/nginx/conf.d/default.conf.template \
    > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
