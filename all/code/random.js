function _ec() {
  window.dataLayer = window.dataLayer || [];
  var o = {},
    a = document.querySelector('input[name*="email"]'),
    b = document.querySelector('input[name*="phone"]'),
    c = document.querySelector('input[name*="name"]'),
    d = document.querySelector('input[name*="Captcha"]');

  a.value.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/) && (o.email = a.value);
  9 === (b = b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
    (o.phone = "+84" + b);
  2 === Object.keys(o).length &&
    c.value &&
    d.value &&
    window.dataLayer.push({ event: "form_dangky", obj: o });
}
_ec();

function _ec() {
  window.dataLayer = window.dataLayer || [];
  var o = {},
    a = document.querySelector("[id*=LoaiXeBaoGia]"),
    b = document.querySelector("input[id*=HoTen]"),
    c = document.querySelector("input[id*=DienThoai]");

  o.phone = "+84" + c.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
  Object.keys(o).length &&
    a.value !== -1 &&
    b.value &&
    window.dataLayer.push({ event: "form_baogia", obj: o });
}
_ec();
// #btnModel
