// Page Passions : vidéos YouTube à la demande et test de réflexes.
(function () {
  var EN = (document.documentElement.getAttribute("lang") || "fr").indexOf("en") === 0;
  var T = EN ? {
    ready: "Ready?", start: "Click here to start the first round.", wait: "Wait for the target…",
    early: "Too early!", earlyTip: "Click to try that round again.", next: "Click for the next round.",
    result: function (avg, best) { return "Average: " + avg + " ms, best: " + best + " ms. Click to play again."; },
    score: function (ms) { return ms + " ms"; }, finished: "Finished"
  } : {
    ready: "Prêt ?", start: "Cliquez ici pour lancer la première manche.", wait: "Attendez la cible…",
    early: "Trop tôt !", earlyTip: "Cliquez pour recommencer cette manche.", next: "Cliquez pour la manche suivante.",
    result: function (avg, best) { return "Moyenne : " + avg + " ms, meilleur : " + best + " ms. Cliquez pour rejouer."; },
    score: function (ms) { return ms + " ms"; }, finished: "Terminé"
  };

  // ---------- Vidéos YouTube : lecteur chargé seulement au clic ----------
  document.querySelectorAll("[data-yt]").forEach(function (box) {
    var btn = box.querySelector(".yt-play");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var id = box.getAttribute("data-yt");
      var frame = document.createElement("iframe");
      frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      frame.title = btn.getAttribute("aria-label") || "YouTube";
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      box.innerHTML = "";
      box.appendChild(frame);
      frame.focus();
    });
  });

  // ---------- Test de réflexes ----------
  var reflex = document.querySelector("[data-reflex]");
  if (reflex) {
    var arena = reflex.querySelector("[data-arena]");
    var msg = reflex.querySelector("[data-arena-msg]");
    var scoresEl = reflex.querySelector("[data-scores]");
    var rnow = reflex.querySelector("[data-reflex-now]");
    var ROUNDS = 5, state = "idle", times = [], timer = null, shownAt = 0, target = null;

    function say(title, sub) {
      msg.innerHTML = "";
      var span = document.createElement("span");
      var st = document.createElement("strong");
      st.textContent = title;
      span.appendChild(st);
      if (sub) span.appendChild(document.createTextNode(sub));
      msg.appendChild(span);
      msg.hidden = false;
    }
    function renderScores() {
      scoresEl.innerHTML = "";
      var best = times.length ? Math.min.apply(null, times) : null;
      times.forEach(function (ms) {
        var li = document.createElement("li");
        li.textContent = T.score(ms);
        if (ms === best) li.className = "is-best";
        scoresEl.appendChild(li);
      });
    }
    function clearTarget() { if (target) { target.remove(); target = null; } }
    function arm() {
      state = "waiting";
      clearTarget();
      say(T.wait, "");
      timer = setTimeout(function () {
        msg.hidden = true;
        target = document.createElement("button");
        target.type = "button";
        target.className = "target";
        target.setAttribute("aria-label", EN ? "Target" : "Cible");
        var r = arena.getBoundingClientRect();
        target.style.left = (30 + Math.random() * Math.max(10, r.width - 60)) + "px";
        target.style.top = (30 + Math.random() * Math.max(10, r.height - 60)) + "px";
        arena.appendChild(target);
        shownAt = performance.now();
        state = "shown";
      }, 900 + Math.random() * 1700);
    }
    function hit() {
      var ms = Math.round(performance.now() - shownAt);
      times.push(ms);
      renderScores();
      clearTarget();
      if (times.length >= ROUNDS) {
        state = "done";
        var avg = Math.round(times.reduce(function (a, b) { return a + b; }, 0) / times.length);
        var best = Math.min.apply(null, times);
        say(T.finished, T.result(avg, best));
        rnow.textContent = T.result(avg, best);
      } else {
        state = "between";
        say(T.score(ms), T.next);
      }
    }
    function act() {
      if (state === "idle" || state === "done") { times = []; renderScores(); rnow.textContent = ""; arm(); return; }
      if (state === "between") { arm(); return; }
      if (state === "waiting") { clearTimeout(timer); state = "between"; say(T.early, T.earlyTip); return; }
      if (state === "shown") hit();
    }
    arena.addEventListener("pointerdown", function (e) { e.preventDefault(); act(); });
    arena.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); act(); }
    });
    say(T.ready, T.start);
  }
})();
