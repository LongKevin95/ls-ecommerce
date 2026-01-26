// ================= SIGNUP LOGIC =================
const USERS_KEY = "users";
const CURRENT_USER_KEY = "user";
const LAST_ORDER_KEY = "lastOrder";
// Toggle show/hide password (no dependency)
document.querySelectorAll(".toggle-pass").forEach((btn) => {
  btn.addEventListener("click", () => {
    const selector = btn.getAttribute("data-target");
    const input = document.querySelector(selector);
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
  });
});

function getUsers() {
  const rawUserData = localStorage.getItem(USERS_KEY);
  const usersList = JSON.parse(rawUserData) || [];
  return usersList;
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function emailExists(email) {
  const target = normalizeEmail(email);
  if (!target) return false;
  return getUsers().some((u) => normalizeEmail(u.email) === target);
}

// ===== UI helpers =====
function setEmailError(emailInput, emailErrorEl, message) {
  emailErrorEl.textContent = message || "";

  if (message) {
    emailInput.classList.add("input-invalid");
    emailInput.setAttribute("aria-invalid", "true");
  } else {
    emailInput.classList.remove("input-invalid");
    emailInput.removeAttribute("aria-invalid");
  }
}

// ===== Main Events  =====
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".auth-form");
  if (!form) return;

  const emailInput = document.querySelector("#email");
  const emailErrorEl = document.querySelector("#emailError");

  if (!emailInput || !emailErrorEl) return;

  
  emailInput.addEventListener("blur", () => {
    const email = emailInput.value;

    
    if (!email.trim()) {
      setEmailError(emailInput, emailErrorEl, "");
      return;
    }

    if (emailExists(email)) {
      setEmailError(
        emailInput,
        emailErrorEl,
        "Email này đã được sử dụng. Vui lòng nhập email khác.",
      );
    } else {
      setEmailError(emailInput, emailErrorEl, "");
    }
  });

  // Submit: validate + save
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const fullName = form.fullName?.value?.trim() || "";
    const email = normalizeEmail(form.email?.value || "");
    const password = form.password?.value || "";
    const confirmPassword = form.confirmPassword?.value || "";

    // Validate email unique (final)
    if (emailExists(email)) {
      setEmailError(
        emailInput,
        emailErrorEl,
        "Email này đã được sử dụng. Vui lòng nhập email khác.",
      );
      emailInput.focus();
      return;
    } else {
      setEmailError(emailInput, emailErrorEl, "");
    }

    // Validate password match
    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.");
      return;
    }

    // Save user
    const users = getUsers();
    const newUser = {
      id: Math.random(),
      fullName,
      email,
      password,
      role: "customer",
    };

    users.push(newUser);
    console.log(newUser);

    saveUsers(users);

    alert("Tạo tài khoản thành công!");
    form.reset();

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    window.location.href = "../../index.html";
  });
});
