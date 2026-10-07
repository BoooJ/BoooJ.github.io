// Maquette du gabarit de lecture OCR (étiquettes fictives).
(function () {
  var sim = document.querySelector('[data-sim="ocr"]');
  if (!sim) return;
  var EN = (document.documentElement.getAttribute("lang") || "fr").indexOf("en") === 0;
  function L(fr, en) { return EN ? en : fr; }

  var stage = sim.querySelector("[data-stage]");
  var label = sim.querySelector("[data-label]");
  var zone = sim.querySelector("[data-zone]");
  var valueEl = sim.querySelector("[data-value]");
  var verdictEl = sim.querySelector("[data-verdict-el]");
  var whichEl = sim.querySelector("[data-which]");

  // Deux constructeurs fictifs : même champs, disposition différente.
  var LAYOUTS = {
    A: { maker: L("constructeur A", "maker A"), order: ["brand", "model", "pn", "sn", "barcode", "lot", "reg"],
         names: { model: "Model", pn: "P/N", sn: "S/N", lot: "LOT" } },
    B: { maker: L("constructeur B", "maker B"), order: ["brand", "model", "sn", "pn", "lot", "barcode", "reg"],
         names: { model: "MDL", pn: "PN", sn: "SN", lot: "BATCH" } }
  };
  var CARTONS = [
    { layout: "A", brand: "VELTA", product: "Chromebook 14", model: "VC14-X21", pn: "9KX42EA#ABF", sn: "5CD4182LQ7", lot: "24-157041" },
    { layout: "A", brand: "VELTA", product: "Chromebook 14", model: "VC14-X21", pn: "9KX42EA#ABF", sn: "5CD4182M2B", lot: "24-157102" },
    { layout: "B", brand: "KORRIN", product: "Chromebox", model: "CBX-500", pn: "7Z10042EU", sn: "8F2K11TQ0Z7", lot: "2409-B" },
    { layout: "B", brand: "KORRIN", product: "Chromebox", model: "CBX-500", pn: "7Z10042EU", sn: "8F2K11TR4P1", lot: "2409-C" }
  ];
  var FIELD_NAMES = EN ? {
    brand: "brand and product", model: "model", pn: "part number", sn: "serial number",
    barcode: "barcode", lot: "batch number", reg: "regulatory marks"
  } : {
    brand: "marque et produit", model: "modèle", pn: "référence produit", sn: "numéro de série",
    barcode: "code-barres", lot: "numéro de lot", reg: "mentions réglementaires"
  };

  var current = 0;
  var zoneTop = null;
  var rowEls = [];

  function carton() { return CARTONS[current]; }
  function layout() { return LAYOUTS[carton().layout]; }

  function renderLabel() {
    var c = carton(), l = layout();
    label.innerHTML = "";
    rowEls = l.order.map(function (field) {
      var row = document.createElement("div");
      row.className = "ocr-row";
      row.setAttribute("data-field", field);
      if (field === "brand") {
        row.innerHTML = '<span class="ocr-brand"></span><span></span>';
        row.children[0].textContent = c.brand;
        row.children[1].textContent = c.product;
      } else if (field === "barcode") {
        row.innerHTML = '<span class="ocr-bars" aria-hidden="true"></span>';
      } else if (field === "reg") {
        row.innerHTML = '<span class="ocr-small">19 V, 3,42 A&nbsp;&nbsp; CE&nbsp;&nbsp; FCC&nbsp;&nbsp; ' + L('Fabriqué hors UE', 'Made outside the EU') + '</span>';
      } else {
        row.innerHTML = "<b></b><span></span>";
        row.children[0].textContent = l.names[field];
        row.children[1].textContent = c[field];
      }
      label.appendChild(row);
      return row;
    });
    whichEl.textContent = L("Carton ", "Box ") + (current % 2 + 1) + ", " + l.maker + L(" (étiquette fictive)", " (fictional label)");
  }

  function rowBox(i) {
    var s = stage.getBoundingClientRect(), r = rowEls[i].getBoundingClientRect();
    return { top: r.top - s.top, height: r.height };
  }
  function bounds() {
    var first = rowBox(0), last = rowBox(rowEls.length - 1);
    return { min: first.top, max: last.top, h: first.height };
  }
  function indexOf(field) { return layout().order.indexOf(field); }

  function place(top) {
    var b = bounds();
    zoneTop = Math.max(b.min, Math.min(b.max, top));
    zone.style.top = zoneTop + "px";
    zone.style.height = b.h + "px";
    read();
  }

  function read() {
    var center = zoneTop + bounds().h / 2;
    var idx = 0;
    for (var i = 0; i < rowEls.length; i++) {
      var r = rowBox(i);
      if (center >= r.top && center < r.top + r.height) { idx = i; break; }
      if (center >= r.top) idx = i;
    }
    var field = layout().order[idx], c = carton();
    var value, verdict, title, detail;
    if (field === "sn") {
      value = c.sn; verdict = "ok";
      title = L("Numéro de série : bon champ.", "Serial number: right field.");
      detail = L("Calée une fois, la zone tombe juste sur chaque carton de ce constructeur.", "Set once, the zone lands right on every box from this maker.");
    } else if (field === "barcode") {
      value = c.sn; verdict = "ok";
      title = L("Code-barres du numéro de série : lecture directe.", "Serial number barcode: read directly.");
      detail = L("Quand l'étiquette en porte un, le champ du numéro de série le lit sans OCR.", "When the label has one, the serial number field reads it without OCR.");
    } else if (field === "pn" || field === "lot") {
      value = c[field]; verdict = "trap";
      title = L("Format plausible, mauvais champ : c'est " + (field === "pn" ? "la référence produit" : "le numéro de lot") + ".", "Plausible format, wrong field: it is the " + FIELD_NAMES[field] + ".");
      detail = L("Personne ne le voit à la saisie. L'erreur apparaîtra des semaines plus tard, quand on cherchera l'appareil sous ce numéro.", "Nobody notices when it is entered. The error shows up weeks later, when someone looks for the device under that number.");
    } else {
      value = field === "brand" ? c.brand + " " + c.product : field === "reg" ? "19 V, 3,42 A CE FCC" : c[field];
      verdict = "wrong";
      title = L("Ce n'est pas un numéro de série.", "This is not a serial number.");
      detail = L("Erreur visible tout de suite, donc peu dangereuse.", "The error is visible at once, so it does little harm.");
    }
    valueEl.textContent = value;
    verdictEl.setAttribute("data-verdict", verdict);
    verdictEl.innerHTML = "";
    verdictEl.appendChild(document.createTextNode(title));
    var span = document.createElement("span");
    span.textContent = detail;
    verdictEl.appendChild(span);
    zone.classList.toggle("is-wrong", verdict !== "ok");
    zone.setAttribute("aria-valuenow", String(idx + 1));
    zone.setAttribute("aria-valuemax", String(rowEls.length));
    zone.setAttribute("aria-valuetext", L("Zone sur la ligne ", "Zone on line ") + (idx + 1) + ": " + FIELD_NAMES[field]);
  }

  // Glisser la zone (souris, doigt, stylet)
  var drag = null;
  zone.addEventListener("pointerdown", function (e) {
    drag = { y: e.clientY, top: zoneTop };
    zone.setPointerCapture(e.pointerId);
    zone.classList.add("is-dragging");
    e.preventDefault();
  });
  zone.addEventListener("pointermove", function (e) {
    if (!drag) return;
    place(drag.top + (e.clientY - drag.y));
  });
  function stop() { drag = null; zone.classList.remove("is-dragging"); }
  zone.addEventListener("pointerup", stop);
  zone.addEventListener("pointercancel", stop);

  // Toucher une ligne y amène la zone
  label.addEventListener("pointerdown", function (e) {
    var row = e.target.closest(".ocr-row");
    if (!row) return;
    place(rowBox(rowEls.indexOf(row)).top);
  });

  // Clavier
  zone.addEventListener("keydown", function (e) {
    var b = bounds(), step = null;
    if (e.key === "ArrowUp") step = -6;
    if (e.key === "ArrowDown") step = 6;
    if (e.key === "PageUp") step = -b.h;
    if (e.key === "PageDown") step = b.h;
    if (e.key === "Home") { place(b.min); e.preventDefault(); return; }
    if (e.key === "End") { place(b.max); e.preventDefault(); return; }
    if (step !== null) { place(zoneTop + step); e.preventDefault(); }
  });

  sim.querySelector('[data-act="next"]').addEventListener("click", function () {
    current = current % 2 === 0 ? current + 1 : current - 1;
    renderLabel();
    place(zoneTop);
  });
  sim.querySelector('[data-act="other"]').addEventListener("click", function () {
    current = carton().layout === "A" ? 2 : 0;
    renderLabel();
    place(zoneTop);
  });
  sim.querySelector('[data-act="recal"]').addEventListener("click", function () {
    place(rowBox(indexOf("sn")).top);
  });

  renderLabel();
  place(rowBox(indexOf("sn")).top);
  window.addEventListener("resize", function () { place(zoneTop); });
})();
