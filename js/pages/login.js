// ================= LOGIN LOGIC =================
const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const USERS_KEY = "users";
const CURRENT_USER_KEY = "user";
const LAST_ORDER_KEY = "lastOrder";
function ensureAdminAccount() {
  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  const hasAdmin = users.some(u => u.role === "admin");

  if (!hasAdmin) {
    users.push({
      id: Date.now(),
      email: "admin@gmail.com",
      password: "admin",
      name: "admin",
      role: "admin",
    });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  ensureAdminAccount();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  const rawUserData = localStorage.getItem(USERS_KEY);
  const usersList = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  console.log(usersList);
  const isInPagesFolder = window.location.pathname.includes("/pages/");

  const currentUser = usersList.find(
    (acc) => acc.email === email && acc.password === password
  );

  if (!currentUser) {
    alert("Sai tài khoản hoặc mật khẩu ❌");
    return;
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));

  alert("Đăng nhập thành công ✅");

  if (currentUser.role === "admin") {
  window.location.href = isInPagesFolder ? "admin.html" : "pages/admin.html";
} else {
  window.location.href = isInPagesFolder ? "../index.html" : "index.html";
}
});

// Show / Hide password
togglePassword.addEventListener("click", () => {
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});
