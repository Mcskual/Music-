(() => {
  // Sélecteur générique pour toutes les cartes SZD Studio
  const CARD_SELECTOR = ".card, .value-card, .price-card, .service-card, .workflow-card";
  // Durée de persistance du glow après un tap (mobile)
  const RELEASE_DELAY = 650;
  const processed = new WeakSet();
  const clearTimers = new WeakMap();

  // Conserve le shadow natif pour le réappliquer pendant le glow
  const rememberShadow = (card) => {
    if (card.style.getPropertyValue("--sZD-card-shadow")) return;
    const styles = window.getComputedStyle(card);
    card.style.setProperty("--sZD-card-shadow", styles.boxShadow || "none");
  };

  const removeGlowLater = (card) => {
    const existing = clearTimers.get(card);
    if (existing) {
      clearTimeout(existing);
    }
    clearTimers.set(
      card,
      window.setTimeout(() => {
        card.classList.remove("is-touch-glow");
        clearTimers.delete(card);
      }, RELEASE_DELAY)
    );
  };

  // Branche les interactions sur une carte ciblée
  const attach = (card) => {
    if (!(card instanceof HTMLElement) || processed.has(card)) return;
    processed.add(card);
    card.classList.add("sZD-card");
    rememberShadow(card);

    card.addEventListener(
      "pointerdown",
      (event) => {
        if (event.pointerType === "mouse") return;
        const pending = clearTimers.get(card);
        if (pending) {
          clearTimeout(pending);
          clearTimers.delete(card);
        }
        card.classList.add("is-touch-glow", "is-touch-pressed");
      },
      { passive: true }
    );

    const handleRelease = (event) => {
      if (event.pointerType === "mouse") return;
      card.classList.remove("is-touch-pressed");
      removeGlowLater(card);
    };

    card.addEventListener("pointerup", handleRelease, { passive: true });
    card.addEventListener("pointercancel", handleRelease, { passive: true });
    card.addEventListener("pointerleave", handleRelease, { passive: true });
  };

  // Scan initial + éléments injectés dynamiquement
  const scan = (root = document) => {
    root.querySelectorAll(CARD_SELECTOR).forEach(attach);
    if (root instanceof HTMLElement && root.matches(CARD_SELECTOR)) {
      attach(root);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    scan();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => scan(node));
      }
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });

  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );
})();
