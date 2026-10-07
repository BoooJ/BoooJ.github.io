// Simulation d'un mois d'environnement de test (données fictives, identiques à chaque visite).
(function () {
  var sim = document.querySelector('[data-sim="licences"]');
  if (!sim) return;
  var EN = (document.documentElement.getAttribute("lang") || "fr").indexOf("en") === 0;
  function L(fr, en) { return EN ? en : fr; }

  var range = sim.querySelector("[data-range]");
  var dayOut = sim.querySelector("[data-day]");
  var playBtn = sim.querySelector("[data-play]");
  var offOut = sim.querySelector("[data-off]");
  var onOut = sim.querySelector("[data-on]");
  var gridOff = sim.querySelector("[data-grid-off]");
  var gridOn = sim.querySelector("[data-grid-on]");
  var summary = sim.querySelector("[data-summary]");

  var DAYS = 30;
  var PROB = [0.75, 0.6, 0.45, 0.35, 0.3, 0.22, 0.18, 0.14, 0.1, 0.08, 0.06, 0.04];
  var PEOPLE = PROB.length;

  // Générateur pseudo-aléatoire à graine fixe : la même simulation pour tout le monde.
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var rand = mulberry32(20260812);

  var conn = [], first = [];
  for (var p = 0; p < PEOPLE; p++) {
    conn[p] = [];
    for (var d = 0; d < DAYS; d++) {
      var weekend = d % 7 === 5 || d % 7 === 6;
      conn[p][d] = rand() < PROB[p] * (weekend ? 0.1 : 1);
    }
    var f = conn[p].indexOf(true);
    first[p] = f === -1 ? Infinity : f;
  }

  function build(grid) {
    var cells = [];
    for (var p = 0; p < PEOPLE; p++) {
      for (var d = 0; d < DAYS; d++) {
        var c = document.createElement("span");
        c.className = "lic-cell";
        grid.appendChild(c);
        cells.push(c);
      }
    }
    return cells;
  }
  var cellsOff = build(gridOff), cellsOn = build(gridOn);

  function update(day) {
    var cumulative = 0, today = 0;
    for (var p = 0; p < PEOPLE; p++) {
      if (first[p] <= day - 1) cumulative++;
      if (conn[p][day - 1]) today++;
      for (var d = 0; d < DAYS; d++) {
        var i = p * DAYS + d;
        var future = d > day - 1;
        var used = conn[p][d];
        var billed = d >= first[p];
        cellsOff[i].className = "lic-cell" + (future ? " is-future" : used ? " is-used" : billed ? " is-billed" : "") + (d === day - 1 ? " is-today" : "");
        cellsOn[i].className = "lic-cell" + (future ? " is-future" : used ? " is-used" : "") + (d === day - 1 ? " is-today" : "");
      }
    }
    dayOut.textContent = day;
    offOut.textContent = cumulative;
    onOut.textContent = today;
    return { cumulative: cumulative, today: today };
  }

  function announce(day, r) {
    if (EN) {
      summary.textContent = "Day " + day + ": without release, " + r.cumulative + " licence" + (r.cumulative === 1 ? " stays" : "s stay") +
        " assigned and billed. With the nightly release, " + r.today + " used during the day, none the next morning.";
      return;
    }
    summary.textContent = "Jour " + day + " : sans reprise, " + r.cumulative + " licence" + (r.cumulative > 1 ? "s restent attribuées" : " reste attribuée") +
      " et facturée" + (r.cumulative > 1 ? "s" : "") + ". Avec la reprise de la nuit, " + r.today + " utilisée" + (r.today > 1 ? "s" : "") + " dans la journée, aucune le lendemain matin.";
  }

  var timer = null;
  function stopPlay(label) {
    clearInterval(timer);
    timer = null;
    playBtn.textContent = label || L("Lancer le mois", "Play the month");
    var day = Number(range.value);
    announce(day, update(day));
  }

  range.addEventListener("input", function () {
    if (timer) stopPlay();
    var day = Number(range.value);
    announce(day, update(day));
  });

  playBtn.addEventListener("click", function () {
    if (timer) { stopPlay(L("Reprendre", "Resume")); return; }
    if (Number(range.value) >= DAYS) range.value = 1;
    playBtn.textContent = L("Pause", "Pause");
    timer = setInterval(function () {
      var next = Number(range.value) + 1;
      if (next > DAYS) { stopPlay(L("Rejouer le mois", "Replay the month")); return; }
      range.value = next;
      update(next);
    }, 180);
  });

  announce(1, update(1));
})();
