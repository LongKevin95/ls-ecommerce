// ================= ADMIN AUTH =================
let imageBase64 = "";

// keys
const USERS_KEY = "users";
const CURRENT_USER_KEY = "user";
const PRODUCTS_KEY = "products";
const LAST_ORDER_KEY = "lastOrder";
// logout
function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.href = "../index.html";
}
window.logout = logout;

// check admin
const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
if (!user || user.role !== "admin") {
  alert("Bạn không có quyền truy cập ❌");
  window.location.href = "../index.html";
}

// ================= DOM =================
const idInput = document.getElementById("id");
const nameInput = document.getElementById("name");
const priceInput = document.getElementById("price");
const stockInput = document.getElementById("stock");
const categoryInput = document.getElementById("category");
const descInput = document.getElementById("desc");
const imgInput = document.getElementById("imgFile");
const preview = document.getElementById("preview");
const btnSave = document.getElementById("btnSaveProduct");

// ================= HELPERS =================
function getProducts() {
  try {
    return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function resetForm() {
  idInput.value = "";
  nameInput.value = "";
  priceInput.value = "";
  stockInput.value = "";
  categoryInput.value = "";
  descInput.value = "";
  imageBase64 = "";

  if (preview) {
    preview.src = "";
    preview.style.display = "none";
    delete preview.dataset.base64;
  }
  if (imgInput) imgInput.value = "";
}

function formatMoney(value) {
  const num = Number(value) || 0;
  const rounded = Math.round(num);
  return `₫${new Intl.NumberFormat("vi-VN").format(rounded)}`;
}

// ================= TABLE =================
function renderTable() {
  const table = document.getElementById("productTable");
  if (!table) return;

  const products = getProducts();
  table.innerHTML = "";

  products.forEach((p, index) => {
    table.innerHTML += `
      <tr onclick="editProduct(${index})" style="cursor:pointer">
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${formatMoney(p.price)}</td>
        <td>
          <img src="${p.img}" style="width:60px;height:60px;object-fit:cover;border-radius:10px">
        </td>
        <td>${p.category}</td>
        <td>${p.desc}</td>
        <td>${Number.isFinite(Number(p.stock)) ? p.stock : "—"}</td>
        <td>
          <button type="button" onclick="event.stopPropagation(); removeProduct('${p.id}')">❌</button>
        </td>
      </tr>
    `;
  });
}
window.renderTable = renderTable;

// ================= CRUD =================
function addOrUpdate() {
  const id = idInput.value.trim();
  const name = nameInput.value.trim();
  const price = priceInput.value.trim();
  const stockRaw = stockInput.value.trim();
  const category = categoryInput.value;
  const desc = descInput.value.trim();

  const imgBase64 = preview?.dataset?.base64 || imageBase64 || "";

  const stock = Number(stockRaw);

  if (!id || !name || !price || !category || !desc || !imgBase64) {
    alert("Vui lòng nhập đầy đủ thông tin và chọn ảnh!");
    return;
  }

  if (!Number.isFinite(stock) || stock < 0) {
    alert("Vui lòng nhập số lượng hợp lệ (>= 0).");
    return;
  }

  const product = {
    id,
    name,
    price: Number(price),
    img: imgBase64,
    category,
    desc,
    stock: Math.floor(stock),
  };

  const products = getProducts();
  const idx = products.findIndex((x) => x.id === id);

  if (idx !== -1) products[idx] = product;
  else products.push(product);

  saveProducts(products);
  renderTable();
  resetForm();
  alert("Lưu sản phẩm thành công ✅");
}
window.addOrUpdate = addOrUpdate;

function removeProduct(id) {
  const products = getProducts().filter((p) => p.id !== id);
  saveProducts(products);
  renderTable();
}
window.removeProduct = removeProduct;

function editProduct(index) {
  const p = getProducts()[index];
  if (!p) return;

  idInput.value = p.id;
  nameInput.value = p.name;
  priceInput.value = p.price;
  stockInput.value = Number.isFinite(Number(p.stock)) ? p.stock : "";
  categoryInput.value = p.category;
  descInput.value = p.desc;

  imageBase64 = p.img;

  if (preview) {
    preview.src = p.img;
    preview.style.display = "block";
    preview.dataset.base64 = p.img;
  }
}
window.editProduct = editProduct;

// ================= IMAGE PREVIEW =================
imgInput?.addEventListener("change", function () {
  const file = this.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    imageBase64 = reader.result;

    if (preview) {
      preview.src = imageBase64;
      preview.style.display = "block";
      preview.dataset.base64 = imageBase64;
    }
  };
  reader.readAsDataURL(file);
});


btnSave?.addEventListener("click", addOrUpdate);

// init
renderTable();
