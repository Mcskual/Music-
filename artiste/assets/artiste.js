(function(){
  const THEME_KEY = "szd_theme";

  function updateThemeLogos(theme){
    const mode = theme === "light" ? "light" : "dark";
    document.querySelectorAll('[data-light-src][data-dark-src]').forEach((img) => {
      const target = mode === "light" ? img.dataset.lightSrc : img.dataset.darkSrc;
      if (target) img.setAttribute("src", target);
    });
  }

  function applyTheme(theme){
    const root = document.documentElement;
    const themeIcon = document.querySelector("[data-theme-icon]");
    if(theme === "light") root.setAttribute("data-theme","light");
    else root.removeAttribute("data-theme");
    if(themeIcon) themeIcon.textContent = theme === "light" ? "☀️" : "🌙";
    updateThemeLogos(theme);
  }

  function initTheme(){
    const toggle = document.getElementById("themeToggle");
    if(!toggle) return;

    let savedTheme = null;
    try { savedTheme = localStorage.getItem(THEME_KEY); } catch(e) {}
    const initialTheme = savedTheme === "light" ? "light" : "dark";
    applyTheme(initialTheme);

    const persistTheme = (theme) => {
      applyTheme(theme);
      try { localStorage.setItem(THEME_KEY, theme); } catch(e) {}
    };

    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      const next = current === "light" ? "dark" : "light";
      persistTheme(next);
    });
  }

  function setActiveNav(){
    const currentPage = document.body.dataset.page;
    if(!currentPage) return;
    document.querySelectorAll("[data-page-link]").forEach(link => {
      const isActive = link.dataset.pageLink === currentPage;
      link.classList.toggle("active", isActive);
      if(isActive) link.setAttribute("aria-current","page");
      else link.removeAttribute("aria-current");
    });
  }

  function initHeaderMenu(){
    const nav = document.getElementById("primaryNav");
    const menuToggle = document.getElementById("menuToggle");
    if(!nav || !menuToggle) return;

    const closeMenu = () => {
      nav.classList.remove("is-open");
      menuToggle.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded","false");
      nav.setAttribute("aria-expanded","false");
      document.body.classList.remove("nav-open");
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      menuToggle.classList.toggle("is-open", isOpen);
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      nav.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.classList.toggle("nav-open", isOpen);
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => closeMenu());
    });

    window.addEventListener("resize", () => {
      if(window.innerWidth >= 960) closeMenu();
    });
  }

  function initAccordion(){
    document.querySelectorAll(".accordion").forEach((accordion) => {
      const trigger = accordion.querySelector(".accordion-trigger");
      const panel = accordion.querySelector(".accordion-panel");
      if(!trigger || !panel) return;
      panel.hidden = true;

      trigger.addEventListener("click", () => {
        const isOpen = accordion.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
        panel.hidden = !isOpen;
      });
    });
  }

  function renderReleases(grid, items){
    grid.innerHTML = "";
    if(!items.length){
      grid.innerHTML = '<p class="muted">Aucune sortie pour le moment.</p>';
      return;
    }

    items.forEach(item => {
      const card = document.createElement("article");
      card.className = "release-card";

      const cover = document.createElement("img");
      cover.className = "release-cover";
      cover.src = item.cover || "assets/releases/mono-lines.svg";
      cover.alt = item.title || "Sortie";
      card.appendChild(cover);

      const body = document.createElement("div");
      body.className = "release-copy";

      const title = document.createElement("h3");
      title.className = "release-title";
      title.textContent = item.title || "Titre à définir";
      body.appendChild(title);

      if(item.artist){
        const artist = document.createElement("p");
        artist.className = "release-artist";
        artist.textContent = item.artist;
        body.appendChild(artist);
      }

      const meta = document.createElement("p");
      const typeLabel = item.type || "Single";
      const yearLabel = item.year ? ` · ${item.year}` : "";
      meta.className = "release-meta";
      meta.textContent = `${typeLabel}${yearLabel}`;
      body.appendChild(meta);

      const action = document.createElement("a");
      action.className = "release-action";
      action.href = item.link || "#";
      action.target = "_blank";
      action.rel = "noopener noreferrer";
      action.textContent = item.cta || "Écouter";
      body.appendChild(action);

      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  function initReleases(){
    const grid = document.querySelector("[data-releases-grid]");
    if(!grid) return;

    fetch("data/sorties.json")
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? data : [])
      .then(items => renderReleases(grid, items))
      .catch(() => { grid.innerHTML = '<p class="muted">Impossible de charger les sorties.</p>'; });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initHeaderMenu();
    initAccordion();
    initReleases();
    setActiveNav();
  });
})();
