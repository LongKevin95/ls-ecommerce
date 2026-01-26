(function () {
  const QUERY_PARAM = "q";

  function parseNumberOrNull(value) {
    const raw = (value || "").toString().trim();
    if (!raw) return null;
    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
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

  function getQueryFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return (params.get(QUERY_PARAM) || params.get("search") || "").trim();
  }

  function getProducts() {
    return JSON.parse(localStorage.getItem("products")) || [];
  }

  function getUniqueCategories(products) {
    const set = new Set();
    (products || []).forEach((p) => {
      const c = (p?.category || "").toString().trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  function fillCategorySelect() {
    const select = document.getElementById("searchFilterCategory");
    if (!select) return;

    const products = getProducts();
    const categories = getUniqueCategories(products);

    select.innerHTML = "";

    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = "Tất cả";
    select.appendChild(allOpt);

    categories.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    });
  }

  function getFiltersFromForm() {
    const category = (
      document.getElementById("searchFilterCategory")?.value || ""
    ).trim();
    const minPrice = parseNumberOrNull(
      document.getElementById("searchFilterMinPrice")?.value,
    );
    const maxPrice = parseNumberOrNull(
      document.getElementById("searchFilterMaxPrice")?.value,
    );

    return {
      category: category || null,
      minPrice,
      maxPrice,
    };
  }

  function applyFilters(list, filters) {
    const f = filters || {};
    return (list || []).filter((p) => {
      if (f.category && (p?.category || "") !== f.category) return false;

      const price = Number(p?.price);
      if (!Number.isFinite(price)) return false;
      if (f.minPrice !== null && price < f.minPrice) return false;
      if (f.maxPrice !== null && price > f.maxPrice) return false;

      return true;
    });
  }

  function getSearchPageHref(term) {
    const next = (term || "").trim();
    const isInPagesFolder = window.location.pathname.includes("/pages/");
    const prefix = isInPagesFolder ? "" : "pages/";

    if (!next) return `${prefix}search.html`;
    return `${prefix}search.html?${QUERY_PARAM}=${encodeURIComponent(next)}`;
  }

  function formatMoney(value) {
    const num = Number(value) || 0;
    const rounded = Math.round(num);
    return `₫${new Intl.NumberFormat("vi-VN").format(rounded)}`;
  }

  function redirectToSearch(term) {
    window.location.href = getSearchPageHref(term);
  }

  function renderResults(term, filters = null) {
    const titleEl = document.getElementById("searchResultsTitle");
    const container = document.getElementById("searchResultsTrack");
    if (!container) return;

    const products = getProducts();
    const q = normalizeText(term);

    const matched = q
      ? products.filter((p) => normalizeText(p?.name).includes(q))
      : products;

    const filtered = filters ? applyFilters(matched, filters) : matched;

    if (titleEl) {
      titleEl.textContent = q
        ? `Kết quả tìm kiếm: "${term}" (${filtered.length})`
        : `Kết quả tìm kiếm (${filtered.length})`;
    }

    if (!filtered.length) {
      container.classList.add("is-empty");
      container.innerHTML =
        '<p class="search-page__empty">Không tìm thấy sản phẩm phù hợp.</p>';
      return;
    }

    container.classList.remove("is-empty");

    if (typeof window.renderProductCards === "function") {
      window.renderProductCards(container, filtered);
      return;
    }

    container.innerHTML = filtered
      .map(
        (p) => `
        <div class="product" onclick="goToDetail('${p.id}')">
          <span class="product-discount">-40%</span>

          <div class="product-actions">
            <button class="product-action-btn" aria-label="Wishlist" onclick="event.stopPropagation(); alert('Đã thêm vào wishlist!')">♡</button>
            <button class="product-action-btn" aria-label="Quick view" onclick="event.stopPropagation(); goToDetail('${p.id}')">👁</button>
          </div>

          <div class="product-img-wrap">
            <img src="${p.img}" class="product-img" />

            <button class="product-cart" onclick="event.stopPropagation(); addToCart('${p.id}')">Add To Cart</button>
          </div>

          <h3 class="product-name">${p.name}</h3>

          <div class="product-price">
            <span class="price-new">${formatMoney(p.price)}</span>
            <span class="price-old">${formatMoney(Math.round(p.price * 1.3))}</span>
          </div>

          <div class="product-rating">⭐⭐⭐⭐⭐ <span>(88)</span></div>
        </div>
      `,
      )
      .join("");
  }

  function bindFilters(term) {
    fillCategorySelect();

    const form = document.getElementById("searchFilterForm");
    if (!form) return;

    if (form.dataset.bound === "1") return;
    form.dataset.bound = "1";

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const filters = getFiltersFromForm();
      renderResults(term, filters);
    });
  }

  function renderSearchPage() {
    const term = getQueryFromUrl();
    const input = document.getElementById("headerSearchInput");
    if (input) input.value = term;
    bindFilters(term);
    renderResults(term);
  }

  window.Search = {
    normalizeText,
    redirectToSearch,
    renderSearchPage,
  };

  document.addEventListener("DOMContentLoaded", () => {
    const path = (window.location.pathname || "").toLowerCase();
    const isSearchPage =
      path.endsWith("/pages/search.html") || path.endsWith("/search.html");
    if (isSearchPage) renderSearchPage();
  });
})();
