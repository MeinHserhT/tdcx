// a[href*="tel:"], a[href*="tel:"] *
// a[href*="zalo.me"], a[href*="zalo.me"] *
// a[href*="mailto:"], a[href*="mailto:"] *
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

function a() {
  var p;
  document.querySelectorAll("input[type=tel]").forEach(function (e) {
    e.value && (p = "+84" + e.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""));
  });
  return p;
}

function a() {
  var p;
  document.querySelectorAll("input[type=email]").forEach(function (e) {
    e.value && (p = e.value);
  });
  return p;
}

document.querySelectorAll("input[type=email]").forEach(function (e) {
  e.value && dataLayer.push({ email: e.value });
});

document.querySelectorAll("input[type=tel]").forEach(function (e) {
  e.value &&
    dataLayer.push({
      phone: "+84" + e.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
    });
});

document.querySelectorAll("input[name=phone]").forEach(function (e) {
  e.value &&
    dataLayer.push({
      phone: "+84" + e.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
    });
});
