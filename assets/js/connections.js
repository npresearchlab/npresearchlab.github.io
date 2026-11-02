// Home page hero: the lab's dot-brain mark, drawn as a field of dots.
// On load, the right half "connects": dots take on the logo colors and links draw between neighbours.
(function () {
  var svg = document.getElementById('connections');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cols = 11, rows = 14, gx = 34, gy = 30;
  var cx = (cols - 1) / 2, cy = (rows - 1) / 2;
  var grays = ['#58585a', '#818285', '#a7a9ac'];
  // top to bottom on the right side, like the logo
  var hues = ['#e9193a', '#ca006c', '#7d4199', '#0079c2', '#00a4e4'];
  var dots = [];

  function inBrain(c, r) {
    // slightly egg-shaped outline
    var dx = (c - cx) / (cols / 2), dy = (r - cy) / (rows / 2);
    return dx * dx * 1.05 + dy * dy * (dy < 0 ? 1.0 : 1.1) < 0.98;
  }

  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      if (!inBrain(c, r)) continue;
      var x = 20 + c * gx, y = 20 + r * gy + (c % 2 ? gy / 2 : 0);
      var right = c > cx;
      // dots shrink toward the edge, like the logo
      var dx = (c - cx) / (cols / 2), dy = (r - cy) / (rows / 2);
      var rad = 9.5 - 4.2 * Math.sqrt(dx * dx + dy * dy);
      var depth = r / (rows - 1);
      var gray = grays[Math.min(2, Math.floor(depth * 3))];
      var hue = hues[Math.min(4, Math.floor(depth * 5))];
      var el = document.createElementNS(NS, 'circle');
      el.setAttribute('cx', x); el.setAttribute('cy', y); el.setAttribute('r', Math.max(3.2, rad).toFixed(1));
      el.setAttribute('class', 'cx-dot');
      el.style.fill = right && !reduce ? grays[2] : (right ? hue : gray);
      svg.appendChild(el);
      dots.push({ c: c, r: r, x: x, y: y, right: right, hue: hue, el: el, rad: rad });
    }
  }

  // Links between neighbouring right-side dots in the upper half: the "connections"
  var linkLayer = document.createElementNS(NS, 'g');
  svg.insertBefore(linkLayer, svg.firstChild);
  var pairs = [];
  var seed = 7;
  function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  // Short chains of 2-3 dots running down and to the right, like the links in the logo
  var used = {};
  function key(d) { return d.c + ',' + d.r; }
  function nextDot(a) {
    var best = null;
    dots.forEach(function (b) {
      if (b.c === a.c + 1 && b.y > a.y && b.y - a.y < 20 && !used[key(b)]) best = b;
    });
    return best;
  }
  dots.filter(function (d) { return d.right && d.r < rows * 0.58; }).forEach(function (a) {
    if (used[key(a)] || rand() > 0.5) return;
    var steps = rand() < 0.5 ? 1 : 2, cur = a;
    for (var i = 0; i < steps; i++) {
      var n = nextDot(cur);
      if (!n) break;
      used[key(cur)] = used[key(n)] = true;
      pairs.push([cur, n]);
      cur = n;
    }
  });
  pairs.forEach(function (p, i) {
    var line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', p[0].x); line.setAttribute('y1', p[0].y);
    line.setAttribute('x2', p[1].x); line.setAttribute('y2', p[1].y);
    line.setAttribute('stroke', p[0].hue);
    line.setAttribute('stroke-width', Math.min(p[0].rad, p[1].rad) * 1.15);
    line.setAttribute('class', 'cx-link');
    var len = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    if (!reduce) {
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      line.style.transition = 'stroke-dashoffset 500ms ease ' + (700 + i * 45) + 'ms';
    }
    linkLayer.appendChild(line);
    p.line = line;
  });

  var maxX = 20 + (cols - 1) * gx, maxY = 20 + rows * gy;
  svg.setAttribute('viewBox', '0 0 ' + (maxX + 20) + ' ' + (maxY + 10));

  if (reduce) return;
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      dots.forEach(function (d) {
        if (!d.right) return;
        d.el.style.transitionDelay = (150 + (d.c - cx) * 90 + d.r * 25) + 'ms';
        d.el.style.fill = d.hue;
      });
      pairs.forEach(function (p) { p.line.style.strokeDashoffset = 0; });
    });
  });
})();
