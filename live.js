// a[href*="tel:"], a[href*="tel:"] *
// a[href*="zalo.me"], a[href*="zalo.me"] *
// a[href*="m.me"], a[href*="m.me"] *
// a[href*="wa.me"], a[href*="wa.me"] *
// a[href*="line.me"], a[href*="line.me"] *
// a[href*="mailto:"], a[href*="mailto:"] *
// a[href*="facebook"], a[href*="facebook"] *
// a[href*="messenger"], a[href*="messenger"] *
// a[href*="kakao.com"], a[href*="kakao.com"] *
// a[href*="maps"], a[href*="maps"] *
// a[href*="whatsapp.com"], a[href*="whatsapp.com"] *
// a[href *= "docs.google"], a[href *= "docs.google"] *
    function a() {
        return Math.floor(performance.now() / 1000);
    }
jQuery("input[name*=phone]").validity.patternMismatch;
// --------------------------------------------------------------------------
// gtm.timerInterval
// gtm.scrollThreshold
// --------------------------------------------------------------------------
// Local Storage
localStorage.setItem(
    "total",
    +document.querySelector("#total-display").innerText.replace(/[^\d]/g, "")
);
function a() {
    return +localStorage.getItem("total");
}

// Value
function a() {
    var a = +document
        .querySelector(".tt-payment-pending-info-row.notranslate > strong")
        .innerText.replace(/[^\d]/g, "");
    return a;
}

// JS Phone
function a() {
    return (
        "+84" +
        document
            .querySelector("[type=tel]")
            .value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")
    );
}

function a() {
    return (
        "+84" +
        document
            .querySelector("[name='tel']")
            .value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")
    );
}

function a() {
    var p;
    document.querySelectorAll('[type="tel"]').forEach(function (e) {
        e.value &&
            (p = "+84" + e.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""));
    });
    return p;
}

// Datalayer Phone
document.querySelectorAll('[placeholder*="Điện Thoại"]').forEach(function (e) {
    if (e.value)
        dataLayer.push({
            phone: "+84" + e.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
        });
});

document.querySelectorAll("[type=tel]").forEach(function (e) {
    if (e.value)
        dataLayer.push({
            phone: "+84" + e.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
        });
});

// Datalayer Email
document.querySelectorAll("[id=email]").forEach(function (e) {
    if (e.value)
        dataLayer.push({
            email: e.value,
        });
});

// JS Email
function a() {
    var em;
    document.querySelectorAll("input[type=email]").forEach(function (e) {
        e.value && (em = e.value);
    });
    return em;
}

// Ladi Multi Value
function a() {
    a = 0;
    document.querySelectorAll("[type=checkbox]").forEach(function (e) {
        if (e.checked) a += +e.value.split(" ").pop().slice(0, -1) * 1000;
    });
    return a;
}

function a() {
    return ['[data-selected="Có, còn đủ cả hai"]', '[data-selected="Từ xa - Học online 100%"]'].every(function (selector) {
        return document.querySelector(selector);
    })
        ? "y"
        : "n";
}

function a() {
    return (
        "+84" +
        document
            .querySelector("#gh-order-detail-list > li:nth-child(2)")
            .innerText.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")
    );
}
