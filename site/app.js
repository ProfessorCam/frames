/* app.js - wires the left column to the right column. No frameworks. */
(function () {
  'use strict';

  var nav = document.getElementById('nav');
  var main = document.getElementById('main');
  var pcapCache = {};

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------- expanding site menu (the whole left rail is the button) ---------- */

  function buildMenu() {
    var panel = document.getElementById('sitemenu'), btn = document.getElementById('menu-btn');
    if (!panel || !btn || !SITE.menu) return;
    panel.innerHTML = '<div class="sitemenu-title">Sites</div>' + SITE.menu.map(function (m) {
      if (!m.href) return '<span class="menu-item soon"><span>' + esc(m.label) + '</span><small>coming soon</small></span>';
      return '<a class="menu-item' + (m.current ? ' current' : '') + '" href="' + esc(m.href) + '"' + (m.current ? ' aria-current="page"' : '') + '>' + esc(m.label) + (m.current ? '<small>you are here</small>' : '') + '</a>';
    }).join('') + '<div class="sitemenu-foot">Click anywhere else, or press Escape, to close.</div>';

    var leaveTimer = null;
    function setOpen(open) {
      panel.classList.toggle('open', open);
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close site menu' : 'Open site menu');
      if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
    }
    function isOpen() { return panel.classList.contains('open'); }

    btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!isOpen()); });
    panel.addEventListener('click', function (e) {
      e.stopPropagation();
      if (e.target.closest('a.menu-item')) setOpen(false);
    });
    document.addEventListener('click', function () { if (isOpen()) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) { setOpen(false); btn.focus(); } });
    panel.addEventListener('mouseleave', function () { if (isOpen()) leaveTimer = setTimeout(function () { setOpen(false); }, 1200); });
    panel.addEventListener('mouseenter', function () { if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; } });
    panel.addEventListener('focusout', function (e) { if (!panel.contains(e.relatedTarget) && e.relatedTarget !== btn) setOpen(false); });
  }

  /* ---------- left column ---------- */

  function buildNav() {
    LESSONS.forEach(function (l, i) {
      var b = document.createElement('button');
      b.className = 'row';
      b.type = 'button';
      b.dataset.id = l.id;
      b.innerHTML =
        '<span class="num">' + (i + 1) + '</span>' +
        '<span class="text"><span class="title">' + esc(l.title) + '</span>' +
        '<span class="sub">' + esc(l.subtitle) + '</span></span>';
      b.addEventListener('click', function () { location.hash = l.id; });
      nav.appendChild(b);
    });
  }

  function setActive(id) {
    Array.prototype.forEach.call(nav.querySelectorAll('.row'), function (b) {
      b.classList.toggle('active', b.dataset.id === id);
    });
  }

  /* ---------- sequence diagram ---------- */

  function diagram(lesson) {
    var actors = lesson.actors, steps = lesson.steps;
    var colW = actors.length > 2 ? 330 : 460, left = 200, top = 70, rowH = 34;
    var width = left * 2 + colW * (actors.length - 1);
    var height = top + rowH * steps.length + 30;
    var xs = actors.map(function (a, i) { return left + colW * i; });
    var out = [];
    out.push('<svg class="seq" viewBox="0 0 ' + width + ' ' + height + '" style="max-width:' + width + 'px" role="img" aria-label="Sequence diagram">');
    var head = '<path d="M0 0 L10 5 L0 10 z"/>';
    function marker(id) { return '<marker id="' + id + '" class="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">' + head + '</marker>'; }
    out.push('<defs>' + marker('arrow') + marker('arrow-bcast') + marker('arrow-dashed') + '</defs>');
    actors.forEach(function (a, i) {
      out.push('<line class="life" x1="' + xs[i] + '" y1="' + (top - 10) + '" x2="' + xs[i] + '" y2="' + (height - 10) + '"/>');
      out.push('<text class="actor" x="' + xs[i] + '" y="24" text-anchor="middle">' + esc(a.name) + '</text>');
      out.push('<text class="addr" x="' + xs[i] + '" y="42" text-anchor="middle">' + esc(a.addr) + '</text>');
    });
    steps.forEach(function (s, i) {
      var y = top + rowH * i + 12;
      var x1 = xs[s.from], x2, cls = 'msg' + (s.dashed ? ' dashed' : '');
      if (s.to === 'all') {
        /* broadcast or multicast: a line across the whole LAN, with a dot at the sender */
        cls += ' bcast';
        out.push('<line class="' + cls + '" x1="40" y1="' + y + '" x2="' + (width - 20) + '" y2="' + y + '" marker-start="url(#arrow-bcast)" marker-end="url(#arrow-bcast)"/>');
        out.push('<circle class="origin" cx="' + x1 + '" cy="' + y + '" r="4"/>');
        out.push('<text class="label" x="' + (width / 2) + '" y="' + (y - 6) + '" text-anchor="middle">' + esc(s.label) + '</text>');
      } else {
        x2 = xs[s.to];
        out.push('<line class="' + cls + '" x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" marker-end="url(#' + (s.dashed ? 'arrow-dashed' : 'arrow') + ')"/>');
        out.push('<text class="label" x="' + ((x1 + x2) / 2) + '" y="' + (y - 6) + '" text-anchor="middle">' + esc(s.label) + '</text>');
      }
      out.push('<text class="stepno" x="18" y="' + (y + 4) + '" text-anchor="middle">' + (i + 1) + '</text>');
    });
    out.push('</svg>');
    return out.join('');
  }

  /* ---------- packet-assembly animation ---------- */

  function assemblyHtml(key, a) {
    var h = ['<div class="asm" data-anim="' + key + '" aria-label="Animation: ' + esc(a.label) + '">'];
    h.push('<div class="asm-caption"><span class="asm-dots">' + a.stages.map(function (s, i) { return '<i data-i="' + i + '"></i>'; }).join('') + '</span><span class="asm-text"></span></div>');
    h.push('<div class="asm-bar">');
    a.segments.forEach(function (g) {
      h.push('<div class="seg seg-' + (g.color || g.id) + (g.ghost ? ' seg-ghost' : '') + '" data-seg="' + g.id + '" style="--w:' + g.width + '%">' +
        '<div class="seg-name">' + esc(g.name) + '</div>' +
        '<div class="seg-bytes">' + g.bytes + ' bytes</div>' +
        '<div class="seg-fields">' + g.fields.map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') + '</div></div>');
    });
    h.push('</div>');
    h.push('<div class="asm-foot"><div class="asm-ctl">' +
      '<button type="button" class="asm-btn" data-act="prev" title="Back one step" aria-label="Back one step">&#9664;</button>' +
      '<button type="button" class="asm-btn asm-toggle" data-act="toggle" title="Pause" aria-label="Pause">&#10074;&#10074;</button>' +
      '<button type="button" class="asm-btn" data-act="next" title="Forward one step" aria-label="Forward one step">&#9654;</button>' +
      '<span class="asm-step"></span></div>' +
      '<div class="asm-total"><span class="asm-total-label">Frame so far</span> <b class="asm-bytes">0</b> bytes</div></div>');
    h.push('</div>');
    return h.join('');
  }

  var ANIMATIONS = {
    'raw-frame': {
      label: 'how a frame with nothing but MAC addresses is built',
      segments: [
        { id: 'eth',  name: 'Ethernet header', bytes: 14, width: 26, fields: ['dst 00:0c:29:7d:e3:5c', 'src 00:0c:29:4b:1f:a2', 'type 0x88b5 = experiment'] },
        { id: 'noip', name: 'IP header',       bytes: 0,  width: 18, ghost: true, fields: ['none', 'no IP address', 'anywhere'] },
        { id: 'data', name: 'Data',            bytes: 58, width: 36, fields: ['"Hello Lab PC 2. This frame', 'has no IP address in it', 'at all."'] },
        { id: 'fcs',  name: 'Check (FCS)',     bytes: 4,  width: 16, fields: ['CRC-32', 'added by the card', 'never captured'] }
      ],
      stages: [
        { on: ['data'],                        hold: 3000, caption: 'Start with what we want to send: 58 bytes of text.' },
        { on: ['noip', 'data'],                hold: 3600, caption: 'Normally an IP header would go in front. Not this time: the receiver is on the same LAN, and a frame can find it by MAC address alone.' },
        { on: ['eth', 'data'],                 hold: 4200, caption: 'The 14-byte Ethernet header: destination MAC, source MAC, and a type code. 0x88b5 is reserved for experiments, so nothing on the LAN will mistake the text for IP. 72 bytes: this is frame 1 in the capture.' },
        { on: ['eth', 'data', 'fcs'],          hold: 3800, caption: 'On the way out, the network card appends a 4-byte CRC-32 check. The receiving card verifies it and strips it before anyone else sees the frame, which is why captures never show it. 76 bytes on the wire.' },
        { on: ['eth', 'data', 'fcs'], done: true, hold: 3000, caption: 'Sent. The switch reads the first six bytes, looks up which port 00:0c:29:7d:e3:5c is on, and sends the frame out of that port only.' }
      ]
    },

    'packet-in-frame': {
      label: 'how a ping to another network is addressed',
      segments: [
        { id: 'eth',  name: 'Ethernet header', bytes: 14, width: 25, fields: ['dst 00:50:56:c0:00:01', '= the GATEWAY, not the server', 'src 00:0c:29:4b:1f:a2', 'type 0x0800 = IPv4'] },
        { id: 'ip',   name: 'IP header',       bytes: 20, width: 25, fields: ['from 192.168.110.50', 'to 10.10.20.5 = the server', 'protocol 1 = ICMP', 'TTL 64'] },
        { id: 'icmp', name: 'ICMP header',     bytes: 8,  width: 20, fields: ['type 8 (echo request)', 'code 0', 'id 5150, seq 1'] },
        { id: 'data', name: 'Ping data',       bytes: 56, width: 26, fields: ['56 bytes of filler', 'echoed back', 'unchanged'] }
      ],
      stages: [
        { on: ['data'],                        hold: 2600, caption: 'The usual 56 bytes of ping filler.' },
        { on: ['icmp', 'data'],                hold: 3000, caption: 'ICMP adds its 8-byte header: Echo Request, id 5150, sequence 1. Nothing here is different from a ping on the same LAN.' },
        { on: ['ip', 'icmp', 'data'],          hold: 3800, caption: 'IP writes the final destination on the parcel: 10.10.20.5. This header will travel all the way to the Lab Server. Only the TTL will change, once per router.' },
        { on: ['eth', 'ip', 'icmp', 'data'],   hold: 4600, caption: 'Now the envelope. 10.10.20.5 is not in 192.168.110.0/23, so the frame is addressed to the gateway\'s MAC, 00:50:56:c0:00:01, learned by ARP in frames 1 and 2. The destination MAC and the destination IP name two different machines. 98 bytes: frame 3 of the first capture.' },
        { on: ['eth', 'ip', 'icmp', 'data'], done: true, hold: 3400, caption: 'Sent. The gateway opens the envelope, reads 10.10.20.5, subtracts one from the TTL, and puts the packet in a fresh envelope for the far network: frame 3 of the second capture.' }
      ]
    },

    'ipv6-ping': {
      label: 'how an IPv6 ping is assembled',
      segments: [
        { id: 'eth',   name: 'Ethernet header', bytes: 14, width: 20, fields: ['dst 00:50:56:c0:00:01', 'src 00:0c:29:4b:1f:a2', 'type 0x86dd = IPv6'] },
        { id: 'ip6',   name: 'IPv6 header',     bytes: 40, width: 34, fields: ['from 2001:db8:110:0:20c:29ff:fe4b:1fa2', 'to 2001:db8:110::1', 'next header 58 = ICMPv6', 'hop limit 64, no checksum'] },
        { id: 'icmp6', name: 'ICMPv6 header',   bytes: 8,  width: 20, color: 'icmp', fields: ['type 128 (echo request)', 'code 0', 'id 0x2a1f, seq 1'] },
        { id: 'data',  name: 'Ping data',       bytes: 56, width: 22, fields: ['56 bytes of filler', 'echoed back', 'unchanged'] }
      ],
      stages: [
        { on: ['data'],                          hold: 2600, caption: 'The same 56 bytes of ping filler as IPv4.' },
        { on: ['icmp6', 'data'],                 hold: 3200, caption: 'ICMPv6 adds 8 bytes: type 128 is Echo Request (IPv4 used 8), with an identifier and sequence number exactly as before.' },
        { on: ['ip6', 'icmp6', 'data'],          hold: 4400, caption: 'The IPv6 header: 40 bytes, of which 32 are the two addresses. Next header 58 says "ICMPv6 inside", hop limit 64 does the TTL\'s job, and there is no checksum to compute. It is always exactly this size.' },
        { on: ['eth', 'ip6', 'icmp6', 'data'],   hold: 3800, caption: 'The same 14-byte Ethernet header as every other row, with one difference: type 0x86dd. The MAC address came from Neighbor Discovery instead of ARP. 118 bytes: frame 5 in the capture, 20 bytes more than the IPv4 ping.' },
        { on: ['eth', 'ip6', 'icmp6', 'data'], done: true, hold: 3000, caption: 'Sent. The Echo Reply comes back as type 129, built the same way in the other direction.' }
      ]
    }
  };

  var animTimers = [];
  function stopAnimations() { animTimers.forEach(clearTimeout); animTimers = []; }

  /* Each animation loops on its own timer. The buttons under the bar pause it,
   * or step one stage back or forward (stepping pauses, so the reader can
   * take their time; play resumes the loop from that stage). */
  function startAnimations() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    Array.prototype.forEach.call(main.querySelectorAll('[data-anim]'), function (el) {
      var a = ANIMATIONS[el.dataset.anim];
      if (!a) return;
      var n = a.stages.length;
      var segs = {}; Array.prototype.forEach.call(el.querySelectorAll('.seg'), function (s) { segs[s.dataset.seg] = s; });
      var text = el.querySelector('.asm-text'), dots = el.querySelectorAll('.asm-dots i'), bytesEl = el.querySelector('.asm-bytes');
      var stepEl = el.querySelector('.asm-step'), toggleBtn = el.querySelector('.asm-toggle');
      var i = 0, timer = null, playing = !reduce;
      function apply(k) {
        var st = a.stages[k], total = 0;
        a.segments.forEach(function (g) {
          var on = st.on.indexOf(g.id) >= 0;
          segs[g.id].classList.toggle('on', on);
          if (on) total += g.bytes;
        });
        el.classList.toggle('done', !!st.done);
        text.textContent = st.caption;
        bytesEl.textContent = total;
        stepEl.textContent = 'step ' + (k + 1) + ' of ' + n;
        Array.prototype.forEach.call(dots, function (d, j) { d.classList.toggle('on', j === k); });
      }
      function clearTimer() {
        if (timer === null) return;
        clearTimeout(timer);
        animTimers = animTimers.filter(function (t) { return t !== timer; });
        timer = null;
      }
      function schedule() {
        clearTimer();
        if (!playing) return;
        timer = setTimeout(function () { go((i + 1) % n); }, a.stages[i].hold);
        animTimers.push(timer);
      }
      function go(k) { i = k; apply(i); schedule(); }
      function setPlaying(p) {
        playing = p;
        el.classList.toggle('paused', !p);
        toggleBtn.innerHTML = p ? '&#10074;&#10074;' : '&#9654;';
        toggleBtn.title = p ? 'Pause' : 'Play';
        toggleBtn.setAttribute('aria-label', p ? 'Pause' : 'Play');
        schedule();
      }
      el.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[data-act], .asm-dots i') : null;
        if (!b || !el.contains(b)) return;
        if (b.dataset.act === 'toggle') { setPlaying(!playing); return; }
        setPlaying(false);
        if (b.dataset.act === 'prev') go((i - 1 + n) % n);
        else if (b.dataset.act === 'next') go((i + 1) % n);
        else if (b.dataset.i !== undefined) go(+b.dataset.i);
      });
      if (reduce) { i = n - 1; }
      setPlaying(playing);
      apply(i);
    });
  }

  /* ---------- welcome page ---------- */

  function renderWelcome() {
    var hosts = (SITE.hosts || []).map(function (x) {
      return '<tr><td>' + esc(x.name) + '</td><td>' + esc(x.mac) + '</td><td>' + esc(x.ip) + '</td><td>' + esc(x.ip6 || '') + '</td><td>' + esc(x.role) + '</td></tr>';
    }).join('');
    main.innerHTML =
      '<article class="welcome">' +
      '<h1>' + esc(SITE.title) + '</h1>' +
      '<p class="lead">How data really moves: the frame that crosses your LAN, the packet that crosses the internet, and the two kinds of address that make them work.</p>' +
      '<h2>How to use this page</h2>' +
      '<ol>' +
      '<li><b>Row 1, MAC address.</b> The address printed on every network card: what it looks like, who hands it out, and how to find your own on Windows, Linux and macOS.</li>' +
      '<li><b>Row 2, Frame.</b> Two machines on one switch talk by MAC address alone. A frame with no IP in it at all, then an ordinary ping to a neighbour.</li>' +
      '<li><b>Row 3, Frame vs packet.</b> The same ping captured on both sides of a router. The MAC addresses change, the IP addresses do not.</li>' +
      '<li><b>Row 4, IPv6.</b> The same picture with 128-bit addresses, no ARP and no broadcast.</li>' +
      '</ol>' +
      '<p>Every row with a capture has a Wireshark-style packet table at the bottom. Click a packet to open it layer by layer, and use the download button to open the same file in Wireshark. The animations have back, pause and forward buttons.</p>' +
      '<h2>The lab machines</h2>' +
      '<div class="table-wrap"><table class="lab hosts"><tr><th>Machine</th><th>MAC address</th><th>IPv4</th><th>IPv6</th><th>Role</th></tr>' + hosts + '</table></div>' +
      '<p class="hint">' + esc(SITE.labName) + ' is ' + esc(SITE.labNetwork) + '; the far network on row 3 is ' + esc(SITE.farNetwork) + '. The captures were built to match these machines byte for byte (see <code>tools/make-captures.py</code> in the repository), which is how the same ping can be shown from both sides of the router with clean timestamps. Wireshark reads them like any other capture, checksums included.</p>' +
      '<h2>Run it on your own LAN</h2>' +
      '<p class="hint">The site is also published as a Docker image. Run it on a machine on the lab network and row 1 shows every visitor their own MAC address, read from the server\'s neighbour table:</p>' +
      '<pre class="cmd">docker run -d --name frames --network host --restart unless-stopped ' + esc(SITE.image) + '</pre>' +
      '<p class="hint">Then open <a href="http://localhost:' + SITE.port + '/">http://localhost:' + SITE.port + '/</a>, or the machine\'s address from another computer on the LAN. Stop it with <code>docker rm -f frames</code>.</p>' +
      '<h2>Reading the packet table</h2>' +
      '<ul>' +
      '<li><b>Source</b> and <b>Destination</b> show MAC addresses when there is no IP packet in the frame (the raw frames and ARP), and IP addresses otherwise. Open a packet to see both.</li>' +
      '<li><b>Protocol</b> is the innermost thing the parser recognised: Ethernet, ARP, ICMP, ICMPv6.</li>' +
      '<li><b>Length</b> is the frame as captured, without the 4-byte check the card adds on the wire.</li>' +
      '</ul>' +
      '</article>';
  }

  /* ---------- lesson sections ---------- */

  function anatomyHtml(a) {
    var h = [], legend;
    if (a.kind === 'mac') {
      h.push('<div class="anatomy" aria-label="MAC address ' + esc(a.value) + '">');
      a.value.split(':').forEach(function (x, i) { h.push('<span class="byte ' + (i < 3 ? 'oui' : 'nic') + '">' + esc(x) + '</span>'); });
      h.push('</div>');
      legend = [['oui', 'First three bytes', a.left], ['nic', 'Last three bytes', a.right]];
    } else {
      h.push('<div class="anatomy" aria-label="IPv6 address ' + esc(a.value) + '">');
      a.value.split(':').forEach(function (x, i) { h.push('<span class="byte wide ' + (i < 4 ? 'net' : 'host') + '">' + esc(x) + '</span>'); });
      h.push('</div>');
      legend = [['net', 'First 64 bits', a.left], ['host', 'Last 64 bits', a.right]];
    }
    h.push('<div class="anatomy-legend">' + legend.map(function (l) { return '<span><i class="sw ' + l[0] + '"></i><b>' + esc(l[1]) + ':</b> ' + esc(l[2]) + '</span>'; }).join('') + '</div>');
    return h.join('');
  }

  function columnsHtml(cols) {
    return '<div class="cols">' + cols.map(function (c) {
      return '<div class="col"><h3>' + esc(c.h) + '</h3>' + (c.p || []).map(function (p) { return '<p>' + p + '</p>'; }).join('') +
        (c.cmd ? '<pre class="cmd">' + esc(c.cmd) + '</pre>' : '') + (c.after ? '<p>' + c.after + '</p>' : '') + '</div>';
    }).join('') + '</div>';
  }

  function tableHtml(rows, cls) {
    var h = ['<div class="table-wrap"><table class="lab ' + (cls || 'compare') + '">'];
    rows.forEach(function (row, i) { h.push('<tr>' + row.map(function (c, j) { return (i === 0 || j === 0 ? '<th>' : '<td>') + c + (i === 0 || j === 0 ? '</th>' : '</td>'); }).join('') + '</tr>'); });
    h.push('</table></div>');
    return h.join('');
  }

  function sectionHtml(s) {
    var h = ['<section><h2>' + esc(s.h) + '</h2>'];
    (s.p || []).forEach(function (p) { h.push('<p>' + p + '</p>'); });
    if (s.anatomy) h.push(anatomyHtml(s.anatomy));
    if (s.steps) { h.push('<ol class="steps">'); s.steps.forEach(function (t) { h.push('<li>' + t + '</li>'); }); h.push('</ol>'); }
    if (s.anim && ANIMATIONS[s.anim]) h.push(assemblyHtml(s.anim, ANIMATIONS[s.anim]));
    if (s.packet) h.push('<div class="peek" data-file="' + esc(s.packet.file) + '" data-no="' + s.packet.no + '" data-note="' + esc(s.packet.note || '') + '"><p class="loading">Loading frame ' + s.packet.no + ' of ' + esc(s.packet.file) + ' ...</p></div>');
    if (s.compare) h.push('<div class="compare-wrap cmp-box" data-a="' + esc(JSON.stringify(s.compare.a)) + '" data-b="' + esc(JSON.stringify(s.compare.b)) + '"><p class="loading">Loading both captures...</p></div>');
    if (s.tool === 'mac') h.push('<div class="seen" id="seen"><p class="loading">Looking for the frame that carried your request...</p></div>');
    if (s.columns) h.push(columnsHtml(s.columns));
    if (s.table) h.push(tableHtml(s.table));
    (s.after || []).forEach(function (p) { h.push('<p>' + p + '</p>'); });
    h.push('</section>');
    return h.join('');
  }

  function renderLesson(lesson, index) {
    var h = [];
    h.push('<article class="lesson" id="lesson-' + lesson.id + '">');
    h.push('<p class="crumb">Row ' + (index + 1) + ' of ' + LESSONS.length + '</p>');
    h.push('<h1>' + esc(lesson.title) + ' <small>' + esc(lesson.subtitle) + '</small></h1>');
    h.push('<p class="lead">' + esc(lesson.oneLiner) + '</p>');
    var facts = lesson.facts || [['Where it lives', lesson.layer], ['How this was made', '<code>' + esc(lesson.command) + '</code>']];
    h.push('<div class="facts">' + facts.map(function (f) { return '<div><span class="k">' + esc(f[0]) + '</span><span class="v">' + (lesson.facts ? esc(f[1]) : f[1]) + '</span></div>'; }).join('') + '</div>');
    lesson.sections.forEach(function (s) { h.push(sectionHtml(s)); });
    if (lesson.steps) h.push('<section><h2>The conversation, step by step</h2><p class="hint">Orange lines are frames sent to everyone (broadcast) or to a group (multicast).</p><div class="diagram">' + diagram(lesson) + '</div></section>');
    if (lesson.lookFor) {
      h.push('<section><h2>' + esc(lesson.lookForTitle || 'What to look for') + '</h2><ul class="lookfor">');
      lesson.lookFor.forEach(function (t) { h.push('<li>' + esc(t) + '</li>'); });
      h.push('</ul></section>');
    }
    var caps = lesson.captures || (lesson.file ? [{ file: lesson.file }] : []);
    caps.forEach(function (c) {
      h.push('<section class="packets"><div class="packets-head"><h2>' + esc(c.title || 'The packets') + '</h2><div class="dl-group">' +
        '<a class="dl" href="pcaps/' + encodeURIComponent(c.file) + '" download>Download .pcap</a></div></div>' +
        '<p class="hint">' + (c.hint ? esc(c.hint) + ' ' : 'Click a packet to expand its details. ') + 'File: <code>' + esc(c.file) + '</code></p>' +
        '<div class="table-wrap pktbox" data-file="' + esc(c.file) + '"><p class="loading">Loading capture...</p></div></section>');
    });
    h.push('</article>');
    main.innerHTML = h.join('');
    main.scrollTop = 0;
    startAnimations();
    loadPeeks();
    loadCompares();
    loadPackets();
    if (document.getElementById('seen')) loadSeen();
  }

  /* ---------- one frame from a capture, shown inline in a lesson ---------- */

  function loadPeeks() {
    Array.prototype.forEach.call(main.querySelectorAll('.peek'), function (box) {
      var file = box.dataset.file, no = +box.dataset.no, note = box.dataset.note;
      fetchPcap(file).then(function (packets) {
        var p = packets[no - 1];
        if (!p || p.no !== no) throw new Error('there is no frame ' + no);
        box.innerHTML = peekHtml(p, file, note);
        wireDetails(box);
      }).catch(function (e) {
        box.innerHTML = '<p class="error">Could not load frame ' + no + ' of ' + esc(file) + ': ' + esc(e.message) + '</p>';
      });
    });
  }

  function peekHtml(p, file, note) {
    var h = ['<div class="peek-head">Frame ' + p.no + ' of <code>' + esc(file) + '</code>' + (note ? ', ' + esc(note) : '') + '. Click the row to fold the details away.</div>'];
    h.push('<div class="table-wrap peek-table">' + packetTable([p]).replace('class="pkt ', 'class="pkt open ').replace('<tr class="det" hidden>', '<tr class="det">') + '</div>');
    if (p.textPayload && p.textPayload.bytes.length) {
      var txt = ''; for (var i = 0; i < p.textPayload.bytes.length; i++) txt += String.fromCharCode(p.textPayload.bytes[i]);
      h.push('<div class="peek-text"><div class="sec-title">' + esc(p.textPayload.label) + '</div><pre class="plain">' + esc(txt) + '</pre></div>');
    }
    return h.join('');
  }

  /* ---------- the same packet in two captures, field by field ---------- */

  function loadCompares() {
    Array.prototype.forEach.call(main.querySelectorAll('.cmp-box'), function (box) {
      var a = JSON.parse(box.dataset.a), b = JSON.parse(box.dataset.b);
      Promise.all([fetchPcap(a.file), fetchPcap(b.file)]).then(function (r) {
        var p = r[0][a.no - 1], q = r[1][b.no - 1];
        if (!p || !q) throw new Error('frame missing');
        box.innerHTML = compareHtml(p, q, a, b);
      }).catch(function (e) {
        box.innerHTML = '<p class="error">Could not load the captures: ' + esc(e.message) + '</p>';
      });
    });
  }

  function plainValue(v) { return String(v).split('  ')[0]; }

  function compareHtml(p, q, a, b) {
    var h = ['<div class="table-wrap"><table class="diff"><thead><tr><th>Field</th><th>' + esc(a.label) + ', frame ' + p.no + '</th><th>' + esc(b.label) + ', frame ' + q.no + '</th></tr></thead><tbody>'];
    function row(name, x, y) {
      var same = x === y;
      h.push('<tr class="' + (same ? 'same' : 'changed') + '"><td class="name">' + esc(name) + '</td><td>' + esc(x) + '</td><td>' + esc(y) + '</td></tr>');
    }
    p.details.forEach(function (sec, si) {
      var other = q.details[si];
      if (!other || other.title !== sec.title) return;
      h.push('<tr><th class="layer" colspan="3">' + esc(sec.title) + '</th></tr>');
      if (si === 0) row('Bytes on the wire', p.len + ' bytes', q.len + ' bytes');
      sec.rows.forEach(function (r, ri) {
        var o = other.rows[ri];
        if (!o || o[0] !== r[0]) return;
        row(r[0], plainValue(r[1]), plainValue(o[1]));
      });
    });
    h.push('</tbody></table></div>');
    return h.join('');
  }

  /* ---------- "your MAC address, as the server saw it" ---------- */

  function loadSeen() {
    var box = document.getElementById('seen');
    function notHere() {
      box.className = 'seen';
      box.innerHTML = '<p><b>This page cannot see your MAC address.</b> It is served from far away, and the frame your request left in was opened and thrown away by your own router; every hop since then used a new one. The server only ever saw the MAC address of its own router.</p>' +
        '<p>Only a machine on your own LAN can see it. Run this site from its Docker container on the lab network (the command is on the welcome page) and this box fills in by itself.</p>';
    }
    fetch('neighbors.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('no neighbour table'); return r.json(); })
      .then(function (n) {
        return fetch('whoami', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (w) { showSeen(box, n, w.ip || ''); });
      }).catch(notHere);
  }

  function showSeen(box, n, ip) {
    ip = ip.replace(/^::ffff:/, '');
    var loop = ip === '127.0.0.1' || ip === '::1' || ip.indexOf('127.') === 0;
    if (loop) {
      var cards = (n.links || []).filter(function (l) { return l.address && l.link_type === 'ether'; });
      box.className = 'seen';
      box.innerHTML = '<p><b>You are browsing from the machine that runs the container itself</b>, so your request never left the machine and there is no frame to look at. These are its own network cards:</p>' +
        '<table class="kv">' + cards.map(function (l) { return '<tr><th>' + esc(l.ifname) + '</th><td>' + esc(l.address) + (l.operstate === 'UP' ? '' : '  (down)') + '</td></tr>'; }).join('') + '</table>';
      return;
    }
    var hit = (n.neigh || []).filter(function (e) { return e.dst === ip && e.lladdr; })[0];
    if (hit) {
      box.className = 'seen ok';
      box.innerHTML = '<p>Your MAC address is <span class="mac">' + esc(hit.lladdr) + '</span></p>' +
        '<p>That is the source address of the frame that carried your request (from ' + esc(ip) + ') to this server, as recorded in the server\'s neighbour table on its card <code>' + esc(hit.dev) + '</code>. You are on the same LAN as the server, which is the only reason it can see it. Prefix <code>' + esc(hit.lladdr.slice(0, 8)) + '</code>: compare it with the table above.</p>';
    } else {
      box.className = 'seen';
      box.innerHTML = '<p><b>Your request came from ' + esc(ip) + ', which is not on the server\'s LAN.</b> The frame that carried it was replaced by a router on the way, so the server saw the router\'s MAC address, not yours (row 3 shows exactly this). Connect to the lab network and reload.</p>';
    }
  }

  /* ---------- packets ---------- */

  function fetchPcap(file) {
    if (pcapCache[file]) return Promise.resolve(pcapCache[file]);
    return fetch('pcaps/' + encodeURIComponent(file))
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
      .then(function (buf) { var p = parsePcap(buf); pcapCache[file] = p; return p; });
  }

  function loadPackets() {
    Array.prototype.forEach.call(main.querySelectorAll('.pktbox'), function (box) {
      fetchPcap(box.dataset.file).then(function (packets) {
        box.innerHTML = packetTable(packets);
        wireDetails(box);
        wireCollapse(box);
      }).catch(function (e) {
        box.innerHTML = '<p class="error">Could not load the capture: ' + esc(e.message) + '. This page must be served over HTTP, not opened as a file.</p>';
      });
    });
  }

  var FOLD_ABOVE = 80, FOLD_HEAD = 40, FOLD_TAIL = 8;

  function packetTable(packets) {
    var h = ['<table class="pk"><thead><tr><th>No.</th><th>Time</th><th>Source</th><th>Destination</th><th>Protocol</th><th>Length</th><th>Info</th></tr></thead><tbody>'];
    var fold = packets.length > FOLD_ABOVE;
    packets.forEach(function (p, i) {
      var cls = 'proto-' + p.proto.toLowerCase().replace(/[^a-z0-9]/g, '');
      var folded = fold && i >= FOLD_HEAD && i < packets.length - FOLD_TAIL;
      if (fold && i === FOLD_HEAD) {
        h.push('<tr class="fold"><td colspan="7"><button type="button" class="fold-btn">Show the other ' + (packets.length - FOLD_HEAD - FOLD_TAIL) + ' packets</button></td></tr>');
      }
      h.push('<tr class="pkt ' + cls + (folded ? ' folded' : '') + '" data-i="' + i + '" tabindex="0"' + (folded ? ' hidden' : '') + '>' +
        '<td class="n">' + p.no + '</td><td class="t">' + p.time.toFixed(6) + '</td>' +
        '<td>' + esc(p.src) + '</td><td>' + esc(p.dst) + '</td>' +
        '<td class="p">' + esc(p.proto) + '</td><td class="n">' + p.len + '</td>' +
        '<td class="info">' + esc(p.info) + '</td></tr>');
      h.push('<tr class="det" hidden><td colspan="7"><div class="det-inner">' + details(p) + '</div></td></tr>');
    });
    h.push('</tbody></table>');
    return h.join('');
  }

  function details(p) {
    var h = ['<div class="frame-line">Frame ' + p.no + ': ' + p.len + ' bytes on the wire, captured ' + p.time.toFixed(6) + ' s after the first packet</div>'];
    p.details.forEach(function (sec) {
      h.push('<div class="sec"><div class="sec-title">' + esc(sec.title) + '</div><table class="kv">');
      sec.rows.forEach(function (r) { h.push('<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]).replace(/\n/g, '<br>') + '</td></tr>'); });
      h.push('</table></div>');
    });
    if (p.rawData && p.rawData.length) h.push('<div class="sec"><div class="sec-title">The bytes after the Ethernet header</div><pre class="hex">' + hexDump(p.rawData, 64) + '</pre></div>');
    return h.join('');
  }

  function hexDump(bytes, max) {
    var out = [], n = Math.min(bytes.length, max);
    for (var i = 0; i < n; i += 16) {
      var hexs = [], chars = '';
      for (var j = i; j < i + 16 && j < n; j++) { hexs.push(bytes[j].toString(16).padStart(2, '0')); chars += bytes[j] >= 32 && bytes[j] < 127 ? String.fromCharCode(bytes[j]) : '.'; }
      out.push(String(i).padStart(4, '0') + '  ' + hexs.join(' ').padEnd(47) + '  ' + esc(chars));
    }
    if (bytes.length > max) out.push('... ' + (bytes.length - max) + ' more bytes');
    return out.join('\n');
  }

  function wireCollapse(box) {
    var btn = box.querySelector('.fold-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      Array.prototype.forEach.call(box.querySelectorAll('tr.pkt.folded'), function (tr) { tr.hidden = false; });
      btn.parentNode.parentNode.remove();
    });
  }

  function wireDetails(box) {
    Array.prototype.forEach.call(box.querySelectorAll('tr.pkt'), function (tr) {
      function toggle() {
        var det = tr.nextElementSibling;
        det.hidden = !det.hidden;
        tr.classList.toggle('open', !det.hidden);
      }
      tr.addEventListener('click', toggle);
      tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
  }

  /* ---------- routing ---------- */

  function route() {
    stopAnimations();
    var id = location.hash.replace('#', '');
    var idx = -1;
    LESSONS.forEach(function (l, i) { if (l.id === id) idx = i; });
    setActive(idx >= 0 ? id : null);
    if (idx >= 0) renderLesson(LESSONS[idx], idx);
    else renderWelcome();
    document.title = (idx >= 0 ? LESSONS[idx].title + ' - ' : '') + SITE.title;
  }

  buildMenu();
  buildNav();
  (function () { var c = document.getElementById('net-cidr'); if (c) c.textContent = SITE.labNetwork; })();
  window.addEventListener('hashchange', route);
  route();
})();
