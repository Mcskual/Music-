(function(){
  const THEME_KEY = "szd_theme";
  const ASSET_BASE = "../prestations/assets/";

  function updateThemeLogos(theme){
    const mode = theme === "light" ? "light" : "dark";

    document.querySelectorAll('[data-light-src][data-dark-src]').forEach((img) => {
      const target = mode === "light" ? img.dataset.lightSrc : img.dataset.darkSrc;
      if (target) {
        img.setAttribute("src", target);
      }
    });
  }

  function syncToggleState(nav, navToggle, isOpen){
    if(nav){ nav.classList.toggle("is-open", Boolean(isOpen)); }
    if(navToggle){
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      navToggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
    }
    const shouldLock = Boolean(isOpen) && window.innerWidth <= 768;
    document.body.classList.toggle("nav-open", shouldLock);
  }

  function initNav(){
    const nav = document.querySelector(".top-nav");
    const navToggle = document.getElementById("navToggle");
    const navLinksContainer = document.getElementById("nav-links");

    function closeMobileMenu(){ syncToggleState(nav, navToggle, false); }

    if(navToggle && navLinksContainer){
      navToggle.addEventListener("click", () => {
        const isOpen = nav ? !nav.classList.contains("is-open") : !(navToggle.getAttribute("aria-expanded") === "true");
        syncToggleState(nav, navToggle, isOpen);
      });

      window.addEventListener("resize", () => { if(window.innerWidth > 768){ closeMobileMenu(); } });

      navLinksContainer.addEventListener("click", (event) => {
        const target = event.target;
        if(target && target.closest("a")){
          closeMobileMenu();
          document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
          target.classList.add('active');
        }
      });

      syncToggleState(nav, navToggle, nav?.classList.contains("is-open"));
    }
  }

  function applyTheme(theme){
    const root = document.documentElement;
    const themeIcon = document.querySelector(".theme-icon");

    if(theme === "light"){
      root.setAttribute("data-theme","light");
    }else{
      root.removeAttribute("data-theme");
    }

    if (themeIcon) {
      themeIcon.textContent = theme === "light" ? "☀️" : "🌙";
    }

    updateThemeLogos(theme);

    if(window.szdEmbed && typeof window.szdEmbed.syncTheme === "function"){
      window.szdEmbed.syncTheme(theme);
    }
  }

  function initTheme(){
    var toggle = document.getElementById("themeToggle");
    if(!toggle) return;

    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch(e) {}

    var initialTheme = saved === "light" ? "light" : "dark";
    applyTheme(initialTheme);
    toggle.checked = initialTheme !== "light";

    function persistTheme(theme){
      applyTheme(theme);
      toggle.checked = theme !== "light";
      try { localStorage.setItem(THEME_KEY, theme); } catch(e) {}
    }

    toggle.addEventListener("change", function(){
      var theme = toggle.checked ? "dark" : "light";
      persistTheme(theme);
    });

    var themeIcon = document.querySelector(".theme-icon");
    if(themeIcon){
      themeIcon.setAttribute("role","button");
      themeIcon.setAttribute("tabindex","0");
      themeIcon.setAttribute("aria-label","Basculer le thème");
      themeIcon.setAttribute("title","Basculer le thème");
      themeIcon.addEventListener("click", function(){
        var nextTheme = toggle.checked ? "light" : "dark";
        persistTheme(nextTheme);
      });
      themeIcon.addEventListener("keydown", function(event){
        if(event.key === "Enter" || event.key === " "){
          event.preventDefault();
          var nextTheme = toggle.checked ? "light" : "dark";
          persistTheme(nextTheme);
        }
      });
    }
  }

  function initReleases(){
    const grid = document.getElementById("releasesGrid");
    if(!grid) return;

    function render(items){
      grid.innerHTML = "";
      items.forEach(item => {
        const card = document.createElement("article");
        card.className = "release-card";
        const img = document.createElement("img");
        img.src = item.cover || `${ASSET_BASE}mc-skual-portrait.jpg`;
        img.alt = item.title || "Sortie";
        card.appendChild(img);

        const body = document.createElement("div");
        body.className = "release-body";

        const title = document.createElement("h3");
        title.className = "release-title";
        title.textContent = item.title || "Titre";
        body.appendChild(title);

        const link = document.createElement("a");
        link.className = "release-link";
        link.href = item.link || "#";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = item.platform || "Écouter";
        body.appendChild(link);

        card.appendChild(body);
        grid.appendChild(card);
      });
    }

    fetch("data/releases.json")
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if(Array.isArray(data) && data.length){
          render(data);
        }else{
          grid.innerHTML = '<p class="muted">Aucune sortie pour le moment.</p>';
        }
      })
      .catch(() => {
        grid.innerHTML = '<p class="muted">Impossible de charger les sorties pour le moment.</p>';
      });
  }

  document.addEventListener("DOMContentLoaded", function(){
    initNav();
    initTheme();
    initReleases();
  });
})();
