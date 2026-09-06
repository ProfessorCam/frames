# Frames & Packets

The third site in the Packet Lessons family. Students click a row in the left column and get,
in the right column, a plain-English lesson, a packet-assembly animation with back / pause /
forward buttons, a sequence diagram, a "what to look for" checklist, and the real bytes of a
`.pcap` file decoded in the browser in a Wireshark-style table.

Rows: **1 MAC address** (what it is, whose prefix it is, how to find your own on Windows, Linux
and macOS), **2 Frame** (two machines on one switch: a frame with no IP inside, then ARP and a
ping), **3 Frame vs packet** (the same ping captured on both sides of a router, compared field by
field), **4 IPv6** (addresses, router and neighbour discovery, ping, and the header next to IPv4's).

No frameworks, no build step: plain HTML, CSS and JavaScript. Published to GitHub Pages at
<https://professorcam.github.io/frames/> by `.github/workflows/pages.yml` on every push to `main`.

## Run it on the LAN

```sh
docker compose up -d --build
```

Then open <http://localhost:8081>. Stop it with `docker compose down`. Or, from Docker Hub:

```sh
docker run -d --name frames --network host --restart unless-stopped professorcam/frames
```

The container uses `network_mode: host` so that `ip neigh` inside it is the real neighbour
(ARP / NDP) table of the machine running Docker. `neigh.sh` writes that table to
`site/neighbors.json` every 3 seconds, nginx answers `/whoami` with the visitor's IP address, and
row 1 looks the visitor up in the table and shows their MAC address. That only works for visitors
on the same LAN as the server, which is the point of the lesson; from anywhere else, and on GitHub
Pages, the box explains why the server cannot see it.

The page must be served over HTTP. Opening `site/index.html` from disk will not work, because the
browser blocks `fetch()` of the `.pcap` files from `file://` URLs.

## Layout

```
Dockerfile           nginx:alpine + iproute2 + the site directory
docker-compose.yml   one service, host networking, port 8081
nginx.conf           serves site/, sends .pcap files as downloads, /whoami endpoint
neigh.sh             runs in the container, publishes the neighbour table as neighbors.json
site/
  index.html         page shell: left <nav>, right <main>
  style.css          layout, diagram, animation and packet-table styling
  app.js             builds the nav, renders a lesson, loads and shows the packets
  lessons.js         ALL teaching content lives here, one object per row
  pcap.js            tiny libpcap parser (Ethernet, raw frames, ARP, IPv4, ICMP, IPv6, ICMPv6, UDP, TCP)
  pcaps/*.pcap       the captures
tools/make-captures.py   builds the four captures
tools/rawframe.py        sends and answers frames with no IP inside (Linux, root)
```

## The captures

All four captures are built by `tools/make-captures.py`, byte for byte, to match the lab
machines listed on the welcome page (Student VM 192.168.110.50, Lab PC 2 .60, gateway .1 with a
second network card 10.10.20.1, Lab Server 10.10.20.5). Building them was the only way to show
the same ping from both sides of the router with clean timestamps and identical packet contents.
IPv4, ICMP and ICMPv6 checksums are computed properly, so Wireshark and tcpdump read them as
ordinary captures:

```sh
python3 tools/make-captures.py
tcpdump -nn -e -vv -r site/pcaps/ipv6-lan-ping.pcap
```

The raw frames on row 2 (EtherType 0x88B5, reserved by the IEEE for local experiments) can be
reproduced on real machines with `tools/rawframe.py`: run `listen` on one, `send` on the other,
and capture with `tcpdump -i <iface> -w frame.pcap ether proto 0x88b5`.

To replace a capture with a real one, save it in classic pcap format (Wireshark: File > Save As >
"Wireshark/tcpdump - pcap", not pcapng) into `site/pcaps/` and point the row's `file` or
`captures` entry in `site/lessons.js` at it. The header comment in that file lists every field a
row and a section can have, including `packet` (one frame shown inline), `compare` (the same
frame in two captures, field by field), `anatomy` (a colour-coded address strip) and `columns`
(side-by-side instructions).

## Checking the parser from the command line

```sh
node -e '
const {parsePcap}=require("./site/pcap.js"); const fs=require("fs");
const b=fs.readFileSync("site/pcaps/ipv6-lan-ping.pcap");
for (const p of parsePcap(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)))
  console.log(p.no, p.time.toFixed(6), p.src, p.dst, p.proto, p.len, p.info);
'
```
