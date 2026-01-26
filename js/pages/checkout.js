const CART_KEY = "cart";
const LAST_ORDER_KEY = "lastOrder";
function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function getProducts() {
  return JSON.parse(localStorage.getItem("products")) || [];
}

function saveProducts(products) {
  localStorage.setItem("products", JSON.stringify(products));
}

function getProductStockValue(product) {
  const raw = Number(product?.stock);
  return Number.isFinite(raw) ? raw : null;
}

function formatMoney(n) {
  const num = Number(n) || 0;
  const rounded = Math.round(num);
  return `₫${new Intl.NumberFormat("vi-VN").format(rounded)}`;
}

function calcSubtotal(cart) {
  return cart.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;
    return sum + price * qty;
  }, 0);
}

function renderCheckout() {
  const cart = getCart();

  const itemsEl = document.getElementById("checkoutItems");
  const subEl = document.getElementById("checkoutSubtotal");
  const totalEl = document.getElementById("checkoutTotal");

  if (!itemsEl || !subEl || !totalEl) return;

  
  if (!cart.length) {
    itemsEl.innerHTML = `<p style="padding:12px 0;">Giỏ hàng đang trống 🛒</p>`;
    subEl.textContent = formatMoney(0);
    totalEl.textContent = formatMoney(0);
    return;
  }

  // render list items
  itemsEl.innerHTML = cart
    .map((item) => {
      const name = item.name || "Unnamed";
      const img = item.img || "";
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      const lineTotal = price * qty;

      return `
        <div class="checkout-item">
          <div class="checkout-item__left">
            <img class="checkout-item__img" src="${img}" alt="${name}">
            <div class="checkout-item__info">
              <div class="checkout-item__name">${name}</div>
              <div class="checkout-item__meta">x${qty}</div>
            </div>
          </div>
          <div class="checkout-item__price">${formatMoney(lineTotal)}</div>
        </div>
      `;
    })
    .join("");

  const subtotal = calcSubtotal(cart);
  subEl.textContent = formatMoney(subtotal);

  // shipping free
  const total = subtotal;
  totalEl.textContent = formatMoney(total);
}

function placeOrder() {
  const cart = getCart();
  if (!cart.length) {
    alert("Giỏ hàng trống, không thể đặt hàng!");
    return;
  }

  const products = getProducts();
  const stockMap = new Map(products.map((p) => [String(p.id), p]));

  for (const item of cart) {
    const product = stockMap.get(String(item.id));
    const stockValue = getProductStockValue(product);
    const qty = Number(item.qty) || 0;
    if (stockValue !== null && qty > stockValue) {
      alert(`Sản phẩm "${item.name}" đã hết hàng.`);
      return;
    }
  }

  cart.forEach((item) => {
    const product = stockMap.get(String(item.id));
    if (!product) return;
    const stockValue = getProductStockValue(product);
    if (stockValue === null) return;
    const qty = Number(item.qty) || 0;
    product.stock = Math.max(0, stockValue - qty);
  });

  saveProducts(products);

  
  localStorage.removeItem(CART_KEY);
  alert("Đặt hàng thành công ✅");
  window.location.href = "../index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  renderCheckout();

  document
    .getElementById("btnPlaceOrder")
    ?.addEventListener("click", placeOrder);
});
