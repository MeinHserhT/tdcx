function _check_form_submit() {
  var em = "",
    ph = "",
    nm = "",
    emReg = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/;

  document.querySelectorAll("input").forEach(function (e) {
    if (e.name.includes("email") && e.value.match(emReg)) em = e.value;
    if (e.name.includes("tel") && e.value) ph = e.value;
    if (e.name.includes("text") && e.value) nm = e.value;
  });

  if (em && ph && nm) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "form_dangky",
      email: em,
    });
  }
}
_check_form_submit();

document.querySelectorAll("form button").forEach(function (e) {
  e.addEventListener("click", function (e) {
    var t = e.target.form,
      l = {},
      n = t.querySelector("[name='email']"),
      e = t.querySelector("[name='dienthoai']"),
      t = t.querySelector("[name='hoten']");
    n &&
      n.value.match(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/) &&
      (l.email = n.value);
    !e ||
      (9 === (e = e.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
        (l.phone = "+84" + e));
    t && t.value && (l.name = t);
    2 == Object.keys.length && console.log(l);
  });
});

function _ec() {
  window.dataLayer = window.dataLayer || [];
  var o = {},
    b = "",
    n = "",
    c = "";

  document.querySelectorAll('input[name*="phone"]').forEach(function (e) {
    if (e.value) b = e;
  });
  document.querySelectorAll('input[name*="name"]').forEach(function (e) {
    if (e.value) n = e;
  });
  document.querySelectorAll('input[name*="content"]').forEach(function (e) {
    if (e.value) c = e;
  });

  9 === (b = b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
    (o.phone = "+84" + b);

  Object.keys(o).length &&
    n.value &&
    c.value &&
    window.dataLayer.push({
      event: "form_lienhe",
      obj: o,
    });
}
_ec();
// [type="submit"], [type="submit"] *

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

function b() {
  var phone = "";
  document.querySelectorAll("input[name*=phone]").forEach(function (e) {
    if (e.value)
      phone = "+84" + e.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
  });
  return phone;
}

function a() {
  var email = "";
  document.querySelectorAll("input[name*=email]").forEach(function (e) {
    if (e.value) email = e.value;
  });
  return email;
}
