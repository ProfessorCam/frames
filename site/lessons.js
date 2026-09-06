/*
 * lessons.js - the teaching content, one object per row in the left column.
 *
 * To add a row: drop a classic .pcap into site/pcaps/, append an object here.
 *
 *   id        short word used in the URL hash (#frame)
 *   title     big label in the left column
 *   subtitle  one line under the title
 *   file      capture shown in the packet table at the bottom (optional), or
 *   captures  [{ file, title, hint }] to show more than one capture
 *   layer     where the idea lives in the stack (shown in the facts box)
 *   command   the command that produced the capture (shown to students)
 *   facts     [[label, text], ...] replaces the layer/command facts box
 *   oneLiner  the whole idea in one sentence
 *   sections  [{ h: heading, p: [paragraphs, may contain <b> <code>], ... }]
 *     anim     - key from ANIMATIONS in app.js (a packet-assembly animation with buttons)
 *     anatomy  - { kind: 'mac' | 'ip6', value, left, right } a colour-coded address strip
 *     packet   - { file, no, note }: one frame from a capture, shown opened, with its data as text
 *     compare  - { a: { file, no, label }, b: { file, no, label } }: the same packet in two captures, field by field
 *     tool     - 'mac' shows the visitor's MAC address when the site runs from its container
 *     columns  - [{ h, p: [...], cmd, after }] side-by-side instructions
 *     table    - [[cells...], ...] a small comparison table (first row is the header)
 *     steps    - [text...] a numbered list
 *     after    - paragraphs shown below all of the above
 *   actors    [{ name, addr }] columns of the sequence diagram, left to right
 *   steps     [{ from, to, label, dashed }] to: actor index or 'all' (broadcast)
 *   lookFor   bullets pointing at concrete things in the packet table
 *   lookForTitle  heading for those bullets (default "What to look for")
 */
var SITE = {
  title: 'Frames & Packets',
  image: 'professorcryan/frames',      /* Docker Hub image of this site */
  port: 8081,
  labName: 'Lab WiFi',
  labNetwork: '192.168.110.0/23',
  farNetwork: '10.10.20.0/24',
  /* The machines that appear in the captures. */
  hosts: [
    { name: 'Student VM', mac: '00:0c:29:4b:1f:a2', ip: '192.168.110.50', ip6: '2001:db8:110:0:20c:29ff:fe4b:1fa2', role: 'the machine most captures were taken on' },
    { name: 'Lab PC 2', mac: '00:0c:29:7d:e3:5c', ip: '192.168.110.60', ip6: '', role: 'another VM on the same LAN (row 2)' },
    { name: 'Gateway, LAN side', mac: '00:50:56:c0:00:01', ip: '192.168.110.1', ip6: '2001:db8:110::1', role: 'the router: one foot on each network' },
    { name: 'Gateway, far side', mac: '00:50:56:c0:00:08', ip: '10.10.20.1', ip6: '', role: 'the same router, its other network card' },
    { name: 'Lab Server', mac: '00:0c:29:a1:b2:c3', ip: '10.10.20.5', ip6: '', role: 'on the far network, behind the router (row 3)' }
  ],
  /* Top menu. href null = not built yet; current: true marks the site you are on. */
  menu: [
    { label: 'Frames & Packets', href: '#', current: true },
    { label: 'Protocols', href: 'https://professorcam.github.io/pcap/' },
    { label: 'Encryption and Protocols', href: 'https://professorcam.github.io/encryption/' }
  ]
};

var FILES = {
  frame: 'frame-lan-peer.pcap',
  lan: 'packet-lan-side.pcap',
  far: 'packet-far-side.pcap',
  ipv6: 'ipv6-lan-ping.pcap'
};

var LESSONS = [
  {
    id: 'mac',
    title: 'MAC address',
    subtitle: 'The address printed on every network card',
    layer: 'Layer 2 (Data link). A MAC address only means something on the local network. It never travels past the first router.',
    facts: [
      ['Where it lives', 'Layer 2 (Data link). A MAC address only means something on the local network. It never travels past the first router.'],
      ['Who hands it out', 'The maker of the network card, from a block of numbers registered with the IEEE. No server, no setting, no login.']
    ],
    oneLiner: 'A MAC address is the name printed on your network card: six bytes, unique in the world, used to deliver frames on your own LAN.',
    sections: [
      { h: 'What it looks like', p: [
        'A MAC address (Media Access Control address) is 48 bits long, written as six pairs of hexadecimal digits. Linux and macOS separate the pairs with colons, Windows uses dashes, and some switches write three groups of four. All of these are the same address: <code>00:0c:29:4b:1f:a2</code>, <code>00-0C-29-4B-1F-A2</code>, <code>000c.294b.1fa2</code>.',
        'This is the address of the Student VM, the machine most of the captures on this site were taken on:'
      ], anatomy: { kind: 'mac', value: '00:0c:29:4b:1f:a2', left: 'the maker\'s prefix, assigned by the IEEE. 00:0c:29 belongs to VMware, so this card is a virtual one', right: 'a serial number the maker chose. Together with the prefix it is unique in the world' }, after: [
        'The address is chosen when the card is made and stored in its firmware, which is why an old name for it is the <b>burned-in address</b>. Every network card has one: the Wi-Fi chip in a phone, the Ethernet port on a laptop, each port of a router, and each virtual card in a virtual machine.'
      ]},
      { h: 'The first half says who made it', p: [
        'The first three bytes are the <b>OUI</b> (Organizationally Unique Identifier). A company buys a block from the IEEE, the body that runs the Ethernet standards, and then numbers its own cards inside that block. There are around 54,000 registered blocks. A few you will meet often:'
      ], table: [
        ['Prefix', 'Belongs to', 'Where you see it'],
        ['00:0c:29 and 00:50:56', 'VMware (United States)', 'virtual machines, including every VM in this lab'],
        ['08:00:27', 'PCS Systemtechnik, the VirtualBox developers (Oracle, United States)', 'VirtualBox VMs'],
        ['00:15:5d', 'Microsoft (United States)', 'Hyper-V and WSL virtual cards'],
        ['3c:22:fb, a4:83:e7 and many more', 'Apple (United States)', 'Macs, iPhones, iPads'],
        ['00:1b:21, 3c:e9:f7 and many more', 'Intel (registered from Malaysia)', 'the Wi-Fi and Ethernet chips in most laptops'],
        ['00:1a:a0', 'Dell (United States)', 'Dell desktops and laptops'],
        ['b8:27:eb, dc:a6:32, d8:3a:dd, e4:5f:01', 'Raspberry Pi (United Kingdom)', 'Raspberry Pi boards'],
        ['00:e0:4c', 'Realtek (Taiwan)', 'cheap Ethernet and USB network adapters']
      ], after: [
        'The IEEE publishes the whole list, so a sniffer on your LAN can usually tell what kind of device each MAC address belongs to. Wireshark does this automatically: it shows <code>VMware_4b:1f:a2</code> instead of <code>00:0c:29:4b:1f:a2</code>. The registry records the company and the address it registered from, which is why a prefix points to a maker and a country. It says nothing about where the device is right now.',
        'Two bits in the first byte carry extra meaning. If the <b>second hex digit</b> is 2, 6, A or E, the address was set by software rather than by the maker: modern phones and laptops make up a fresh <b>private Wi-Fi address</b> like this for every network they join, so the maker cannot be looked up. If the first byte is odd (ends in 1, 3, 5, 7, 9, B, D or F) the address is a <b>group</b> address: <code>ff:ff:ff:ff:ff:ff</code> means everyone, and <code>33:33:...</code> means an IPv6 multicast group (row 4).'
      ]},
      { h: 'Your MAC address', p: [
        'The box below fills in only when this site runs from its Docker container on your own LAN, because only a machine on the same network can see your MAC address (row 3 explains why). Either way, your computer will tell you its own:'
      ], tool: 'mac', columns: [
        { h: 'Windows', p: ['Open a Command Prompt or PowerShell and run:'], cmd: 'ipconfig /all', after: 'Find your adapter (Wi-Fi or Ethernet) and read the <b>Physical Address</b> line, written with dashes, for example <code>00-0C-29-4B-1F-A2</code>. The shorter <code>getmac /v</code> lists just the addresses. Settings &gt; Network &amp; internet &gt; Wi-Fi &gt; your network &gt; Properties shows it as <b>Physical address (MAC)</b>.' },
        { h: 'Linux', p: ['In a terminal run:'], cmd: 'ip link', after: 'Each card is listed with a <b>link/ether</b> line, for example <code>link/ether 00:0c:29:4b:1f:a2</code>. The card names look like <code>eth0</code>, <code>ens33</code> or <code>wlan0</code>; ignore <code>lo</code>, the loopback, which has no real address. <code>cat /sys/class/net/eth0/address</code> prints just the address.' },
        { h: 'macOS', p: ['In Terminal run:'], cmd: 'ifconfig en0 | grep ether', after: '<code>en0</code> is the Wi-Fi card on a laptop; the <b>ether</b> line is the address. Or open System Settings &gt; Wi-Fi, click <b>Details...</b> next to your network, and look under <b>Hardware</b>. Note that macOS, iOS and Android use a made-up private address on Wi-Fi by default, so the one you see there may not be the one printed on the card.' }
      ]},
      { h: 'What a MAC address is not', p: [
        'It is <b>not a location</b>. Your laptop keeps the same MAC address at home, at school and in a cafe. Nothing in it says which network you are on, which is exactly why IP addresses exist (row 3).',
        'It is <b>not secret and not proof of identity</b>. It is sent in the clear in every frame, and any operating system can change it with one command. Networks that "secure" themselves with a list of allowed MAC addresses are relying on a name badge anyone can copy.',
        'It is <b>not seen by the internet</b>. A MAC address lives inside the frame, and the frame is thrown away at every router. A website sees the MAC address of its own router and nothing further back. The only devices that ever see yours are the ones on your own LAN.'
      ]}
    ],
    lookForTitle: 'Things to try',
    lookFor: [
      'Find your own MAC address with the command for your system, then find the prefix in the table. If it is not there, a search for the first three bytes plus "OUI" will find the maker.',
      'On a phone, look at the Wi-Fi address in the network settings and check the second hex digit. A 2, 6, A or E means the phone made it up for this network.',
      'On row 2, open any packet and compare the Source MAC in the Ethernet header with the addresses in the table on the welcome page.'
    ]
  },

  {
    id: 'frame',
    title: 'Frame',
    subtitle: 'MAC to MAC on the same LAN',
    file: FILES.frame,
    layer: 'Layer 2 (Data link). A frame lives and dies on one link: one switch, one Wi-Fi network, one cable.',
    command: 'sudo python3 tools/rawframe.py send ens33 00:0c:29:7d:e3:5c "Hello Lab PC 2. ..."   then   ping -c 2 192.168.110.60',
    oneLiner: 'A frame is the envelope the LAN uses: destination MAC, source MAC, a type, the data, and a check number. Two machines on the same switch need nothing else to talk.',
    sections: [
      { h: 'The envelope', p: [
        'Everything that crosses an Ethernet or Wi-Fi network travels inside a <b>frame</b>. The frame is the outermost layer of every packet you have seen on the Protocols site, and it is the same five parts every time:'
      ], steps: [
        '<b>Destination MAC</b>, 6 bytes. The card that should pick this frame up. Every other card on the LAN sees it go by and ignores it.',
        '<b>Source MAC</b>, 6 bytes. The card that sent it, so the receiver knows where to send the answer.',
        '<b>Type</b>, 2 bytes. What is inside: <code>0x0800</code> for an IPv4 packet, <code>0x0806</code> for ARP, <code>0x86dd</code> for IPv6. The receiver reads this to know which part of the operating system gets the contents.',
        '<b>Data</b>, 46 to 1500 bytes. Whatever is being carried. If it is shorter than 46 bytes, zeros are added to reach the minimum; that is why so many packets show as exactly 60 bytes.',
        '<b>Frame check sequence</b>, 4 bytes. A CRC-32 checksum the sending card calculates over the whole frame. The receiving card recalculates it and silently drops any frame that does not match. Cards strip it before handing the frame to the operating system, so it never appears in a capture: a 60-byte frame in Wireshark was 64 bytes on the wire.'
      ], anim: 'raw-frame', after: [
        'On Wi-Fi the radio frame has a longer header with three or four addresses, but the operating system converts it to this Ethernet form before anything else sees it, so a capture on a laptop\'s Wi-Fi card looks exactly like this.'
      ]},
      { h: 'No IP address anywhere', p: [
        'To prove that a frame needs nothing but MAC addresses, the first two packets in the capture were made with a small script that writes a frame by hand: destination MAC, source MAC, an experimental type code, and a sentence. No IP header, no port, no protocol on top. Lab PC 2 received it and answered the same way.',
        'Here is the first one. The Ethernet header is all there is; the data starts at byte 15:'
      ], packet: { file: FILES.frame, no: 1, note: 'a frame with nothing but MAC addresses in it' }, after: [
        'This is how a LAN works underneath IP. The switch, the cards and the cable never look at an IP address; they deliver frames by MAC address, and whatever is inside is not their business. IP is a passenger.'
      ]},
      { h: 'How the switch delivers it', p: [
        'A switch has a table of which MAC address was last seen on which port. It fills the table by reading the <b>source</b> address of every frame that comes in, and it uses the table by reading the <b>destination</b> address of every frame it must send out. After the first two frames in the capture the switch knows both machines:'
      ], table: [
        ['Port', 'MAC address', 'How the switch learned it'],
        ['3', '00:0c:29:4b:1f:a2 (Student VM)', 'source address of frame 1'],
        ['7', '00:0c:29:7d:e3:5c (Lab PC 2)', 'source address of frame 2']
      ], after: [
        'A frame to a known address goes out of one port only; nobody else on the LAN even sees it. A frame to an address the switch has not learned yet, and every frame to the broadcast address <code>ff:ff:ff:ff:ff:ff</code>, is copied to every port. That is what frame 3, the ARP request, does: it has to reach everyone, because the sender does not know which port to ask. A Wi-Fi access point does the same job for the machines on its network, and a router does exactly the same for its own LAN-side port.'
      ]},
      { h: 'When an IP packet rides inside', p: [
        'Frames 3 to 8 are an ordinary ping to Lab PC 2. Now there is an IP packet inside each frame, and the frame\'s Type field says <code>0x0800</code> so the receiver knows to hand the contents to IP. Before the first ping the Student VM had to ask "who has 192.168.110.60?" (frame 3, ARP, to everyone) and got "192.168.110.60 is at 00:0c:29:7d:e3:5c" (frame 4). Only then could it address the envelope.',
        'Look at the two sets of addresses in frame 5. The frame is addressed to Lab PC 2\'s MAC, and the packet inside is addressed to Lab PC 2\'s IP. Envelope and letter name the same machine, because it is on the same LAN:'
      ], packet: { file: FILES.frame, no: 5, note: 'an IP packet inside a frame, both addressed to the same machine' }, after: [
        'Row 3 changes exactly one thing: the destination moves to another network. The letter is addressed the same way, but the envelope is not.'
      ]}
    ],
    actors: [{ name: 'Student VM', addr: '00:0c:29:4b:1f:a2' }, { name: 'Lab PC 2', addr: '00:0c:29:7d:e3:5c' }],
    steps: [
      { from: 0, to: 1, label: 'Raw frame: "Hello Lab PC 2 ..." (no IP)' },
      { from: 1, to: 0, label: 'Raw frame: "Hello Student VM ..."' },
      { from: 0, to: 'all', label: 'ARP: who has 192.168.110.60?  (broadcast)' },
      { from: 1, to: 0, label: 'ARP: 192.168.110.60 is at 00:0c:29:7d:e3:5c' },
      { from: 0, to: 1, label: 'Frame to 00:0c:29:7d:e3:5c carrying Echo request seq=1' },
      { from: 1, to: 0, label: 'Frame to 00:0c:29:4b:1f:a2 carrying Echo reply seq=1' },
      { from: 0, to: 1, label: 'Echo request seq=2  (1 s later)' },
      { from: 1, to: 0, label: 'Echo reply seq=2' }
    ],
    lookFor: [
      'Frames 1 and 2: the Source and Destination columns show MAC addresses, because there is no IP address anywhere in these frames. Open one and read the sentence in the Data section.',
      'Frame 1 is 72 bytes: 14 bytes of header and 58 of text. Frame 2 is 65. Neither needed padding.',
      'Frames 3 and 4 are 60 bytes: 42 real bytes plus 18 zeros of padding to reach the Ethernet minimum.',
      'Frame 3 goes to ff:ff:ff:ff:ff:ff (everyone); frame 4 comes straight back to 00:0c:29:4b:1f:a2. Only the question is broadcast.',
      'Frames 5 to 8: Type 0x0800 in the Ethernet header, then an IPv4 header, then ICMP. The destination MAC and the destination IP belong to the same machine, Lab PC 2.'
    ]
  },

  {
    id: 'packet',
    title: 'Frame vs packet',
    subtitle: 'What changes when the destination is on another network',
    captures: [
      { file: FILES.lan, title: 'Captured on the Student VM, LAN side', hint: 'The frames as they left the Student VM. Note the destination MAC of frames 3 and 5.' },
      { file: FILES.far, title: 'Captured on the Lab Server, far side of the router', hint: 'The same pings a moment later, on the other network. New frames, same packets.' }
    ],
    layer: 'Layer 2 carries layer 3. The frame is rebuilt at every router; the IP packet inside travels end to end.',
    command: 'ping -c 2 10.10.20.5   (captured on the Student VM and on the Lab Server at the same time)',
    oneLiner: 'The IP address says where the packet must end up. The MAC address says which machine gets it next. On one LAN those are the same machine; across a router they are not.',
    sections: [
      { h: 'Two addresses, two jobs', p: [
        'Think of a parcel. The <b>IP address</b> is the address written on the parcel: it names the final destination and it does not change on the way. The <b>MAC address</b> is the number plate of the van the parcel is riding in right now. The parcel changes vans at every depot, and each van only drives one leg of the trip.',
        'The frame is the van; the packet is the parcel. Everything about them follows from that:'
      ], table: [
        ['', 'Frame (Ethernet)', 'Packet (IPv4)'],
        ['Layer', '2, Data link', '3, Network'],
        ['Address', 'MAC, 48 bits, e.g. 00:0c:29:4b:1f:a2', 'IP, 32 bits, e.g. 192.168.110.50'],
        ['Who assigns it', 'the card maker, once, forever', 'the network: DHCP, or an administrator, for as long as you are on that network'],
        ['What it names', 'a network card', 'a machine on a particular network'],
        ['How far it reaches', 'one link: this switch, this Wi-Fi network', 'the whole internet'],
        ['On the way', 'thrown away and rebuilt by every router', 'carried unchanged from end to end (only the TTL counts down)'],
        ['Header size', '14 bytes', '20 bytes'],
        ['How to find the next one', 'ARP: "who has this IP?"', 'the routing table: "is it on my network? if not, use the gateway"']
      ]},
      { h: 'The sender\'s decision', p: [
        'The Student VM is 192.168.110.50 with mask 255.255.254.0, so its network is 192.168.110.0 to 192.168.111.255. Before sending a packet it asks one question: <b>is the destination inside my network?</b>',
        'On row 2 the answer was yes (192.168.110.60), so it asked ARP for that machine\'s MAC and addressed the frame straight to it. Here the answer is no (10.10.20.5), so it asks ARP for the <b>gateway\'s</b> MAC instead (frames 1 and 2) and addresses the frame to the gateway, while the packet inside still says 10.10.20.5:'
      ], anim: 'packet-in-frame', table: [
        ['', 'Ping to Lab PC 2 (row 2)', 'Ping to the Lab Server (this row)'],
        ['Destination IP', '192.168.110.60', '10.10.20.5'],
        ['Inside 192.168.110.0/23?', 'yes', 'no'],
        ['ARP asks for', '192.168.110.60', '192.168.110.1, the gateway'],
        ['Destination MAC', '00:0c:29:7d:e3:5c (Lab PC 2)', '00:50:56:c0:00:01 (gateway)'],
        ['Who opens the envelope', 'Lab PC 2, the final destination', 'the gateway, which reads the IP address and makes a new envelope']
      ]},
      { h: 'The same packet on both sides of the router', p: [
        'The two captures on this row were taken at the same moment on the two ends of the trip. Frame 3 in each is the first Echo Request. Here they are field by field. Yellow rows changed on the way through the router; green rows did not:'
      ], compare: { a: { file: FILES.lan, no: 3, label: 'LAN side (Student VM)' }, b: { file: FILES.far, no: 3, label: 'Far side (Lab Server)' } }, after: [
        'Everything in the Ethernet header is new: the router threw the first frame away and built another with its own far-side card as the source and the Lab Server as the destination. To do that it first ran ARP on the far network (frames 1 and 2 of the second capture). Everything in the IP packet is the same except the <b>TTL</b>, which the router lowered from 64 to 63; that is how the packet counts the routers it has crossed, and how it is stopped if it ever goes round in circles. The ICMP message inside was not touched at all.',
        'The reply makes the same trip backwards: the Lab Server sends it in a frame addressed to the router\'s far-side card (00:50:56:c0:00:08), and the Student VM receives it in a frame from the router\'s LAN-side card (00:50:56:c0:00:01), with the TTL now 63.'
      ]},
      { h: 'Why the internet never sees your MAC address', p: [
        'A packet to a website crosses ten or twenty routers. Each one repeats what you just saw: open the envelope, read the address on the parcel, subtract one from the TTL, put the parcel in a new envelope for the next hop. The web server receives a frame whose source MAC is its own router\'s. Your MAC address was gone at hop one.',
        'The lab router forwards the packet honestly, so the IP addresses in the two captures match. A home router does one more thing on the way out to the internet: it swaps your private 192.168 address for its public one (NAT), which is a different lesson. Inside a network like this one, the rule holds exactly: <b>MAC addresses change at every hop, IP addresses do not.</b>'
      ]}
    ],
    actors: [{ name: 'Student VM', addr: '192.168.110.50' }, { name: 'Gateway', addr: '.110.1  |  10.10.20.1' }, { name: 'Lab Server', addr: '10.10.20.5' }],
    steps: [
      { from: 0, to: 'all', label: 'ARP: who has 192.168.110.1?  (LAN side, broadcast)' },
      { from: 1, to: 0, label: 'ARP: 192.168.110.1 is at 00:50:56:c0:00:01' },
      { from: 0, to: 1, label: 'Frame to 00:50:56:c0:00:01: packet 192.168.110.50 → 10.10.20.5, TTL 64' },
      { from: 1, to: 'all', label: 'ARP: who has 10.10.20.5?  (far side, broadcast)' },
      { from: 2, to: 1, label: 'ARP: 10.10.20.5 is at 00:0c:29:a1:b2:c3' },
      { from: 1, to: 2, label: 'New frame to 00:0c:29:a1:b2:c3: same packet, TTL 63' },
      { from: 2, to: 1, label: 'Frame to 00:50:56:c0:00:08: reply 10.10.20.5 → 192.168.110.50, TTL 64' },
      { from: 1, to: 0, label: 'New frame to 00:0c:29:4b:1f:a2: same reply, TTL 63' }
    ],
    lookFor: [
      'First capture, frame 1: the VM asks for the gateway\'s MAC, not the server\'s. It knows 10.10.20.5 is not on its network.',
      'First capture, frame 3: destination MAC 00:50:56:c0:00:01 (the gateway) but destination IP 10.10.20.5 (the server). The envelope and the parcel name different machines.',
      'Second capture, frames 1 and 2: the router asks ARP on the far network, just as the VM did on the LAN.',
      'Frame 3 in both captures: same source and destination IP, same Identification 0x5e21, same ICMP id 5150 and seq 1, same 56 data bytes. Different MAC addresses, TTL 64 then 63.',
      'The replies: TTL 64 in the second capture, 63 in the first. The reply crossed the router too.'
    ]
  },

  {
    id: 'ipv6',
    title: 'IPv6',
    subtitle: 'Bigger addresses, same frames, no ARP',
    file: FILES.ipv6,
    layer: 'Layer 3 (Network), like IPv4. It rides in exactly the same Ethernet frames, with type 0x86dd instead of 0x0800.',
    command: 'ping -c 2 2001:db8:110::1   (right after the network card came up)',
    oneLiner: 'IPv6 is IPv4 with room to breathe: addresses four times as long, so every device can have its own, and a tidier way to find routers and neighbours.',
    sections: [
      { h: 'Why there is a version 6', p: [
        'IPv4 addresses are 32 bits, which allows about 4.3 billion of them. That ran out: the central pool was emptied in 2011 and the regional pools followed. Home networks cope by sharing one public address between many devices (NAT), which works but makes every device a second-class citizen that cannot be reached directly.',
        'IPv6 addresses are <b>128 bits</b>: 340 undecillion of them, enough to give every device on Earth its own reachable address many times over. Today the two versions run side by side on most networks ("dual stack"). Close to half of the traffic reaching large sites such as Google already arrives over IPv6, and your phone on mobile data is very likely using it right now.'
      ]},
      { h: 'Reading an address', p: [
        '128 bits are written as eight groups of four hex digits separated by colons. Two rules make them shorter: leading zeros in a group are dropped, and one run of all-zero groups may be replaced by <code>::</code>. This is the Student VM\'s address, in full:'
      ], anatomy: { kind: 'ip6', value: '2001:0db8:0110:0000:020c:29ff:fe4b:1fa2', left: 'the network prefix, the same for every machine on this LAN. The router announces it (see below)', right: 'the interface identifier, which names this card within the network' }, after: [
        'Written short it is <code>2001:db8:110:0:20c:29ff:fe4b:1fa2</code>, and the gateway <code>2001:0db8:0110:0000:0000:0000:0000:0001</code> collapses to <code>2001:db8:110::1</code>. The <code>::</code> may be used once per address, otherwise you could not tell how many zero groups it stands for.',
        'Look closely at the second half: <code>020c:29ff:fe4b:1fa2</code>. It is the VM\'s MAC address, <code>00:0c:29:4b:1f:a2</code>, with <code>ff:fe</code> inserted in the middle and one bit flipped in the first byte. This is the <b>EUI-64</b> rule, the original way a machine made its own IPv6 address. Most laptops and phones now use a random second half instead, so that the address does not reveal the card, but the idea is the same: the network gives you the first half, you make up the second.',
        '<code>2001:db8::/32</code> is the prefix reserved for documentation and labs, which is why it is used here. On your own network the prefix will be whatever your internet provider hands the router.'
      ]},
      { h: 'One card, several addresses', p: [
        'An IPv4 card usually has one address. An IPv6 card always has several, each with a job:'
      ], table: [
        ['Address', 'Prefix', 'Where it comes from', 'What it is for'],
        ['fe80::20c:29ff:fe4b:1fa2', 'fe80::/10, link-local', 'made by the card itself the moment it comes up, no router needed', 'talking on this LAN only: finding the router, neighbour discovery. Every IPv6 card has one'],
        ['2001:db8:110:0:20c:29ff:fe4b:1fa2', '2001:db8:110::/64, global', 'prefix from the router, second half made by the machine (SLAAC)', 'talking to anywhere: the everyday address'],
        ['ff02::1', 'ff00::/8, multicast', 'fixed by the standard', '"all nodes on this link". The router uses it to announce the prefix'],
        ['ff02::1:ff4b:1fa2', 'solicited-node multicast', 'the last 24 bits of your own address', 'the group a card listens to so neighbours can find it without waking everyone up']
      ], after: [
        'There is <b>no broadcast in IPv6</b>. Everything that IPv4 broadcasts, IPv6 multicasts to a group, and the Ethernet frame goes to a group MAC address that starts with <code>33:33</code> followed by the last four bytes of the IPv6 address. Cards ignore groups they have not joined, so a chatty network no longer interrupts every machine on it.'
      ]},
      { h: 'Finding the router and the neighbour, without ARP', p: [
        'The first four packets in the capture happen automatically when the card comes up, and they replace both DHCP and ARP:'
      ], steps: [
        '<b>Router Solicitation</b> (frame 1). The VM, using only its link-local address, asks <code>ff02::2</code> (all routers): is there a router here?',
        '<b>Router Advertisement</b> (frame 2). The gateway answers to <code>ff02::1</code> (all nodes): I am a router, the prefix here is <code>2001:db8:110::/64</code>, make yourself an address from it, and use me as your gateway for the next 1800 seconds. The VM builds its global address on the spot. This is <b>SLAAC</b>, stateless address autoconfiguration: no lease, no server, no DHCP.',
        '<b>Neighbor Solicitation</b> (frame 3). To ping the gateway the VM needs its MAC address. Instead of an ARP broadcast it sends an ICMPv6 message to the gateway\'s solicited-node group <code>ff02::1:ff00:1</code>, frame address <code>33:33:ff:00:00:01</code>. Only cards whose address ends in <code>00:00:01</code> even look at it.',
        '<b>Neighbor Advertisement</b> (frame 4). The gateway replies straight back: <code>2001:db8:110::1</code> is at <code>00:50:56:c0:00:01</code>. Same job as an ARP reply, done inside ICMPv6 rather than as a separate protocol.'
      ], after: [
        'Then the ping itself, frames 5 to 8, which looks almost exactly like the IPv4 ping on row 2. ICMPv6 type 128 is the Echo Request and 129 the Echo Reply, instead of 8 and 0:'
      ], anim: 'ipv6-ping' },
      { h: 'The header, side by side', p: [
        'The IPv6 header is twice the size of the IPv4 header, entirely because of the addresses, and simpler everywhere else:'
      ], table: [
        ['', 'IPv4', 'IPv6'],
        ['Address', '32 bits, 192.168.110.50', '128 bits, 2001:db8:110:0:20c:29ff:fe4b:1fa2'],
        ['Header', '20 bytes, more with options', '40 bytes, always. Extras go in extension headers after it'],
        ['What is inside', 'Protocol field: 1 ICMP, 6 TCP, 17 UDP', 'Next header field: 58 ICMPv6, 6 TCP, 17 UDP'],
        ['Hop counter', 'TTL, minus one per router', 'Hop limit, minus one per router. Same job, honest name'],
        ['Header checksum', 'yes, recomputed by every router', 'none. Ethernet, TCP, UDP and ICMPv6 already check the bytes'],
        ['Fragmentation', 'routers may cut a packet into pieces', 'only the sender may; routers report "packet too big" instead'],
        ['Broadcast', 'yes, 255.255.255.255 and the network broadcast', 'none. Multicast groups instead'],
        ['Finding a MAC address', 'ARP, a separate protocol beside IP', 'Neighbor Discovery, part of ICMPv6'],
        ['Getting an address', 'DHCP, or typed in by hand', 'SLAAC from the router\'s advertisement, or DHCPv6, or by hand'],
        ['In the Ethernet frame', 'Type 0x0800', 'Type 0x86dd. The frame itself is unchanged']
      ], after: [
        'Everything from row 3 still holds. The frame is thrown away at every router, the packet travels end to end, and the hop limit counts down. IPv6 changed the addresses and tidied the housekeeping; it did not change the picture.'
      ]}
    ],
    actors: [{ name: 'Student VM', addr: '2001:db8:110:0:20c:29ff:fe4b:1fa2' }, { name: 'Gateway', addr: '2001:db8:110::1' }],
    steps: [
      { from: 0, to: 'all', label: 'Router Solicitation → ff02::2 (all routers)' },
      { from: 1, to: 'all', label: 'Router Advertisement → ff02::1: prefix 2001:db8:110::/64' },
      { from: 0, to: 'all', label: 'Neighbor Solicitation → ff02::1:ff00:1: who has 2001:db8:110::1?' },
      { from: 1, to: 0, label: 'Neighbor Advertisement: 2001:db8:110::1 is at 00:50:56:c0:00:01' },
      { from: 0, to: 1, label: 'Echo request seq=1  (ICMPv6 type 128)' },
      { from: 1, to: 0, label: 'Echo reply seq=1  (type 129)' },
      { from: 0, to: 1, label: 'Echo request seq=2' },
      { from: 1, to: 0, label: 'Echo reply seq=2' }
    ],
    lookFor: [
      'Frame 1 comes from a link-local address, fe80::..., because the VM has no other address yet. Frame 3 already comes from the global address it built from the prefix in frame 2.',
      'Open frame 2 and find the prefix option, the MTU option and the router lifetime. That single packet replaces a DHCP lease.',
      'Frames 1 to 4 have hop limit 255. Neighbour discovery messages must arrive with 255 untouched, which proves they did not cross a router.',
      'The destination MAC of frames 1 to 3 starts with 33:33, and its last four bytes are the last four bytes of the IPv6 destination. No frame in this capture goes to ff:ff:ff:ff:ff:ff.',
      'Frames 5 to 8: the same four-packet ping as row 2, with types 128 and 129, hop limit 64, and a 40-byte IP header instead of 20. Every frame is 118 bytes rather than 98: exactly the 20 extra bytes of header.'
    ]
  }
];
