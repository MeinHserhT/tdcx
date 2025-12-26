// ---- Value -----
function _v() {
    return +document
        .querySelector("tfoot tr:last-child span")
        .innerText.replace(/[^\d]/g, "");
}
function _v() {
    var ordTotal = +document
        .querySelector("strong .amount")
        .innerText.replace(/[^\d]/g, "");
    return ordTotal;
}
// ---- Order ID -----
function _id() {
    return document.querySelector(".order").innerText.replace(/\D/g, "");
}
function _id() {
    return document
        .querySelector(".order")
        .innerText.replace(/[Mã đơn hàng:]/g, "");
}
// ---- UPD -----
function _p() {
    return (
        "+84" +
        document
            .querySelector(".woocommerce-customer-details--phone")
            .innerText.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")
    );
}

function _p() {
    return (
        "+84" +
        document
            .querySelector("#billing_phone")
            .innerText.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")
    );
}
function _e() {
    return document.querySelector(".woocommerce-customer-details--email")
        .innerText;
}
function e() {
    return document.querySelector("[type=email]").value;
}
function p() {
    return (
        "+84" +
        document
            .querySelector("[type=tel]")
            .value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")
    );
}
localStorage.setItem(
    "total",
    +document
        .querySelector("strong .woocommerce-Price-amount.amount")
        .innerText.replace(/[^\d.-]/g, "")
);

function a() {
    return localStorage.getItem("total");
}

// order-received
