/*
 * lessons.js - the teaching content, one object per row in the left column.
 *
 * To add a row: drop a classic .pcap into site/pcaps/, append an object here.
 *
 *   id        short word used in the URL hash (#frame)
 *   stack     2, 3, 4, 7, 'tls' or 'stack': groups the left column by layer and sets the chip on the row
 *   chip      optional override for the small chip text on the row (default from stack)
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
 *
 * Reading levels: any prose (oneLiner, layer, facts values, p, after, steps, table cells,
 * column p/after, capture hints, lookFor bullets, animation captions) may be a plain string
 * (the same at every level) or { s: ..., m: ..., e: ... } for Simple / Moderate / Engineer.
 * A missing key falls back to m; '' leaves that paragraph out at that level. Refer to other
 * rows as {{row:id}} / {{Row:id}}, which becomes the row's title in quotes when drawn. See level.js.
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
    { name: 'Lab PC 2', mac: '00:0c:29:7d:e3:5c', ip: '192.168.110.60', ip6: '', role: 'another VM on the same LAN (\u201cFrame\u201d row)' },
    { name: 'Gateway, LAN side', mac: '00:50:56:c0:00:01', ip: '192.168.110.1', ip6: '2001:db8:110::1', role: 'the router: one foot on each network' },
    { name: 'Gateway, far side', mac: '00:50:56:c0:00:08', ip: '10.10.20.1', ip6: '', role: 'the same router, its other network card' },
    { name: 'Lab Server', mac: '00:0c:29:a1:b2:c3', ip: '10.10.20.5', ip6: '', role: 'on the far network, behind the router (\u201cFrame vs packet\u201d row)' }
  ],
  /* Top menu. href null = not built yet; current: true marks the site you are on. */
  menu: [
    { label: 'Frames & Packets', href: '#', current: true },
    { label: 'Protocols', href: 'https://professorcam.github.io/pcap/' },
    { label: 'Encryption and Protocols', href: 'https://professorcam.github.io/encryption/' },
    { label: 'Packet Forensics', href: 'https://professorcam.github.io/forensics/' }
  ]
};

var FILES = {
  frame: 'frame-lan-peer.pcap',
  lan: 'packet-lan-side.pcap',
  far: 'packet-far-side.pcap',
  ipv6: 'ipv6-lan-ping.pcap',
  stack: 'stack-http-get.pcap'
};

var LESSONS = [
  {
    id: 'mac',
    stack: 2,
    title: 'MAC address',
    subtitle: 'The address printed on every network card',
    layer: 'Layer 2 (Data link). A MAC address only means something on the local network. It never travels past the first router.',
    facts: [
      ['Where it lives', {
        s: 'On your own network only. A MAC address is how machines on the same switch or Wi-Fi find each other. It never gets past the first router.',
        m: 'Layer 2 (Data link). A MAC address only means something on the local network. It never travels past the first router.',
        e: 'Layer 2 (IEEE 802). Link-local scope: the address is rewritten at every router hop and never appears in an IP header.'
      }],
      ['Who hands it out', {
        s: 'The company that made your network card. Nobody on your network assigns it; it comes with the hardware.',
        m: 'The maker of the network card, from a block of numbers registered with the IEEE. No server, no setting, no login.',
        e: 'The card vendor, from an IEEE-registered MA-L (OUI) block; the low 24 bits are vendor-assigned. No protocol allocates it.'
      }]
    ],
    oneLiner: {
      s: 'A MAC address is the name printed on your network card. It is six bytes long, no two cards share one, and it is how your own network delivers frames to you.',
      m: 'A MAC address is the name printed on your network card: six bytes, unique in the world, used to deliver frames on your own LAN.',
      e: 'A 48-bit IEEE 802 hardware address: a 24-bit vendor prefix plus a 24-bit vendor-assigned serial, used as the source and destination of every Ethernet and Wi-Fi frame on the local link.'
    },
    sections: [
      { h: 'What it looks like', p: {
        s: [
          'A MAC address is six numbers written in hex, like <code>00:0c:29:4b:1f:a2</code>. Windows writes it with dashes; it is the same address.',
          'This is the Student VM\'s address, the machine most captures here came from:'
        ],
        m: [
          'A MAC address (Media Access Control address) is 48 bits long, written as six pairs of hexadecimal digits. Linux and macOS separate the pairs with colons, Windows uses dashes, and some switches write three groups of four. All of these are the same address: <code>00:0c:29:4b:1f:a2</code>, <code>00-0C-29-4B-1F-A2</code>, <code>000c.294b.1fa2</code>.',
          'This is the address of the Student VM, the machine most of the captures on this site were taken on:'
        ],
        e: [
          '48 bits (EUI-48) written as six hex octets. Colon, dash (Windows) and Cisco dotted forms are display conventions only: <code>00:0c:29:4b:1f:a2</code> = <code>00-0C-29-4B-1F-A2</code> = <code>000c.294b.1fa2</code>. Each octet is transmitted least-significant bit first on Ethernet.',
          'The Student VM\'s address, the source of most captures here:'
        ]
      }, anatomy: { kind: 'mac', value: '00:0c:29:4b:1f:a2', left: 'the maker\'s prefix, assigned by the IEEE. 00:0c:29 belongs to VMware, so this card is a virtual one', right: 'a serial number the maker chose. Together with the prefix it is unique in the world' }, after: {
        s: [
          'It is built into the card when it is made. Every network card has one, including the Wi-Fi chip in a phone and the pretend cards inside virtual machines.'
        ],
        m: [
          'The address is chosen when the card is made and stored in its firmware, which is why an old name for it is the <b>burned-in address</b>. Every network card has one: the Wi-Fi chip in a phone, the Ethernet port on a laptop, each port of a router, and each virtual card in a virtual machine.'
        ],
        e: [
          'Stored in the NIC\'s EEPROM at manufacture (the <b>burned-in address</b>, BIA). Every 802 interface has one: Wi-Fi chipsets, each router port, each virtual NIC. The driver may substitute an administered address; the BIA remains.'
        ]
      }},
      { h: 'The first half says who made it', p: {
        s: [
          'The first three numbers say which company made the card. Some you will run into:'
        ],
        m: [
          'The first three bytes are the <b>OUI</b> (Organizationally Unique Identifier). A company buys a block from the IEEE, the body that runs the Ethernet standards, and then numbers its own cards inside that block. There are around 54,000 registered blocks. A few you will meet often:'
        ],
        e: [
          'Bytes 0 to 2 are the <b>OUI</b> (an MA-L block, 24 bits) registered with the IEEE Registration Authority; bytes 3 to 5 are vendor-assigned. Smaller MA-M (28-bit) and MA-S (36-bit) blocks also exist. Around 54,000 MA-L assignments are public. Common prefixes:'
        ]
      }, table: [
        ['Prefix', 'Belongs to', 'Where you see it'],
        ['00:0c:29 and 00:50:56', 'VMware (United States)', 'virtual machines, including every VM in this lab'],
        ['08:00:27', 'PCS Systemtechnik, the VirtualBox developers (Oracle, United States)', 'VirtualBox VMs'],
        ['00:15:5d', 'Microsoft (United States)', 'Hyper-V and WSL virtual cards'],
        ['3c:22:fb, a4:83:e7 and many more', 'Apple (United States)', 'Macs, iPhones, iPads'],
        ['00:1b:21, 3c:e9:f7 and many more', 'Intel (registered from Malaysia)', 'the Wi-Fi and Ethernet chips in most laptops'],
        ['00:1a:a0', 'Dell (United States)', 'Dell desktops and laptops'],
        ['b8:27:eb, dc:a6:32, d8:3a:dd, e4:5f:01', 'Raspberry Pi (United Kingdom)', 'Raspberry Pi boards'],
        ['00:e0:4c', 'Realtek (Taiwan)', 'cheap Ethernet and USB network adapters']
      ], after: {
        s: [
          'Wireshark shows the company name in place of those three numbers. The prefix says who made the card, not where it is.',
          'Phones and laptops often make up a random address for each Wi-Fi network they join, so the maker cannot be looked up.'
        ],
        m: [
          'The IEEE publishes the whole list, so a sniffer on your LAN can usually tell what kind of device each MAC address belongs to. Wireshark does this automatically: it shows <code>VMware_4b:1f:a2</code> instead of <code>00:0c:29:4b:1f:a2</code>. The registry records the company and the address it registered from, which is why a prefix points to a maker and a country. It says nothing about where the device is right now.',
          'Two bits in the first byte carry extra meaning. If the <b>second hex digit</b> is 2, 6, A or E, the address was set by software rather than by the maker: modern phones and laptops make up a fresh <b>private Wi-Fi address</b> like this for every network they join, so the maker cannot be looked up. If the first byte is odd (ends in 1, 3, 5, 7, 9, B, D or F) the address is a <b>group</b> address: <code>ff:ff:ff:ff:ff:ff</code> means everyone, and <code>33:33:...</code> means an IPv6 multicast group ({{row:ipv6}}).'
        ],
        e: [
          'The IEEE publishes the MA-L, MA-M and MA-S registries; Wireshark\'s <code>manuf</code> file resolves <code>00:0c:29</code> to <code>VMware_4b:1f:a2</code>. The registry lists the assignee and its registered address, nothing about device location.',
          'Two flag bits live in the first octet. Bit 1 (U/L, value 0x02) set means <b>locally administered</b>: randomised private Wi-Fi addresses (second hex digit 2, 6, A or E) and most software-generated addresses, so no vendor lookup applies. Bit 0 (I/G, value 0x01) set means <b>group</b>: <code>ff:ff:ff:ff:ff:ff</code> broadcast, <code>01:00:5e:xx:xx:xx</code> IPv4 multicast, <code>33:33:xx:xx:xx:xx</code> IPv6 multicast ({{row:ipv6}}).'
        ]
      }},
      { h: 'Your MAC address', p: {
        s: [
          'The box below only fills in when this site runs on your own network, because only your own network can see your MAC address ({{row:packet}}). Your computer will always tell you:'
        ],
        m: [
          'The box below fills in only when this site runs from its Docker container on your own LAN, because only a machine on the same network can see your MAC address ({{row:packet}} explains why). Either way, your computer will tell you its own:'
        ],
        e: [
          'The box below is populated only when the site is served from its Docker container on the same L2 segment: it reads the server\'s neighbour cache, and a MAC address never survives a router hop ({{row:packet}}). Locally:'
        ]
      }, tool: 'mac', columns: [
        { h: 'Windows', p: [{ s: 'Open a Command Prompt and type:', m: 'Open a Command Prompt or PowerShell and run:', e: 'Command Prompt or PowerShell:' }], cmd: 'ipconfig /all', after: {
          s: 'Read the <b>Physical Address</b> line for your adapter, for example <code>00-0C-29-4B-1F-A2</code>.',
          m: 'Find your adapter (Wi-Fi or Ethernet) and read the <b>Physical Address</b> line, written with dashes, for example <code>00-0C-29-4B-1F-A2</code>. The shorter <code>getmac /v</code> lists just the addresses. Settings &gt; Network &amp; internet &gt; Wi-Fi &gt; your network &gt; Properties shows it as <b>Physical address (MAC)</b>.',
          e: '<b>Physical Address</b> under the adapter, dash-separated. <code>getmac /v</code> lists all adapters; <code>Get-NetAdapter | Select Name, MacAddress</code> in PowerShell shows the same, including the <b>LinkLayerAddress</b> the driver is actually using if one was administered.'
        } },
        { h: 'Linux', p: [{ s: 'Open a terminal and type:', m: 'In a terminal run:', e: 'Terminal:' }], cmd: 'ip link', after: {
          s: 'Read the <b>link/ether</b> line, for example <code>link/ether 00:0c:29:4b:1f:a2</code>. Ignore <code>lo</code>.',
          m: 'Each card is listed with a <b>link/ether</b> line, for example <code>link/ether 00:0c:29:4b:1f:a2</code>. The card names look like <code>eth0</code>, <code>ens33</code> or <code>wlan0</code>; ignore <code>lo</code>, the loopback, which has no real address. <code>cat /sys/class/net/eth0/address</code> prints just the address.',
          e: '<b>link/ether</b> per interface; <code>lo</code> has no hardware address. <code>ip -br link</code> is the compact form, <code>cat /sys/class/net/eth0/address</code> the scriptable one, and <code>ethtool -P eth0</code> prints the permanent (burned-in) address even when a different one is administered.'
        } },
        { h: 'macOS', p: [{ s: 'Open Terminal and type:', m: 'In Terminal run:', e: 'Terminal:' }], cmd: 'ifconfig en0 | grep ether', after: {
          s: 'The <b>ether</b> line is the address. Macs and phones often use a made-up address on Wi-Fi, so it may not match the one on the card.',
          m: '<code>en0</code> is the Wi-Fi card on a laptop; the <b>ether</b> line is the address. Or open System Settings &gt; Wi-Fi, click <b>Details...</b> next to your network, and look under <b>Hardware</b>. Note that macOS, iOS and Android use a made-up private address on Wi-Fi by default, so the one you see there may not be the one printed on the card.',
          e: '<code>en0</code> is normally Wi-Fi on a laptop; <code>networksetup -listallhardwareports</code> maps ports to interfaces and prints each <b>Ethernet Address</b>. With Private Wi-Fi Address on (the default since macOS 14 and iOS 14), the address in use is locally administered and differs from the BIA.'
        } }
      ]},
      { h: 'What a MAC address is not', p: {
        s: [
          'It is <b>not a location</b>. Your laptop keeps the same MAC address everywhere. An IP address is what says which network you are on ({{row:packet}}).',
          'It is <b>not secret</b>. It is in every frame, and any computer can change its own.',
          'The <b>internet never sees it</b>. It only reaches the machines on your own network.'
        ],
        m: [
          'It is <b>not a location</b>. Your laptop keeps the same MAC address at home, at school and in a cafe. Nothing in it says which network you are on, which is exactly why IP addresses exist ({{row:packet}}).',
          'It is <b>not secret and not proof of identity</b>. It is sent in the clear in every frame, and any operating system can change it with one command. Networks that "secure" themselves with a list of allowed MAC addresses are relying on a name badge anyone can copy.',
          'It is <b>not seen by the internet</b>. A MAC address lives inside the frame, and the frame is thrown away at every router. A website sees the MAC address of its own router and nothing further back. The only devices that ever see yours are the ones on your own LAN.'
        ],
        e: [
          '<b>Not a locator.</b> The address is topology-independent and identical on every network the interface joins; reaching a host across networks needs L3 addressing ({{row:packet}}).',
          '<b>Not an authenticator.</b> It is transmitted in cleartext in every frame header and trivially overridden (<code>ip link set dev eth0 address ...</code>, or the adapter\'s Network Address property on Windows). MAC allow-lists are a weak access control.',
          '<b>Not visible beyond the link.</b> Routers strip and rewrite the L2 header at every hop; a remote server sees only the MAC of its own last-hop router. Only hosts on your segment ever see yours.'
        ]
      }}
    ],
    lookForTitle: 'Things to try',
    lookFor: [
      { s: 'Find your own MAC address and look up its first three numbers in the table.', m: 'Find your own MAC address with the command for your system, then find the prefix in the table. If it is not there, a search for the first three bytes plus "OUI" will find the maker.', e: 'Resolve your own OUI against the table or the IEEE MA-L registry. If the second hex digit is 2, 6, A or E there is no vendor to find: the U/L bit is set.' },
      { s: 'On a phone, if the second character of the Wi-Fi address is 2, 6, A or E, the phone made it up.', m: 'On a phone, look at the Wi-Fi address in the network settings and check the second hex digit. A 2, 6, A or E means the phone made it up for this network.', e: 'Compare a phone\'s per-network Wi-Fi address with its hardware address in About: the per-network one is locally administered and changes per SSID.' },
      { s: 'On {{row:frame}}, open a packet and match its Source MAC to the table on the welcome page.', m: 'On {{row:frame}}, open any packet and compare the Source MAC in the Ethernet header with the addresses in the table on the welcome page.', e: 'On {{row:frame}}, read Source MAC in the Ethernet II header of any frame and match it to the host table on the welcome page; every lab address carries the VMware OUI 00:0c:29 or 00:50:56.' }
    ]
  },

  {
    id: 'frame',
    stack: 2,
    title: 'Frame',
    subtitle: 'MAC to MAC on the same LAN',
    file: FILES.frame,
    layer: {
      s: 'On your own network only. A frame goes from one card to another across one switch or one Wi-Fi network, and no further.',
      m: 'Layer 2 (Data link). A frame lives and dies on one link: one switch, one Wi-Fi network, one cable.',
      e: 'Layer 2 (IEEE 802.3 / 802.11). Scope is one link or bridged segment; the frame is consumed at the next hop.'
    },
    command: 'sudo python3 tools/rawframe.py send ens33 00:0c:29:7d:e3:5c "Hello Lab PC 2. ..."   then   ping -c 2 192.168.110.60',
    oneLiner: {
      s: 'A frame is the envelope your own network uses. It says who it is for, who sent it, what kind of thing is inside, then the contents, then a check number. Two machines on the same switch need nothing else to talk.',
      m: 'A frame is the envelope the LAN uses: destination MAC, source MAC, a type, the data, and a check number. Two machines on the same switch need nothing else to talk.',
      e: 'An Ethernet II frame is a 14-byte header (destination MAC, source MAC, EtherType), 46 to 1500 bytes of payload and a 4-byte CRC-32 FCS. On one link that is a complete delivery mechanism; IP is optional.'
    },
    sections: [
      { h: 'The envelope', p: {
        s: [
          'Everything on a wired or Wi-Fi network travels inside a <b>frame</b>, which always has five parts:'
        ],
        m: [
          'Everything that crosses an Ethernet or Wi-Fi network travels inside a <b>frame</b>. The frame is the outermost layer of every packet you have seen on the Protocols site, and it is the same five parts every time:'
        ],
        e: [
          'Every packet on an 802.3 link is carried in an Ethernet II frame with the same five fields. The 8-byte preamble and start-of-frame delimiter precede it on the wire and are never captured:'
        ]
      }, steps: [
        { s: '<b>Who it is for</b>: the MAC address of the card that should pick it up.', m: '<b>Destination MAC</b>, 6 bytes. The card that should pick this frame up. Every other card on the LAN sees it go by and ignores it.', e: '<b>Destination MAC</b>, 6 bytes. Unicast, or a group address if the I/G bit is set. NICs filter on this field in hardware unless in promiscuous mode.' },
        { s: '<b>Who sent it</b>.', m: '<b>Source MAC</b>, 6 bytes. The card that sent it, so the receiver knows where to send the answer.', e: '<b>Source MAC</b>, 6 bytes. Always unicast. Switches build their forwarding table from it.' },
        { s: '<b>What is inside</b>, so the receiver knows which part of the system should open it.', m: '<b>Type</b>, 2 bytes. What is inside: <code>0x0800</code> for an IPv4 packet, <code>0x0806</code> for ARP, <code>0x86dd</code> for IPv6. The receiver reads this to know which part of the operating system gets the contents.', e: '<b>EtherType</b>, 2 bytes, values of 0x0600 and above: <code>0x0800</code> IPv4, <code>0x0806</code> ARP, <code>0x86dd</code> IPv6, <code>0x8100</code> an 802.1Q VLAN tag. A value of 1500 or less is instead an 802.3 length field with LLC following.' },
        { s: '<b>The contents</b>. Short contents are padded with zeros, which is why so many packets are exactly 60 bytes.', m: '<b>Data</b>, 46 to 1500 bytes. Whatever is being carried. If it is shorter than 46 bytes, zeros are added to reach the minimum; that is why so many packets show as exactly 60 bytes.', e: '<b>Payload</b>, 46 to 1500 bytes (1500 is the default MTU). Shorter payloads are zero-padded to 46 so the frame reaches the 64-byte minimum including FCS; Wireshark shows the padding as a trailer.' },
        { s: '<b>A check number</b> added by the card. A damaged frame fails the check and is thrown away. Captures never show it.', m: '<b>Frame check sequence</b>, 4 bytes. A CRC-32 checksum the sending card calculates over the whole frame. The receiving card recalculates it and silently drops any frame that does not match. Cards strip it before handing the frame to the operating system, so it never appears in a capture: a 60-byte frame in Wireshark was 64 bytes on the wire.', e: '<b>FCS</b>, 4 bytes, CRC-32 over header and payload, computed and checked in NIC hardware. It is stripped before the driver sees the frame, so a 60-byte capture was 64 bytes on the wire, 72 with preamble and SFD, followed by a 12-byte inter-frame gap.' }
      ], anim: 'raw-frame', after: {
        s: [
          'Wi-Fi frames look different on the radio, but your computer converts them to this shape, so a capture on a laptop looks just like this.'
        ],
        m: [
          'On Wi-Fi the radio frame has a longer header with three or four addresses, but the operating system converts it to this Ethernet form before anything else sees it, so a capture on a laptop\'s Wi-Fi card looks exactly like this.'
        ],
        e: [
          '802.11 frames carry three or four address fields and a different header; the driver translates them to Ethernet II before the stack sees them, so a capture on a Wi-Fi interface outside monitor mode is Ethernet II.'
        ]
      }},
      { h: 'No IP address anywhere', p: {
        s: [
          'The first two packets were made by hand: two MAC addresses, a made-up type code, and a sentence. No IP address anywhere. Lab PC 2 received it and answered the same way.',
          'Here is the first one:'
        ],
        m: [
          'To prove that a frame needs nothing but MAC addresses, the first two packets in the capture were made with a small script that writes a frame by hand: destination MAC, source MAC, an experimental type code, and a sentence. No IP header, no port, no protocol on top. Lab PC 2 received it and answered the same way.',
          'Here is the first one. The Ethernet header is all there is; the data starts at byte 15:'
        ],
        e: [
          'Frames 1 and 2 were written through a raw AF_PACKET socket (<code>tools/rawframe.py</code>): destination, source, EtherType <code>0x88b5</code> (an IEEE value reserved for experiments), then ASCII. No L3 header, no port, no checksum beyond the FCS. Lab PC 2 replied on the same EtherType.',
          'Frame 1. The header is 14 bytes and the payload begins at offset 14:'
        ]
      }, packet: { file: FILES.frame, no: 1, note: 'a frame with nothing but MAC addresses in it' }, after: {
        s: [
          'The switch, the cards and the cable only ever look at MAC addresses. IP is just a passenger.'
        ],
        m: [
          'This is how a LAN works underneath IP. The switch, the cards and the cable never look at an IP address; they deliver frames by MAC address, and whatever is inside is not their business. IP is a passenger.'
        ],
        e: [
          'Switches, NICs and the medium forward on L2 fields only. Any network-layer protocol, or none, is opaque payload selected by EtherType; IP is one client of the link layer among many.'
        ]
      }},
      { h: 'How the switch delivers it', p: {
        s: [
          'A switch remembers which address was seen on which port. After the first two frames it knows both machines:'
        ],
        m: [
          'A switch has a table of which MAC address was last seen on which port. It fills the table by reading the <b>source</b> address of every frame that comes in, and it uses the table by reading the <b>destination</b> address of every frame it must send out. After the first two frames in the capture the switch knows both machines:'
        ],
        e: [
          'A learning bridge keeps a MAC address table (the CAM table) keyed by source address and ingress port, ageing entries after typically 300 s, and forwards on the destination address. After frames 1 and 2:'
        ]
      }, table: [
        ['Port', 'MAC address', 'How the switch learned it'],
        ['3', '00:0c:29:4b:1f:a2 (Student VM)', 'source address of frame 1'],
        ['7', '00:0c:29:7d:e3:5c (Lab PC 2)', 'source address of frame 2']
      ], after: {
        s: [
          'A frame to a known address goes out of one port only. A frame to an unknown address, or to everyone, is copied to every port. Frame 3 is a question for everyone.'
        ],
        m: [
          'A frame to a known address goes out of one port only; nobody else on the LAN even sees it. A frame to an address the switch has not learned yet, and every frame to the broadcast address <code>ff:ff:ff:ff:ff:ff</code>, is copied to every port. That is what frame 3, the ARP request, does: it has to reach everyone, because the sender does not know which port to ask. A Wi-Fi access point does the same job for the machines on its network, and a router does exactly the same for its own LAN-side port.'
        ],
        e: [
          'Known unicast is forwarded on one port. Unknown unicast, broadcast (<code>ff:ff:ff:ff:ff:ff</code>) and unregistered multicast are flooded to every port in the VLAN except the ingress port; frame 3, the ARP request, is flooded. An access point bridges its BSS the same way, and a router\'s LAN interface is one more station on the segment.'
        ]
      }},
      { h: 'When an IP packet rides inside', p: {
        s: [
          'Frames 3 to 8 are an ordinary ping to Lab PC 2, so now there is an IP packet inside each frame. First the VM asked everyone "who has 192.168.110.60?" (frame 3) and got the MAC address back (frame 4).',
          'In frame 5 the envelope and the letter inside both name Lab PC 2, because it is on the same network:'
        ],
        m: [
          'Frames 3 to 8 are an ordinary ping to Lab PC 2. Now there is an IP packet inside each frame, and the frame\'s Type field says <code>0x0800</code> so the receiver knows to hand the contents to IP. Before the first ping the Student VM had to ask "who has 192.168.110.60?" (frame 3, ARP, to everyone) and got "192.168.110.60 is at 00:0c:29:7d:e3:5c" (frame 4). Only then could it address the envelope.',
          'Look at the two sets of addresses in frame 5. The frame is addressed to Lab PC 2\'s MAC, and the packet inside is addressed to Lab PC 2\'s IP. Envelope and letter name the same machine, because it is on the same LAN:'
        ],
        e: [
          'Frames 3 to 8: ARP resolution (RFC 826) followed by four ICMP echo messages under EtherType <code>0x0800</code>. Frame 3 is a broadcast ARP request for 192.168.110.60; frame 4 the unicast reply carrying <code>00:0c:29:7d:e3:5c</code>, cached in the neighbour table before frame 5 is built.',
          'Frame 5: destination MAC and destination IP identify the same host because the destination is on-link, inside the same /23:'
        ]
      }, packet: { file: FILES.frame, no: 5, note: 'an IP packet inside a frame, both addressed to the same machine' }, after: {
        s: [
          '{{Row:packet}} changes one thing: the destination is on another network.'
        ],
        m: [
          '{{Row:packet}} changes exactly one thing: the destination moves to another network. The letter is addressed the same way, but the envelope is not.'
        ],
        e: [
          '{{Row:packet}} changes only the on-link test. With an off-link destination the L3 header is unchanged and the L2 destination becomes the gateway\'s MAC.'
        ]
      }}
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
      { s: 'Frames 1 and 2 show MAC addresses in the Source and Destination columns, because there is no IP address in them. Open one and read the sentence.', m: 'Frames 1 and 2: the Source and Destination columns show MAC addresses, because there is no IP address anywhere in these frames. Open one and read the sentence in the Data section.', e: 'Frames 1 and 2: Protocol column Ethernet, EtherType 0x88b5, Source and Destination are MAC addresses. The payload is ASCII at offset 14.' },
      { s: 'Frame 1 is 72 bytes: 14 of header and 58 of text.', m: 'Frame 1 is 72 bytes: 14 bytes of header and 58 of text. Frame 2 is 65. Neither needed padding.', e: 'Frame 1 is 72 bytes (14 + 58), frame 2 is 65 (14 + 51). Both exceed the 60-byte minimum, so no padding.' },
      { s: 'Frames 3 and 4 are exactly 60 bytes; the rest is padding.', m: 'Frames 3 and 4 are 60 bytes: 42 real bytes plus 18 zeros of padding to reach the Ethernet minimum.', e: 'Frames 3 and 4: 14 + 28 bytes of ARP = 42, padded with 18 zero bytes to the 60-byte minimum (64 with FCS).' },
      { s: 'Frame 3 goes to everyone; frame 4 comes straight back to the Student VM. Only the question is shouted.', m: 'Frame 3 goes to ff:ff:ff:ff:ff:ff (everyone); frame 4 comes straight back to 00:0c:29:4b:1f:a2. Only the question is broadcast.', e: 'Frame 3 destination ff:ff:ff:ff:ff:ff (flooded); frame 4 unicast to 00:0c:29:4b:1f:a2. Only the request is broadcast.' },
      { s: 'Frames 5 to 8: a ping inside an IP packet inside a frame, all addressed to Lab PC 2.', m: 'Frames 5 to 8: Type 0x0800 in the Ethernet header, then an IPv4 header, then ICMP. The destination MAC and the destination IP belong to the same machine, Lab PC 2.', e: 'Frames 5 to 8: EtherType 0x0800, IPv4 protocol 1, ICMP types 8 and 0, id 4321, seq 1 and 2, TTL 64 both ways (no router crossed). Destination MAC and destination IP belong to the same host.' }
    ]
  },

  {
    id: 'packet',
    stack: 3,
    title: 'Frame vs packet',
    subtitle: 'What changes when the destination is on another network',
    captures: [
      { file: FILES.lan, title: 'Captured on the Student VM, LAN side', hint: { s: 'The frames as they left the Student VM. Look at who frames 3 and 5 are addressed to.', m: 'The frames as they left the Student VM. Note the destination MAC of frames 3 and 5.', e: 'Captured on the Student VM\'s interface. Note the destination MAC of frames 3 and 5 versus their destination IP.' } },
      { file: FILES.far, title: 'Captured on the Lab Server, far side of the router', hint: { s: 'The same pings a moment later, on the other network. New envelopes, same letters.', m: 'The same pings a moment later, on the other network. New frames, same packets.', e: 'Captured on the Lab Server. Same IP datagrams after one forwarding hop: new L2 header, TTL decremented.' } }
    ],
    layer: {
      s: 'Two layers at once. The frame only goes as far as the next machine; the packet inside goes all the way.',
      m: 'Layer 2 carries layer 3. The frame is rebuilt at every router; the IP packet inside travels end to end.',
      e: 'L2 carries L3. The frame is terminated and regenerated at each router; the IPv4 header (RFC 791) is forwarded end to end with TTL decremented and the header checksum recomputed per hop.'
    },
    command: 'ping -c 2 10.10.20.5   (captured on the Student VM and on the Lab Server at the same time)',
    oneLiner: {
      s: 'The IP address says where the packet must finally end up. The MAC address says which machine gets it next. On one network those are the same machine. Across a router they are not.',
      m: 'The IP address says where the packet must end up. The MAC address says which machine gets it next. On one LAN those are the same machine; across a router they are not.',
      e: 'IP addresses are end-to-end identifiers; MAC addresses are next-hop identifiers. On-link, both name the destination host. Off-link, the L2 destination is the gateway resolved by ARP and the L3 destination is unchanged.'
    },
    sections: [
      { h: 'Two addresses, two jobs', p: {
        s: [
          'The <b>IP address</b> is written on the parcel: where it must finally go. The <b>MAC address</b> is the number plate of the van carrying it right now. The parcel changes vans at every depot.',
          'The frame is the van and the packet is the parcel:'
        ],
        m: [
          'Think of a parcel. The <b>IP address</b> is the address written on the parcel: it names the final destination and it does not change on the way. The <b>MAC address</b> is the number plate of the van the parcel is riding in right now. The parcel changes vans at every depot, and each van only drives one leg of the trip.',
          'The frame is the van; the packet is the parcel. Everything about them follows from that:'
        ],
        e: [
          'L3 addressing is end-to-end and invariant across hops (NAT aside); L2 addressing is per-link and rewritten at every router. The frame is the hop-by-hop container, the packet the end-to-end payload:'
        ]
      }, table: [
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
      { h: 'The sender\'s decision', p: {
        s: [
          'Before sending, the Student VM asks one question: <b>is the destination on my network?</b>',
          'On {{row:frame}} it was, so the frame went straight to that machine. Here it is not, so the VM asks for the <b>router\'s</b> MAC address (frames 1 and 2) and hands the frame to the router, while the packet inside still names the Lab Server:'
        ],
        m: [
          'The Student VM is 192.168.110.50 with mask 255.255.254.0, so its network is 192.168.110.0 to 192.168.111.255. Before sending a packet it asks one question: <b>is the destination inside my network?</b>',
          'On {{row:frame}} the answer was yes (192.168.110.60), so it asked ARP for that machine\'s MAC and addressed the frame straight to it. Here the answer is no (10.10.20.5), so it asks ARP for the <b>gateway\'s</b> MAC instead (frames 1 and 2) and addresses the frame to the gateway, while the packet inside still says 10.10.20.5:'
        ],
        e: [
          '192.168.110.50/23 covers 192.168.110.0 to 192.168.111.255. The on-link test is <code>(dst &amp; mask) == (src &amp; mask)</code>.',
          'On {{row:frame}} 192.168.110.60 passed, so ARP resolved the destination itself. 10.10.20.5 fails, so the routing table selects the default gateway 192.168.110.1, ARP resolves that (frames 1 and 2), and the frame is addressed to <code>00:50:56:c0:00:01</code> with the destination IP 10.10.20.5 untouched:'
        ]
      }, anim: 'packet-in-frame', table: [
        ['', 'Ping to Lab PC 2 ({{row:frame}})', 'Ping to the Lab Server (this row)'],
        ['Destination IP', '192.168.110.60', '10.10.20.5'],
        ['Inside 192.168.110.0/23?', 'yes', 'no'],
        ['ARP asks for', '192.168.110.60', '192.168.110.1, the gateway'],
        ['Destination MAC', '00:0c:29:7d:e3:5c (Lab PC 2)', '00:50:56:c0:00:01 (gateway)'],
        ['Who opens the envelope', 'Lab PC 2, the final destination', 'the gateway, which reads the IP address and makes a new envelope']
      ]},
      { h: 'The same packet on both sides of the router', p: {
        s: [
          'Both captures were taken at the same moment, one at each end. Frame 3 in each is the first ping. Yellow rows changed on the way; green rows did not:'
        ],
        m: [
          'The two captures on this row were taken at the same moment on the two ends of the trip. Frame 3 in each is the first Echo Request. Here they are field by field. Yellow rows changed on the way through the router; green rows did not:'
        ],
        e: [
          'Frame 3 of each capture is the same IP datagram before and after one forwarding hop. Yellow: rewritten by the router. Green: forwarded unchanged:'
        ]
      }, compare: { a: { file: FILES.lan, no: 3, label: 'LAN side (Student VM)' }, b: { file: FILES.far, no: 3, label: 'Far side (Lab Server)' } }, after: {
        s: [
          'The envelope is brand new: the router wrote another from its own far-side card to the Lab Server, after asking the far network who that was (frames 1 and 2 of the second capture). The parcel inside is the same, except a counter that goes down by one at each router.',
          'The reply makes the same trip backwards.'
        ],
        m: [
          'Everything in the Ethernet header is new: the router threw the first frame away and built another with its own far-side card as the source and the Lab Server as the destination. To do that it first ran ARP on the far network (frames 1 and 2 of the second capture). Everything in the IP packet is the same except the <b>TTL</b>, which the router lowered from 64 to 63; that is how the packet counts the routers it has crossed, and how it is stopped if it ever goes round in circles. The ICMP message inside was not touched at all.',
          'The reply makes the same trip backwards: the Lab Server sends it in a frame addressed to the router\'s far-side card (00:50:56:c0:00:08), and the Student VM receives it in a frame from the router\'s LAN-side card (00:50:56:c0:00:01), with the TTL now 63.'
        ],
        e: [
          'Router forwarding (RFC 1812): strip the ingress L2 header, decrement TTL 64 to 63, recompute the IP header checksum, look up 10.10.20.5, resolve <code>00:0c:29:a1:b2:c3</code> by ARP on the egress interface (frames 1 and 2 of the second capture), re-encapsulate with source <code>00:50:56:c0:00:08</code>. Identification 0x5e21, ICMP id 5150, seq 1 and the 56-byte payload are byte-identical.',
          'The reply is forwarded symmetrically: L2 destination 00:50:56:c0:00:08 on the far side, L2 source 00:50:56:c0:00:01 on the LAN side, TTL 64 to 63.'
        ]
      }},
      { h: 'Why the internet never sees your MAC address', p: {
        s: [
          'A packet to a website passes through ten or twenty routers, and each one writes a new envelope. Your MAC address was gone at the first hop.',
          'The rule: <b>MAC addresses change at every hop, IP addresses do not.</b>'
        ],
        m: [
          'A packet to a website crosses ten or twenty routers. Each one repeats what you just saw: open the envelope, read the address on the parcel, subtract one from the TTL, put the parcel in a new envelope for the next hop. The web server receives a frame whose source MAC is its own router\'s. Your MAC address was gone at hop one.',
          'The lab router forwards the packet honestly, so the IP addresses in the two captures match. A home router does one more thing on the way out to the internet: it swaps your private 192.168 address for its public one (NAT), which is a different lesson. Inside a network like this one, the rule holds exactly: <b>MAC addresses change at every hop, IP addresses do not.</b>'
        ],
        e: [
          'Each of the ten to twenty hops to a public server repeats the forwarding cycle; the server sees a source MAC belonging to its own last-hop router. The originating MAC is carried in no L3 field and is unrecoverable past hop one.',
          'The lab router forwards without translation, so the L3 addresses match in both captures. A home router additionally applies NAPT (RFC 3022) on egress. Inside this lab the invariant is exact: <b>L2 addresses change per hop, L3 addresses do not.</b>'
        ]
      }}
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
      { s: 'First capture, frame 1: the VM asks for the router\'s MAC address, not the server\'s.', m: 'First capture, frame 1: the VM asks for the gateway\'s MAC, not the server\'s. It knows 10.10.20.5 is not on its network.', e: 'First capture, frame 1: ARP target 192.168.110.1, not 10.10.20.5. The off-link decision was made before any frame was sent.' },
      { s: 'First capture, frame 3: the frame goes to the router, the packet inside goes to the server.', m: 'First capture, frame 3: destination MAC 00:50:56:c0:00:01 (the gateway) but destination IP 10.10.20.5 (the server). The envelope and the parcel name different machines.', e: 'First capture, frame 3: destination MAC 00:50:56:c0:00:01 (next hop) versus destination IP 10.10.20.5 (end host).' },
      { s: 'Second capture, frames 1 and 2: the router asks the far network for the server\'s MAC address.', m: 'Second capture, frames 1 and 2: the router asks ARP on the far network, just as the VM did on the LAN.', e: 'Second capture, frames 1 and 2: the router\'s egress ARP from 00:50:56:c0:00:08 / 10.10.20.1, answered by 00:0c:29:a1:b2:c3.' },
      { s: 'Frame 3 in both captures: same IP addresses, same ping, different MAC addresses, counter 64 then 63.', m: 'Frame 3 in both captures: same source and destination IP, same Identification 0x5e21, same ICMP id 5150 and seq 1, same 56 data bytes. Different MAC addresses, TTL 64 then 63.', e: 'Frame 3 in both captures: identical IP identification 0x5e21, ICMP id 5150, seq 1 and 56-byte payload; TTL 64 then 63, and a different IP header checksum because of it. Both L2 addresses differ.' },
      { s: 'The replies: the counter is 64 in the second capture and 63 in the first. The reply crossed the router too.', m: 'The replies: TTL 64 in the second capture, 63 in the first. The reply crossed the router too.', e: 'Replies: TTL 64 at the Lab Server, 63 at the Student VM; IP identification 0x2b74 and 0x2b75, unchanged across the hop.' }
    ]
  },

  {
    id: 'ipv6',
    stack: 3,
    title: 'IPv6',
    subtitle: 'Bigger addresses, same frames, no ARP',
    file: FILES.ipv6,
    layer: {
      s: 'The same job as IPv4: the address that goes all the way. It rides inside exactly the same frames.',
      m: 'Layer 3 (Network), like IPv4. It rides in exactly the same Ethernet frames, with type 0x86dd instead of 0x0800.',
      e: 'Layer 3 (RFC 8200). Same Ethernet II framing with EtherType 0x86dd. Neighbor Discovery (RFC 4861) replaces ARP and SLAAC (RFC 4862) replaces DHCP for addressing.'
    },
    command: 'ping -c 2 2001:db8:110::1   (right after the network card came up)',
    oneLiner: {
      s: 'IPv6 is IPv4 with much longer addresses, so every device in the world can have its own, plus a tidier way of finding the router and the neighbours.',
      m: 'IPv6 is IPv4 with room to breathe: addresses four times as long, so every device can have its own, and a tidier way to find routers and neighbours.',
      e: '128-bit addresses (RFC 4291), a fixed 40-byte header, no broadcast, and neighbour and router discovery folded into ICMPv6. Framing and forwarding are otherwise identical to IPv4.'
    },
    sections: [
      { h: 'Why there is a version 6', p: {
        s: [
          'IPv4 addresses ran out: there are only about four billion, and far more devices. Home networks cope by sharing one address between everything in the house.',
          'IPv6 addresses are four times longer, so every device can have its own. Most networks run both today, and your phone on mobile data is probably using IPv6 right now.'
        ],
        m: [
          'IPv4 addresses are 32 bits, which allows about 4.3 billion of them. That ran out: the central pool was emptied in 2011 and the regional pools followed. Home networks cope by sharing one public address between many devices (NAT), which works but makes every device a second-class citizen that cannot be reached directly.',
          'IPv6 addresses are <b>128 bits</b>: 340 undecillion of them, enough to give every device on Earth its own reachable address many times over. Today the two versions run side by side on most networks ("dual stack"). Close to half of the traffic reaching large sites such as Google already arrives over IPv6, and your phone on mobile data is very likely using it right now.'
        ],
        e: [
          'IPv4\'s 32-bit space (about 4.3 billion addresses) was exhausted at IANA in 2011 and at the regional registries after it; NAPT sharing broke end-to-end reachability. IPv6 (RFC 8200) uses 128-bit addresses, about 3.4 &times; 10<sup>38</sup>.',
          'Deployment is dual-stack (RFC 4213) almost everywhere. Close to half of client traffic to Google arrives over IPv6, and mobile carriers are largely IPv6-only with 464XLAT for legacy destinations.'
        ]
      }},
      { h: 'Reading an address', p: {
        s: [
          'An IPv6 address is eight groups of hex digits separated by colons. Leading zeros are dropped, and one run of zero groups can become a double colon. The Student VM\'s address, in full:'
        ],
        m: [
          '128 bits are written as eight groups of four hex digits separated by colons. Two rules make them shorter: leading zeros in a group are dropped, and one run of all-zero groups may be replaced by <code>::</code>. This is the Student VM\'s address, in full:'
        ],
        e: [
          '128 bits as eight 16-bit hex groups (RFC 4291). Canonical text form per RFC 5952: strip leading zeros, compress the longest run of zero groups (the leftmost if tied) to <code>::</code>, lowercase. The Student VM\'s address uncompressed:'
        ]
      }, anatomy: { kind: 'ip6', value: '2001:0db8:0110:0000:020c:29ff:fe4b:1fa2', left: 'the network prefix, the same for every machine on this LAN. The router announces it (see below)', right: 'the interface identifier, which names this card within the network' }, after: {
        s: [
          'Written short it is <code>2001:db8:110:0:20c:29ff:fe4b:1fa2</code>, and the gateway is <code>2001:db8:110::1</code>.',
          'The second half is the VM\'s MAC address with a bit added in the middle: the network gives the first half, the machine makes the second. Most phones and laptops use a random second half instead.'
        ],
        m: [
          'Written short it is <code>2001:db8:110:0:20c:29ff:fe4b:1fa2</code>, and the gateway <code>2001:0db8:0110:0000:0000:0000:0000:0001</code> collapses to <code>2001:db8:110::1</code>. The <code>::</code> may be used once per address, otherwise you could not tell how many zero groups it stands for.',
          'Look closely at the second half: <code>020c:29ff:fe4b:1fa2</code>. It is the VM\'s MAC address, <code>00:0c:29:4b:1f:a2</code>, with <code>ff:fe</code> inserted in the middle and one bit flipped in the first byte. This is the <b>EUI-64</b> rule, the original way a machine made its own IPv6 address. Most laptops and phones now use a random second half instead, so that the address does not reveal the card, but the idea is the same: the network gives you the first half, you make up the second.',
          '<code>2001:db8::/32</code> is the prefix reserved for documentation and labs, which is why it is used here. On your own network the prefix will be whatever your internet provider hands the router.'
        ],
        e: [
          'Compressed: <code>2001:db8:110:0:20c:29ff:fe4b:1fa2</code>; the gateway <code>2001:0db8:0110:0000:0000:0000:0000:0001</code> becomes <code>2001:db8:110::1</code>. <code>::</code> is permitted once per address.',
          'The interface identifier <code>020c:29ff:fe4b:1fa2</code> is the modified EUI-64 (RFC 4291 appendix A, RFC 7042) of <code>00:0c:29:4b:1f:a2</code>: insert <code>ff:fe</code> between OUI and serial, invert the U/L bit (0x02). Most hosts now use stable-privacy (RFC 7217) or temporary (RFC 8981) identifiers instead.',
          '<code>2001:db8::/32</code> is reserved for documentation (RFC 3849). Production prefixes are delegated by the ISP, typically a /56 or /48 per site and a /64 per link.'
        ]
      }},
      { h: 'One card, several addresses', p: {
        s: [
          'An IPv6 card always has several addresses, each for a different job:'
        ],
        m: [
          'An IPv4 card usually has one address. An IPv6 card always has several, each with a job:'
        ],
        e: [
          'An IPv6 interface holds several addresses of different scope (RFC 4291 section 2.1); all of these appear in the capture:'
        ]
      }, table: [
        ['Address', 'Prefix', 'Where it comes from', 'What it is for'],
        ['fe80::20c:29ff:fe4b:1fa2', 'fe80::/10, link-local', 'made by the card itself the moment it comes up, no router needed', 'talking on this LAN only: finding the router, neighbour discovery. Every IPv6 card has one'],
        ['2001:db8:110:0:20c:29ff:fe4b:1fa2', '2001:db8:110::/64, global', 'prefix from the router, second half made by the machine (SLAAC)', 'talking to anywhere: the everyday address'],
        ['ff02::1', 'ff00::/8, multicast', 'fixed by the standard', '"all nodes on this link". The router uses it to announce the prefix'],
        ['ff02::1:ff4b:1fa2', 'solicited-node multicast', 'the last 24 bits of your own address', 'the group a card listens to so neighbours can find it without waking everyone up']
      ], after: {
        s: [
          'IPv6 has no "everyone" address. A machine talks to a group instead, and cards ignore groups they have not joined.'
        ],
        m: [
          'There is <b>no broadcast in IPv6</b>. Everything that IPv4 broadcasts, IPv6 multicasts to a group, and the Ethernet frame goes to a group MAC address that starts with <code>33:33</code> followed by the last four bytes of the IPv6 address. Cards ignore groups they have not joined, so a chatty network no longer interrupts every machine on it.'
        ],
        e: [
          'IPv6 has <b>no broadcast</b>. Link-scope multicast (<code>ff02::/16</code>) replaces it, and the frame destination is <code>33:33</code> followed by the low 32 bits of the group address (RFC 2464). NICs filter multicast in hardware, so hosts not subscribed to a group never process the frame.'
        ]
      }},
      { h: 'Finding the router and the neighbour, without ARP', p: {
        s: [
          'The first four packets happen by themselves when the card comes up. They do the jobs of DHCP and ARP:'
        ],
        m: [
          'The first four packets in the capture happen automatically when the card comes up, and they replace both DHCP and ARP:'
        ],
        e: [
          'Frames 1 to 4 are Neighbor Discovery (RFC 4861) and SLAAC (RFC 4862), replacing DHCP and ARP:'
        ]
      }, steps: [
        { s: '<b>Frame 1.</b> The VM asks all routers: is there a router here?', m: '<b>Router Solicitation</b> (frame 1). The VM, using only its link-local address, asks <code>ff02::2</code> (all routers): is there a router here?', e: '<b>Router Solicitation</b> (ICMPv6 type 133), frame 1: source <code>fe80::20c:29ff:fe4b:1fa2</code>, destination <code>ff02::2</code>, hop limit 255, with a source link-layer address option.' },
        { s: '<b>Frame 2.</b> The router answers: here is the prefix, make your own address from it, use me as the way out. No lease, no server.', m: '<b>Router Advertisement</b> (frame 2). The gateway answers to <code>ff02::1</code> (all nodes): I am a router, the prefix here is <code>2001:db8:110::/64</code>, make yourself an address from it, and use me as your gateway for the next 1800 seconds. The VM builds its global address on the spot. This is <b>SLAAC</b>, stateless address autoconfiguration: no lease, no server, no DHCP.', e: '<b>Router Advertisement</b> (type 134), frame 2: destination <code>ff02::1</code>, router lifetime 1800 s, MTU option 1500, Prefix Information option <code>2001:db8:110::/64</code> with the A (autonomous) and L (on-link) flags. The host forms its global address by SLAAC; no DHCPv6 is involved.' },
        { s: '<b>Frame 3.</b> The VM needs the router\'s MAC address, so it asks a small group that only the router listens to.', m: '<b>Neighbor Solicitation</b> (frame 3). To ping the gateway the VM needs its MAC address. Instead of an ARP broadcast it sends an ICMPv6 message to the gateway\'s solicited-node group <code>ff02::1:ff00:1</code>, frame address <code>33:33:ff:00:00:01</code>. Only cards whose address ends in <code>00:00:01</code> even look at it.', e: '<b>Neighbor Solicitation</b> (type 135), frame 3: target <code>2001:db8:110::1</code>, destination the solicited-node group <code>ff02::1:ff00:1</code> (RFC 4291 section 2.7.1), frame destination <code>33:33:ff:00:00:01</code>, with the sender\'s link-layer address option.' },
        { s: '<b>Frame 4.</b> The router answers straight back with its MAC address. Same job as an ARP reply.', m: '<b>Neighbor Advertisement</b> (frame 4). The gateway replies straight back: <code>2001:db8:110::1</code> is at <code>00:50:56:c0:00:01</code>. Same job as an ARP reply, done inside ICMPv6 rather than as a separate protocol.', e: '<b>Neighbor Advertisement</b> (type 136), frame 4: R, S and O flags set, target <code>2001:db8:110::1</code>, target link-layer address option <code>00:50:56:c0:00:01</code>, unicast to the VM.' }
      ], after: {
        s: [
          'Then comes the ping itself, frames 5 to 8, which looks almost exactly like the IPv4 ping on {{row:frame}}:'
        ],
        m: [
          'Then the ping itself, frames 5 to 8, which looks almost exactly like the IPv4 ping on {{row:frame}}. ICMPv6 type 128 is the Echo Request and 129 the Echo Reply, instead of 8 and 0:'
        ],
        e: [
          'Frames 5 to 8: Echo Request type 128 and Echo Reply type 129 (RFC 4443), hop limit 64, identifier 0x2a1f, compared with the IPv4 ping on {{row:frame}}:'
        ]
      }, anim: 'ipv6-ping' },
      { h: 'The header, side by side', p: {
        s: [
          'The IPv6 header is twice as big, entirely because of the longer addresses, and simpler everywhere else:'
        ],
        m: [
          'The IPv6 header is twice the size of the IPv4 header, entirely because of the addresses, and simpler everywhere else:'
        ],
        e: [
          'The fixed 40-byte IPv6 header against the 20-byte minimum IPv4 header:'
        ]
      }, table: [
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
      ], after: {
        s: [
          'Everything from {{row:packet}} still holds: a new frame at every router, the same packet all the way, the hop counter down by one each time.'
        ],
        m: [
          'Everything from {{row:packet}} still holds. The frame is thrown away at every router, the packet travels end to end, and the hop limit counts down. IPv6 changed the addresses and tidied the housekeeping; it did not change the picture.'
        ],
        e: [
          'Forwarding semantics from {{row:packet}} are unchanged: per-hop L2 re-encapsulation, end-to-end L3 header, hop limit decremented per router. Routers no longer fragment (path MTU discovery, RFC 8201) or recompute a header checksum.'
        ]
      }}
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
      { s: 'Frame 1 comes from a temporary address starting fe80. By frame 3 the VM is using the full address it built from the router\'s answer.', m: 'Frame 1 comes from a link-local address, fe80::..., because the VM has no other address yet. Frame 3 already comes from the global address it built from the prefix in frame 2.', e: 'Frame 1 source fe80::20c:29ff:fe4b:1fa2 (link-local, formed without a router). Frame 3 source 2001:db8:110:0:20c:29ff:fe4b:1fa2, formed by SLAAC from the prefix advertised in frame 2.' },
      { s: 'Open frame 2 and find the prefix the router hands out. That one packet does the job of a DHCP lease.', m: 'Open frame 2 and find the prefix option, the MTU option and the router lifetime. That single packet replaces a DHCP lease.', e: 'Frame 2: Prefix Information option 2001:db8:110::/64, MTU option 1500, router lifetime 1800 s. One RA replaces the DHCP lease.' },
      { s: 'Frames 1 to 4 have the hop counter at 255, which proves they did not come through a router.', m: 'Frames 1 to 4 have hop limit 255. Neighbour discovery messages must arrive with 255 untouched, which proves they did not cross a router.', e: 'Frames 1 to 4: hop limit 255. ND requires received hop limit 255 (RFC 4861 section 3), proving the packet was not forwarded.' },
      { s: 'Frames 1 to 3 go to group addresses starting 33:33. Nothing here goes to everyone.', m: 'The destination MAC of frames 1 to 3 starts with 33:33, and its last four bytes are the last four bytes of the IPv6 destination. No frame in this capture goes to ff:ff:ff:ff:ff:ff.', e: 'Frames 1 to 3: destination MAC 33:33 plus the low 32 bits of the IPv6 group (33:33:00:00:00:02, 33:33:00:00:00:01, 33:33:ff:00:00:01). No broadcast frame exists in the capture.' },
      { s: 'Frames 5 to 8: the same ping as {{row:frame}}, each frame 20 bytes longer because of the bigger header.', m: 'Frames 5 to 8: the same four-packet ping as {{row:frame}}, with types 128 and 129, hop limit 64, and a 40-byte IP header instead of 20. Every frame is 118 bytes rather than 98: exactly the 20 extra bytes of header.', e: 'Frames 5 to 8: ICMPv6 types 128 and 129, id 0x2a1f, hop limit 64, 40-byte header. 118 bytes per frame versus 98 for the IPv4 ping on {{row:frame}}: the 20-byte header difference exactly.' }
    ]
  },

  {
    id: 'stack',
    stack: 'stack',
    title: 'How a packet is built',
    subtitle: 'Every layer in one frame, and which order they go on',
    file: FILES.stack,
    layer: {
      s: 'All of them at once. One small web request shows the Ethernet frame, the IP packet, the TCP segment and the text of the request, one inside the other.',
      m: 'Layers 2, 3, 4 and 7 in a single frame: Ethernet carrying IPv4 carrying TCP carrying HTTP. Layers 5 and 6 of the OSI model have no header of their own here; in a capture they are simply part of the application data.',
      e: 'Ethernet (L2) / IPv4 (L3) / TCP (L4) / HTTP (L7). TCP/IP has four layers; the OSI session and presentation layers never appear as separate headers in a capture.'
    },
    command: 'curl http://10.10.20.5/hello.txt   (captured on the Student VM)',
    oneLiner: {
      s: 'A packet is built like a parcel packed inside a bigger parcel: the message goes in first, and each layer wraps its own label around the outside.',
      m: 'Sending works from the top down. The application hands its data to TCP, TCP adds a header, IP adds a header in front of that, and Ethernet adds the last one. So the bytes on the wire read from the bottom up: Ethernet first, HTTP last.',
      e: 'Encapsulation is top-down at the sender and bottom-up at the receiver. Each layer prepends its header to the PDU it was handed, so the wire order is the reverse of the build order: Ethernet, IP, TCP, then the application bytes.'
    },
    sections: [
      { h: 'Built from the top down', p: {
        s: [
          'Think of sending a letter through a company mail room. You write the letter (the message). The mail room puts it in an envelope with the department name (that is TCP). The post office puts that in a bigger envelope with the street address (IP). The courier puts everything in a van that only needs to know the next stop (Ethernet).',
          'Each helper wraps its own label around the outside of what it was given, so the last label added is the first one you see on the outside. The animation below builds one real web request that way.'
        ],
        m: [
          'The OSI model is usually drawn with layer 7 at the top and layer 1 at the bottom, and that is the order a packet is built in. The application writes its data. TCP takes those bytes and puts its 20-byte header in front. IP takes the whole TCP segment and puts its 20-byte header in front of that. The network driver puts the 14-byte Ethernet header in front of everything, and the card appends the 4-byte check at the very end.',
          'Each layer only ever wraps what it was handed. It never looks inside, and it never changes the order of the layers above it. This is <b>encapsulation</b>, and the animation below does it to a real request from this capture: <code>GET /hello.txt</code> from the Student VM to the Lab Server.'
        ],
        e: [
          'Encapsulation order at the sender: the application writes 82 bytes of HTTP; TCP prepends a 20-byte header (no options after the handshake); IP prepends a 20-byte header (IHL 5); the driver prepends the 14-byte Ethernet header and the NIC appends the 4-byte FCS. Each layer treats the PDU above it as opaque payload.',
          'In practice the kernel reserves headroom in one buffer and each layer writes its header into the space in front of the payload, so nothing is copied, but the result is byte-for-byte the same as building it in stages.'
        ]
      }, anim: 'stack-build', after: {
        s: [
          'Notice that the envelope on the outside is the smallest-minded one: Ethernet only knows the next machine along, the router. The street address that says where the letter is really going, and the name of the department, are both inside.'
        ],
        m: [
          'The 14 + 20 + 20 bytes of headers are the price of every packet, which is why the small request below is 136 bytes on the wire for 82 bytes of text. Frames 1 to 3 are the TCP handshake with no data at all: 60 bytes each, and 6 of those are padding to reach the Ethernet minimum.'
        ],
        e: [
          'Frame 4 is 136 bytes captured: 14 + 20 + 20 + 82. The three handshake segments carry 40 bytes of IP + TCP (44 with the MSS option in the SYNs) and are padded to the 60-byte Ethernet minimum; Wireshark shows the padding as trailer bytes after the IP total length.'
        ]
      }},
      { h: 'Read from the bottom up', p: {
        s: [
          'Because the labels were added outside-in, the network reads them inside-out. A switch reads only the outer label. A router opens one layer and reads the street address. Only the Lab Server opens everything and reads the message. Here is frame 4 with all its layers:'
        ],
        m: [
          'On the wire the layers appear in the reverse order from the way they were built, and every device reads only as far as it needs to. A switch reads the Ethernet header. The router opens the frame, reads the IP header and rebuilds the frame for the next link ({{row:packet}}). Only the Lab Server opens the TCP header and hands the text to its web server. Open frame 4 and read it top to bottom; that is the wire order:'
        ],
        e: [
          'Wire order is Ethernet, IPv4, TCP, HTTP. Each header names the next one: EtherType 0x0800 selects IPv4, IP protocol 6 selects TCP, destination port 80 selects the web server. Frame 4 decoded, in wire order:'
        ]
      }, packet: { file: FILES.stack, no: 4, note: 'Frame 4: the GET request. Read it from the top: Ethernet, then IP, then TCP, then the HTTP text.' }, table: [
        ['OSI layer', 'TCP/IP layer', 'In this frame', 'Who reads it'],
        ['7 Application, 6 Presentation, 5 Session', 'Application', { s: 'the request text, GET /hello.txt', m: 'the 82 bytes of HTTP text. Layers 5 and 6 have no separate header; in a capture they are simply part of the application data', e: '82 bytes of HTTP/1.1. No session or presentation header exists on the wire; those OSI layers are folded into the application' }, 'the web server'],
        ['4 Transport', 'Transport', { s: 'TCP: which program, and a running count so nothing gets lost', m: 'TCP header, 20 bytes: ports 51234 → 80, sequence and acknowledgement numbers, flags PSH ACK', e: 'TCP, 20 bytes: sport 51234, dport 80, seq 1 (relative), ack 1, flags 0x018 (PSH, ACK), window 64240, checksum over the pseudo-header' }, 'the Lab Server'],
        ['3 Network', 'Internet', { s: 'IP: the real from and to addresses', m: 'IPv4 header, 20 bytes: 192.168.110.50 → 10.10.20.5, protocol 6 = TCP, TTL 64', e: 'IPv4, 20 bytes: IHL 5, total length 122, DF set, TTL 64, protocol 6, header checksum, src 192.168.110.50, dst 10.10.20.5' }, 'every router, and the Lab Server'],
        ['2 Data link', 'Link', { s: 'Ethernet: the address of the next machine along, the router', m: 'Ethernet header, 14 bytes: to the gateway\'s MAC 00:50:56:c0:00:01, from 00:0c:29:4b:1f:a2, type 0x0800 = IPv4', e: 'Ethernet II, 14 bytes: dst 00:50:56:c0:00:01 (gateway), src 00:0c:29:4b:1f:a2, EtherType 0x0800. FCS not in the capture' }, 'the switch and the router'],
        ['1 Physical', 'Link', { s: 'the electrical signals on the cable or the radio', m: 'the bits as voltages on the cable or radio symbols in the air. Nothing of layer 1 is in a capture file', e: 'not captured. The NIC hands the driver the frame after the preamble, SFD and FCS have been consumed' }, 'the cable and the cards']
      ]},
      { h: 'Unwrapped at the other end', p: {
        s: [
          'The Lab Server takes the parcel apart in the opposite order, outside first:'
        ],
        m: [
          'Receiving is the same steps run backwards. The Lab Server strips one header at a time from the outside in, and each header tells it who to hand the rest to:'
        ],
        e: [
          'De-encapsulation on the Lab Server, bottom-up. Each header\'s demultiplexing field selects the next handler:'
        ]
      }, steps: [
        { s: 'The card checks the outer label is for it and removes the Ethernet wrapper.', m: 'The network card sees its own MAC address as the destination, checks the FCS, strips the Ethernet header and passes the rest up because the type field said IPv4.', e: 'NIC: dst MAC matches, FCS good, strip 14 bytes. EtherType 0x0800 → IPv4 input.' },
        { s: 'IP checks the street address is its own and removes its wrapper.', m: 'IP sees 10.10.20.5, its own address, checks the header checksum, strips 20 bytes and hands the rest to TCP because the protocol field is 6.', e: 'IP: dst 10.10.20.5 is local, header checksum ok, strip 20 bytes. Protocol 6 → TCP input.' },
        { s: 'TCP checks the department name, port 80, and removes its wrapper.', m: 'TCP matches port 80 and the connection set up in frames 1 to 3, checks the sequence number is the one it expects, strips 20 bytes and queues the 82 bytes for the web server.', e: 'TCP: 4-tuple matches the established socket, seq in window, checksum ok, strip 20 bytes, deliver 82 bytes to the socket receive queue, schedule an ACK.' },
        { s: 'The web server reads the message and answers. Its answer is wrapped up the same way and sent back (frame 5).', m: 'The web server reads <code>GET /hello.txt</code> and answers. Its reply goes through the same wrapping on the way out, which is frame 5 in the capture.', e: 'nginx parses the request line and headers, writes a 162-byte response; the reply is encapsulated identically (frame 5, PSH ACK, seq 1, ack 83).' }
      ], after: {
        s: [
          'The router in the middle only unwrapped one layer, read the street address, and put everything in a fresh outer envelope for the next road. That is the whole story of {{row:packet}}.'
        ],
        m: [
          'The router along the way did only the first step and a half: it stripped the Ethernet header, read the IP destination, took one off the TTL, and built a new Ethernet header for the far network. It never looked at TCP or HTTP. That is exactly what {{row:packet}} showed with a ping.'
        ],
        e: [
          'The router terminates layer 2 only: strip Ethernet, decrement TTL, recompute the IP header checksum, re-encapsulate for the egress link. TCP and HTTP pass through untouched, as in {{row:packet}}.'
        ]
      }},
      { h: 'Can you skip IP entirely?', p: {
        s: [
          'Yes, as long as both machines are plugged into the same network. {{Row:frame}} sent a message using only MAC addresses, and it worked. Real things do this all the time: ARP itself, the messages switches use to find each other, and a lot of factory equipment.',
          'The catch is that a frame cannot leave the local network. There is no street address in it, so no router can carry it further. That is the whole reason IP exists: it is the layer that works between networks, not just inside one.'
        ],
        m: [
          'Yes. A frame needs nothing but two MAC addresses and a type code, and {{row:frame}} proved it with a frame of type 0x88b5 carrying plain text. Plenty of real protocols live entirely at layer 2: ARP ({{row:packet}}, frames 1 and 2), LLDP, which switches use to tell each other who they are, the spanning-tree messages that stop switch loops, PPPoE discovery, and industrial protocols such as EtherCAT and PROFINET that skip IP for speed.',
          'What you give up is everything IP provides. A frame cannot cross a router, so the conversation is limited to one LAN. There are no port numbers, only the type field, so one program per protocol. There is no hop limit, no fragmentation, and nothing that says how to reach a machine you cannot see. IP is the layer that turns thousands of separate LANs into one network.'
        ],
        e: [
          'Yes. Ethernet needs only dst, src and EtherType; {{row:frame}} carries 58 bytes of text under EtherType 0x88b5 with no network layer. Layer-2-only protocols in production: ARP (0x0806), LLDP (0x88cc), STP/RSTP BPDUs (802.3 LLC, DSAP 0x42), PPPoE Discovery (0x8863), EtherCAT (0x88a4), PROFINET RT (0x8892), MACsec (0x88e5).',
          'Constraints: scope is one broadcast domain, since no router forwards on MAC addresses; multiplexing is by EtherType only, so no per-process ports; no TTL, fragmentation, or path selection; delivery is unacknowledged unless the protocol adds it. IP supplies exactly the pieces missing from that list.'
        ]
      }}
    ],
    actors: [{ name: 'Student VM', addr: '192.168.110.50' }, { name: 'Gateway', addr: '192.168.110.1 / 10.10.20.1' }, { name: 'Lab Server', addr: '10.10.20.5' }],
    steps: [
      { from: 0, to: 2, label: 'SYN  (frame 1, via the gateway)' },
      { from: 2, to: 0, label: 'SYN, ACK  (frame 2)' },
      { from: 0, to: 2, label: 'ACK  (frame 3): connection open' },
      { from: 0, to: 2, label: 'GET /hello.txt HTTP/1.1  (frame 4, 82 bytes of text)' },
      { from: 2, to: 0, label: 'HTTP/1.1 200 OK + 51-byte body  (frame 5)' },
      { from: 0, to: 2, label: 'ACK  (frame 6)' }
    ],
    lookFor: [
      { s: 'Open frame 4. The layers are listed from the outside in: Ethernet, then IP, then TCP, then the request text at the bottom.', m: 'Open frame 4 and read the layers top to bottom: Ethernet (14 bytes), IPv4 (20), TCP (20), then the 82 bytes of HTTP. 14 + 20 + 20 + 82 = 136, the Length column.', e: 'Frame 4: 136 bytes = 14 Ethernet + 20 IPv4 (total length 122) + 20 TCP + 82 payload. Frame 5: 216 = 14 + 20 + 20 + 162.' },
      { s: 'The outer label says "to the router", but the inner one says "to 10.10.20.5". The router is just the next stop.', m: 'The destination MAC in every outgoing frame is the gateway, 00:50:56:c0:00:01, while the destination IP is the Lab Server, 10.10.20.5. Layer 2 addresses the next hop; layer 3 addresses the end.', e: 'dst MAC 00:50:56:c0:00:01 (next hop) versus dst IP 10.10.20.5 (end host) in frames 1, 3, 4, 6. Replies arrive with src MAC = gateway, src IP = server, TTL 63.' },
      { s: 'Each layer names the next one: the frame says "IP inside", IP says "TCP inside", TCP says "port 80, the web server".', m: 'Follow the chain of type fields: Ethernet type 0x0800 means IPv4 inside, IP protocol 6 means TCP inside, TCP destination port 80 means a web server. That chain is how the receiver knows who to hand each layer to.', e: 'Demultiplexing chain: EtherType 0x0800 → IP protocol 6 → dst port 80. The SYNs (frames 1 and 2) carry a 4-byte MSS option, so their TCP header is 24 bytes and data offset is 6.' },
      { s: 'Frames 1 to 3 carry no message at all. They are the two machines agreeing to talk before anything is sent.', m: 'Frames 1 to 3 have Len=0: the TCP handshake carries no application data. Only from frame 4 does layer 7 appear. Frames 1, 2, 3 and 6 are all 60 bytes because Ethernet pads short frames to its minimum.', e: 'Handshake segments are 44 bytes of IP (with MSS) or 40 without, padded to the 60-byte minimum; the parser shows the padding in the frame length, not in the IP total length.' }
    ]
  }
];
