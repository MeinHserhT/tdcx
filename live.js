// a[href*="tel:"], a[href*="tel:"] *
// a[href*="zalo.me"], a[href*="zalo.me"] *
// a[href*="m.me"], a[href*="m.me"] *
// a[href*="facebook"], a[href*="facebook"] *
// a[href*="messenger"], a[href*="messenger"] *
// a[href*="maps"], a[href*="maps"] *
// a[href*="whatsapp.com"], a[href*="whatsapp.com"] *
// a[href*="wa.me"], a[href*="wa.me"] *

// --------------------------------------------------------------------------
// gtm.timerInterval
// --------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Purchase
function p() {
  window.dataLayer = window.dataLayer || [];
  var a = document.querySelector('input[id*="email"]'),
    b = document.querySelector('input[id*="phone"]'),
    c = document.querySelector('input[id*="first"]'),
    d = document.querySelector('input[id*="last"]'),
    e = document.querySelector('input[id*="address_1"]'),
    f = document.querySelector('input[id*="city"]'),
    i = document.querySelector('select[id*="country"]'),
    o = {},
    v = +document
      .querySelector(".order-total .amount")
      .innerText.replace(/[^\d]/g, "");

  o.email = a.value;
  o.phone = "+84" + b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
  2 === Object.keys(o).length &&
    c.value &&
    d.value &&
    e.value &&
    f.value &&
    i.value &&
    v &&
    window.dataLayer.push({ event: "muahang", total: v, obj: o });
}
p();

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

// jQuery("input[name*=phone]").validity.patternMismatch
document.querySelectorAll(".arcu-button").forEach(function (e) {
  e.addEventListener("click", function () {
    setTimeout(function () {
      var element = document.querySelector(".arcu-form-success.active");
      if (element) {
        // Có element
        var elm = document.querySelector("input[name=email]");
        if (elm.value) {
          dataLayer.push({
            event: "success",
            email: elm.value,
          });
        }
      }
    }, 500);
  });
});

function p() {
  window.dataLayer = window.dataLayer || [];
  var a = document.querySelector('input[id*="email"]').value,
    b = document.querySelector('input[id*="phone"]').value,
    c = document.querySelector('input[id*="first"]').value,
    d = document.querySelector('input[id*="last"]').value,
    e = document.querySelector('input[id*="address_1"]').value,
    f = document.querySelector('input[id*="city"]').value,
    em = "";

  a && b && c && d && e && f && (em = a);

  return em;
}

document
  .querySelectorAll('a[title*="nhận báo giá"], a[title*="đăng ký"]')
  .forEach(function (ele) {
    ele.addEventListener("click", function () {
      setTimeout(function () {
        var err = document.querySelector(".gh-alert-content .msg");
        if (!err) {
          document
            .querySelectorAll('input[data-field="DienThoai"]')
            .forEach(function (e) {
              e.value &&
                dataLayer.push({
                  event: "success",
                  phone:
                    "+84" + e.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
                });
            });
        }
      }, 500);
    });
  });

window.dataLayer = window.dataLayer || [];
var o = {},
  b = document.querySelector('input[name*="phone"]'),
  c = document.querySelector('input[name*="name"]'),
  d = document.querySelector('input[name*="address"]'),
  val = +jQuery(".popup_quickbuy_total_calc")[0].innerText.replace(
    /[^\d]/g,
    ""
  );
o.phone = "+84" + b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
Object.keys(o).length &&
  c.value &&
  d.value &&
  window.dataLayer.push({ event: "muahang", obj: o, total: val });

function b() {
  var phone = "";
  document.querySelectorAll("input[name*=phone]").forEach(function (e) {
    if (e.value)
      phone = "+84" + e.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
  });
  return phone;
}

function a() {
  return document.querySelector(".box-cart-info > p > span").innerText;
}

dataLayer.push({
  phone:
    "+84" +
    document
      .querySelector('[name="phoneNumber"]')
      .value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
  email: document.querySelector('[name="email"]').value,
});
