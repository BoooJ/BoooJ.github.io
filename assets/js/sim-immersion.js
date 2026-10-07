// Immersion : défilement automatique des captures (ordinateur et téléphone), arrêté dès que le visiteur reprend la main.
(function () {
  var sim = document.querySelector('[data-sim="immersion"]');
  if (!sim) return;
  var button = sim.querySelector("[data-autoscroll]");
  var screens = sim.querySelectorAll(".screen");
  var running = false, last = null, dir = 1;
  var SPEED = 70; // pixels par seconde, pour l'écran le plus long

  function frame(ts) {
    if (!running) return;
    if (last === null) last = ts;
    var dt = Math.min(64, ts - last) / 1000;
    last = ts;
    var done = true;
    screens.forEach(function (sc) {
      var max = sc.scrollHeight - sc.clientHeight;
      if (max <= 0) return;
      var ratio = max / Math.max.apply(null, Array.prototype.map.call(screens, function (s) { return s.scrollHeight - s.clientHeight; }));
      sc.scrollTop = Math.max(0, Math.min(max, sc.scrollTop + dir * SPEED * ratio * dt));
      if ((dir > 0 && sc.scrollTop < max - 1) || (dir < 0 && sc.scrollTop > 1)) done = false;
    });
    if (done) dir = -dir;
    requestAnimationFrame(frame);
  }

  function set(on) {
    running = on;
    last = null;
    button.setAttribute("aria-pressed", String(on));
    if (on) requestAnimationFrame(frame);
  }

  button.addEventListener("click", function () { set(!running); });
  screens.forEach(function (sc) {
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) {
      sc.addEventListener(type, function () { if (running) set(false); }, { passive: true });
    });
  });
})();
