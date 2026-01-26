(function () {
  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }

  function requireLogin() {
    const user = getCurrentUser();
    if (!user) {
      alert("Vui lòng đăng nhập tài khoản để được hỗ trợ!");
      window.location.href = "./login.html";
      return null;
    }
    return user;
  }

  function getUserDisplayName(user) {
    const first = (user?.profile?.firstName || "").trim();
    const last = (user?.profile?.lastName || "").trim();
    const full = `${first} ${last}`.trim();
    return (
      full ||
      user?.profile?.username ||
      user?.fullName ||
      user?.name ||
      user?.username ||
      ""
    );
  }

  function prefillSupportForm(user, { nameEl, emailEl, phoneEl }) {
    if (!user) return;

    const name = getUserDisplayName(user);
    const email = (user?.email || "").trim();
    const phone = (user?.profile?.phone || user?.phone || "").trim();

    if (nameEl && !String(nameEl.value || "").trim() && name)
      nameEl.value = name;
    if (emailEl && !String(emailEl.value || "").trim() && email)
      emailEl.value = email;
    if (phoneEl && !String(phoneEl.value || "").trim() && phone)
      phoneEl.value = phone;
  }

  function validateSupportForm(user) {
    const form = document.getElementById("supportForm");
    const nameEl = document.getElementById("supportName");
    const emailEl = document.getElementById("supportEmail");
    const phoneEl = document.getElementById("supportPhone");
    const messageEl = document.getElementById("supportMessage");

    if (!form || !nameEl || !emailEl || !phoneEl || !messageEl) return;

    if (form.dataset.bound === "1") return;
    form.dataset.bound = "1";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    const nameRegex = /^[A-Za-zÀ-ỹ\s]+$/u;

    const fail = (el, msg) => {
      alert(msg);
      el.focus();
    };

    prefillSupportForm(user, { nameEl, emailEl, phoneEl });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = (nameEl.value || "").trim();
      const email = (emailEl.value || "").trim();
      const phone = (phoneEl.value || "").trim();
      const message = (messageEl.value || "").trim();

      if (!name) return fail(nameEl, "Vui lòng nhập họ tên!");
      if (!nameRegex.test(name))
        return fail(nameEl, "Họ tên không được chứa số và ký tự đặc biệt!");

      if (!email) return fail(emailEl, "Vui lòng nhập email!");
      if (!emailRegex.test(email)) return fail(emailEl, "Email không hợp lệ!");

      if (!phone) return fail(phoneEl, "Vui lòng nhập số điện thoại!");
      if (!phoneRegex.test(phone))
        return fail(
          phoneEl,
          `Số điện thoại gồm 10-11 số và bắt đầu bằng "0" hoặc "+84"
Ví dụ 0912345678.`,
        );

      if (!message) return fail(messageEl, "Vui lòng nhập nội dung hỗ trợ!");
      if (message.length < 50)
        return fail(messageEl, "Nội dung hỗ trợ phải tối thiểu 50 ký tự!");

      messageEl.value = "";
      alert("Gửi yêu cầu hỗ trợ thành công!");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const user = requireLogin();
    if (!user) return;
    validateSupportForm(user);
  });
})();
