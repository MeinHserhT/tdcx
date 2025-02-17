// a[href*="tel:"], a[href*="tel:"] *
// a[href*="zalo.me"], a[href*="zalo.me"] *
// a[href*="m.me"], a[href*="m.me"] *
// a[href*="facebook"], a[href*="facebook"] *
// a[href*="messenger"], a[href*="messenger"] *
// a[href*="maps"], a[href*="maps"] *
// a[href*="whatsapp.com"], a[href*="whatsapp.com"] *
// a[href*="wa.me"], a[href*="wa.me"] *

// --------------------------------------------------------------------------
// obj.email  ----	obj.phone

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

function checkPhone() {
  var c_name = "",
    c_phone = "",
    c_xe = "";
  document.querySelectorAll('[name*="item_name"]').forEach(function (e) {
    if (e.value) c_name = e.value;
  });
  document.querySelectorAll('[name*="item_phone"]').forEach(function (e) {
    if (e.value) c_phone = e.value;
  });
  document.querySelectorAll('[name*="item_class"]').forEach(function (e) {
    if (e.value) c_xe = e.value;
  });
  var checkAll = c_name && c_phone && c_xe;
  if (checkAll) {
    return "+84" + c_phone.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
  }
  return "";
}

function a() {
  var e = 0;
  return (
    jQuery('[name="product_combo"]').each(function (c) {
      if (this.checked) return (e = +this.value.match(/\d{4}/g, "")[0]), !1;
    }),
    e
  );
}

window.dataLayer = window.dataLayer || [];
var o = {},
  b = document.querySelector('input[name*="phone"]'),
  c = document.querySelector('input[name*="name"]'),
  d = document.querySelector('input[name*="address"]'),
  val = +jQuery(".popup_quickbuy_total_calc")[0].innerText.replace(/[^\d]/g,"");
o.phone = "+84" + b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
Object.keys(o).length &&
  c.value &&
  d.value &&
  window.dataLayer.push({ event: "muahang", obj: o, total: val });

// .success
function a() {
  return document.querySelector("#buy_email").value;
}

document.addEventListener("wpcf7mailsent", function (e) {
  window.dataLayer = window.dataLayer || [];
  var p = "",
    d = e.detail.inputs,
    b = d.find(function (n) {
      return n.name.includes("dienthoai");
    });
  p = "+84" + b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
  p &&
    window.dataLayer.push({
      event: "form_lienhe",
      phone: p,
    });
});

function a() {
  var phone_number = document.querySelector(
    "#order_info > div.order_info > div.right > p:nth-child(3) > span:nth-child(3)"
  ).innerText;
  if (phone_number.includes("+84")) {
    phone_number = "+" + phone_number.trim().match(/\d+/g).join("");
  } else {
    phone_number =
      "+84" +
      phone_number
        .replace(/^(?!00[^0])0/, "")
        .match(/\d+/g)
        .join("");
  }
  return phone_number;
}

function b() {
  var phone = "";
  document.querySelectorAll("input[name*=phone]").forEach(function (e) {
    if (e.value)
      phone = "+84" + e.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
  });
  return phone;
}

function a() {
  return (
    "+84" +
    window.location.href
      .match(/phone=[\d]*/g)[0]
      .split("=")[1]
      .replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")
  );
}

var onElmClick=function(e,t){document.addEventListener("click",(function(n){n.target.matches(e)&&t(n)}))};
  var _btn = null;
  onElmClick('.btn', (e) => {

    setTimeout(function() {
      var element = document.querySelector('.gh-alert-content .msg')
      if (!element) { // ko có alert lỗi
        _btn = e.target;

        var _parent  = _btn.closest('.modal-dialog');
        if(_parent) {
          var _phone = '';
          var _input = _parent.querySelectorAll('input[data-field="DienThoai"]').forEach(function(inp) {
          	if (inp.value) {
            	_phone = '+84' + inp.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
            }
          });
        }
        dataLayer.push({
          event: "successful",
          phone: _phone,
        })
      }
    }, 500)

  })