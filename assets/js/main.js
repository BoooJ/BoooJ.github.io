// Script commun à toutes les pages (français et anglais : la langue est lue sur <html lang>).
// 1. Thème clair / sombre   2. Ticket de contact   3. Matrice de compétences
// 4. Plan de câblage        5. Vidéos qui se lancent à l'écran
(function () {
  var root = document.documentElement;
  var KEY = "pm-theme";
  var EN = (root.getAttribute("lang") || "fr").indexOf("en") === 0;

  var T = EN ? {
    toLight: "Switch to light theme", toDark: "Switch to dark theme",
    night: "Night mode. At Good iD, this is when my script took the test licences back.",
    subject: "Contact from your portfolio",
    play: "Play the video", pause: "Pause the video",
    wiring: {
      ecran: "Display: connected to the base unit over HDMI, then display settings are checked.",
      uc: "ChromeOS base unit: the heart of the room. Enrolled in the client's domain back at the workshop, then linked to the room's calendar resource, otherwise every meeting code has to be typed in.",
      barre: "Sound and camera bar: USB-C to the base unit, on its own power supply. The microphones plug into it.",
      micro: "Microphones: into the dedicated port at the back of the bar; several of them are daisy-chained.",
      tablette: "Control tablet: two links, USB-C for control and PoE network for power. Forgetting one gives a symptom that does not point to its cause.",
      poe: "PoE box: takes the network from the base unit and powers the tablet over the same cable.",
      secteur: "Mains power: base unit and bar on two separate power supplies."
    }
  } : {
    toLight: "Passer en thème clair", toDark: "Passer en thème sombre",
    night: "Mode nuit. Chez Good iD, c'était l'heure où mon script reprenait les licences de test.",
    subject: "Prise de contact depuis votre portfolio",
    play: "Lire la vidéo", pause: "Mettre la vidéo en pause",
    wiring: {
      ecran: "Écran : relié à l'unité centrale en HDMI ; on vérifie ensuite les réglages d'affichage.",
      uc: "Unité centrale ChromeOS : le cœur de la salle. Enrôlée sur le domaine du client dès l'atelier, puis associée à la ressource d'agenda de la salle, sans quoi il faut taper le code de chaque réunion.",
      barre: "Barre son et caméra : USB-C vers l'unité centrale, sur une alimentation distincte. Les microphones s'y branchent.",
      micro: "Microphones : sur le port dédié à l'arrière de la barre ; s'il y en a plusieurs, ils se branchent en série.",
      tablette: "Tablette de contrôle : deux liaisons, l'USB-C pour le pilotage et le réseau PoE pour l'alimentation. Oublier l'une des deux donne un symptôme qui n'oriente pas vers sa cause.",
      poe: "Boîtier PoE : reçoit le réseau de l'unité centrale et alimente la tablette par le même câble.",
      secteur: "Alimentation secteur : unité centrale et barre sur deux alimentations distinctes."
    }
  };

  function read(store, key) {
    try { return window[store].getItem(key); } catch (e) { return null; }
  }
  function write(store, key, value) {
    try { window[store].setItem(key, value); } catch (e) { /* stockage indisponible : sans effet */ }
  }
  function currentTheme() {
    var forced = root.getAttribute("data-theme");
    if (forced) return forced;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  var saved = read("localStorage", KEY);
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  // ?theme=light ou ?theme=dark impose un thème pour ce lien, sans rien mémoriser.
  var forcedTheme = /[?&]theme=(light|dark)\b/.exec(window.location.search);
  if (forcedTheme) root.setAttribute("data-theme", forcedTheme[1]);

  window.pmTicket = function () { return "T-" + Math.floor(100000 + Math.random() * 900000); };
  window.pmLang = EN ? "en" : "fr";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !/[?&]motion=on\b/.test(window.location.search);
  window.pmReduceMotion = reduceMotion;

  function showToast(text) {
    var toast = document.querySelector("[data-toast]");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("data-toast", "");
      toast.hidden = true;
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { toast.hidden = true; }, 5200);
  }

  document.addEventListener("DOMContentLoaded", function () {
    // 1. Thème
    var button = document.querySelector("[data-theme-toggle]");
    if (button) {
      var label = function () {
        var text = currentTheme() === "dark" ? T.toLight : T.toDark;
        button.setAttribute("aria-label", text);
        button.setAttribute("title", text);
      };
      label();
      button.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        write("localStorage", KEY, next);
        label();
        if (next === "dark" && !read("sessionStorage", "pm-night")) {
          write("sessionStorage", "pm-night", "1");
          showToast(T.night);
        }
      });
    }

    // 2. Ticket de contact
    var ticket = window.pmTicket();
    document.querySelectorAll("[data-ticket]").forEach(function (el) { el.textContent = ticket; });
    document.querySelectorAll("a[data-mailto]").forEach(function (a) {
      var base = a.getAttribute("href").split("?")[0];
      a.setAttribute("href", base + "?subject=" + encodeURIComponent("[" + ticket + "] " + T.subject));
    });

    // 3. Matrice : surligner la colonne survolée ou ciblée au clavier
    var matrix = document.querySelector("[data-matrix]");
    if (matrix) {
      var setCol = function (col) {
        matrix.querySelectorAll(".is-col").forEach(function (el) { el.classList.remove("is-col"); });
        if (!col) return;
        matrix.querySelectorAll('[data-col="' + col + '"]').forEach(function (el) { el.classList.add("is-col"); });
      };
      var colOf = function (e) { var cell = e.target.closest("[data-col]"); return cell ? cell.getAttribute("data-col") : null; };
      matrix.addEventListener("mouseover", function (e) { setCol(colOf(e)); });
      matrix.addEventListener("mouseleave", function () { setCol(null); });
      matrix.addEventListener("focusin", function (e) { setCol(colOf(e)); });
      matrix.addEventListener("focusout", function () { setCol(null); });
    }

    // 4. Plan de câblage
    var wiring = document.querySelector("[data-wiring]");
    if (wiring) {
      var readout = wiring.querySelector("[data-wiring-readout]");
      var idle = readout ? readout.textContent : "";
      var focusDevice = function (id) {
        wiring.classList.toggle("is-focus", !!id);
        wiring.querySelectorAll(".is-on").forEach(function (el) { el.classList.remove("is-on"); });
        if (!id) { if (readout) readout.textContent = idle; return; }
        wiring.querySelectorAll("[data-for]").forEach(function (el) {
          if (el.getAttribute("data-for").split(" ").indexOf(id) !== -1) el.classList.add("is-on");
        });
        var dev = wiring.querySelector('[data-dev="' + id + '"]');
        if (dev) dev.classList.add("is-on");
        if (readout) readout.textContent = T.wiring[id] || "";
      };
      wiring.querySelectorAll("[data-dev]").forEach(function (dev) {
        var id = dev.getAttribute("data-dev");
        dev.addEventListener("mouseenter", function () { focusDevice(id); });
        dev.addEventListener("focus", function () { focusDevice(id); });
        dev.addEventListener("click", function () { focusDevice(id); });
        dev.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focusDevice(id); }
        });
      });
      wiring.addEventListener("mouseleave", function () {
        if (!wiring.contains(document.activeElement)) focusDevice(null);
      });
    }

    // 5. Vidéos : lecture muette quand elles sont à l'écran (sauf mouvement réduit), bouton lecture / pause
    var clips = document.querySelectorAll("video[data-clip]");
    var playIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>';
    var pauseIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>';
    clips.forEach(function (video) {
      var btn = video.parentElement.querySelector(".clip-play");
      video.muted = true;
      var sync = function () {
        if (!btn) return;
        var playing = !video.paused;
        btn.innerHTML = playing ? pauseIcon : playIcon;
        btn.setAttribute("aria-label", playing ? T.pause : T.play);
      };
      video.addEventListener("play", sync);
      video.addEventListener("pause", sync);
      if (btn) {
        btn.addEventListener("click", function () {
          video.dataset.user = "1";
          if (video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); } else { video.pause(); }
        });
      }
      sync();
    });
    if (!reduceMotion && "IntersectionObserver" in window && clips.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          if (v.dataset.user === "1") return;
          if (entry.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else v.pause();
        });
      }, { threshold: 0.6 });
      clips.forEach(function (v) { io.observe(v); });
    }

    // 6. Compétences : filtre par projet
    var skills = document.querySelector("[data-skills]");
    if (skills) {
      var summary = skills.querySelector("[data-skills-summary]");
      var filters = skills.querySelectorAll("[data-skill-filter]");
      filters.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var p = btn.getAttribute("data-skill-filter");
          filters.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
          var all = p === "all";
          skills.classList.toggle("is-filtered", !all);
          skills.style.setProperty("--fc", all ? "transparent" : "var(--p" + p + ")");
          var n = 0;
          skills.querySelectorAll(".skill").forEach(function (li) {
            var match = !all && li.getAttribute("data-p").split(" ").indexOf(p) !== -1;
            li.classList.toggle("is-match", match);
            if (match) n++;
            li.querySelectorAll(".pill").forEach(function (pill) { pill.classList.toggle("is-match", match && pill.classList.contains("p" + p)); });
          });
          var name = btn.textContent.trim();
          summary.textContent = all ? "" : (EN ? name + ": " + n + " skill" + (n > 1 ? "s" : "") + " used."
                                               : name + " : " + n + " compétence" + (n > 1 ? "s" : "") + " mobilisée" + (n > 1 ? "s" : "") + ".");
        });
      });
    }
  });
})();
