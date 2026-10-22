// Script commun à toutes les pages (français et anglais : la langue est lue sur <html lang>).
// 1. Thème clair / sombre   2. Ticket de contact   3. Matrice de compétences
// 4. Plan de câblage        5. Vidéos qui se lancent à l'écran   6. Filtre des compétences
// 7. Section en cours dans le menu (accueil)   8. Sommaire des études de cas
// 9. Langue : garder la position   10. Retour en haut   11. Visionneuse d'images
// 12. Copier l'adresse e-mail
(function () {
  var root = document.documentElement;
  var KEY = "pm-theme";
  var EN = (root.getAttribute("lang") || "fr").indexOf("en") === 0;

  var T = EN ? {
    toLight: "Switch to light theme", toDark: "Switch to dark theme",
    night: "Night mode. At Good iD, this is when my script took the test licences back.",
    subject: "Contact from your portfolio",
    play: "Play video", pause: "Pause video", sep: ": ",
    toc: "On this page", top: "Back to top",
    enlarge: "Enlarge image", viewer: "Enlarged image", close: "Close",
    copied: "Address copied: ", copyFail: "Copy failed. The address is ",
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
    play: "Lire la vidéo", pause: "Mettre la vidéo en pause", sep: " : ",
    toc: "Sur cette page", top: "Haut de page",
    enlarge: "Agrandir l'image", viewer: "Image agrandie", close: "Fermer",
    copied: "Adresse copiée : ", copyFail: "Copie impossible. L'adresse est ",
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

  // Identifiant d'ancre à partir d'un titre : « Résultats vérifiables » → « resultats-verifiables »
  function slug(text) {
    var s = String(text || "");
    if (s.normalize) s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  // Section en cours : la dernière dont le haut a franchi 45 % de la hauteur de la fenêtre.
  function currentOf(sections) {
    var line = window.innerHeight * 0.45;
    var found = null;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= line) found = sections[i];
    }
    var doc = document.documentElement;
    if (sections.length && window.innerHeight + window.pageYOffset >= doc.scrollHeight - 2) {
      var last = sections[sections.length - 1];
      if (last.getBoundingClientRect().top < window.innerHeight) found = last;
    }
    return found;
  }

  // Observe le passage des sections dans une bande au milieu de l'écran et appelle apply(section en cours).
  // Après un clic sur une ancre interne (menu, sommaire), la section visée reste désignée
  // jusqu'à ce que le visiteur reprenne la main (molette, clavier, souris, doigt) :
  // une section courte en haut de l'écran n'atteint pas la bande et ne serait jamais désignée.
  // Identifiant visé par une ancre « #section » (null si absent ou illisible)
  function idOf(hash) {
    var raw = String(hash || "").replace(/^#/, "");
    try { return raw ? decodeURIComponent(raw) : null; } catch (e) { return raw; }
  }

  function spy(sections, apply) {
    if (!sections.length) return;
    var locked = null;
    var update = function () { apply(locked || currentOf(sections)); };
    var lockOn = function (id) {
      var target = id ? document.getElementById(id) : null;
      if (!target || sections.indexOf(target) === -1) return;
      locked = target;
      update();
    };
    var unlock = function () { if (locked) { locked = null; update(); } };
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (a) lockOn(idOf(a.getAttribute("href")));
    });
    ["wheel", "touchmove", "keydown", "mousedown"].forEach(function (type) {
      window.addEventListener(type, unlock, { passive: true });
    });
    if (window.location.hash) lockOn(idOf(window.location.hash));
    update();
    if (!("IntersectionObserver" in window)) {
      window.addEventListener("scroll", update, { passive: true });
      return;
    }
    var observer = new IntersectionObserver(update, { rootMargin: "-40% 0px -55% 0px" });
    for (var i = 0; i < sections.length; i++) observer.observe(sections[i]);
    // En bas de page, la dernière section peut ne jamais atteindre la bande.
    window.addEventListener("scroll", function () {
      var doc = document.documentElement;
      if (window.innerHeight + window.pageYOffset >= doc.scrollHeight - 2) update();
    }, { passive: true });
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
    document.querySelectorAll("span[data-ticket]").forEach(function (el) { el.textContent = ticket; });
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

    // 5. Vidéos : lecture muette quand elles sont à l'écran (sauf mouvement réduit), bouton lecture / pause.
    // Vitrine de l'accueil, sur un appareil avec survol : seule la première se lance seule,
    // les autres jouent au survol ou au focus et s'arrêtent quand on les quitte.
    var clips = document.querySelectorAll("video[data-clip]");
    var playIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>';
    var pauseIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>';
    var canHover = window.matchMedia && window.matchMedia("(hover: hover)").matches;
    var startClip = function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    var autoClips = [];
    clips.forEach(function (video) {
      var btn = video.parentElement.querySelector(".clip-play");
      var name = video.getAttribute("aria-label") || "";
      video.muted = true;
      var sync = function () {
        if (!btn) return;
        var playing = !video.paused;
        btn.innerHTML = playing ? pauseIcon : playIcon;
        btn.setAttribute("aria-label", (playing ? T.pause : T.play) + (name ? T.sep + name : ""));
      };
      video.addEventListener("play", sync);
      video.addEventListener("pause", sync);
      if (btn) {
        btn.addEventListener("click", function () {
          video.dataset.user = "1";
          if (video.paused) startClip(video); else video.pause();
        });
      }
      sync();

      var reel = video.closest("[data-reel]");
      if (!reel || !canHover || reel.querySelector("video[data-clip]") === video) { autoClips.push(video); return; }
      if (reduceMotion) return;
      var fig = video.closest(".clip-fig") || video.parentElement;
      var hoverStart = function () { if (video.dataset.user !== "1") startClip(video); };
      var hoverStop = function () { if (video.dataset.user !== "1") video.pause(); };
      fig.addEventListener("mouseenter", hoverStart);
      fig.addEventListener("mouseleave", function () { if (!fig.contains(document.activeElement)) hoverStop(); });
      fig.addEventListener("focusin", hoverStart);
      fig.addEventListener("focusout", function (e) { if (!fig.contains(e.relatedTarget) && !fig.matches(":hover")) hoverStop(); });
    });
    if (!reduceMotion && "IntersectionObserver" in window && autoClips.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          if (v.dataset.user === "1") return;
          if (entry.isIntersecting) startClip(v);
          else v.pause();
        });
      }, { threshold: 0.6 });
      autoClips.forEach(function (v) { io.observe(v); });
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

    // Position courante, retenue pour le changement de langue (identifiant de section, ou null)
    var position = { known: false, id: null };

    // 7. Accueil : le lien du menu de la section en cours reçoit aria-current
    var homeSections = Array.prototype.slice.call(document.querySelectorAll("main > section[id]"));
    var navLinks = {};
    document.querySelectorAll(".site-nav a[href^='#']").forEach(function (a) { navLinks[a.getAttribute("href").slice(1)] = a; });
    if (homeSections.length && Object.keys(navLinks).length) {
      position.known = true;
      spy(homeSections, function (section) {
        position.id = section ? section.id : null;
        var target = section ? navLinks[section.getAttribute("data-spy") || section.id] : null;
        Object.keys(navLinks).forEach(function (k) {
          if (navLinks[k] === target) navLinks[k].setAttribute("aria-current", "true");
          else navLinks[k].removeAttribute("aria-current");
        });
      });
    }

    // 8. Études de cas : sommaire construit à partir des titres, section en cours surlignée
    var content = document.querySelector(".case-content");
    var meta = document.querySelector(".case-meta");
    if (content && meta) {
      var parts = [];
      Array.prototype.forEach.call(content.children, function (child) {
        if (child.tagName !== "SECTION") return;
        var h2 = child.querySelector("h2");
        if (!h2) return;
        if (!child.id) child.id = slug(h2.textContent);
        parts.push({ section: child, title: h2.textContent.replace(/\s+/g, " ").trim() });
      });
      if (parts.length > 1) {
        var toc = document.createElement("nav");
        toc.className = "case-toc";
        toc.setAttribute("aria-label", T.toc);
        var tocTitle = document.createElement("p");
        tocTitle.className = "case-toc-title";
        tocTitle.setAttribute("aria-hidden", "true");
        tocTitle.textContent = T.toc;
        var list = document.createElement("ol");
        parts.forEach(function (part) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = "#" + part.section.id;
          a.textContent = part.title;
          part.link = a;
          li.appendChild(a);
          list.appendChild(li);
        });
        toc.appendChild(tocTitle);
        toc.appendChild(list);
        meta.appendChild(toc);
        var tocSections = parts.map(function (part) { return part.section; });
        position.known = true;
        // Fiche collante plus haute que l'écran : une fois la fiche collée en haut et la lecture commencée,
        // elle défile d'elle-même pour garder le sommaire entièrement visible.
        var activeSection = null, wasStuck = null, metaTicking = false;
        // Collée, ou déjà repoussée vers le haut par la fin de l'article
        var isStuck = function () {
          var top = parseFloat(window.getComputedStyle(meta).top);
          return !isNaN(top) && meta.getBoundingClientRect().top <= top + 2;
        };
        var revealToc = function () {
          if (meta.scrollHeight <= meta.clientHeight + 1) return;
          if (!activeSection || !isStuck()) { meta.scrollTop = 0; return; }
          var overflow = toc.getBoundingClientRect().bottom - meta.getBoundingClientRect().bottom;
          if (overflow > 0) meta.scrollTop += overflow + 4;
        };
        window.addEventListener("scroll", function () {
          if (metaTicking) return;
          metaTicking = true;
          window.requestAnimationFrame(function () {
            metaTicking = false;
            var stuck = isStuck();
            if (stuck !== wasStuck) { wasStuck = stuck; revealToc(); }
          });
        }, { passive: true });
        spy(tocSections, function (section) {
          position.id = section ? section.id : null;
          activeSection = section;
          revealToc();
          parts.forEach(function (part) {
            if (part.section === section) part.link.setAttribute("aria-current", "true");
            else part.link.removeAttribute("aria-current");
          });
        });
      }
    }

    // 9. Changement de langue : la page d'arrivée s'ouvre à la même section
    document.querySelectorAll(".lang-switch").forEach(function (a) {
      var keepPosition = function () {
        var base = a.getAttribute("href").split("#")[0];
        var id = position.known ? position.id : (window.location.hash ? window.location.hash.slice(1) : null);
        a.setAttribute("href", id ? base + "#" + id : base);
      };
      a.addEventListener("mousedown", keepPosition);
      a.addEventListener("click", keepPosition);
    });

    // 10. Retour en haut : bouton affiché après deux écrans de défilement
    var toTop = document.createElement("button");
    toTop.type = "button";
    toTop.className = "to-top";
    toTop.setAttribute("aria-label", T.top);
    toTop.setAttribute("title", T.top);
    toTop.innerHTML = '<span aria-hidden="true">↑</span>';
    toTop.hidden = true;
    document.body.appendChild(toTop);
    var topTicking = false;
    var syncTop = function () {
      topTicking = false;
      toTop.hidden = window.pageYOffset < window.innerHeight * 2;
    };
    window.addEventListener("scroll", function () {
      if (!topTicking) { topTicking = true; window.requestAnimationFrame(syncTop); }
    }, { passive: true });
    syncTop();
    toTop.addEventListener("click", function () {
      // Le défilement doux vient de la feuille de style (désactivé en mouvement réduit).
      window.scrollTo(0, 0);
      var home = document.querySelector(".wordmark");
      if (home) {
        try { home.focus({ preventScroll: true }); } catch (e) { home.focus(); }
      }
    });

    // 11. Visionneuse : captures d'écran, écrans de l'app mobile et visuels publicitaires
    var zoomables = document.querySelectorAll(".figure-frame--flush img, .app-phone img, .ad-still");
    var testDialog = document.createElement("dialog");
    if (zoomables.length && typeof testDialog.showModal === "function") {
      var box = document.createElement("dialog");
      box.className = "lightbox";
      box.setAttribute("aria-label", T.viewer);
      // La légende reprend le texte alternatif de l'image : masquée aux lecteurs d'écran pour ne pas le lire deux fois.
      box.innerHTML = '<figure class="lightbox-fig"><figcaption class="lightbox-cap" aria-hidden="true"></figcaption></figure>' +
        '<button class="lightbox-close" type="button"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>';
      document.body.appendChild(box);
      var boxCap = box.querySelector(".lightbox-cap");
      // L'image n'est créée qu'à la première ouverture (pas d'image sans source dans la page).
      var boxImg = null;
      var boxClose = box.querySelector(".lightbox-close");
      boxClose.setAttribute("aria-label", T.close);
      boxClose.setAttribute("title", T.close);
      var opener = null;
      var openViewer = function (img) {
        opener = img;
        if (!boxImg) {
          boxImg = document.createElement("img");
          boxImg.className = "lightbox-img";
          boxCap.parentNode.insertBefore(boxImg, boxCap);
        }
        boxImg.src = img.currentSrc || img.src;
        boxImg.alt = img.alt || "";
        boxCap.textContent = img.alt || "";
        boxCap.hidden = !img.alt;
        box.showModal();
        boxClose.focus();
      };
      boxClose.addEventListener("click", function () { box.close(); });
      // Un clic hors de l'image (sur le fond) ferme la visionneuse.
      box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
      box.addEventListener("close", function () {
        if (opener) opener.focus();
        opener = null;
      });
      zoomables.forEach(function (img) {
        if (img.closest("a, button")) return;
        img.classList.add("is-zoomable");
        img.setAttribute("tabindex", "0");
        img.setAttribute("role", "button");
        img.setAttribute("aria-label", T.enlarge + (img.alt ? T.sep + img.alt : ""));
        img.addEventListener("click", function () { openViewer(img); });
        img.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openViewer(img); }
        });
      });
    }

    // 12. Copier l'adresse e-mail (le bouton reste masqué si le presse-papiers est indisponible)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      document.querySelectorAll("[data-copy]").forEach(function (btn) {
        btn.hidden = false;
        btn.addEventListener("click", function () {
          var text = btn.getAttribute("data-copy");
          navigator.clipboard.writeText(text).then(function () {
            showToast(T.copied + text);
          }, function () {
            showToast(T.copyFail + text);
          });
        });
      });
    }
  });
})();
