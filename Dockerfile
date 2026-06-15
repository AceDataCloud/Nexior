# build stage
FROM node:26 as build-stage
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
# Pre-render the flag-allowlisted routes, then derive a plain SPA shell from
# each. nginx serves the shell by default and the SSG page only when the runtime
# `features=ssr` flag is set (URL/cookie) — prod behaviour unchanged until opt-in.
RUN npm run build:ssg && node scripts/ssg-shell.mjs

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]