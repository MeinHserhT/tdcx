// Custom JS
function _a() {
  return +document
    .querySelector("tfoot tr:last-child span")
    .innerText.replace(/[^\d]/g, "");
}

function _a() {
  var ordTotal = +document
    .querySelector("strong .amount")
    .innerText.replace(/[^\d]/g, "");
  return ordTotal;
}

function _b() {
  var ordId = document
    .querySelector(".woocommerce-order-overview__order.order")
    .innerText.replace(/\D/g, "");
  return ordId;
}

function _b() {
  return document
    .querySelector(".order")
    .innerText.replace(/[Mã đơn hàng:]/g, "");
}

function _p() {
  return (
    "+84" +
    document
      .querySelector(".woocommerce-customer-details--phone")
      .innerText.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")
  );
}

function _e() {
  return document.querySelector(".woocommerce-customer-details--email")
    .innerText;
}

// order-received

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

var fname = document.querySelector("#billing_first_name_field").value,
  lname = document.querySelector("#billing_last_name_field").value,
  add = document.querySelector("#billing_address_1").value,
  city = document.querySelector("#billing_city").value,
  phone = document.querySelector("#billing_phone").value,
  email = document.querySelector("#billing_email").value,
  value = parseFloat(
    document
      .querySelector("strong .woocommerce-Price-amount.amount")
      .innerText.replace(/[^\d.-]/g, "")
  );

<script>
  localStorage.setItem("value", +document .querySelector("strong .amount")
  .innerText.replace(/[^\d]/g, ""))
</script>;

function a() {
  return +localStorage.getItem("value");
}
