// ===== KEYS =====
const USERS_KEY = "users";
const CURRENT_USER_KEY = "user";
const ORDERS_KEY = "orders";

// ===== HELPERS =====
function getLS(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function money(n) {
  const v = Math.round(Number(n) || 0);
  return `₫${new Intl.NumberFormat("vi-VN").format(v)}`;
}
function toVN(dateISO) {
  try {
    return new Date(dateISO).toLocaleString("vi-VN");
  } catch {
    return "—";
  }
}

// ===== AUTH =====
function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.href = "../index.html";
}
window.logout = logout;

const me = getLS(CURRENT_USER_KEY, null);
if (!me || me.role !== "admin") {
  alert("Bạn không có quyền truy cập ❌");
  window.location.href = "../index.html";
}

// ===== DATA =====
function getUsers() {
  return getLS(USERS_KEY, []);
}
function getOrders() {
  return getLS(ORDERS_KEY, []);
}

function getUserId(u) {
  return String(u.id || u.username || u.email || "");
}


function buildOrderStats(orders) {
  const map = new Map(); // userId -> {count,total,lastISO,orders:[]}
  orders.forEach((o) => {
    const uid = String(o.userId || o.username || o.email || "");
    if (!uid) return;
    if (!map.has(uid))
      map.set(uid, { count: 0, total: 0, lastISO: null, orders: [] });

    const s = map.get(uid);
    s.count += 1;
    s.total += Number(o.total) || 0;
    s.orders.push(o);

    const iso = o.dateISO || new Date().toISOString();
    if (!s.lastISO || new Date(iso) > new Date(s.lastISO)) s.lastISO = iso;
  });
  return map;
}

// ===== RENDER =====
function renderUsers() {
  const tbody = document.getElementById("usersTable");
  const empty = document.getElementById("usersEmpty");
  if (!tbody) return;

  const users = getUsers();
  const orders = getOrders();
  const stats = buildOrderStats(orders);

  const q = (document.getElementById("userSearch")?.value || "")
    .trim()
    .toLowerCase();
  const role = document.getElementById("roleFilter")?.value || "";

  const filtered = users.filter((u) => {
    const matchQ =
      !q ||
      (u.username || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q);
    const matchRole = !role || (u.role || "user") === role;
    return matchQ && matchRole;
  });

  if (!users.length) {
    tbody.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  tbody.innerHTML = filtered
    .map((u, idx) => {
      const uid = getUserId(u);
      const s = stats.get(uid) || {
        count: 0,
        total: 0,
        lastISO: null,
        orders: [],
      };

      const roleBadge =
        u.role === "admin"
          ? `<span class="badge badge--admin">admin</span>`
          : `<span class="badge badge--user">user</span>`;

      const last = s.lastISO ? toVN(s.lastISO) : "—";

      return `
      <tr>
        <td>${idx + 1}</td>
        <td>
          <div style="font-weight:800">${u.username || "(no username)"}</div>
          <div class="muted">${uid}</div>
        </td>
        <td>${u.email || "—"}</td>
        <td>${roleBadge}</td>
        <td>${s.count}</td>
        <td>${money(s.total)}</td>
        <td>${last}</td>
        <td>
          <button class="admin-btn admin-btn--ghost" type="button"
            onclick="openOrders('${encodeURIComponent(uid)}')">
            📄 Xem đơn
          </button>
        </td>
      </tr>
    `;
    })
    .join("");

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="padding:16px;color:rgba(0,0,0,.6)">Không có user phù hợp.</td></tr>`;
  }
}

window.openOrders = function (uidEncoded) {
  const uid = decodeURIComponent(uidEncoded);
  const orders = getOrders().filter(
    (o) => String(o.userId || o.username || o.email || "") === uid,
  );

  const modal = document.getElementById("ordersModal");
  const list = document.getElementById("ordersList");
  const title = document.getElementById("modalTitle");
  const sub = document.getElementById("modalSub");

  title.textContent = "Đơn hàng của: " + uid;
  sub.textContent = `Tổng đơn: ${orders.length}`;

  if (!orders.length) {
    list.innerHTML = `<div class="admin-empty">User này chưa có đơn hàng.</div>`;
  } else {
    
    orders.sort((a, b) => new Date(b.dateISO || 0) - new Date(a.dateISO || 0));

    list.innerHTML = orders
      .map((o) => {
        const itemsHtml = (o.items || [])
          .map((it) => {
            const qty = Number(it.qty) || 1;
            const price = Number(it.price) || 0;
            return `
          <div class="order-item">
            <span>${it.name || "Item"} × ${qty}</span>
            <span>${money(price * qty)}</span>
          </div>
        `;
          })
          .join("");

        return `
        <div class="order-card">
          <div class="order-head">
            <div>
              <div class="order-id">#${o.id}</div>
              <div class="order-meta">${o.dateVN || toVN(o.dateISO) || "—"}</div>
            </div>
            <div class="order-meta">Status: ${o.status || "paid"}</div>
          </div>
          <div class="order-items">${itemsHtml}</div>
          <div class="order-total">Tổng: ${money(o.total)}</div>
        </div>
      `;
      })
      .join("");
  }

  modal.hidden = false;
};

function closeModal() {
  const modal = document.getElementById("ordersModal");
  if (modal) modal.hidden = true;
}

document.addEventListener("click", (e) => {
  const t = e.target;
  if (t && t.dataset && t.dataset.close) closeModal();
});

document.getElementById("userSearch")?.addEventListener("input", renderUsers);
document.getElementById("roleFilter")?.addEventListener("change", renderUsers);

renderUsers();
