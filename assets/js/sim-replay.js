// Rejeu animé du service de bordereaux (données fictives).
(function () {
  var sim = document.querySelector('[data-sim="replay"]');
  if (!sim) return;
  var EN = (document.documentElement.getAttribute("lang") || "fr").indexOf("en") === 0;
  function L(fr, en) { return EN ? en : fr; }

  var svg = sim.querySelector("svg");
  var queueEl = sim.querySelector("[data-queue]");
  var consoleEl = sim.querySelector("[data-console]");
  var btnOne = sim.querySelector('[data-act="one"]');
  var btnThree = sim.querySelector('[data-act="three"]');

  var STEP_MS = 650;
  var jobs = [];
  var running = false;
  var count = 0;

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function hot(step) {
    svg.querySelectorAll(".is-hot").forEach(function (n) { n.classList.remove("is-hot"); });
    if (step === null) return;
    svg.querySelectorAll('[data-step="' + step + '"], [data-step="0"]').forEach(function (n) { n.classList.add("is-hot"); });
  }

  function line(text, cls) {
    var li = document.createElement("li");
    if (cls) li.className = cls;
    li.textContent = text;
    consoleEl.appendChild(li);
    while (consoleEl.children.length > 40) consoleEl.removeChild(consoleEl.firstChild);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  function renderQueue() {
    queueEl.innerHTML = "";
    var label = document.createElement("span");
    label.className = "rp-queue-label";
    label.textContent = L("File d'attente :", "Queue:");
    queueEl.appendChild(label);
    var visible = jobs.filter(function (j) { return j.state !== "done"; }).concat(jobs.filter(function (j) { return j.state === "done"; }).slice(-2));
    if (!visible.length) {
      var empty = document.createElement("span");
      empty.className = "rp-queue-label";
      empty.textContent = L("vide", "empty");
      queueEl.appendChild(empty);
    }
    visible.sort(function (a, b) { return a.n - b.n; }).forEach(function (j) {
      var chip = document.createElement("span");
      chip.className = "rp-job" + (j.state === "running" ? " is-running" : j.state === "done" ? " is-done" : "");
      chip.textContent = L("Demande ", "Request ") + j.n + (j.state === "waiting" ? L(" (en attente)", " (waiting)") : j.state === "running" ? L(" (en cours)", " (running)") : L(" (terminée)", " (done)"));
      queueEl.appendChild(chip);
    });
  }

  async function process(job) {
    var plis = job.plis;
    var depot = 48000 + Math.floor(Math.random() * 1000);
    hot(1); line("→ POST /depot   " + L(plis + " pli" + (plis > 1 ? "s" : "") + " reçu" + (plis > 1 ? "s" : "") + " d'Airtable (demande " + job.n + ")", plis + " parcel" + (plis > 1 ? "s" : "") + " received from Airtable (request " + job.n + ")"), "in");
    await wait(STEP_MS);
    hot(2); line("  GET /envois/:pli ×" + plis + L("   identifiants retrouvés", "   IDs found"));
    await wait(STEP_MS * 0.6);
    line("  POST /depots   " + L("dépôt n° " + depot + " créé", "drop-off no. " + depot + " created"));
    await wait(STEP_MS);
    hot(3); line(L("  ← bordereau reçu en PDF (base64)", "  ← slip received as PDF (base64)"));
    await wait(STEP_MS);
    hot(4); line(L("  PDF décodé et envoyé vers Cloud Storage : ", "  PDF decoded and sent to Cloud Storage: ") + "depot_" + depot + ".pdf");
    await wait(STEP_MS);
    hot(5); line(L("  Airtable : expédition mise à jour, bordereau joint, n° ", "  Airtable: shipment updated, slip attached, no. ") + depot);
    await wait(STEP_MS);
    line("← 200 Dépôt créé avec succès", "ok");
    hot(null);
  }

  async function drain() {
    if (running) return;
    running = true;
    var next;
    while ((next = jobs.filter(function (j) { return j.state === "waiting"; })[0])) {
      next.state = "running";
      renderQueue();
      await process(next);
      next.state = "done";
      renderQueue();
      await wait(250);
    }
    running = false;
  }

  function enqueue(n) {
    for (var i = 0; i < n; i++) {
      jobs.push({ n: ++count, plis: 1 + Math.floor(Math.random() * 4), state: "waiting" });
    }
    if (n > 1) line(L("Trois demandes arrivent en même temps : elles passent l'une après l'autre.", "Three requests arrive at once: they go through one after the other."), "muted");
    renderQueue();
    drain();
  }

  btnOne.addEventListener("click", function () { enqueue(1); });
  btnThree.addEventListener("click", function () { enqueue(3); });
  renderQueue();
})();
