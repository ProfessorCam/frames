#!/usr/bin/env python3
"""
Builds the four captures used by the Frames & Packets site. They are
synthetic: every byte is written by this script so that the addresses match
the lab network exactly and the same ping can be shown from both sides of the
router. Checksums are real, so Wireshark shows them as good.

  site/pcaps/frame-lan-peer.pcap    two machines on one LAN: a raw frame with no
                                    IP inside, then ARP and a ping between them
  site/pcaps/packet-lan-side.pcap   a ping to another network, seen on the LAN
  site/pcaps/packet-far-side.pcap   the same ping, seen on the far network
  site/pcaps/ipv6-lan-ping.pcap     IPv6: router discovery, neighbour discovery, ping

Usage:  python3 tools/make-captures.py
"""
import ipaddress, os, struct

HERE = os.path.dirname(os.path.abspath(__file__))
PCAPS = os.path.join(HERE, '..', 'site', 'pcaps')

# ---------- the lab machines ----------
VM_MAC   = bytes.fromhex('000c294b1fa2'); VM_IP   = '192.168.110.50'   # Student VM
PC2_MAC  = bytes.fromhex('000c297de35c'); PC2_IP  = '192.168.110.60'   # Lab PC 2, same LAN
GW_MAC   = bytes.fromhex('005056c00001'); GW_IP   = '192.168.110.1'    # gateway, LAN side
GWF_MAC  = bytes.fromhex('005056c00008'); GWF_IP  = '10.10.20.1'       # gateway, far side
SRV_MAC  = bytes.fromhex('000c29a1b2c3'); SRV_IP  = '10.10.20.5'       # Lab Server, far network
BCAST    = b'\xff' * 6

VM_LL    = 'fe80::20c:29ff:fe4b:1fa2'                # link-local, EUI-64 from VM_MAC
VM_G     = '2001:db8:110:0:20c:29ff:fe4b:1fa2'       # global, from the router's prefix
GW_LL    = 'fe80::250:56ff:fec0:1'
GW_G     = '2001:db8:110::1'
PREFIX   = '2001:db8:110::'

PING_DATA = bytes(range(0x10, 0x38))                 # 40 bytes of pattern...
PING_DATA = struct.pack('!II', 0x66d9e2a1, 0x000a1b2c) + b'\x00' * 8 + PING_DATA  # ...after a 16-byte timestamp slot = 56

# ---------- helpers ----------
def ip2b(ip): return bytes(int(x) for x in ip.split('.'))
def ip6b(ip): return ipaddress.IPv6Address(ip).packed

def checksum(data):
    if len(data) % 2: data += b'\0'
    s = sum(struct.unpack('!%dH' % (len(data) // 2), data))
    while s >> 16: s = (s & 0xffff) + (s >> 16)
    return (~s) & 0xffff

def eth(dst, src, etype, payload):
    frame = dst + src + struct.pack('!H', etype) + payload
    return frame + b'\0' * max(0, 60 - len(frame))   # pad to the Ethernet minimum

def ipv4(src, dst, proto, payload, ident, ttl=64, df=True):
    total = 20 + len(payload)
    hdr = struct.pack('!BBHHHBBH4s4s', 0x45, 0, total, ident, 0x4000 if df else 0, ttl, proto, 0, ip2b(src), ip2b(dst))
    hdr = hdr[:10] + struct.pack('!H', checksum(hdr)) + hdr[12:]
    return hdr + payload

def icmp_echo(reply, ident, seq, data=PING_DATA):
    msg = struct.pack('!BBHHH', 0 if reply else 8, 0, 0, ident, seq) + data
    return msg[:2] + struct.pack('!H', checksum(msg)) + msg[4:]

def arp(op, sha, spa, tha, tpa):
    return struct.pack('!HHBBH', 1, 0x0800, 6, 4, op) + sha + ip2b(spa) + tha + ip2b(tpa)

def ipv6(src, dst, next_hdr, payload, hop=64):
    return struct.pack('!IHBB', 0x60000000, len(payload), next_hdr, hop) + ip6b(src) + ip6b(dst) + payload

def icmp6(src, dst, body):
    pseudo = ip6b(src) + ip6b(dst) + struct.pack('!IBBBB', len(body), 0, 0, 0, 58)
    return body[:2] + struct.pack('!H', checksum(pseudo + body)) + body[4:]

def mac_of_mcast6(addr):
    return b'\x33\x33' + ip6b(addr)[-4:]

class Pcap:
    def __init__(self, path, t0=1757100000.0):
        self.f = open(path, 'wb'); self.t = t0
        self.f.write(struct.pack('<IHHiIII', 0xa1b2c3d4, 2, 4, 0, 0, 65535, 1))
    def add(self, frame, gap):
        self.t += gap
        sec = int(self.t); usec = int(round((self.t - sec) * 1e6))
        self.f.write(struct.pack('<IIII', sec, usec, len(frame), len(frame)) + frame)
    def close(self): self.f.close()

# ---------- 1. frame-lan-peer: two machines, one switch ----------
def frame_lan_peer():
    c = Pcap(os.path.join(PCAPS, 'frame-lan-peer.pcap'))
    hello = b'Hello Lab PC 2. This frame has no IP address in it at all.'
    back  = b'Hello Student VM. Got it, MAC to MAC, no IP needed.'
    c.add(eth(PC2_MAC, VM_MAC, 0x88b5, hello), 0)            # 1 raw frame, experimental EtherType
    c.add(eth(VM_MAC, PC2_MAC, 0x88b5, back), 0.000412)      # 2 raw frame back
    c.add(eth(BCAST, VM_MAC, 0x0806, arp(1, VM_MAC, VM_IP, b'\0' * 6, PC2_IP)), 2.104)   # 3 who has .60?
    c.add(eth(VM_MAC, PC2_MAC, 0x0806, arp(2, PC2_MAC, PC2_IP, VM_MAC, VM_IP)), 0.000388) # 4 .60 is at
    ident = 0x4a21
    for seq in (1, 2):
        c.add(eth(PC2_MAC, VM_MAC, 0x0800, ipv4(VM_IP, PC2_IP, 1, icmp_echo(False, 4321, seq), ident)), 0.000201 if seq == 1 else 1.0012)
        c.add(eth(VM_MAC, PC2_MAC, 0x0800, ipv4(PC2_IP, VM_IP, 1, icmp_echo(True, 4321, seq), 0x9c30 + seq)), 0.000431)
        ident += 1
    c.close()

# ---------- 2. packet-lan-side / packet-far-side: the same ping, both sides of the router ----------
def packet_both_sides():
    ids = [0x5e21, 0x5e22]
    reply_ids = [0x2b74, 0x2b75]
    # LAN side, captured on the Student VM
    a = Pcap(os.path.join(PCAPS, 'packet-lan-side.pcap'))
    a.add(eth(BCAST, VM_MAC, 0x0806, arp(1, VM_MAC, VM_IP, b'\0' * 6, GW_IP)), 0)              # 1 who has the gateway?
    a.add(eth(VM_MAC, GW_MAC, 0x0806, arp(2, GW_MAC, GW_IP, VM_MAC, VM_IP)), 0.000351)         # 2 gateway is at
    for i, seq in enumerate((1, 2)):
        a.add(eth(GW_MAC, VM_MAC, 0x0800, ipv4(VM_IP, SRV_IP, 1, icmp_echo(False, 5150, seq), ids[i], ttl=64)), 0.000190 if i == 0 else 1.0009)
        a.add(eth(VM_MAC, GW_MAC, 0x0800, ipv4(SRV_IP, VM_IP, 1, icmp_echo(True, 5150, seq), reply_ids[i], ttl=63)), 0.001284)
    a.close()
    # far side, captured on the Lab Server
    b = Pcap(os.path.join(PCAPS, 'packet-far-side.pcap'), t0=1757100000.000642)
    b.add(eth(BCAST, GWF_MAC, 0x0806, arp(1, GWF_MAC, GWF_IP, b'\0' * 6, SRV_IP)), 0)           # 1 router: who has 10.10.20.5?
    b.add(eth(GWF_MAC, SRV_MAC, 0x0806, arp(2, SRV_MAC, SRV_IP, GWF_MAC, GWF_IP)), 0.000297)    # 2 server is at
    for i, seq in enumerate((1, 2)):
        b.add(eth(SRV_MAC, GWF_MAC, 0x0800, ipv4(VM_IP, SRV_IP, 1, icmp_echo(False, 5150, seq), ids[i], ttl=63)), 0.000144 if i == 0 else 1.0009)
        b.add(eth(GWF_MAC, SRV_MAC, 0x0800, ipv4(SRV_IP, VM_IP, 1, icmp_echo(True, 5150, seq), reply_ids[i], ttl=64)), 0.000062)
    b.close()

# ---------- 3. ipv6-lan-ping: router discovery, neighbour discovery, ping ----------
def ipv6_lan_ping():
    c = Pcap(os.path.join(PCAPS, 'ipv6-lan-ping.pcap'))
    opt_src_ll = lambda m: b'\x01\x01' + m          # option 1: source link-layer address
    opt_tgt_ll = lambda m: b'\x02\x01' + m          # option 2: target link-layer address
    # 1 Router Solicitation: "is there a router here?"  fe80::vm -> ff02::2 (all routers)
    rs = struct.pack('!BBHI', 133, 0, 0, 0) + opt_src_ll(VM_MAC)
    c.add(eth(mac_of_mcast6('ff02::2'), VM_MAC, 0x86dd, ipv6(VM_LL, 'ff02::2', 58, icmp6(VM_LL, 'ff02::2', rs), hop=255)), 0)
    # 2 Router Advertisement: prefix 2001:db8:110::/64, use SLAAC  fe80::gw -> ff02::1 (all nodes)
    ra = struct.pack('!BBHBBHII', 134, 0, 0, 64, 0x00, 1800, 0, 0)
    ra += opt_src_ll(GW_MAC)
    ra += struct.pack('!BBHI', 5, 1, 0, 1500)                                   # option 5: MTU
    ra += struct.pack('!BBBBIII', 3, 4, 64, 0xc0, 86400, 14400, 0) + ip6b(PREFIX)  # option 3: prefix, flags L+A
    c.add(eth(mac_of_mcast6('ff02::1'), GW_MAC, 0x86dd, ipv6(GW_LL, 'ff02::1', 58, icmp6(GW_LL, 'ff02::1', ra), hop=255)), 0.0121)
    # 3 Neighbor Solicitation: "who has 2001:db8:110::1?"  -> solicited-node multicast ff02::1:ff00:1
    sn = 'ff02::1:ff00:1'
    ns = struct.pack('!BBHI', 135, 0, 0, 0) + ip6b(GW_G) + opt_src_ll(VM_MAC)
    c.add(eth(mac_of_mcast6(sn), VM_MAC, 0x86dd, ipv6(VM_G, sn, 58, icmp6(VM_G, sn, ns), hop=255)), 1.4879)
    # 4 Neighbor Advertisement: "2001:db8:110::1 is at 00:50:56:c0:00:01"  flags R S O
    na = struct.pack('!BBHI', 136, 0, 0, 0xe0000000) + ip6b(GW_G) + opt_tgt_ll(GW_MAC)
    c.add(eth(VM_MAC, GW_MAC, 0x86dd, ipv6(GW_G, VM_G, 58, icmp6(GW_G, VM_G, na), hop=255)), 0.000402)
    # 5-8 Echo Request / Reply, types 128 / 129
    for seq in (1, 2):
        req = struct.pack('!BBHHH', 128, 0, 0, 0x2a1f, seq) + PING_DATA
        rep = struct.pack('!BBHHH', 129, 0, 0, 0x2a1f, seq) + PING_DATA
        c.add(eth(GW_MAC, VM_MAC, 0x86dd, ipv6(VM_G, GW_G, 58, icmp6(VM_G, GW_G, req), hop=64)), 0.000188 if seq == 1 else 1.0011)
        c.add(eth(VM_MAC, GW_MAC, 0x86dd, ipv6(GW_G, VM_G, 58, icmp6(GW_G, VM_G, rep), hop=64)), 0.000377)
    c.close()

if __name__ == '__main__':
    os.makedirs(PCAPS, exist_ok=True)
    frame_lan_peer(); packet_both_sides(); ipv6_lan_ping()
    for n in ('frame-lan-peer', 'packet-lan-side', 'packet-far-side', 'ipv6-lan-ping'):
        print('wrote', n + '.pcap', os.path.getsize(os.path.join(PCAPS, n + '.pcap')), 'bytes')
