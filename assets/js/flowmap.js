// Carte des flux (page d'accueil).
// Pour ajouter un projet : déclarer ses nœuds dans NODES, puis son scénario dans SCENARIOS.
// Les liaisons dessinées sont déduites des étapes (hops) des scénarios.
(function () {
  var root = document.querySelector("[data-flowmap]");
  if (!root) return;

  var svg = root.querySelector("[data-fm-svg]");
  var logEl = root.querySelector("[data-fm-log]");
  var resultEl = root.querySelector("[data-fm-result]");
  var chipsEl = root.querySelector("[data-fm-scenarios]");
  var NS = "http://www.w3.org/2000/svg";
  // ?motion=on force l'animation (utile pour une démonstration sur un poste en « mouvement réduit »).
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !/[?&]motion=on\b/.test(window.location.search);

  // ---------- Données ----------

  // Géométrie, en unités du viewBox (700 × 570)
  var GEO = {
    trigger: { x: 10, w: 150, h: 46 },
    build: { x: 245, w: 190, h: 54 },
    system: { x: 540, w: 150, h: 36 }
  };
  var ROW = [70, 170, 270, 370, 470];

  var NODES = {
    client:     { type: "trigger", y: ROW[0], label: "Un client écrit" },
    carton:     { type: "trigger", y: ROW[1], label: "Un carton arrive" },
    ingenieur:  { type: "trigger", y: ROW[2], label: "Un ingénieur", label2: "se connecte" },
    commande:   { type: "trigger", y: ROW[3], label: "Une commande", label2: "est prête" },
    modif:      { type: "trigger", y: ROW[4], label: "Une modification", label2: "à publier" },

    support:    { type: "build", y: ROW[0], label: "Script de support", sub: "Apps Script" },
    inventaire: { type: "build", y: ROW[1], label: "App d'inventaire", sub: "AppSheet, OCR" },
    licences:   { type: "build", y: ROW[2], label: "App de licences", sub: "Apps Script" },
    bordereaux: { type: "build", y: ROW[3], label: "Service de bordereaux", sub: "Node.js, Heroku" },
    boutique:   { type: "build", y: ROW[4], label: "Boutiques Shopify", sub: "thèmes et recette" },

    gmail:      { type: "system", y: 46, label: "Gmail" },
    sheets:     { type: "system", y: 106, label: "Google Sheets" },
    drive:      { type: "system", y: 166, label: "Google Drive" },
    annuaire:   { type: "system", y: 266, label: "Annuaire et licences" },
    laposte:    { type: "system", y: 326, label: "API La Poste" },
    gcs:        { type: "system", y: 378, label: "Cloud Storage" },
    airtable:   { type: "system", y: 430, label: "Airtable" },
    agents:     { type: "system", y: 486, label: "Agents IA" },
    shopify:    { type: "system", y: 538, label: "Shopify" }
  };

  // {T} est remplacé par un numéro de ticket tiré au hasard à chaque lecture.
  var SCENARIOS = [
    {
      id: "support", chip: "Une demande client", start: "09:41:07", step: 9,
      hops: [
        { from: "client", to: "support", text: "Un client écrit à l'adresse générique du support ; le script relève le message dans Gmail." },
        { from: "support", to: "sheets", text: "Aucun numéro dans le fil : nouvelle ligne {T}, statut « Nouveau »." },
        { from: "support", to: "gmail", text: "Accusé de réception envoyé au client, avec le numéro {T}." },
        { from: "client", to: "support", text: "Le client relance dans le même fil." },
        { from: "support", to: "sheets", text: "Numéro {T} retrouvé : même demande, la ligne existante est mise à jour. Pas de doublon." }
      ],
      result: { status: "prod", label: "En production", text: "Depuis début août 2026, chez Good iD.", href: "projets/support-client.html" }
    },
    {
      id: "inventaire", chip: "Un carton à inventorier", start: "14:02:31", step: 6,
      hops: [
        { from: "carton", to: "inventaire", text: "Un bouton, la caméra s'ouvre : photo de l'étiquette du carton." },
        { from: "inventaire", to: "inventaire", text: "Lecture par gabarit : modèle et numéro de série extraits des zones calibrées." },
        { from: "inventaire", to: "drive", text: "La photo est rangée dans le Drive de l'organisation, sous ses droits d'accès." },
        { from: "inventaire", to: "sheets", text: "Ligne ajoutée : identifiant, photo, modèle, numéro de série. Rien n'a été recopié à la main." }
      ],
      result: { status: "prod", label: "En production", text: "Depuis le 12 juin 2026 ; 81 équipements enregistrés.", href: "projets/inventaire-ocr.html" }
    },
    {
      id: "licences", chip: "Une licence de test", start: "10:15:00", step: 2,
      hops: [
        { from: "ingenieur", to: "licences", text: "Un ingénieur ouvre l'application dans l'environnement de test." },
        { from: "licences", to: "annuaire", text: "Session identifiée ; identifiant de l'organisation lu dans l'annuaire." },
        { from: "licences", to: "annuaire", text: "Aucune licence de ce type : attribution." },
        { from: "licences", to: "annuaire", night: true, text: "Dans la nuit, l'exécution planifiée reprend la licence." }
      ],
      result: { status: "test", label: "Fonctionnel en test", text: "Validé dans l'environnement de test de Good iD.", href: "projets/licences-flex.html" }
    },
    {
      id: "bordereaux", chip: "Une commande à expédier", start: "16:20:44", step: 3,
      hops: [
        { from: "commande", to: "bordereaux", text: "Airtable envoie la liste des plis prêts à partir." },
        { from: "bordereaux", to: "laposte", text: "Chaque pli est retrouvé, puis le dépôt est créé." },
        { from: "laposte", to: "bordereaux", text: "Le bordereau revient en PDF." },
        { from: "bordereaux", to: "gcs", text: "Le PDF est stocké dans Google Cloud Storage." },
        { from: "bordereaux", to: "airtable", text: "L'expédition reçoit le bordereau en pièce jointe et le numéro de dépôt." }
      ],
      result: { status: "done", label: "Livré", text: "Janvier 2025, chez The Lost Recordings.", href: "projets/bordereaux-la-poste.html" }
    },
    {
      id: "boutique", chip: "Une modification à publier", start: "11:03:12", step: 240,
      hops: [
        { from: "modif", to: "boutique", text: "Je décris la modification attendue : section, correction ou traduction." },
        { from: "boutique", to: "agents", text: "L'agent IA écrit le changement dans les fichiers du thème." },
        { from: "shopify", to: "boutique", text: "Point de restauration : copie complète du thème en ligne." },
        { from: "boutique", to: "shopify", text: "Après mon accord, mise en ligne d'un seul fichier." },
        { from: "boutique", to: "boutique", text: "Recette en ligne : pages, panier, Lighthouse. Un écart, et on reprend." }
      ],
      result: { status: "done", label: "Projet personnel", text: "Première commande réelle le 22 septembre 2026.", href: "projets/e-commerce.html" }
    }
  ];

  // ---------- Version anglaise (appliquée si <html lang="en">) ----------

  var UI = { cols: ["Déclencheur", "Ce que j'ai construit", "Systèmes reliés"], read: "Lire l'étude de cas", night: "nuit" };
  if ((document.documentElement.getAttribute("lang") || "").indexOf("en") === 0) {
    UI = { cols: ["Trigger", "What I built", "Connected systems"], read: "Read the case study", night: "night" };
    var EN_NODES = {
      client: { label: "A client writes" }, carton: { label: "A box arrives" },
      ingenieur: { label: "An engineer", label2: "signs in" }, commande: { label: "An order", label2: "is ready" },
      modif: { label: "A change", label2: "to publish" },
      support: { label: "Support script" }, inventaire: { label: "Inventory app" }, licences: { label: "Licence app" },
      bordereaux: { label: "Shipping slip service" }, boutique: { label: "Shopify stores", sub: "themes and testing" },
      annuaire: { label: "Directory and licences" }, laposte: { label: "La Poste API" }, agents: { label: "AI agents" }
    };
    Object.keys(EN_NODES).forEach(function (id) {
      var src = EN_NODES[id];
      for (var k in src) NODES[id][k] = src[k];
    });
    var EN_SC = {
      support: { chip: "A client request", label: "In production", text: "Since early August 2026, at Good iD.", hops: [
        "A client writes to the shared support address; the script picks the message up in Gmail.",
        "No ticket number in the thread: new row {T}, status “New”.",
        "Acknowledgement sent to the client, with number {T}.",
        "The client follows up in the same thread.",
        "Number {T} found: same request, the existing row is updated. No duplicate."] },
      inventaire: { chip: "A box to log", label: "In production", text: "Since 12 June 2026; 81 devices logged.", hops: [
        "One button, the camera opens: photo of the box label.",
        "Template-based reading: model and serial number taken from calibrated zones.",
        "The photo is stored in the organisation's Drive, under its access rules.",
        "Row added: ID, photo, model, serial number. Nothing typed by hand."] },
      licences: { chip: "A test licence", label: "Working in test", text: "Validated in Good iD's test environment.", hops: [
        "An engineer opens the app in the test environment.",
        "Session identified; the organisation ID is read from the directory.",
        "No licence of this type yet: assigned.",
        "During the night, the scheduled run takes the licence back."] },
      bordereaux: { chip: "An order to ship", label: "Delivered", text: "January 2025, at The Lost Recordings.", hops: [
        "Airtable sends the list of parcels ready to go.",
        "Each parcel is looked up, then the drop-off is created.",
        "The slip comes back as a PDF.",
        "The PDF is stored in Google Cloud Storage.",
        "The shipment gets the slip attached and the drop-off number."] },
      boutique: { chip: "A change to publish", label: "Personal project", text: "First real order on 22 September 2026.", hops: [
        "I describe the expected change: section, fix or translation.",
        "The AI agent writes the change into the theme files.",
        "Restore point: full copy of the live theme.",
        "Once I approve, one single file goes live.",
        "Live testing: pages, cart, Lighthouse. Any gap, and we go again."] }
    };
    SCENARIOS.forEach(function (sc) {
      var e = EN_SC[sc.id];
      sc.chip = e.chip;
      sc.result.label = e.label;
      sc.result.text = e.text;
      sc.hops.forEach(function (h, i) { h.text = e.hops[i]; });
    });
  }

  // ---------- Dessin ----------

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  function box(id) {
    var n = NODES[id], g = GEO[n.type];
    return { x: g.x, y: n.y - g.h / 2, w: g.w, h: g.h, cx: g.x + g.w / 2, cy: n.y };
  }
  function nameOf(id) {
    var n = NODES[id];
    return n.label2 ? n.label + " " + n.label2 : n.label;
  }

  var scenarioOf = {};
  SCENARIOS.forEach(function (sc) {
    sc.hops.forEach(function (h) {
      if (NODES[h.from].type !== "system" && !scenarioOf[h.from]) scenarioOf[h.from] = sc.id;
      if (NODES[h.to].type !== "system" && !scenarioOf[h.to]) scenarioOf[h.to] = sc.id;
    });
  });

  var COLS = UI.cols;
  el("text", { class: "fm-col-label", x: GEO.trigger.x, y: 16 }, svg).textContent = COLS[0];
  el("text", { class: "fm-col-label", x: GEO.build.x, y: 16 }, svg).textContent = COLS[1];
  el("text", { class: "fm-col-label", x: GEO.system.x, y: 16 }, svg).textContent = COLS[2];
  var defs = el("defs", {}, svg);
  var mk = el("marker", { id: "fm-col-head", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto" }, defs);
  el("path", { d: "M0,0 L10,5 L0,10 z", fill: "#34505e" }, mk);
  el("path", { class: "fm-col-arrow", d: "M" + (GEO.trigger.x + 96) + ",12 H" + (GEO.build.x - 12), "marker-end": "url(#fm-col-head)" }, svg);
  el("path", { class: "fm-col-arrow", d: "M" + (GEO.build.x + 168) + ",12 H" + (GEO.system.x - 12), "marker-end": "url(#fm-col-head)" }, svg);

  var edgesLayer = el("g", {}, svg);
  var nodesLayer = el("g", {}, svg);
  var edges = {};

  function edgeKey(a, b) {
    var left = box(a).x <= box(b).x ? a : b;
    return left === a ? a + "|" + b : b + "|" + a;
  }

  SCENARIOS.forEach(function (sc) {
    sc.hops.forEach(function (h) {
      if (h.from === h.to) return;
      var key = edgeKey(h.from, h.to);
      if (edges[key]) return;
      var ids = key.split("|"), a = box(ids[0]), b = box(ids[1]);
      var x1 = a.x + a.w, y1 = a.cy, x2 = b.x, y2 = b.cy;
      var d = Math.abs(y1 - y2) < 1
        ? "M" + x1 + "," + y1 + " H" + x2
        : "M" + x1 + "," + y1 + " C" + (x1 + 55) + "," + y1 + " " + (x2 - 55) + "," + y2 + " " + x2 + "," + y2;
      edges[key] = el("path", { class: "fm-edge", d: d, "data-edge": key }, edgesLayer);
    });
  });

  var nodeEls = {};
  Object.keys(NODES).forEach(function (id) {
    var n = NODES[id], b = box(id);
    var g = el("g", { class: "fm-node fm-node--" + n.type, "data-node": id }, nodesLayer);
    el("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: n.type === "trigger" ? 23 : 8 }, g);
    var tx = n.type === "system" ? b.x + 14 : b.cx;
    var anchor = n.type === "system" ? "start" : "middle";
    if (n.sub || n.label2) {
      el("text", { class: "fm-label", x: tx, y: b.cy - 3, "text-anchor": anchor }, g).textContent = n.label;
      el("text", { class: n.sub ? "fm-sub" : "fm-label", x: tx, y: b.cy + (n.sub ? 14 : 13), "text-anchor": anchor }, g).textContent = n.sub || n.label2;
    } else {
      el("text", { class: "fm-label", x: tx, y: b.cy + 4.5, "text-anchor": anchor }, g).textContent = n.label;
    }
    if (scenarioOf[id]) {
      g.addEventListener("click", function () { play(scenarioOf[id], { user: true }); });
    }
    nodeEls[id] = g;
  });

  var halo = el("circle", { class: "fm-packet-halo", r: 11, cx: -50, cy: -50 }, svg);
  var packet = el("circle", { class: "fm-packet", r: 5, cx: -50, cy: -50 }, svg);

  // ---------- Boutons de scénario ----------

  var chips = {};
  SCENARIOS.forEach(function (sc) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "fm-chip";
    b.setAttribute("aria-pressed", "false");
    b.textContent = sc.chip;
    b.addEventListener("click", function () { play(sc.id, { user: true }); });
    chipsEl.appendChild(b);
    chips[sc.id] = b;
  });

  // ---------- Lecture ----------

  var gen = 0;

  function visible() { return svg.getBoundingClientRect().width > 0; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function clock(start, offset) {
    var p = start.split(":").map(Number);
    var s = p[0] * 3600 + p[1] * 60 + p[2] + offset;
    function two(n) { return (n < 10 ? "0" : "") + n; }
    return two(Math.floor(s / 3600) % 24) + ":" + two(Math.floor(s / 60) % 60) + ":" + two(s % 60);
  }

  function reset() {
    root.classList.remove("is-playing", "is-moving");
    svg.querySelectorAll(".is-active, .is-hot, .is-night, .is-hit").forEach(function (n) {
      n.classList.remove("is-active", "is-hot", "is-night", "is-hit");
    });
    logEl.innerHTML = "";
    resultEl.innerHTML = "";
  }

  function addLog(time, hop, text) {
    var li = document.createElement("li");
    if (hop.night) li.className = "is-night";
    var t = document.createElement("time");
    t.textContent = time;
    var div = document.createElement("div");
    var route = document.createElement("span");
    route.className = "fm-log-route";
    route.textContent = hop.from === hop.to ? nameOf(hop.from) : nameOf(hop.from) + " → " + nameOf(hop.to);
    var msg = document.createElement("span");
    msg.className = "fm-log-text";
    msg.textContent = text;
    div.appendChild(route);
    div.appendChild(msg);
    li.appendChild(t);
    li.appendChild(div);
    logEl.appendChild(li);
  }

  function showResult(sc) {
    var r = sc.result;
    var pill = document.createElement("span");
    pill.className = "fm-status" + (r.status === "test" ? " fm-status--test" : r.status === "done" ? " fm-status--done" : "");
    pill.textContent = r.label;
    var p = document.createElement("p");
    p.textContent = r.text + " ";
    var a = document.createElement("a");
    a.href = r.href;
    a.textContent = UI.read;
    p.appendChild(a);
    resultEl.appendChild(pill);
    resultEl.appendChild(p);
  }

  function pulse(id, night) {
    var g = nodeEls[id];
    g.classList.remove("is-hit", "is-night");
    g.getBoundingClientRect();
    g.classList.add("is-hit");
    if (night) g.classList.add("is-night");
    setTimeout(function () { g.classList.remove("is-hit"); }, 750);
  }

  function travel(hop, my) {
    return new Promise(function (resolve) {
      var path = edges[edgeKey(hop.from, hop.to)];
      if (!visible()) { setTimeout(resolve, 520); return; }
      var forward = edgeKey(hop.from, hop.to) === hop.from + "|" + hop.to;
      var len = path.getTotalLength();
      var duration = 820;
      var start = null;
      packet.classList.toggle("is-night", !!hop.night);
      halo.classList.toggle("is-night", !!hop.night);
      var first = path.getPointAtLength(forward ? 0 : len);
      packet.setAttribute("cx", first.x); packet.setAttribute("cy", first.y);
      halo.setAttribute("cx", first.x); halo.setAttribute("cy", first.y);
      root.classList.add("is-moving");
      function frame(ts) {
        if (my !== gen) { resolve(); return; }
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / duration);
        var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        var pt = path.getPointAtLength((forward ? e : 1 - e) * len);
        packet.setAttribute("cx", pt.x); packet.setAttribute("cy", pt.y);
        halo.setAttribute("cx", pt.x); halo.setAttribute("cy", pt.y);
        if (p < 1) requestAnimationFrame(frame); else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  function play(id, opts) {
    opts = opts || {};
    var sc = SCENARIOS.filter(function (s) { return s.id === id; })[0];
    if (!sc) return;
    var my = ++gen;
    if (opts.user) logEl.setAttribute("aria-live", "polite");
    reset();
    Object.keys(chips).forEach(function (k) { chips[k].setAttribute("aria-pressed", String(k === id)); });
    root.classList.add("is-playing");

    var ticket = window.pmTicket ? window.pmTicket() : "T-482913";
    sc.hops.forEach(function (h) {
      nodeEls[h.from].classList.add("is-active");
      nodeEls[h.to].classList.add("is-active");
      if (h.from !== h.to) edges[edgeKey(h.from, h.to)].classList.add("is-active");
    });
    function textOf(h) { return h.text.replace(/\{T\}/g, ticket); }
    function timeOf(h, i) { return h.night ? UI.night : clock(sc.start, i * sc.step); }

    if (reduceMotion || opts.instant) {
      sc.hops.forEach(function (h, i) { addLog(timeOf(h, i), h, textOf(h)); });
      showResult(sc);
      return;
    }

    (async function () {
      for (var i = 0; i < sc.hops.length; i++) {
        var h = sc.hops[i];
        await wait(i === 0 ? 150 : 320);
        if (my !== gen) return;
        addLog(timeOf(h, i), h, textOf(h));
        if (h.from === h.to) {
          pulse(h.to, h.night);
          await wait(700);
        } else {
          var path = edges[edgeKey(h.from, h.to)];
          path.classList.add("is-hot");
          path.classList.toggle("is-night", !!h.night);
          await travel(h, my);
          if (my !== gen) return;
          path.classList.remove("is-hot", "is-night");
          pulse(h.to, h.night);
        }
      }
      if (my !== gen) return;
      root.classList.remove("is-moving");
      showResult(sc);
    })();
  }

  // Premier scénario joué une fois, quand la carte devient visible.
  var started = false;
  function autostart() {
    if (started) return;
    started = true;
    play(SCENARIOS[0].id, { instant: reduceMotion });
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { autostart(); io.disconnect(); }
      });
    }, { threshold: 0.35 });
    io.observe(root);
  } else {
    autostart();
  }
})();
