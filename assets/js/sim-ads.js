// Galerie des publicités : bascule fil / story et cartes retournables (traduction).
(function () {
  var sim = document.querySelector('[data-sim="ads"]');
  if (!sim) return;
  var EN = (document.documentElement.getAttribute("lang") || "fr").indexOf("en") === 0;
  function L(fr, en) { return EN ? en : fr; }
  var list = sim.querySelector("[data-ads]");
  var formatButtons = sim.querySelectorAll("button[data-format]");

  formatButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var format = button.getAttribute("data-format");
      list.setAttribute("data-format", format);
      formatButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === button)); });
      list.querySelectorAll("img[data-feed]").forEach(function (img) {
        img.src = img.getAttribute("data-" + format);
        img.width = format === "story" ? 450 : 640;
        img.height = format === "story" ? 796 : 800;
      });
    });
  });

  list.querySelectorAll(".ad-flip").forEach(function (card) {
    var title = card.querySelector(".ad-back-title");
    var back = card.querySelector(".ad-face--back");
    var label = title ? title.textContent : "";
    function sync() {
      var flipped = card.classList.contains("is-flipped");
      card.setAttribute("aria-pressed", String(flipped));
      card.setAttribute("aria-label", flipped
        ? L("Traduction affichée : ", "Translation shown: ") + label + L(". Revenir à la publicité", ". Back to the ad")
        : L("Afficher la traduction de la publicité : ", "Show the ad translation: ") + label);
      if (back) back.setAttribute("aria-hidden", String(!flipped));
    }
    sync();
    card.addEventListener("click", function () {
      card.classList.toggle("is-flipped");
      sync();
    });
  });
})();
