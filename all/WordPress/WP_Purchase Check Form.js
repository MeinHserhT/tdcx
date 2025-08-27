// HTML Full form
// obj.email  ----	obj.phone
// .button.alt, .button.alt *
function p() {
  window.dataLayer = window.dataLayer || [];
  var a = document.querySelector('input[id*="email"]'),
    b = document.querySelector('input[id*="phone"]'),
    c = document.querySelector('input[id*="first"]'),
    d = document.querySelector('input[id*="last"]'),
    e = document.querySelector('input[id*="address_1"]'),
    h = document.querySelector('input[id*="city"]'),
    o = {},
    v = +document
      .querySelector(".order-total .amount")
      .innerText.replace(/[^\d]/g, "");
  a.value.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)(\.\w{2,3})+$/) &&
    (o.email = a.value);
  9 === (b = b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
    (o.phone = "+84" + b);
  2 === Object.keys(o).length &&
    c.value &&
    d.value &&
    e.value &&
    h.value &&
    v &&
    window.dataLayer.push({ event: "muahang", total: v, obj: o });
}
p();

// orderData.customer.billing.email  //  orderData.customer.billing.phone

document.querySelector(".button.alt").addEventListener("click", function p() {
  window.dataLayer = window.dataLayer || [];
  var a = document.querySelector('input[id*="email"]'),
    b = document.querySelector('input[id*="phone"]'),
    c = document.querySelector('input[id*="first"]'),
    d = document.querySelector('input[id*="address_1"]'),
    o = {},
    v = +document
      .querySelector(".order-total .amount")
      .innerText.replace(/[^\d]/g, "");
  a &&
    a.value.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)(\.\w{2,3})+$/) &&
    (o.email = a.value);
  !b ||
    (9 === (b = b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
      (o.phone = "+84" + b));
  2 === Object.keys(o).length &&
    c.value &&
    d.value &&
    v &&
    window.dataLayer.push({ event: "muahang", total: v, obj: o });
});

var fn = document.querySelector("#billing_first_name").value,
  ln = document.querySelector("#billing_last_name").value,
  ct = document.querySelector("#billing_country").value,
  add = document.querySelector("#billing_address_1").value,
  city = document.querySelector("#billing_city").value,
  ph = document.querySelector("#billing_phone").value,
  em = document.querySelector("#billing_email").value,
  term = document.querySelector('[name="agree"]').checked,
  a = 0;
document.querySelectorAll('[name="payment"]').forEach(function (e) {
  if (e.checked) a = 1;
});

function a() {
  return +localStorage.getItem("value");
}

function a() {
  var fn = document.querySelector("#billing_first_name").value,
    ln = document.querySelector("#billing_last_name").value,
    ct = document.querySelector("#billing_country").value,
    add = document.querySelector("#billing_address_1").value,
    city = document.querySelector("#billing_city").value,
    ph = document.querySelector("#billing_phone").value,
    em = document.querySelector("#billing_email").value,
    term = document.querySelector("#terms").checked;

  if (fn && ln && ct && add && city && ph && em && term) return "y";
  return "n";
}

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

function a() {
  var term = document.querySelector('[name="agree"]').checked,
    a = 0;
  document.querySelectorAll('[name="payment"]').forEach(function (e) {
    if (e.checked) a = 1;
  });
  if (term && a) return 1;
  return 0;
}
