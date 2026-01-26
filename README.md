- Project được tổ chức theo kiến trúc Asset-based:
- Phần CSS sử dụng kiến trúc ITCSS, cấc rules CSS được phân bổ vào file "base.css", "layout.css" và "components.css":

* File "base.css" chứa 4 tầng đầu Settings, Tool, Generic,
  Element và tầng 7 Trumps/Utilities.
* File "layout.css" chứa tầng 5 là Objects/Layout patterns.
* File "components.css" chứa tầng thứ 6 là Components/UI.
* File "responsive.css" chứa các Media Queries cho Responsive.

<pre>
Project - LS Ecommerce/
│
├── index.html
├── README.md
├── pages/
│  ├── admin-users.html
│  ├── admin.html
│  ├── cart.html
│  ├── category.html
│  ├── checkout.html
│  ├── login.html
│  ├── product-detail.html
│  ├── search.html
│  ├── sign-up.html
│  ├── thank-you.html
│  ├── user-profile.html
│  └── wishlist.html
├── assets/
│  ├── icons/
│  │  ├── Icon-Facebook.png
│  │  ├── Icon-Linkedin.png
│  │  ├── Icon-Twitter.png
│  │  ├── app-store-logo.png
│  │  ├── burger-menu-icon.svg
│  │  ├── cart-icon.svg
│  │  ├── featured-icon1.png
│  │  ├── featured-icon2.png
│  │  ├── featured-icon3.png
│  │  ├── gg-play-logo.png
│  │  ├── heart-icon.svg
│  │  ├── icon-instagram.png
│  │  ├── search-icon.svg
│  │  └── user-icon.svg
│  └── images/
│     ├── logo.png
│     ├── carousel-img1.jpg
│     ├── featured-product1.jpg
│     └── ...
├── css/
│  ├── base.css
│  ├── components.css
│  ├── layout.css
│  ├── responsive.css
│  ├── style.css
│  └── pages/
│     ├── admin-users.css
│     ├── admin.css
│     ├── cart.css
│     ├── checkout.css
│     ├── login.css
│     ├── product-detail.css
│     ├── search.css
│     ├── sign-up.css
│     ├── thank-you.css
│     ├── user-profile.css
│     └── wishlist.css
└── js/
   ├── header.js
   ├── script.js
   └── pages/
      ├── admin-users.js
      ├── admin.js
      ├── cart.js
      ├── checkout.js
      ├── login.js
      ├── product-detail.js
      ├── search.js
      ├── sign-up.js
      └── wishlist.js
</pre>

- Tài khoản admin được init ngay khi khởi chạy app với thông tin đăng nhập mặc định:
  Email: admin@gmail.com
  Password: admin

- Cần tạo tài khoản user trước mới đăng nhập.

- Phần CSS áp dụng một phần kiến trúc ITCSS và đặt tên class theo quy tắc BEM.

- Các trang chính sẽ nằm trong thư mục pages
