#!/bin/sh
# Runs inside the container at startup (nginx's /docker-entrypoint.d hook).
# With network_mode: host, `ip neigh` here is the real neighbour (ARP / NDP)
# table of the machine running Docker: every LAN device that has talked to it
# recently, with its MAC address. The MAC page looks the visitor up in it.
OUT=/usr/share/nginx/html/neighbors.json
TMP=/tmp/neighbors.json.tmp

write_json() {
  neigh=$(ip -j neigh show 2>/dev/null) || neigh='[]'
  links=$(ip -j link show 2>/dev/null) || links='[]'
  printf '{"generated":"%s","hostname":"%s","neigh":%s,"links":%s}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$(hostname)" "$neigh" "$links" > "$TMP" && mv "$TMP" "$OUT"
}

write_json
( while true; do sleep 3; write_json; done ) &
