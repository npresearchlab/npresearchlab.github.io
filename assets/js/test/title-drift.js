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
    var movers = [];
    function mover(el) {
      // slow, small, out-of-phase orbits: 2-3.5 units, 7-13 second periods
      movers.push({ el: el, ax: 1.6 + Math.random() * 1.9, ay: 1.6 + Math.random() * 1.9,
        wx: (2 * Math.PI) / (7000 + Math.random() * 6000), wy: (2 * Math.PI) / (7000 + Math.random() * 6000),
        px: Math.random() * 6.3, py: Math.random() * 6.3 });
    }
    DOTS.forEach(function (d) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', d[0]); c.setAttribute('cy', d[1]); c.setAttribute('r', d[2]);
      c.setAttribute('fill', DARK[d[3]] || d[3]);
      svg.appendChild(c); mover(c);
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
    });
    box.innerHTML = ''; box.appendChild(svg);
    if (reduce) return;

    var visible = true, start = performance.now();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) requestAnimationFrame(tick); }).observe(box);
    }
    function tick(now) {
      if (!visible || document.hidden) return;
      var t = now - start;
      for (var i = 0; i < movers.length; i++) {
        var m = movers[i];
        m.el.setAttribute('transform', 'translate(' + (m.ax * Math.sin(t * m.wx + m.px)).toFixed(2) + ' ' + (m.ay * Math.sin(t * m.wy + m.py)).toFixed(2) + ')');
      }
      requestAnimationFrame(tick);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden && visible) requestAnimationFrame(tick); });
    requestAnimationFrame(tick);
  });
})();
