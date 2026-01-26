(function () {
  const CURRENT_USER_KEY = "user";
  const WISHLIST_PREFIX = "wishlist:";

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    } catch {
      return null;
    }
  }

  function getWishlistKey() {
    const user = getUser();
    if (!user?.id) return null;
    return `${WISHLIST_PREFIX}${user.id}`;
  }

  function getWishlistIds() {
    const key = getWishlistKey();
    if (!key) return [];
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  function saveWishlistIds(ids) {
    const key = getWishlistKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(ids));
  }

  function redirectToLogin() {
    alert("Vui lòng đăng nhập để sử dụng wishlist!");
    window.location.href = "./login.html";
  }

  function getProducts() {
    try {
      return JSON.parse(localStorage.getItem("products")) || [];
    } catch {
      return [];
    }
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  function getProductStockValue(product) {
    const raw = Number(product?.stock);
    return Number.isFinite(raw) ? raw : null;
  }

  function syncHeaderCartBadge() {
    const badge = document.getElementById("headerCartBadge");
    if (!badge) return;
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + (Number(item?.qty) || 0), 0);
    badge.textContent = String(total);
  }

  function syncHeaderWishlistBadge() {
    const badge = document.getElementById("headerWishlistBadge");
    if (!badge) return;

    const user = getUser();
    if (!user || user.role !== "customer") {
      badge.textContent = "0";
      badge.style.display = "none";
      return;
    }

    const count = getWishlistIds().length;
    badge.textContent = String(count);
    badge.style.display = count > 0 ? "flex" : "none";
  }

  function formatMoney(value) {
    if (typeof window.formatMoney === "function") {
      return window.formatMoney(value);
    }
    const num = Number(value) || 0;
    const rounded = Math.round(num);
    return `₫${new Intl.NumberFormat("vi-VN").format(rounded)}`;
  }

  function getWishlistItems() {
    const ids = getWishlistIds().map(String);
    if (!ids.length) return [];
    const products = getProducts();
    const idSet = new Set(ids);
    return products.filter((p) => idSet.has(String(p.id)));
  }

  function renderWishlistCards(container, items) {
    container.innerHTML = "";

    if (container.dataset.bound !== "1") {
      container.dataset.bound = "1";
      container.addEventListener(
        "click",
        (e) => {
          const removeBtn = e.target.closest("[data-remove-wishlist-id]");
          if (removeBtn && container.contains(removeBtn)) {
            e.preventDefault();
            e.stopPropagation();
            removeWishlistItem(removeBtn.dataset.removeWishlistId);
            return;
          }
        },
        true,
      );
    }

    items.forEach((p) => {
      const stockValue = getProductStockValue(p);
      const isSoldOut = stockValue !== null && stockValue <= 0;
      const addButtonLabel = isSoldOut ? "Sold Out" : "Add To Cart";

      container.innerHTML += `
        <div class="product${isSoldOut ? " product--sold-out" : ""}" onclick="goToDetail('${p.id}')">
          <span class="product-discount">-40%</span>
          ${isSoldOut ? '<span class="product-soldout">Sold out</span>' : ""}

          <div class="product-actions">
            <button
              class="product-action-btn"
              type="button"
              aria-label="Remove"
              data-remove-wishlist-id="${p.id}"
            >🗑</button>
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
        </div>
      `;
    });
  }

  function renderWishlist() {
    const listEl = document.getElementById("wishlistList");
    const totalCountEl = document.getElementById("totalCount");
    if (!listEl || !totalCountEl) return;

    const user = getUser();
    if (!user) {
      listEl.innerHTML = "<p>Vui lòng đăng nhập để xem wishlist.</p>";
      totalCountEl.textContent = "0";
      syncHeaderWishlistBadge();
      return;
    }

    if (user.role !== "customer") {
      listEl.innerHTML = "<p>Admin không thể sử dụng wishlist.</p>";
      totalCountEl.textContent = "0";
      syncHeaderWishlistBadge();
      return;
    }

    const ids = getWishlistIds().map(String);
    totalCountEl.textContent = String(ids.length);

    if (ids.length === 0) {
      listEl.innerHTML = '<p class="wishlist-empty">Wishlist trống</p>';
      syncHeaderWishlistBadge();
      return;
    }

    const items = getWishlistItems();
    if (items.length === 0) {
      listEl.innerHTML = '<p class="wishlist-empty">Wishlist trống</p>';
      syncHeaderWishlistBadge();
      return;
    }

    renderWishlistCards(listEl, items);
    syncHeaderWishlistBadge();
  }

  function removeWishlistItem(productId) {
    const user = getUser();
    if (!user) {
      redirectToLogin();
      return;
    }

    const ids = getWishlistIds().map(String);
    const next = ids.filter((id) => id !== String(productId));
    saveWishlistIds(next);
    renderWishlist();
  }

  function clearWishlist() {
    const user = getUser();
    if (!user) {
      redirectToLogin();
      return;
    }

    saveWishlistIds([]);
    renderWishlist();
  }

  function moveAllToCart() {
    const user = getUser();
    if (!user) {
      alert("Vui lòng đăng nhập để mua hàng!");
      window.location.href = "./login.html";
      return;
    }

    if (user.role !== "customer") {
      alert("Admin không thể mua hàng!");
      return;
    }

    const items = getWishlistItems();
    if (!items.length) {
      alert("Wishlist đang trống.");
      return;
    }

    const cart = getCart();
    const indexById = new Map(cart.map((item, idx) => [String(item?.id), idx]));

    let added = 0;
    items.forEach((p) => {
      const id = String(p.id);
      const idx = indexById.get(id);
      const stockValue = getProductStockValue(p);

      if (idx !== undefined) {
        const currentQty = Number(cart[idx]?.qty) || 0;
        if (stockValue !== null && currentQty >= stockValue) return;
        cart[idx].qty = currentQty + 1;
        added += 1;
        return;
      }

      if (stockValue !== null && stockValue <= 0) return;

      cart.push({
        id: p.id,
        name: p.name,
        price: p.price,
        img: p.img,
        qty: 1,
      });
      indexById.set(id, cart.length - 1);
      added += 1;
    });

    saveCart(cart);
    syncHeaderCartBadge();
    alert(
      added > 0
        ? "Đã thêm tất cả vào giỏ hàng 🛒"
        : "Không thể thêm sản phẩm vào giỏ hàng.",
    );
  }

  window.removeWishlistItem = removeWishlistItem;
  window.clearWishlist = clearWishlist;
  window.moveAllToCart = moveAllToCart;

  renderWishlist();
})();
