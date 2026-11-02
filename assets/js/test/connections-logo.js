// TEST: home hero drawn from the lab logo's exact dot positions (traced from NPRL_Logo.png).
// Right half starts gray, then colors in from top to bottom and the linked dots connect.
(function () {
  var svg = document.getElementById('connections');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DOTS = [[189.4, 100.9, 7.8, "#58585a"], [224.0, 100.9, 7.8, "#e9193a"], [162.3, 115.2, 8.6, "#58585a"], [189.4, 129.3, 9.1, "#58585a"], [135.2, 137.1, 6.6, "#58585a"], [162.4, 145.7, 9.5, "#58585a"], [189.5, 160.7, 10.1, "#58585a"], [135.2, 164.7, 8.5, "#58585a"], [162.4, 177.4, 10.2, "#58585a"], [109.8, 177.4, 7.2, "#58585a"], [189.4, 192.3, 11.1, "#818285"], [135.3, 193.5, 11.0, "#58585a"], [162.5, 209.1, 11.1, "#818285"], [109.8, 208.7, 9.1, "#58585a"], [303.4, 208.7, 9.2, "#ca006c"], [189.4, 224.6, 11.1, "#818285"], [223.9, 224.6, 11.0, "#0079c2"], [135.3, 226.4, 11.1, "#818285"], [278.2, 226.4, 11.1, "#7d4199"], [162.4, 240.6, 10.2, "#818285"], [250.8, 240.6, 10.1, "#0079c2"], [109.8, 240.2, 9.0, "#818285"], [303.5, 240.2, 9.1, "#7d4199"], [189.4, 256.0, 10.9, "#a7a9ac"], [224.0, 256.0, 10.9, "#0079c2"], [135.3, 257.7, 10.1, "#818285"], [278.2, 257.6, 10.1, "#0079c2"], [162.4, 272.4, 9.9, "#a7a9ac"], [251.0, 272.3, 9.9, "#0079c2"], [109.8, 271.5, 7.1, "#818285"], [303.5, 271.5, 7.2, "#0079c2"], [189.4, 287.6, 10.2, "#a7a9ac"], [223.9, 287.5, 10.1, "#00a4e4"], [135.3, 288.5, 9.2, "#a7a9ac"], [278.1, 288.5, 9.3, "#0079c2"], [162.3, 304.0, 8.8, "#a7a9ac"], [251.0, 304.0, 8.8, "#00a4e4"], [135.2, 316.8, 6.6, "#a7a9ac"], [189.4, 319.6, 9.2, "#a7a9ac"], [223.9, 319.5, 9.2, "#00a4e4"], [278.1, 316.8, 6.6, "#00a4e4"], [162.4, 333.8, 8.1, "#a7a9ac"], [250.8, 333.8, 8.1, "#00a4e4"], [189.4, 348.1, 7.8, "#a7a9ac"], [224.0, 348.1, 7.8, "#00a4e4"]];
  var LINKS = [{"c": "#e9193a", "nodes": [[224, 129, 10.8], [254, 114, 10.6], [256, 147, 11.3]], "segs": [[243, 131, 224, 129], [243, 131, 254, 114], [243, 131, 256, 147]]}, {"c": "#e9193a", "nodes": [[278, 137, 9.6], [281, 165, 10.2], [303, 177, 8.4]], "segs": [[278, 137, 281, 165], [281, 165, 303, 177]]}, {"c": "#ca006c", "nodes": [[224, 161, 11.7], [251, 178, 11.7], [278, 194, 12.0]], "segs": [[224, 161, 251, 178], [251, 178, 278, 194]]}, {"c": "#7d4199", "nodes": [[223, 192, 10.8], [251, 209, 11.0]], "segs": [[223, 192, 251, 209]]}];
  var MID = 212, START = '#b9bbbe';
  svg.setAttribute('viewBox', '92 88 228 274');
  var lineLayer = document.createElementNS(NS, 'g'); svg.appendChild(lineLayer);
  var dotLayer = document.createElementNS(NS, 'g'); svg.appendChild(dotLayer);
  function circle(x, y, r, c) {
    var el = document.createElementNS(NS, 'circle');
    el.setAttribute('cx', x); el.setAttribute('cy', y); el.setAttribute('r', r);
    el.setAttribute('class', 'cx-dot');
    var right = x > MID;
    el.style.fill = right && !reduce ? START : c;
    if (right && !reduce) el.dataset.color = c;
    el.dataset.y = y;
    dotLayer.appendChild(el);
  }
  DOTS.forEach(function (d) { circle(d[0], d[1], d[2], d[3]); });
  var lines = [];
  LINKS.forEach(function (L, i) {
    var w = Math.min.apply(null, L.nodes.map(function (n) { return n[2]; })) * 1.2;
    L.segs.forEach(function (s) {
      var line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', s[0]); line.setAttribute('y1', s[1]); line.setAttribute('x2', s[2]); line.setAttribute('y2', s[3]);
      line.setAttribute('stroke', L.c); line.setAttribute('stroke-width', w.toFixed(1)); line.setAttribute('stroke-linecap', 'round');
      var len = Math.hypot(s[2] - s[0], s[3] - s[1]);
      if (!reduce) {
        line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
        line.style.transition = 'stroke-dashoffset 450ms ease ' + (900 + i * 160) + 'ms';
      }
      lineLayer.appendChild(line); lines.push(line);
    });
    L.nodes.forEach(function (n) { circle(n[0], n[1], n[2], L.c); });
  });
  if (reduce) return;
  requestAnimationFrame(function () { requestAnimationFrame(function () {
    dotLayer.querySelectorAll('circle[data-color]').forEach(function (el) {
      el.style.transitionDelay = (150 + (el.dataset.y - 100) * 3) + 'ms';
      el.style.fill = el.dataset.color;
    });
    lines.forEach(function (l) { l.style.strokeDashoffset = 0; });
  }); });
})();
