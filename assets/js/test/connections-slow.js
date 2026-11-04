// Home page hero: the lab logo traced dot for dot from NPRL_Logo.png.
// On load the right half colors in from top to bottom and the linked dots connect, then it holds still.
(function () {
  var svg = document.getElementById('connections');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DOTS = [[189.4, 100.9, 7.8, "#58585a"], [224.0, 100.9, 7.8, "#e9193a"], [162.3, 115.2, 8.6, "#58585a"], [189.4, 129.3, 9.1, "#58585a"], [135.2, 137.1, 6.6, "#58585a"], [162.4, 145.7, 9.5, "#58585a"], [189.5, 160.7, 10.1, "#58585a"], [135.2, 164.7, 8.5, "#58585a"], [162.4, 177.4, 10.2, "#58585a"], [109.8, 177.4, 7.2, "#58585a"], [189.4, 192.3, 11.1, "#818285"], [135.3, 193.5, 11.0, "#58585a"], [162.5, 209.1, 11.1, "#818285"], [109.8, 208.7, 9.1, "#58585a"], [303.4, 208.7, 9.2, "#ca006c"], [189.4, 224.6, 11.1, "#818285"], [223.9, 224.6, 11.0, "#0079c2"], [135.3, 226.4, 11.1, "#818285"], [278.2, 226.4, 11.1, "#7d4199"], [162.4, 240.6, 10.2, "#818285"], [250.8, 240.6, 10.1, "#0079c2"], [109.8, 240.2, 9.0, "#818285"], [303.5, 240.2, 9.1, "#7d4199"], [189.4, 256.0, 10.9, "#a7a9ac"], [224.0, 256.0, 10.9, "#0079c2"], [135.3, 257.7, 10.1, "#818285"], [278.2, 257.6, 10.1, "#0079c2"], [162.4, 272.4, 9.9, "#a7a9ac"], [251.0, 272.3, 9.9, "#0079c2"], [109.8, 271.5, 7.1, "#818285"], [303.5, 271.5, 7.2, "#0079c2"], [189.4, 287.6, 10.2, "#a7a9ac"], [223.9, 287.5, 10.1, "#00a4e4"], [135.3, 288.5, 9.2, "#a7a9ac"], [278.1, 288.5, 9.3, "#0079c2"], [162.3, 304.0, 8.8, "#a7a9ac"], [251.0, 304.0, 8.8, "#00a4e4"], [135.2, 316.8, 6.6, "#a7a9ac"], [189.4, 319.6, 9.2, "#a7a9ac"], [223.9, 319.5, 9.2, "#00a4e4"], [278.1, 316.8, 6.6, "#00a4e4"], [162.4, 333.8, 8.1, "#a7a9ac"], [250.8, 333.8, 8.1, "#00a4e4"], [189.4, 348.1, 7.8, "#a7a9ac"], [224.0, 348.1, 7.8, "#00a4e4"]];
  var LINKS = [{"c": "#e9193a", "nodes": [[224, 129, 10.8], [251, 115, 9.8], [251, 145, 11.2]], "segs": [[240, 131, 224, 129], [240, 131, 251, 115], [240, 131, 251, 145]]}, {"c": "#e9193a", "nodes": [[278, 137, 9.6], [278, 165, 10.2], [303, 177, 8.4]], "segs": [[278, 137, 278, 165], [278, 165, 303, 177]]}, {"c": "#ca006c", "nodes": [[224, 161, 11.7], [251, 178, 11.7], [278, 194, 12.0]], "segs": [[224, 161, 251, 178], [251, 178, 278, 194]]}, {"c": "#7d4199", "nodes": [[223, 192, 10.8], [251, 209, 11.0]], "segs": [[223, 192, 251, 209]]}];
  var SLOW = 2; // test: everything takes twice as long
  var MID = 212, START = '#b9bbbe';
  svg.setAttribute('viewBox', '92 88 228 274');
  // "Goo" filter: blur then sharpen the alpha so linked dots and their connectors melt into one
  // smooth blob, like the logo's links. Applied only to the linked groups.
  var defs = document.createElementNS(NS, 'defs');
  defs.innerHTML = '<filter id="nprl-goo" x="-20%" y="-20%" width="140%" height="140%">' +
    '<feGaussianBlur in="SourceGraphic" stdDeviation="3.6" result="b"/>' +
    '<feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11" result="g"/>' +
    '<feComposite in="SourceGraphic" in2="g" operator="atop"/></filter>';
  svg.appendChild(defs);
  var dotLayer = document.createElementNS(NS, 'g'); svg.appendChild(dotLayer);
  function circle(x, y, r, c, parent) {
    var el = document.createElementNS(NS, 'circle');
    el.setAttribute('cx', x); el.setAttribute('cy', y); el.setAttribute('r', r);
    el.setAttribute('class', 'cx-dot');
    var right = x > MID;
    el.style.fill = right && !reduce ? START : c;
    if (right && !reduce) el.dataset.color = c;
    el.dataset.y = y;
    (parent || dotLayer).appendChild(el);
  }
  DOTS.forEach(function (d) { circle(d[0], d[1], d[2], d[3]); });
  var lines = [];
  LINKS.forEach(function (L, i) {
    var group = document.createElementNS(NS, 'g');
    group.setAttribute('filter', 'url(#nprl-goo)');
    svg.appendChild(group);
    var w = Math.min.apply(null, L.nodes.map(function (n) { return n[2]; })) * 0.78;
    L.segs.forEach(function (s) {
      var line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', s[0]); line.setAttribute('y1', s[1]); line.setAttribute('x2', s[2]); line.setAttribute('y2', s[3]);
      line.setAttribute('stroke', L.c); line.setAttribute('stroke-width', w.toFixed(1)); line.setAttribute('stroke-linecap', 'round');
      var len = Math.hypot(s[2] - s[0], s[3] - s[1]);
      if (!reduce) {
        line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
        line.style.transition = 'stroke-dashoffset ' + 450 * SLOW + 'ms ease ' + (900 + i * 160) * SLOW + 'ms';
      }
      group.appendChild(line); lines.push(line);
    });
    L.nodes.forEach(function (n) { circle(n[0], n[1], n[2], L.c, group); });
    // the three-way joint in the top red cluster is a filled knot in the logo
    if (L.segs.length === 3 && L.segs[0][0] === L.segs[1][0]) {
      var knot = document.createElementNS(NS, 'circle');
      knot.setAttribute('cx', L.segs[0][0]); knot.setAttribute('cy', L.segs[0][1]); knot.setAttribute('r', 7);
      knot.setAttribute('fill', L.c);
      if (!reduce) { knot.style.opacity = 0; knot.style.transition = 'opacity ' + 300 * SLOW + 'ms ease ' + (900 + i * 160) * SLOW + 'ms'; lines.push({ style: knot.style, knot: true }); }
      group.appendChild(knot);
    }
  });
  if (reduce) return;
  requestAnimationFrame(function () { requestAnimationFrame(function () {
    svg.querySelectorAll('circle[data-color]').forEach(function (el) {
      el.style.transition = 'fill ' + 700 * SLOW + 'ms ease ' + (150 + (el.dataset.y - 100) * 3) * SLOW + 'ms';
      el.style.fill = el.dataset.color;
    });
    lines.forEach(function (l) { if (l.knot) l.style.opacity = 1; else l.style.strokeDashoffset = 0; });
  }); });
})();
