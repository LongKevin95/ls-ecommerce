(function () {
  const CURRENT_USER_KEY = "user";

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    } catch {
      return null;
    }
  }

  function getLoginHrefFallback() {
    const loginLink = document.getElementById("loginLink");
    const href = loginLink?.getAttribute("href");
    if (href) return href;

    const isInPagesFolder = window.location.pathname.includes("/pages/");
    return isInPagesFolder ? "login.html" : "pages/login.html";
  }

  function getSearchPageHref(term) {
    const next = (term || "").trim();

    // Prefer using any existing search link in header to avoid hardcoding paths.
    const searchAnchor = document.querySelector(
      'a[href*="search.html"]:not([href*="javascript"])',
    );
    const baseHref = searchAnchor?.getAttribute("href") || "";

    if (baseHref.includes("search.html")) {
      const clean = baseHref.split("?")[0];
      if (!next) return clean;
      const joiner = clean.includes("?") ? "&" : "?";
      return `${clean}${joiner}q=${encodeURIComponent(next)}`;
    }

    const isInPagesFolder = window.location.pathname.includes("/pages/");
    const prefix = isInPagesFolder ? "" : "pages/";
    if (!next) return `${prefix}search.html`;
    return `${prefix}search.html?q=${encodeURIComponent(next)}`;
  }

  function getHomeHref() {
    const isInPagesFolder = window.location.pathname.includes("/pages/");
    return isInPagesFolder ? "../index.html" : "index.html";
  }

  function insertMobileHomeLink() {
    const panel = document.getElementById("mobileMenuPanel");
    if (!panel) return;

    if (panel.dataset.homeBound === "1") return;
    panel.dataset.homeBound = "1";

    if (panel.querySelector("#mobileHomeBtn")) return;

    const home = document.createElement("a");
    home.id = "mobileHomeBtn";
    home.className = "mobile-menu__home";
    home.href = getHomeHref();
    home.textContent = "Home";
    home.addEventListener("click", () => {
      closeMobileMenuIfOpen();
    });

    const menu = panel.querySelector("#mobileMenu");
    if (menu) {
      panel.insertBefore(home, menu);
    } else {
      panel.appendChild(home);
    }
  }

  function redirectTo(url) {
    window.location.href = url;
  }

  function normalizeText(str) {
    return (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getProducts() {
    try {
      return JSON.parse(localStorage.getItem("products")) || [];
    } catch {
      return [];
    }
  }

  function updateCartBadge() {
    if (typeof window.updateCartBadge === "function") {
      window.updateCartBadge();
      return;
    }

    const badge = document.getElementById("headerCartBadge");
    if (!badge) return;

    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      cart = [];
    }

    const total = cart.reduce((sum, item) => sum + (Number(item?.qty) || 0), 0);
    badge.textContent = String(total);
  }

  function updateWishlistBadge() {
    if (typeof window.updateWishlistBadge === "function") {
      window.updateWishlistBadge();
      return;
    }

    const badge = document.getElementById("headerWishlistBadge");
    if (!badge) return;

    const user = getUser();
    if (!user || user.role !== "customer") {
      badge.textContent = "0";
      badge.style.display = "none";
      return;
    }

    const key = `wishlist:${user.id}`;
    let ids = [];
    try {
      ids = JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      ids = [];
    }

    const count = ids.length;
    badge.textContent = String(count);
    badge.style.display = count > 0 ? "flex" : "none";
  }

  function handleAuthUI() {
    const currentUser = getUser();
    const loginLink = document.getElementById("loginLink");
    const signupLink = document.getElementById("signupLink");
    const logoutBtn = document.getElementById("logoutBtn");

    if (currentUser) {
      if (loginLink) loginLink.style.display = "none";
      if (signupLink) signupLink.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "inline-block";
    } else {
      if (loginLink) loginLink.style.display = "inline-block";
      if (signupLink) signupLink.style.display = "inline-block";
      if (logoutBtn) logoutBtn.style.display = "none";
    }
  }

  function bindLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn && logoutBtn.dataset.bound !== "1") {
      logoutBtn.dataset.bound = "1";
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof window.logout === "function") {
          window.logout();
          return;
        }
        localStorage.removeItem(CURRENT_USER_KEY);
        redirectTo(getLoginHrefFallback());
      });
    }

    const menuLogout = document.getElementById("menuLogout");
    if (menuLogout && menuLogout.dataset.bound !== "1") {
      menuLogout.dataset.bound = "1";
      menuLogout.addEventListener("click", () => {
        if (typeof window.logout === "function") {
          window.logout();
          return;
        }
        localStorage.removeItem(CURRENT_USER_KEY);
        redirectTo(getLoginHrefFallback());
      });
    }
  }

  function bindHeaderSearch() {
    const form = document.getElementById("headerSearchForm");
    const input = document.getElementById("headerSearchInput");
    const suggestions = document.getElementById("headerSearchSuggestions");
    if (!form || !input) return;

    if (form.dataset.bound === "1") return;
    form.dataset.bound = "1";

    function redirectToSearch(term) {
      redirectTo(getSearchPageHref(term));
    }

    function getSuggestions(query) {
      const q = normalizeText(query);
      if (!q) return [];

      const products = getProducts();
      const unique = new Set();

      products.forEach((p) => {
        if (p?.name) unique.add(String(p.name).trim());
      });

      const all = Array.from(unique)
        .map((s) => s.trim())
        .filter(Boolean);

      const filtered = all.filter((s) => normalizeText(s).includes(q));

      filtered.sort((a, b) => {
        const na = normalizeText(a);
        const nb = normalizeText(b);
        const aStarts = na.startsWith(q);
        const bStarts = nb.startsWith(q);
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        return na.localeCompare(nb);
      });

      return filtered.slice(0, 8);
    }

    function hideSuggestions() {
      if (!suggestions) return;
      suggestions.hidden = true;
      suggestions.innerHTML = "";
    }

    function renderSuggestions(list) {
      if (!suggestions) return;
      if (!list.length) {
        hideSuggestions();
        return;
      }

      suggestions.innerHTML = list
        .map(
          (text) =>
            `<button type="button" class="header-search__suggestion-item" data-value="${text.replace(
              /"/g,
              "&quot;",
            )}">${text}</button>`,
        )
        .join("");
      suggestions.hidden = false;
    }

    input.addEventListener("input", () => {
      renderSuggestions(getSuggestions(input.value));
    });

    input.addEventListener("focus", () => {
      renderSuggestions(getSuggestions(input.value));
    });

    suggestions?.addEventListener("click", (e) => {
      const btn = e.target.closest(".header-search__suggestion-item");
      if (!btn) return;
      const value = btn.dataset.value || btn.textContent || "";
      input.value = value;
      hideSuggestions();
      redirectToSearch(value);
    });

    document.addEventListener("click", (e) => {
      if (!suggestions || suggestions.hidden) return;
      if (!form.contains(e.target)) hideSuggestions();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const term = input.value.trim();
      hideSuggestions();
      redirectToSearch(term);
    });
  }

  function bindHeaderWishlist() {
    const btn = document.getElementById("headerWishlistBtn");
    if (!btn) return;

    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", (e) => {
      const user = getUser();
      if (!user) {
        e.preventDefault();
        alert("Vui lòng đăng nhập để sử dụng wishlist!");
        redirectTo(getLoginHrefFallback());
        return;
      }

      if (user.role !== "customer") {
        e.preventDefault();
        alert("Admin không thể sử dụng wishlist!");
      }
    });
  }

  function bindSupportLink() {
    const link = document.getElementById("navSupport");
    if (!link) return;

    if (link.dataset.bound === "1") return;
    link.dataset.bound = "1";

    link.addEventListener("click", (e) => {
      const user = getUser();
      if (!user) {
        e.preventDefault();
        alert("Vui lòng đăng nhập tài khoản để được hỗ trợ!");
      }
    });
  }

  function bindCategoriesDropdown() {
    const btn = document.getElementById("categoriesBtn");
    const dropdown = document.getElementById("categoriesDropdown");
    if (!btn || !dropdown) return;

    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    const close = () => {
      dropdown.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    };
    const open = () => {
      dropdown.hidden = false;
      btn.setAttribute("aria-expanded", "true");
    };

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (dropdown.hidden) open();
      else close();
    });

    document.addEventListener("click", (e) => {
      if (dropdown.hidden) return;
      if (dropdown.contains(e.target) || e.target === btn) return;
      close();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  function bindMobileMenu() {
    const btn = document.getElementById("mobileMenuBtn");
    const panel = document.getElementById("mobileMenuPanel");
    const overlay = document.getElementById("mobileMenuOverlay");
    const closeBtn = document.getElementById("mobileMenuCloseBtn");
    if (!btn || !panel || !overlay) return;

    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    const open = () => {
      overlay.hidden = false;
      panel.hidden = false;
      btn.setAttribute("aria-expanded", "true");
    };

    const close = () => {
      overlay.hidden = true;
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    };

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (panel.hidden) open();
      else close();
    });

    closeBtn?.addEventListener("click", () => {
      close();
    });

    overlay.addEventListener("click", () => {
      close();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) close();
    });
  }

  function closeMobileMenuIfOpen() {
    const panel = document.getElementById("mobileMenuPanel");
    const overlay = document.getElementById("mobileMenuOverlay");
    const btn = document.getElementById("mobileMenuBtn");

    if (panel && overlay && btn) {
      panel.hidden = true;
      overlay.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }
  }

  function closeCategoriesDropdownIfOpen() {
    const dropdown = document.getElementById("categoriesDropdown");
    const btn = document.getElementById("categoriesBtn");

    if (dropdown && btn) {
      dropdown.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }
  }

  function getCategoryPageHref(category) {
    const isInPagesFolder = window.location.pathname.includes("/pages/");
    const prefix = isInPagesFolder ? "" : "pages/";
    const cat = category || "";
    return `${prefix}category.html?category=${encodeURIComponent(cat)}`;
  }

  function bindCategoryMenu() {
    const menu = document.getElementById("menu");
    if (!menu) return;

    if (menu.dataset.bound === "1") return;
    menu.dataset.bound = "1";

    menu.addEventListener("click", (e) => {
      const item = e.target.closest(".menu-list-item");
      if (!item) return;

      const category = item.dataset.category || "";

      closeMobileMenuIfOpen();
      closeCategoriesDropdownIfOpen();

      redirectTo(getCategoryPageHref(category));
    });
  }

  function bindMobileCategoryMenu() {
    const menu = document.getElementById("mobileMenu");
    if (!menu) return;

    if (menu.dataset.bound === "1") return;
    menu.dataset.bound = "1";

    menu.addEventListener("click", (e) => {
      const item = e.target.closest(".menu-list-item");
      if (!item) return;

      const category = item.dataset.category || "";

      closeMobileMenuIfOpen();

      redirectTo(getCategoryPageHref(category));
    });
  }

  function bindUserMenu() {
    const userIcon = document.getElementById("userIcon");
    const userIconImg = document.getElementById("userIconImg");
    const userMenu = document.getElementById("userMenu");

    const headEl = userMenu?.querySelector(".user-menu__head");
    const dividerEl = userMenu?.querySelector(".user-menu__divider");

    const avatarEl = document.getElementById("userMenuAvatar");
    const nameEl = document.getElementById("userMenuName");
    const emailEl = document.getElementById("userMenuEmail");

    const signInBtn = document.getElementById("menuSignIn");
    const myProfileBtn = document.getElementById("menuMyProfile");
    const settingsBtn = document.getElementById("menuSettings");
    const notificationBtn = document.getElementById("menuNotification");
    const adminDashboardBtn = document.getElementById("menuAdminDashboard");
    const logoutBtn = document.getElementById("menuLogout");

    if (!userIcon || !userMenu) return;

    if (userIcon.dataset.bound === "1") return;
    userIcon.dataset.bound = "1";

    const isInPagesFolder = window.location.pathname.includes("/pages/");

    const loggedInAvatar = "https://i.pravatar.cc/80?img=32";

    const closeMenu = () => {
      userMenu.hidden = true;
      userIcon.setAttribute("aria-expanded", "false");
    };

    const applyUserMenuState = (u) => {
      const isLoggedIn = Boolean(u);
      const isAdmin = u?.role === "admin";

      const profileAvatar = u?.profile?.avatar || loggedInAvatar;

      const defaultAvatar = isInPagesFolder
        ? "../assets/icons/user-icon.svg"
        : "./assets/icons/user-icon.svg";

      if (userIconImg)
        userIconImg.src = isLoggedIn ? profileAvatar : defaultAvatar;
      if (avatarEl) avatarEl.src = isLoggedIn ? profileAvatar : defaultAvatar;

      if (headEl) headEl.style.display = isLoggedIn ? "flex" : "none";
      if (dividerEl) dividerEl.style.display = isLoggedIn ? "block" : "none";

      if (signInBtn) signInBtn.style.display = isLoggedIn ? "none" : "flex";
      if (myProfileBtn)
        myProfileBtn.style.display = isLoggedIn ? "flex" : "none";
      if (settingsBtn) settingsBtn.style.display = isLoggedIn ? "flex" : "none";
      if (notificationBtn)
        notificationBtn.style.display = isLoggedIn ? "block" : "none";
      if (logoutBtn) logoutBtn.style.display = isLoggedIn ? "flex" : "none";

      if (adminDashboardBtn) {
        adminDashboardBtn.hidden = !isAdmin;
        adminDashboardBtn.style.display = isAdmin ? "flex" : "none";
      }

      if (!isLoggedIn) return;

      const displayName =
        `${u?.profile?.firstName || ""} ${u?.profile?.lastName || ""}`.trim() ||
        u?.profile?.username ||
        u?.fullName ||
        u?.name ||
        "Your name";
      const displayEmail = u?.email || "yourname@gmail.com";

      if (nameEl) nameEl.textContent = displayName;
      if (emailEl) emailEl.textContent = displayEmail;
    };

    applyUserMenuState(getUser());

    const openMenu = () => {
      applyUserMenuState(getUser());
      userMenu.hidden = false;
      userIcon.setAttribute("aria-expanded", "true");
    };

    userIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      if (userMenu.hidden) openMenu();
      else closeMenu();
    });

    signInBtn?.addEventListener("click", () => {
      closeMenu();
      redirectTo(getLoginHrefFallback());
    });

    adminDashboardBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const u = getUser();
      if (!u || u.role !== "admin") {
        alert("Bạn không có quyền truy cập ❌");
        return;
      }

      closeMenu();

      redirectTo(isInPagesFolder ? "admin.html" : "pages/admin.html");
    });

    myProfileBtn?.addEventListener("click", () => {
      const u = getUser();
      if (!u) {
        redirectTo(getLoginHrefFallback());
        return;
      }

      closeMenu();

      redirectTo(
        isInPagesFolder ? "user-profile.html" : "pages/user-profile.html",
      );
    });

    logoutBtn?.addEventListener("click", () => {
      closeMenu();
      if (typeof window.logout === "function") window.logout();
      else localStorage.removeItem(CURRENT_USER_KEY);
    });

    document.addEventListener("click", (e) => {
      if (
        !userMenu.hidden &&
        !userMenu.contains(e.target) &&
        e.target !== userIcon
      ) {
        closeMenu();
      }
    });
  }

  function applyNavByRole() {
    const u = getUser();
    const isAdmin = u?.role === "admin";

    const navShop = document.getElementById("navShop");
    const cartBtn = document.getElementById("headerCartBtn");

    if (navShop) navShop.parentElement.style.display = isAdmin ? "none" : "";

    // Under option B, href should be correct in HTML per page.
    // We only disable for admin, and restore for others.
    if (cartBtn) {
      if (isAdmin) {
        cartBtn.setAttribute("aria-disabled", "true");
        cartBtn.dataset.hrefBackup = cartBtn.getAttribute("href") || "";
        cartBtn.removeAttribute("href");
        cartBtn.style.pointerEvents = "none";
        cartBtn.style.opacity = "0.6";
      } else {
        cartBtn.removeAttribute("aria-disabled");
        const backup = cartBtn.dataset.hrefBackup;
        if (backup) cartBtn.setAttribute("href", backup);
        cartBtn.style.pointerEvents = "";
        cartBtn.style.opacity = "";
      }
    }
  }

  function initHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    if (header.dataset.bound === "1") return;
    header.dataset.bound = "1";

    handleAuthUI();
    bindLogout();

    bindHeaderSearch();
    bindHeaderWishlist();
    bindSupportLink();

    bindCategoriesDropdown();
    insertMobileHomeLink();
    bindMobileMenu();
    bindCategoryMenu();
    bindMobileCategoryMenu();
    bindUserMenu();

    updateCartBadge();
    updateWishlistBadge();

    applyNavByRole();
  }

  document.addEventListener("DOMContentLoaded", initHeader);
})();
