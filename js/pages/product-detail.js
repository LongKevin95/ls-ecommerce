const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
const LAST_ORDER_KEY = "lastOrder";
const products = JSON.parse(localStorage.getItem("products")) || [];
const product = products.find((p) => p.id == productId);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const DEFAULT_DETAIL = {
  breadcrumbPrefix: "Account",
  category: "Gaming",
  name: "Havic HV G-92 Gamepad",
  price: 192,
  description:
    "PlayStation 5 Controller Skin High quality vinyl with air channel adhesive for easy bubble free install & mess free removal. Pressure sensitive.",
  mainImage: "../assets/images/game-controller.jpg",
  thumbnails: [
    "https://picsum.photos/120?1",
    "https://picsum.photos/120?2",
    "https://picsum.photos/120?3",
    "https://picsum.photos/120?4",
  ],
};

function renderProductDetail(p) {
  const name = p?.name || DEFAULT_DETAIL.name;
  const category = p?.category || DEFAULT_DETAIL.category;
  const description = p?.desc || DEFAULT_DETAIL.description;
  const price = p?.price ?? DEFAULT_DETAIL.price;
  const mainImage = p?.img || DEFAULT_DETAIL.mainImage;

  const breadcrumb = document.querySelector(".breadcrumb");
  if (breadcrumb) {
    const categoryHref = `category.html?category=${encodeURIComponent(
      String(category),
    )}`;
    breadcrumb.innerHTML = `<a href="../index.html">Home</a> &gt; <a href="${categoryHref}">${escapeHtml(
      category,
    )}</a> &gt; <strong>${escapeHtml(name)}</strong>`;
  }

  const titleEl = document.querySelector(".product-detail .info h1");
  if (titleEl) titleEl.textContent = name;

  const priceEl = document.querySelector(".product-detail .info .price");
  if (priceEl) priceEl.textContent = formatPrice(price);

  const descEl = document.querySelector(".product-detail .info .description");
  if (descEl) descEl.textContent = description;

  const mainImgEl = document.querySelector(".product-detail .main-image img");
  if (mainImgEl) {
    mainImgEl.src = mainImage;
    mainImgEl.alt = name;
  }

  const thumbsEl = document.querySelector(".product-detail .thumbnails");
  if (thumbsEl) {
    const thumbs = [...DEFAULT_DETAIL.thumbnails];
    if (mainImage) thumbs[0] = mainImage;

    thumbsEl.innerHTML = thumbs
      .map(
        (src) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(name)}" />`,
      )
      .join("");
  }

  const buyBtn = document.querySelector(".product-detail .buy-btn");
  if (buyBtn && p?.id != null) {
    const stockValue = getProductStockValue(p);
    if (stockValue !== null && stockValue <= 0) {
      buyBtn.disabled = true;
      buyBtn.textContent = "Sold Out";
    }

    buyBtn.addEventListener("click", () => {
      addToCart(p.id);
      window.location.href = "cart.html";
    });
  }
}

function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function getProductStockValue(product) {
  const raw = Number(product?.stock);
  return Number.isFinite(raw) ? raw : null;
}

function addToCart(productIdToAdd) {
  const user = getUser();

  if (!user) {
    alert("Vui lòng đăng nhập để mua hàng!");
    window.location.href = "login.html";
    return;
  }

  if (user.role !== "customer") {
    alert("Admin không thể mua hàng!");
    return;
  }

  const all = JSON.parse(localStorage.getItem("products")) || [];
  const p = all.find((x) => x.id == productIdToAdd);
  if (!p) {
    alert("Sản phẩm không tồn tại!");
    return;
  }

  const stockValue = getProductStockValue(p);

  const cart = getCart();
  const index = cart.findIndex((i) => i.id == productIdToAdd);
  const currentQty = index !== -1 ? Number(cart[index].qty) || 0 : 0;

  if (stockValue !== null && stockValue <= currentQty) {
    alert("Sản phẩm đã hết hàng (sold out).");
    return;
  }

  if (index !== -1) {
    cart[index].qty += 1;
  } else {
    cart.push({
      id: p.id,
      name: p.name,
      price: p.price,
      img: p.img,
      qty: 1,
    });
  }

  saveCart(cart);
  alert("Đã thêm vào giỏ hàng 🛒");
}

function formatPrice(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "₫0";
  const rounded = Math.round(num);
  return `₫${new Intl.NumberFormat("vi-VN").format(rounded)}`;
}

function goToDetail(id) {
  window.location.href = `product-detail.html?id=${id}`;
}

function renderRelatedProducts(currentProduct, allProducts) {
  const container = document.querySelector(".related .related-track");
  if (!container) return;

  const category = currentProduct?.category;
  const related = (allProducts || [])
    .filter((p) => p && p.category === category && p.id != currentProduct.id)
    .slice(0, 4);

  if (!related.length) {
    container.classList.add("is-empty");
    container.innerHTML = `<p>Không có sản phẩm liên quan.</p>`;
    return;
  }
  container.classList.remove("is-empty");
  container.innerHTML = related
    .map((p) => {
      const stockValue = getProductStockValue(p);
      const isSoldOut = stockValue !== null && stockValue <= 0;

      return `
        <div class="product${isSoldOut ? " product--sold-out" : ""}" data-id="${p.id}" tabindex="0" role="button">
          <span class="product-discount">-40%</span>
          ${isSoldOut ? '<span class="product-soldout">Sold out</span>' : ""}

          <div class="product-img-wrap">
            <img src="${p.img}" class="product-img" alt="${String(
              p.name || "Product",
            )
              .replace(/"/g, "&quot;")
              .trim()}" />

            <button class="product-cart" data-add-to-cart="${p.id}" ${
              isSoldOut ? "disabled" : ""
            }>
              ${isSoldOut ? "Sold Out" : "Add To Cart"}
            </button>
          </div>

          <h3 class="product-name">${p.name}</h3>

          <div class="product-price">
            <span class="price-new">${formatPrice(p.price)}</span>
            <span class="price-old">${formatPrice(
              Math.round(Number(p.price) * 1.3),
            )}</span>
          </div>

          <div class="product-rating">
            ⭐⭐⭐⭐⭐
            <span>(88)</span>
          </div>
        </div>
      `;
    })
    .join("");

  container.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".product-cart");
    if (addBtn && container.contains(addBtn)) {
      const id = addBtn.dataset.addToCart;
      if (id) addToCart(id);
      return;
    }

    const card = e.target.closest(".product");
    if (!card || !container.contains(card)) return;
    const id = card.dataset.id;
    if (!id) return;
    goToDetail(id);
  });

  container.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const card = e.target.closest(".product");
    if (!card || !container.contains(card)) return;
    const id = card.dataset.id;
    if (!id) return;
    goToDetail(id);
  });
}

if (!product) {
  alert("Không tìm thấy sản phẩm!");
} else {
  console.log("Product detail:", product);
  renderProductDetail(product);
  renderRelatedProducts(product, products);
}
