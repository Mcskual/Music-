(function(){
  const KEY = "theme";
  const root = document.documentElement;
  const readPreference = () => {
    try { return localStorage.getItem(KEY); } catch(e) { return null; }
  };
  const stored = readPreference();
  const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  const theme = stored || (prefersLight ? "light" : "dark");
  root.dataset.theme = theme === "light" ? "light" : "dark";
})();
