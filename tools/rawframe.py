#!/usr/bin/env python3
"""
Send and receive Ethernet frames with no IP inside, straight MAC to MAC.
This is the experiment behind the Frame row. It uses EtherType 0x88B5, which
the IEEE reserves for local experiments, so nothing else on the LAN will try
to interpret the frames. Linux only (raw AF_PACKET sockets); needs root.

  On Lab PC 2:    sudo python3 rawframe.py listen ens33
  On Student VM:  sudo python3 rawframe.py send ens33 00:0c:29:7d:e3:5c "Hello Lab PC 2. This frame has no IP address in it at all."

The listener prints every frame it gets and answers each one with a frame of
its own. Capture on either machine with:  tcpdump -i ens33 -w frame.pcap ether proto 0x88b5
"""
import socket, struct, sys

ETHERTYPE = 0x88B5

def mac_bytes(s): return bytes.fromhex(s.replace(':', '').replace('-', ''))
def mac_str(b): return ':'.join('%02x' % x for x in b)

def open_socket(iface):
    s = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.htons(ETHERTYPE))
    s.bind((iface, 0))
    return s

def send(sock, dst, src, text):
    frame = dst + src + struct.pack('!H', ETHERTYPE) + text.encode()
    frame += b'\0' * max(0, 60 - len(frame))          # Ethernet minimum, without the FCS
    sock.send(frame)
    print('sent %d bytes to %s: %r' % (len(frame), mac_str(dst), text))

def main():
    if len(sys.argv) < 3 or sys.argv[1] not in ('send', 'listen'):
        print(__doc__); sys.exit(1)
    mode, iface = sys.argv[1], sys.argv[2]
    sock = open_socket(iface)
    my_mac = sock.getsockname()[4]
    if mode == 'send':
        send(sock, mac_bytes(sys.argv[3]), my_mac, ' '.join(sys.argv[4:]) or 'Hello, MAC to MAC.')
        sock.settimeout(2)
        try:
            frame = sock.recv(2000)
            print('got %d bytes from %s: %r' % (len(frame), mac_str(frame[6:12]), frame[14:].rstrip(b'\0').decode(errors='replace')))
        except socket.timeout:
            print('no answer within 2 s')
    else:
        print('listening on', iface, 'as', mac_str(my_mac))
        while True:
            frame = sock.recv(2000)
            src = frame[6:12]
            print('got %d bytes from %s: %r' % (len(frame), mac_str(src), frame[14:].rstrip(b'\0').decode(errors='replace')))
            send(sock, src, my_mac, 'Hello Student VM. Got it, MAC to MAC, no IP needed.')

if __name__ == '__main__':
    main()
