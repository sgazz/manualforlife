(function initTheme() {
  var key = "manualforlife-theme";
  var toggle = document.querySelector("[data-theme-toggle]");
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!toggle) return;

  function getTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  }

  function setMetaThemeColor(theme) {
    if (!metaTheme) return;
    metaTheme.setAttribute(
      "content",
      theme === "dark" ? "#1a1714" : "#f8f5f0"
    );
  }

  function updateToggleLabel(theme) {
    toggle.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  }

  function applyTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    updateToggleLabel(theme);
    setMetaThemeColor(theme);
    if (persist) {
      try {
        localStorage.setItem(key, theme);
      } catch (e) {
        /* ignore storage failures */
      }
    }
  }

  applyTheme(getTheme(), false);

  toggle.addEventListener("click", function () {
    applyTheme(getTheme() === "dark" ? "light" : "dark", true);
  });
})();

(function initMobileMenu() {
  var header = document.querySelector(".site-header");
  var menuToggle = document.querySelector("[data-menu-toggle]");
  var nav = document.getElementById("mobile-menu");
  var backdrop = document.querySelector("[data-menu-backdrop]");
  if (!header || !menuToggle || !nav) return;

  function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function setOpen(isOpen) {
    header.classList.toggle("is-menu-open", isOpen);
    document.body.classList.toggle("is-menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");

    if (isMobile()) {
      nav.setAttribute("aria-hidden", isOpen ? "false" : "true");
      document.body.style.overflow = isOpen ? "hidden" : "";
    } else {
      nav.removeAttribute("aria-hidden");
      document.body.style.overflow = "";
    }

    if (backdrop) {
      backdrop.setAttribute("aria-hidden", isOpen && isMobile() ? "false" : "true");
      backdrop.tabIndex = isOpen && isMobile() ? 0 : -1;
    }
  }

  menuToggle.addEventListener("click", function () {
    setOpen(!header.classList.contains("is-menu-open"));
  });

  if (backdrop) {
    backdrop.addEventListener("click", function () {
      setOpen(false);
      menuToggle.focus();
    });
  }

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setOpen(false);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && header.classList.contains("is-menu-open")) {
      setOpen(false);
      menuToggle.focus();
    }
  });

  window.matchMedia("(max-width: 768px)").addEventListener("change", function (event) {
    if (!event.matches) setOpen(false);
  });

  window.matchMedia("(min-width: 769px)").addEventListener("change", function (event) {
    if (event.matches) setOpen(false);
  });

  setOpen(false);
})();
