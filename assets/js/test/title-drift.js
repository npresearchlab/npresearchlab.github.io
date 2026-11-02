// TEST: page-title logo that gently drifts. Each dot floats on its own slow path; linked groups float
// together so the connections hold. Pauses when off screen or when the visitor prefers reduced motion.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var DOTS = [[189.4, 100.9, 7.8, "#58585a"], [224.0, 100.9, 7.8, "#e9193a"], [162.3, 115.2, 8.6, "#58585a"], [189.4, 129.3, 9.1, "#58585a"], [135.2, 137.1, 6.6, "#58585a"], [162.4, 145.7, 9.5, "#58585a"], [189.5, 160.7, 10.1, "#58585a"], [135.2, 164.7, 8.5, "#58585a"], [162.4, 177.4, 10.2, "#58585a"], [109.8, 177.4, 7.2, "#58585a"], [189.4, 192.3, 11.1, "#818285"], [135.3, 193.5, 11.0, "#58585a"], [162.5, 209.1, 11.1, "#818285"], [109.8, 208.7, 9.1, "#58585a"], [303.4, 208.7, 9.2, "#ca006c"], [189.4, 224.6, 11.1, "#818285"], [223.9, 224.6, 11.0, "#0079c2"], [135.3, 226.4, 11.1, "#818285"], [278.2, 226.4, 11.1, "#7d4199"], [162.4, 240.6, 10.2, "#818285"], [250.8, 240.6, 10.1, "#0079c2"], [109.8, 240.2, 9.0, "#818285"], [303.5, 240.2, 9.1, "#7d4199"], [189.4, 256.0, 10.9, "#a7a9ac"], [224.0, 256.0, 10.9, "#0079c2"], [135.3, 257.7, 10.1, "#818285"], [278.2, 257.6, 10.1, "#0079c2"], [162.4, 272.4, 9.9, "#a7a9ac"], [251.0, 272.3, 9.9, "#0079c2"], [109.8, 271.5, 7.1, "#818285"], [303.5, 271.5, 7.2, "#0079c2"], [189.4, 287.6, 10.2, "#a7a9ac"], [223.9, 287.5, 10.1, "#00a4e4"], [135.3, 288.5, 9.2, "#a7a9ac"], [278.1, 288.5, 9.3, "#0079c2"], [162.3, 304.0, 8.8, "#a7a9ac"], [251.0, 304.0, 8.8, "#00a4e4"], [135.2, 316.8, 6.6, "#a7a9ac"], [189.4, 319.6, 9.2, "#a7a9ac"], [223.9, 319.5, 9.2, "#00a4e4"], [278.1, 316.8, 6.6, "#00a4e4"], [162.4, 333.8, 8.1, "#a7a9ac"], [250.8, 333.8, 8.1, "#00a4e4"], [189.4, 348.1, 7.8, "#a7a9ac"], [224.0, 348.1, 7.8, "#00a4e4"]];
  var LINKS = [{"c": "#e9193a", "nodes": [[224, 129, 10.8], [251, 115, 9.8], [251, 145, 11.2]], "segs": [[240, 131, 224, 129], [240, 131, 251, 115], [240, 131, 251, 145]]}, {"c": "#e9193a", "nodes": [[278, 137, 9.6], [278, 165, 10.2], [303, 177, 8.4]], "segs": [[278, 137, 278, 165], [278, 165, 303, 177]]}, {"c": "#ca006c", "nodes": [[224, 161, 11.7], [251, 178, 11.7], [278, 194, 12.0]], "segs": [[224, 161, 251, 178], [251, 178, 278, 194]]}, {"c": "#7d4199", "nodes": [[223, 192, 10.8], [251, 209, 11.0]], "segs": [[223, 192, 251, 209]]}];
  var DARK = { '#58585a': '#3d4a66', '#818285': '#55617b', '#a7a9ac': '#6f7a91' };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FILTER = '<filter id="goo-%ID%" x="-20%" y="-20%" width="140%" height="140%">' +
    '<feGaussianBlur in="SourceGraphic" stdDeviation="3.6" result="b"/>' +
    '<feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11" result="g"/>' +
    '<feComposite in="SourceGraphic" in2="g" operator="atop"/></filter>';

  document.querySelectorAll('.v2-title-art').forEach(function (box, k) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '92 88 228 274');
    svg.setAttribute('class', 'v2-title-svg');
    var defs = document.createElementNS(NS, 'defs'); defs.innerHTML = FILTER.replace('%ID%', k); svg.appendChild(defs);
    var movers = [], free = [], logoLinks = [], live = [];
    function mover(el, extra) {
      // slow, small, out-of-phase orbits: 2-3.5 units, 7-13 second periods
      var m = { el: el, x: 0, y: 0, ax: 1.6 + Math.random() * 1.9, ay: 1.6 + Math.random() * 1.9,
        wx: (2 * Math.PI) / (7000 + Math.random() * 6000), wy: (2 * Math.PI) / (7000 + Math.random() * 6000),
        px: Math.random() * 6.3, py: Math.random() * 6.3 };
      if (extra) for (var k2 in extra) m[k2] = extra[k2];
      movers.push(m);
      return m;
    }
    DOTS.forEach(function (d) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', d[0]); c.setAttribute('cy', d[1]); c.setAttribute('r', d[2]);
      c.setAttribute('fill', DARK[d[3]] || d[3]);
      svg.appendChild(c);
      var m = mover(c, { bx: d[0], by: d[1], r: d[2], color: d[3] });
      if (d[0] > 212) free.push(m); // the colored half is where connections happen
    });
    LINKS.forEach(function (L) {
      var g = document.createElementNS(NS, 'g'); g.setAttribute('filter', 'url(#goo-' + k + ')');
      var w = Math.min.apply(null, L.nodes.map(function (n) { return n[2]; })) * 0.78;
      L.segs.forEach(function (s) {
        var l = document.createElementNS(NS, 'line');
        l.setAttribute('x1', s[0]); l.setAttribute('y1', s[1]); l.setAttribute('x2', s[2]); l.setAttribute('y2', s[3]);
        l.setAttribute('stroke', L.c); l.setAttribute('stroke-width', w.toFixed(1)); l.setAttribute('stroke-linecap', 'round');
        g.appendChild(l);
      });
      L.nodes.forEach(function (n) {
        var c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', n[0]); c.setAttribute('cy', n[1]); c.setAttribute('r', n[2]); c.setAttribute('fill', L.c);
        g.appendChild(c);
      });
      if (L.segs.length === 3 && L.segs[0][0] === L.segs[1][0]) {
        var knot = document.createElementNS(NS, 'circle');
        knot.setAttribute('cx', L.segs[0][0]); knot.setAttribute('cy', L.segs[0][1]); knot.setAttribute('r', 7); knot.setAttribute('fill', L.c);
        g.appendChild(knot);
      }
      var outer = document.createElementNS(NS, 'g'); outer.appendChild(g);
      svg.appendChild(outer); mover(outer);
      // the logo's own chains (not the three-way knot) can occasionally let go and reconnect
      if (!(L.segs.length === 3 && L.segs[0][0] === L.segs[1][0])) {
        g.querySelectorAll('line').forEach(function (l) {
          var len = Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value, l.y2.baseVal.value - l.y1.baseVal.value);
          logoLinks.push({ el: l, len: len });
        });
      }
    });
    box.innerHTML = ''; box.appendChild(svg);
    if (reduce) return;

    // --- Making connections: neighbouring colored dots link up, hold, then let go ---
    var GROW = 1400, HOLD_MIN = 3500, HOLD_RAND = 3500, FADE = 1200;
    function busy(m) { return live.some(function (c) { return c.a === m || c.b === m; }); }
    function spawn(now) {
      var pairs = [];
      free.forEach(function (a) {
        free.forEach(function (b) {
          if (a === b || b.bx < a.bx || a.color !== b.color || busy(a) || busy(b)) return;
          var d = Math.hypot(a.bx - b.bx, a.by - b.by);
          if (d < 36) pairs.push([a, b]);
        });
      });
      if (!pairs.length) return;
      var pr = pairs[Math.floor(Math.random() * pairs.length)], a = pr[0], b = pr[1];
      var g = document.createElementNS(NS, 'g'); g.setAttribute('filter', 'url(#goo-' + k + ')');
      var line = document.createElementNS(NS, 'line');
      line.setAttribute('stroke', DARK[a.color] || a.color); line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('stroke-width', (Math.min(a.r, b.r) * 0.78).toFixed(1));
      // twins of the two dots inside the filter, so the new link melts into them
      var ta = a.el.cloneNode(), tb = b.el.cloneNode();
      g.appendChild(line); g.appendChild(ta); g.appendChild(tb);
      svg.appendChild(g);
      live.push({ a: a, b: b, g: g, line: line, ta: ta, tb: tb, t0: now, hold: HOLD_MIN + Math.random() * HOLD_RAND });
    }
    function updateLinks(now) {
      for (var i = live.length - 1; i >= 0; i--) {
        var c = live[i], age = now - c.t0;
        var ax = c.a.bx + c.a.x, ay = c.a.by + c.a.y, bx = c.b.bx + c.b.x, by = c.b.by + c.b.y;
        var p;
        if (age < GROW) p = ease(age / GROW);
        else if (age < GROW + c.hold) p = 1;
        else if (age < GROW + c.hold + FADE) p = 1 - ease((age - GROW - c.hold) / FADE);
        else { c.g.remove(); live.splice(i, 1); continue; }
        // grow out from a toward b, and retract back to a
        c.line.setAttribute('x1', ax); c.line.setAttribute('y1', ay);
        c.line.setAttribute('x2', (ax + (bx - ax) * p).toFixed(2)); c.line.setAttribute('y2', (ay + (by - ay) * p).toFixed(2));
        c.ta.setAttribute('transform', c.a.el.getAttribute('transform') || '');
        c.tb.setAttribute('transform', c.b.el.getAttribute('transform') || '');
        c.tb.style.opacity = p > 0.15 ? 1 : 0;
      }
    }
    // a logo chain lets go and reconnects
    var released = null;
    function releaseLogoLink(now) {
      if (released || !logoLinks.length) return;
      var L = logoLinks[Math.floor(Math.random() * logoLinks.length)];
      L.el.style.strokeDasharray = L.len; released = { L: L, t0: now };
    }
    function updateRelease(now) {
      if (!released) return;
      var age = now - released.t0, L = released.L, p;
      if (age < FADE) p = ease(age / FADE);            // letting go
      else if (age < FADE + 3000) p = 1;              // apart
      else if (age < FADE * 2 + 3000) p = 1 - ease((age - FADE - 3000) / FADE); // reconnecting
      else { L.el.style.strokeDasharray = ''; L.el.style.strokeDashoffset = ''; released = null; return; }
      L.el.style.strokeDashoffset = (L.len * p).toFixed(2);
    }
    function ease(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
    var nextSpawn = 600, nextRelease = 9000;

    var visible = true, start = performance.now();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) requestAnimationFrame(tick); }).observe(box);
    }
    function tick(now) {
      if (!visible || document.hidden) return;
      var t = now - start;
      for (var i = 0; i < movers.length; i++) {
        var m = movers[i];
        m.x = m.ax * Math.sin(t * m.wx + m.px); m.y = m.ay * Math.sin(t * m.wy + m.py);
        m.el.setAttribute('transform', 'translate(' + m.x.toFixed(2) + ' ' + m.y.toFixed(2) + ')');
      }
      if (t > nextSpawn) { if (live.length < 3) spawn(t); nextSpawn = t + 1800 + Math.random() * 2200; }
      if (t > nextRelease) { releaseLogoLink(t); nextRelease = t + 12000 + Math.random() * 8000; }
      updateLinks(t); updateRelease(t);
      requestAnimationFrame(tick);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden && visible) requestAnimationFrame(tick); });
    requestAnimationFrame(tick);
  });
})();
