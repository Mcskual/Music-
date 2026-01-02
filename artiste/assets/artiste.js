(function(){
  const THEME_KEY = "szd_theme";
  const ASSET_BASE = "../prestations/assets/";

  function updateThemeLogos(theme){
    const mode = theme === "light" ? "light" : "dark";
    document.querySelectorAll('[data-light-src][data-dark-src]').forEach((img) => {
      const target = mode === "light" ? img.dataset.lightSrc : img.dataset.darkSrc;
      if (target) img.setAttribute("src", target);
    });
  }

  function applyTheme(theme){
    const root = document.documentElement;
    const themeIcon = document.querySelector(".theme-icon");
    if(theme === "light") root.setAttribute("data-theme","light");
    else root.removeAttribute("data-theme");
    if(themeIcon) themeIcon.textContent = theme === "light" ? "☀️" : "🌙";
    updateThemeLogos(theme);
  }

  function initTheme(){
    const toggle = document.getElementById("themeToggle");
    if(!toggle) return;

    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch(e) {}
    const initialTheme = saved === "light" ? "light" : "dark";
    applyTheme(initialTheme);

    const isCheckbox = toggle.tagName === "INPUT" && toggle.type === "checkbox";
    const syncToggle = (theme) => {
      if(isCheckbox) toggle.checked = theme !== "light";
      toggle.setAttribute("data-mode", theme);
    };
    syncToggle(initialTheme);

    const persistTheme = (theme) => {
      applyTheme(theme);
      syncToggle(theme);
      try { localStorage.setItem(THEME_KEY, theme); } catch(e) {}
    };

    if(isCheckbox){
      toggle.addEventListener("change", () => {
        const next = toggle.checked ? "dark" : "light";
        persistTheme(next);
      });
    } else {
      toggle.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
        const next = currentTheme === "light" ? "dark" : "light";
        persistTheme(next);
      });
    }

    const themeIcon = document.querySelector(".theme-icon");
    if(themeIcon && themeIcon.closest("button") !== toggle){
      themeIcon.setAttribute("role","button");
      themeIcon.setAttribute("tabindex","0");
      themeIcon.addEventListener("click", () => {
        const next = toggle.checked ? "light" : "dark";
        persistTheme(next);
      });
      themeIcon.addEventListener("keydown", (event) => {
        if(event.key === "Enter" || event.key === " "){
          event.preventDefault();
          const next = toggle.checked ? "light" : "dark";
          persistTheme(next);
        }
      });
    }
  }

  function closeNav(nav, toggle){
    nav?.classList.remove("is-open");
    toggle?.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded","false");
    document.body.classList.remove("nav-open");
  }

  function toggleNav(nav, toggle){
    const isOpen = nav?.classList.toggle("is-open");
    toggle?.classList.toggle("is-open", isOpen);
    toggle?.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.classList.toggle("nav-open", Boolean(isOpen));
  }

  function initNav(){
    const nav = document.getElementById("sideNav");
    const navToggle = document.getElementById("navToggle");
    const links = document.querySelectorAll('.nav-link[data-target]');

    if(navToggle){
      navToggle.addEventListener("click", () => toggleNav(nav, navToggle));
    }

    links.forEach(link => {
      link.addEventListener("click", () => {
        const targetId = link.getAttribute("data-target");
        const section = targetId ? document.getElementById(targetId) : null;
        if(section){ section.scrollIntoView({ behavior: "smooth", block: "start" }); }
        links.forEach(l => l.classList.remove("active"));
        link.classList.add("active");
        closeNav(nav, navToggle);
      });
    });

    window.addEventListener("resize", () => {
      if(window.innerWidth >= 960){ closeNav(nav, navToggle); }
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
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      menuToggle.classList.toggle("is-open", isOpen);
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      nav.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => closeMenu());
    });

    window.addEventListener("resize", () => {
      if(window.innerWidth >= 960) closeMenu();
    });
  }

  function initSectionObserver(){
    const links = document.querySelectorAll('.nav-link[data-target]');
    const sections = Array.from(document.querySelectorAll('[data-section]'));
    if(!("IntersectionObserver" in window) || !sections.length) return;

    const map = new Map();
    links.forEach(link => map.set(link.getAttribute("data-target"), link));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          const link = map.get(entry.target.id);
          if(link){
            links.forEach(l => l.classList.remove("active"));
            link.classList.add("active");
          }
        }
      });
    }, { rootMargin: "-40% 0px -40% 0px", threshold: 0.2 });

    sections.forEach(section => observer.observe(section));
  }

  function initReleases(){
    const grid = document.getElementById("releasesGrid");
    if(!grid) return;

    const render = (items) => {
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
    };

    fetch("data/releases.json")
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if(Array.isArray(data) && data.length){ render(data); }
        else { grid.innerHTML = '<p class="muted">Aucune sortie pour le moment.</p>'; }
      })
      .catch(() => {
        grid.innerHTML = '<p class="muted">Impossible de charger les sorties pour le moment.</p>';
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNav();
    initHeaderMenu();
    initSectionObserver();
    initReleases();
  });
})();
