# Static teaching site served by nginx. No build step.
FROM nginx:1.27-alpine

# iproute2 gives the real `ip -j` (JSON output) used by neigh.sh
RUN apk add --no-cache iproute2

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/
COPY neigh.sh /docker-entrypoint.d/50-neigh.sh

EXPOSE 8081
