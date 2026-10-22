// Galerie des publicités : bascule fil / story et cartes retournables (traduction).
(function () {
  var sim = document.querySelector('[data-sim="ads"]');
  if (!sim) return;
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

  // Le nom de chaque carte vient de son contenu visible : l'image (texte alternatif) ou la traduction.
  list.querySelectorAll(".ad-flip").forEach(function (card) {
    var front = card.querySelector(".ad-face--front");
    var back = card.querySelector(".ad-face--back");
    function sync() {
      var flipped = card.classList.contains("is-flipped");
      card.setAttribute("aria-pressed", String(flipped));
      if (front) front.setAttribute("aria-hidden", String(flipped));
      if (back) back.setAttribute("aria-hidden", String(!flipped));
    }
    sync();
    card.addEventListener("click", function () {
      card.classList.toggle("is-flipped");
      sync();
    });
  });
})();
