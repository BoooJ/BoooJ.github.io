// Maquette du tableau de suivi des tickets (données fictives).
(function () {
  var sim = document.querySelector('[data-sim="tickets"]');
  if (!sim) return;
  var EN = (document.documentElement.getAttribute("lang") || "fr").indexOf("en") === 0;
  function L(fr, en) { return EN ? en : fr; }

  var tbody = sim.querySelector("[data-rows]");
  var logEl = sim.querySelector("[data-log]");
  var btnNew = sim.querySelector('[data-act="new"]');
  var btnReply = sim.querySelector('[data-act="reply"]');
  var dedup = sim.querySelector('[data-opt="dedup"]');
  var stats = {
    threads: sim.querySelector('[data-stat="threads"]'),
    rows: sim.querySelector('[data-stat="rows"]'),
    dups: sim.querySelector('[data-stat="dups"]')
  };

  var CLIENTS = ["c.durand@example.com", "m.lefevre@example.com", "s.benali@example.com", "a.moreau@example.com", "j.petit@example.com", "l.garnier@example.com"];
  var SUBJECTS = EN ? ["Calendar sharing not working", "Mailbox delegation", "Meeting room won't start", "Access denied to a Drive folder", "Email signature to change", "Email alias to create"]
    : ["Partage d'agenda impossible", "Délégation de boîte mail", "Salle de visio qui ne démarre pas", "Accès refusé à un dossier Drive", "Signature d'e-mail à modifier", "Alias de messagerie à créer"];
  var STATUSES = [
    { id: "nouveau", label: L("Nouveau", "New") },
    { id: "en-cours", label: L("En cours", "In progress") },
    { id: "attente", label: L("En attente client", "Waiting for client") },
    { id: "resolu", label: L("Résolu", "Resolved") }
  ];
  var MAX_ROWS = 8;

  var threads = [];   // { id, client, subject }
  var rows = [];      // { ticket, thread, time, status, flash }
  var counter = 0;
  var minutes = 9 * 60 + 12;
  var lastThread = null;

  function ticket() { return window.pmTicket ? window.pmTicket() : "T-" + Math.floor(100000 + Math.random() * 900000); }
  function tick() {
    minutes += 3 + Math.floor(Math.random() * 15);
    var h = Math.floor(minutes / 60) % 24, m = minutes % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }
  function say(text, warn) {
    logEl.textContent = text;
    logEl.classList.toggle("is-warn", !!warn);
  }
  function threadRows(id) { return rows.filter(function (r) { return r.thread === id; }); }

  function trim() {
    while (rows.length > MAX_ROWS) {
      var idx = -1;
      for (var i = rows.length - 1; i >= 0; i--) { if (rows[i].status === "resolu") { idx = i; break; } }
      rows.splice(idx === -1 ? rows.length - 1 : idx, 1);
    }
  }

  function render() {
    tbody.innerHTML = "";
    if (!rows.length) {
      var empty = document.createElement("tr");
      empty.className = "tk-empty";
      empty.innerHTML = L('<td colspan="5">Aucune demande. Cliquez sur « Un client écrit ».</td>', '<td colspan="5">No requests yet. Click “A client writes”.</td>');
      tbody.appendChild(empty);
    }
    rows.forEach(function (r) {
      var th = threads.filter(function (t) { return t.id === r.thread; })[0];
      var tr = document.createElement("tr");
      tr.setAttribute("data-status", r.status);
      if (r.flash) { tr.classList.add("is-flash"); r.flash = false; }

      var tdId = document.createElement("td");
      tdId.className = "tk-id";
      tdId.textContent = r.ticket;
      if (threadRows(r.thread).length > 1) {
        var dup = document.createElement("span");
        dup.className = "tk-dup";
        dup.textContent = L("doublon", "duplicate");
        tdId.appendChild(dup);
      }
      var tdTime = document.createElement("td");
      tdTime.textContent = r.time;
      var tdClient = document.createElement("td");
      tdClient.textContent = th.client;
      var tdSubject = document.createElement("td");
      tdSubject.textContent = th.subject;

      var tdStatus = document.createElement("td");
      var select = document.createElement("select");
      select.setAttribute("aria-label", L("Statut du ticket ", "Status of ticket ") + r.ticket);
      STATUSES.forEach(function (s) {
        var o = document.createElement("option");
        o.value = s.id;
        o.textContent = s.label;
        if (s.id === r.status) o.selected = true;
        select.appendChild(o);
      });
      select.addEventListener("change", function () {
        r.status = select.value;
        var label = STATUSES.filter(function (s) { return s.id === r.status; })[0].label;
        say(L("Statut de " + r.ticket + " changé à la main : « " + label + " ». Ce passage-là, le script ne le fait jamais seul.", "Status of " + r.ticket + " changed by hand: “" + label + "”. The script never makes this move on its own."));
        render();
      });
      tdStatus.appendChild(select);

      [tdId, tdTime, tdClient, tdSubject, tdStatus].forEach(function (td) { tr.appendChild(td); });
      tbody.appendChild(tr);
    });

    var dups = rows.length - threads.filter(function (t) { return threadRows(t.id).length; }).length;
    stats.threads.textContent = threads.filter(function (t) { return threadRows(t.id).length; }).length;
    stats.rows.textContent = rows.length;
    stats.dups.textContent = dups;
    stats.dups.classList.toggle("is-bad", dups > 0);
    btnReply.disabled = !threads.some(function (t) { return threadRows(t.id).length; });
  }

  btnNew.addEventListener("click", function () {
    var thread = { id: ++counter, client: CLIENTS[(counter - 1) % CLIENTS.length], subject: SUBJECTS[(counter - 1) % SUBJECTS.length] };
    threads.push(thread);
    var row = { ticket: ticket(), thread: thread.id, time: tick(), status: "nouveau", flash: true };
    rows.unshift(row);
    lastThread = thread.id;
    trim();
    say(L("Ligne créée et accusé de réception envoyé à " + thread.client + " : « Votre demande " + row.ticket + " est enregistrée. »", "Row created and acknowledgement sent to " + thread.client + ": “Your request " + row.ticket + " has been logged.”"));
    render();
  });

  btnReply.addEventListener("click", function () {
    // Relance sur le fil le plus récent qui n'est pas déjà « Nouveau », sinon sur le dernier fil.
    var candidates = threads.filter(function (t) { return threadRows(t.id).length; });
    var target = candidates.filter(function (t) {
      return threadRows(t.id).every(function (r) { return r.status !== "nouveau"; });
    }).pop() || candidates.filter(function (t) { return t.id === lastThread; })[0] || candidates.pop();
    if (!target) return;
    var existing = threadRows(target.id);

    if (dedup.checked) {
      existing.forEach(function (r) { r.status = "nouveau"; r.time = tick(); r.flash = true; });
      say(L("Numéro " + existing[0].ticket + " retrouvé dans le fil : la ligne est mise à jour et repasse en « Nouveau ». Aucun doublon.", "Number " + existing[0].ticket + " found in the thread: the row is updated and goes back to “New”. No duplicate."));
    } else {
      var row = { ticket: ticket(), thread: target.id, time: tick(), status: "nouveau", flash: true };
      rows.unshift(row);
      trim();
      say(L("Sans détection, la relance crée une seconde ligne, " + row.ticket + ", pour la même demande. Le tableau ne dit plus la vérité sur la charge.", "Without detection, the follow-up creates a second row, " + row.ticket + ", for the same request. The sheet no longer tells the truth about the workload."), true);
    }
    lastThread = target.id;
    render();
  });

  dedup.addEventListener("change", function () {
    say(dedup.checked
      ? L("Détection des relances activée : une relance met à jour la ligne existante.", "Follow-up detection on: a follow-up updates the existing row.")
      : L("Détection désactivée : faites relancer un client pour voir ce qui se passe.", "Detection off: have a client follow up and see what happens."), !dedup.checked);
  });

  render();
})();
