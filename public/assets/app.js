(() => {
  const THEME_KEY = "brightpath_theme";
  const PALETTE_KEY = "brightpath_palette";

  function getSystemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }

  function getInitialTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return getSystemTheme();
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || getInitialTheme();
    const next = current === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  }

  // Init
  try {
    setTheme(getInitialTheme());
  } catch {
    setTheme(getSystemTheme());
  }

  // Bind toggles (can appear multiple times)
  document.addEventListener("click", (e) => {
    const target = e.target instanceof Element ? e.target.closest("[data-theme-toggle]") : null;
    if (!target) return;
    e.preventDefault();
    toggleTheme();
  });

  // Palette selection
  function getInitialPalette() {
    const saved = localStorage.getItem(PALETTE_KEY);
    if (saved === "ink" || saved === "emerald" || saved === "coral") return saved;
    return "ink";
  }

  function setPalette(palette) {
    document.documentElement.setAttribute("data-palette", palette);
  }

  try {
    setPalette(getInitialPalette());
  } catch {
    setPalette("ink");
  }

  document.addEventListener("click", (e) => {
    const target = e.target instanceof Element ? e.target.closest("[data-palette]") : null;
    if (!target) return;
    const palette = target.getAttribute("data-palette");
    if (!palette) return;
    e.preventDefault();
    setPalette(palette);
    localStorage.setItem(PALETTE_KEY, palette);
  });

  // Page transitions (simple + safe)
  function markReady() {
    document.body.classList.add("is-ready");
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    requestAnimationFrame(markReady);
  } else {
    window.addEventListener("DOMContentLoaded", () => requestAnimationFrame(markReady), { once: true });
  }

  document.addEventListener("click", (e) => {
    const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
    if (!a) return;

    const href = a.getAttribute("href") || "";
    if (!href || href.startsWith("#")) return;
    if (a.hasAttribute("target")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    // Only handle same-folder navigation (static pages)
    if (!/\.html(\#.*)?$/i.test(href)) return;

    e.preventDefault();
    document.body.classList.add("is-leaving");
    window.setTimeout(() => {
      window.location.href = href;
    }, 200);
  });
})();
