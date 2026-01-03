(function(){
  const logo = document.getElementById("szdLogo");
  const themeIcon = document.querySelector("[data-theme-icon]");

  function applyTheme(theme) {
    const mode = theme === "light" ? "light" : "dark";
    document.body.dataset.theme = mode;
    document.documentElement.dataset.theme = mode;
    if (logo) {
      logo.src = mode === "light" ? logo.dataset.light : logo.dataset.dark;
    }
    if (themeIcon) themeIcon.textContent = mode === "light" ? "☀️" : "🌙";
  }

  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    const nextTheme =
      document.body.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  });

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
    const backdrop = document.querySelector("[data-nav-backdrop]");
    if(!nav || !menuToggle) return;

    const closeMenu = () => {
      nav.classList.remove("is-open");
      menuToggle.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded","false");
      nav.setAttribute("aria-expanded","false");
      document.body.classList.remove("nav-open");
    };

    const openMenu = () => {
      nav.classList.add("is-open");
      menuToggle.classList.add("is-open");
      menuToggle.setAttribute("aria-expanded","true");
      nav.setAttribute("aria-expanded","true");
      document.body.classList.add("nav-open");
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = nav.classList.contains("is-open");
      if(isOpen) closeMenu();
      else openMenu();
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => closeMenu());
    });

    if(backdrop){
      backdrop.addEventListener("click", closeMenu);
    }

    window.addEventListener("resize", () => {
      if(window.innerWidth >= 720) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if(event.key === "Escape") closeMenu();
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
    initHeaderMenu();
    initAccordion();
    initReleases();
    setActiveNav();
  });
})();
