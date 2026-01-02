(function(){
  const THEME_KEY = "szd_theme";

  // Swap logo according to current theme
  function updateThemeLogos(theme){
    const mode = theme === "light" ? "light" : "dark";
    document.querySelectorAll('[data-light-src][data-dark-src]').forEach((img) => {
      const target = mode === "light" ? img.dataset.lightSrc : img.dataset.darkSrc;
      if (target && img.getAttribute("src") !== target) img.setAttribute("src", target);
    });
  }

  function applyTheme(theme){
    const root = document.documentElement;
    const themeIcon = document.querySelector("[data-theme-icon]");
    const isLight = theme === "light";
    if(isLight) root.setAttribute("data-theme","light");
    else root.removeAttribute("data-theme");
    if(themeIcon) themeIcon.textContent = isLight ? "☀️" : "🌙";
    updateThemeLogos(theme);
  }

  function getSavedTheme(){
    try { return localStorage.getItem(THEME_KEY); } catch(e) { return null; }
  }

  function persistTheme(theme){
    applyTheme(theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch(e) {}
  }

  function initTheme(){
    const toggle = document.getElementById("themeToggle");
    if(!toggle) return;

    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    const stored = getSavedTheme();
    const initial = stored || (prefersLight ? "light" : "dark");
    applyTheme(initial);

    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      const next = current === "light" ? "dark" : "light";
      persistTheme(next);
    });

    if(window.matchMedia){
      window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (event) => {
        const saved = getSavedTheme();
        if(saved) return; // user preference has priority
        applyTheme(event.matches ? "light" : "dark");
      });
    }
  }

  function setActiveNav(){
    const currentPage = document.body.dataset.page;
    if(!currentPage) return;
    document.querySelectorAll("[data-active-pages]").forEach(link => {
      const pages = link.dataset.activePages.split(",").map(v => v.trim());
      const isActive = pages.includes(currentPage);
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

  function initPricingSwitch(){
    const triggers = Array.from(document.querySelectorAll("[data-tab-target]"));
    const panels = Array.from(document.querySelectorAll("[data-tab-panel]"));
    if(!triggers.length || !panels.length) return;

    const shell = triggers[0].closest(".switch-shell");

    const updateIndicator = (target) => {
      if(!shell) return;
      const index = triggers.findIndex(btn => btn.dataset.tabTarget === target);
      shell.style.setProperty("--switch-index", Math.max(0, index));
    };

    const activate = (target) => {
      if(!target) return;

      triggers.forEach((btn) => {
        const isActive = btn.dataset.tabTarget === target;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
        btn.setAttribute("tabindex", isActive ? "0" : "-1");
      });

      panels.forEach((panel) => {
        const isActive = panel.dataset.tabPanel === target;
        panel.hidden = !isActive;
        panel.setAttribute("aria-hidden", isActive ? "false" : "true");
        panel.classList.toggle("is-active", isActive);
        panel.classList.remove("is-entering");
        if(isActive){
          void panel.offsetWidth; // force reflow for animation
          panel.classList.add("is-entering");
          setTimeout(() => panel.classList.remove("is-entering"), 360);
        }
      });

      updateIndicator(target);
    };

    const initialTarget = triggers.find(btn => btn.classList.contains("is-active"))?.dataset.tabTarget || triggers[0].dataset.tabTarget;
    activate(initialTarget);

    triggers.forEach(btn => {
      btn.addEventListener("click", () => activate(btn.dataset.tabTarget));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initHeaderMenu();
    initAccordion();
    initReleases();
    initPricingSwitch();
    setActiveNav();
  });
})();
