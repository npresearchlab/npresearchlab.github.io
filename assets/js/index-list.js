/* What we study (home): hovering or focusing a row shows its photo on the right. */
(function () {
  document.querySelectorAll('[data-idx]').forEach(function (box) {
    var img = box.querySelector('.idx-preview img');
    var items = box.querySelectorAll('.idx-list li');
    function pick(li) {
      items.forEach(function (x) { x.classList.toggle('on', x === li); });
      var a = li.querySelector('a');
      if (img.getAttribute('src') !== a.dataset.img) { img.style.opacity = 0; setTimeout(function () { img.src = a.dataset.img; img.style.opacity = 1; }, 150); }
    }
    items.forEach(function (li) {
      li.addEventListener('mouseenter', function () { pick(li); });
      li.querySelector('a').addEventListener('focus', function () { pick(li); });
    });
    pick(items[0]);
  });
})();
