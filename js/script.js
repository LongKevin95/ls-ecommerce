// ================= USER =================

const USERS_KEY = "users";
const CURRENT_USER_KEY = "user";
let activeCategory = null;

function initAdminAccount() {
  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

  
  const hasAdmin = users.some((user) => user.role === "admin");

  if (!hasAdmin) {
    const admin = {
      id: Date.now(),
      email: "admin@gmail.com",
      password: "admin",
      name: "admin",
      role: "admin",
    };

    users.push(admin);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    console.log("Admin account created");
  }
}

function renderBestSellingProducts() {
  const container = document.getElementById("bestSellingTrack");
  if (!container) return;

  const products = JSON.parse(localStorage.getItem("products")) || [];
  let list = products.slice(0, 4);

  if (!list.length) {
    list = [
      {
        id: "best-1",
        name: "The north coat",
        price: 260,
        img: "https://picsum.photos/400?best1",
      },
      {
        id: "best-2",
        name: "Gucci duffle bag",
        price: 960,
        img: "https://picsum.photos/400?best2",
      },
      {
        id: "best-3",
        name: "RGB liquid CPU Cooler",
        price: 160,
        img: "https://picsum.photos/400?best3",
      },
      {
        id: "best-4",
        name: "Small BookShelf",
        price: 360,
        img: "https://picsum.photos/400?best4",
      },
    ];
  }

  renderProductCards(container, list);
}

function syncActiveCategoryUI() {
  const items = document.querySelectorAll(
    "#menu .menu-list-item, #mobileMenu .menu-list-item",
  );
  if (!items.length) return;

  const current = activeCategory || "";
  items.forEach((li) => {
    const liCategory = li.dataset.category || "";
    li.classList.toggle("is-active", liCategory === current);
  });
}

function getUser() {
  return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
}

// ================= LOGOUT =================
function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  const isInPagesFolder = window.location.pathname.includes("/pages/");
  window.location.href = isInPagesFolder ? "../index.html" : "./index.html";
}


window.logout = logout;

// ================= CART =================
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartBadge() {
  const badge = document.getElementById("headerCartBadge");
  if (!badge) return;

  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = total;
}

// ================= WISHLIST =================
const WISHLIST_PREFIX = "wishlist:";

function getWishlistKey() {
  const user = getUser();
  if (!user?.id) return null;
  return `${WISHLIST_PREFIX}${user.id}`;
}

function getWishlistIds() {
  const key = getWishlistKey();
  if (!key) return [];
  return JSON.parse(localStorage.getItem(key)) || [];
}

function saveWishlistIds(ids) {
  const key = getWishlistKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(ids));
}

function isInWishlist(productId) {
  return getWishlistIds().some((id) => String(id) === String(productId));
}

function updateWishlistBadge() {
  const badge = document.getElementById("headerWishlistBadge");
  if (!badge) return;

  const user = getUser();
  if (!user || user.role !== "customer") {
    badge.textContent = "0";
    badge.style.display = "none";
    return;
  }

  const count = getWishlistIds().length;
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

function redirectToLoginForWishlist() {
  alert("Vui lòng đăng nhập để sử dụng wishlist!");
  const isInPagesFolder = window.location.pathname.includes("/pages/");
  window.location.href = isInPagesFolder ? "login.html" : "pages/login.html";
}

function toggleWishlist(productId) {
  const user = getUser();
  if (!user) {
    redirectToLoginForWishlist();
    return { added: false, ids: [] };
  }

  if (user.role !== "customer") {
    alert("Admin không thể sử dụng wishlist!");
    return { added: false, ids: getWishlistIds() };
  }

  const nextId = String(productId);
  const ids = getWishlistIds().map(String);
  const index = ids.indexOf(nextId);

  let added = false;
  if (index >= 0) {
    ids.splice(index, 1);
  } else {
    ids.push(nextId);
    added = true;
  }

  saveWishlistIds(ids);
  updateWishlistBadge();
  return { added, ids };
}

// ================= ADD TO CART =================
function getProductStockValue(product) {
  const raw = Number(product?.stock);
  return Number.isFinite(raw) ? raw : null;
}

function addToCart(productId) {
  const user = getUser();

  if (!user) {
    alert("Vui lòng đăng nhập để mua hàng!");
    const isInPagesFolder = window.location.pathname.includes("/pages/");
    window.location.href = isInPagesFolder ? "login.html" : "pages/login.html";
    return;
  }

  if (user.role !== "customer") {
    alert("Admin không thể mua hàng!");
    return;
  }

  const products = JSON.parse(localStorage.getItem("products")) || [];
  const product = products.find((p) => p.id == productId);

  if (!product) {
    alert("Sản phẩm không tồn tại!");
    return;
  }

  let cart = getCart();
  const index = cart.findIndex((i) => i.id == productId);
  const stockValue = getProductStockValue(product);
  const currentQty = index !== -1 ? Number(cart[index].qty) || 0 : 0;

  if (stockValue !== null && stockValue <= currentQty) {
    alert("Sản phẩm đã hết hàng (sold out).");
    return;
  }

  if (index !== -1) {
    cart[index].qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      img: product.img,
      qty: 1,
    });
  }

  saveCart(cart);
  updateCartBadge();
  alert("Đã thêm vào giỏ hàng 🛒");
}

window.addToCart = addToCart;

// ================= RENDER PRODUCTS =================
function getSearchTermFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("q") || params.get("search") || "").trim();
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

function getCategoryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = (params.get("category") || "").trim();
  return raw || null;
}

function formatMoney(value) {
  const num = Number(value) || 0;
  const rounded = Math.round(num);
  return `₫${new Intl.NumberFormat("vi-VN").format(rounded)}`;
}

window.formatMoney = formatMoney;

function renderProductCards(container, list) {
  if (!container) return;
  container.innerHTML = "";

  if (container.dataset.wishlistBound !== "1") {
    container.dataset.wishlistBound = "1";
    container.addEventListener(
      "click",
      (e) => {
        const btn = e.target.closest("[data-wishlist-id]");
        if (!btn || !container.contains(btn)) return;

        
        e.preventDefault();
        e.stopPropagation();

        const productId = btn.dataset.wishlistId;
        const result = toggleWishlist(productId);
        btn.textContent = result.added ? "♥" : "♡";
      },
      true,
    );
  }

  list.forEach((p) => {
    const stockValue = getProductStockValue(p);
    const isSoldOut = stockValue !== null && stockValue <= 0;
    const addButtonLabel = isSoldOut ? "Sold Out" : "Add To Cart";

    container.innerHTML += `
      <div class="product${isSoldOut ? " product--sold-out" : ""}" onclick="goToDetail('${p.id}')">
        <span class="product-discount">-40%</span>
        ${isSoldOut ? '<span class="product-soldout">Sold out</span>' : ""}

        <div class="product-actions">
          <button class="product-action-btn" type="button" aria-label="Wishlist" data-wishlist-id="${p.id}">${
            isInWishlist(p.id) ? "♥" : "♡"
          }</button>
          <button class="product-action-btn" aria-label="Quick view" onclick="event.stopPropagation(); goToDetail('${
            p.id
          }')">👁</button>
        </div>

        <div class="product-img-wrap">
          <img src="${p.img}" class="product-img" />

          <button class="product-cart" ${
            isSoldOut ? "disabled" : ""
          } onclick="event.stopPropagation(); addToCart('${p.id}')">
            ${addButtonLabel}
          </button>
        </div>

        <h3 class="product-name">${p.name}</h3>

        <div class="product-price">
          <span class="price-new">${formatMoney(p.price)}</span>
          <span class="price-old">${formatMoney(Math.round(p.price * 1.3))}</span>
        </div>

        <div class="product-rating">
          ⭐⭐⭐⭐⭐ <span>(88)</span>
        </div>
      </div>
    `;
  });
}

window.renderProductCards = renderProductCards;

function renderFlashSaleProducts(filterCategory = null) {
  const container = document.querySelector(".flash-track");
  if (!container) return;

  const products = JSON.parse(localStorage.getItem("products")) || [];
  const filteredProducts = filterCategory
    ? products.filter((p) => p.category === filterCategory)
    : products;

  renderProductCards(container, filteredProducts.slice(0, 8));
}

function renderCategoryPage() {
  const track = document.getElementById("categoryTrack");
  if (!track) return;
  const emptyMsg = document.querySelector(".no-product-messege");

  const titleEl = document.getElementById("categoryTitle");
  const breadcrumbCurrentEl = document.getElementById(
    "categoryBreadcrumbCurrent",
  );
  const category = getCategoryFromUrl();

  if (titleEl) {
    titleEl.value = category || "";

    if (titleEl.dataset.bound !== "1") {
      titleEl.dataset.bound = "1";
      titleEl.addEventListener("change", () => {
        const next = (titleEl.value || "").trim();
        const params = new URLSearchParams(window.location.search);
        if (next) params.set("category", next);
        else params.delete("category");

        const isInPagesFolder = window.location.pathname.includes("/pages/");
        const prefix = isInPagesFolder ? "" : "pages/";
        const qs = params.toString();
        window.location.href = `${prefix}category.html${qs ? `?${qs}` : ""}`;
      });
    }
  }

  let categoryLabel = category || "All";
  if (titleEl) {
    const options = Array.from(titleEl.options || []);
    const match = options.find((opt) => opt.value === (category || ""));
    if (match)
      categoryLabel = (match.textContent || "").trim() || categoryLabel;
  }

  if (breadcrumbCurrentEl) breadcrumbCurrentEl.textContent = categoryLabel;

  const products = JSON.parse(localStorage.getItem("products")) || [];
  const filtered = category
    ? products.filter((p) => p.category === category)
    : products;

  if (!filtered.length) {
    if (emptyMsg) emptyMsg.style.display = "flex";
    track.style.display = "none";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";
  track.style.display = "grid";

  renderProductCards(track, filtered);
}

function syncHeaderNavActiveState() {
  const nav = document.querySelector(".header-nav__list");
  if (!nav) return;

  const homeLink = nav.querySelector('a[href="/index.html"]');
  const categoriesBtn = document.getElementById("categoriesBtn");

  const path = (window.location.pathname || "").toLowerCase();
  const isCategoryPage = path.endsWith("/pages/category.html");

  if (homeLink) homeLink.classList.toggle("is-active", !isCategoryPage);
  if (categoriesBtn)
    categoriesBtn.classList.toggle("is-active", isCategoryPage);
}

function renderSearchResults(term, filterCategory = null) {
  const titleEl = document.getElementById("searchResultsTitle");
  const container = document.getElementById("searchResultsTrack");
  if (!container) return;

  const products = JSON.parse(localStorage.getItem("products")) || [];
  const q = normalizeText(term);
  const matched = q
    ? products.filter((p) => {
        const name = normalizeText(p.name);
        return name.includes(q);
      })
    : products;

  if (titleEl) {
    titleEl.textContent = q
      ? `Kết quả tìm kiếm: "${term}" (${matched.length})`
      : "Kết quả tìm kiếm";
  }

  if (matched.length === 0) {
    container.innerHTML = "<p>Không tìm thấy sản phẩm phù hợp.</p>";
    return;
  }

  renderProductCards(container, matched);
}

function applySearchState() {
  const flashSection = document.getElementById("flashSection");
  const bestSellingSection = document.getElementById("bestSellingSection");
  const searchSection = document.getElementById("searchResultsSection");
  const term = getSearchTermFromUrl();

  const input = document.getElementById("headerSearchInput");
  if (input) input.value = term;

  if (term) {
    if (flashSection) flashSection.hidden = true;
    if (bestSellingSection) bestSellingSection.hidden = true;
    if (searchSection) searchSection.hidden = false;
    renderSearchResults(term);
  } else {
    if (flashSection) flashSection.hidden = false;
    if (bestSellingSection) bestSellingSection.hidden = false;
    if (searchSection) searchSection.hidden = true;
    renderFlashSaleProducts(activeCategory);
    renderBestSellingProducts();
  }
}

window.addEventListener("popstate", () => {
  if (
    document.getElementById("flashSection") ||
    document.getElementById("bestSellingSection") ||
    document.getElementById("searchResultsSection")
  ) {
    applySearchState();
  }
});

// ==========PRODUCT DETAIL=============
function goToDetail(productId) {
  const isInPagesFolder = window.location.pathname.includes("/pages/");
  const prefix = isInPagesFolder ? "" : "pages/";
  window.location.href = `${prefix}product-detail.html?id=${productId}`;
}
window.goToDetail = goToDetail;

function init() {
  initAdminAccount();
  const isInPagesFolder = window.location.pathname.includes("/pages/");
  const isHome =
    window.location.pathname.endsWith("/index.html") ||
    window.location.pathname === "/" ||
    window.location.pathname.endsWith("/");

  syncHeaderNavActiveState();

  const backToTopBtn = document.getElementById("backToTop");
  if (backToTopBtn) {
    const syncBackToTopVisibility = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      backToTopBtn.style.display = y > 300 ? "flex" : "none";
    };

    syncBackToTopVisibility();
    window.addEventListener("scroll", syncBackToTopVisibility, {
      passive: true,
    });

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (document.getElementById("categoryTrack")) {
    renderCategoryPage();
  } else {
    syncActiveCategoryUI();
    if (
      document.getElementById("flashSection") ||
      document.getElementById("bestSellingSection") ||
      document.getElementById("searchResultsSection")
    ) {
      applySearchState();
    }
  }
}
init();
