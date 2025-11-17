// a[href*="tel:"], a[href*="tel:"] *
// a[href*="zalo.me"], a[href*="zalo.me"] *
// a[href*="mailto:"], a[href*="mailto:"] *
// a[href*="m.me"], a[href*="m.me"] *
// a[href*="facebook"], a[href*="facebook"] *
// a[href*="messenger"], a[href*="messenger"] *
// a[href*="maps"], a[href*="maps"] *
// a[href*="whatsapp.com"], a[href*="whatsapp.com"] *
// a[href*="wa.me"], a[href*="wa.me"] *
// a[href*="line.me"], a[href*="line.me"] *

// b/456666535
// --------------------------------------------------------------------------
// gtm.timerInterval
// gtm.scrollThreshold
// --------------------------------------------------------------------------

// jQuery("input[name*=phone]").validity.patternMismatch
localStorage.setItem(
    "total",
    +document.querySelector(".Sum2 > span").innerText.replace(/[^\d]/g, "")
);

function a() {
    return +localStorage.getItem("total");
}

function a() {
    var a = 0;
    document
        .querySelectorAll(".item_or > td:nth-child(5)")
        .forEach(function (e) {
            a += +e.innerText.replace(/[^\d]/g, "");
        });
    return a;
}

function a() {
    var a = +document
        .querySelector(".load-price-total")
        .innerText.replace(/[^\d]/g, "");
    return a;
}

function a() {
    return (
        "+84" +
        document
            .querySelector("#txtDienThoaiBaoGiaPopup")
            .value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")
    );
}

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
            .querySelector('#modalPriceQuote [data-field="DienThoai"]')
            .value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")
    );
}

document.querySelectorAll('[placeholder*="điện thoại"]').forEach(function (e) {
    if (e.value)
        dataLayer.push({
            phone: "+84" + e.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
        });
});

function a() {
    var p;
    document.querySelectorAll("input[type=tel]").forEach(function (e) {
        e.value &&
            (p = "+84" + e.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""));
    });
    return p;
}

function a() {
    var em;
    document.querySelectorAll("input[type=email]").forEach(function (e) {
        e.value && (em = e.value);
    });
    return em;
}

function a() {
    var a = document.querySelector('input=[name="ten"]').value;
    var b = document.querySelector('input=[type="tel"]').value;
    var c = document.querySelector('input=[name="diachi"]').value;
    var d = document.querySelector("#city").value;
    var e = document.querySelector("#wards").value;
    if (a && b && c && d && e) return "y";
    return "n";
}
