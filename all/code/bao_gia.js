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

document.addEventListener("click", function (e) {
    (l = e.target.closest('a[title*="báo giá"],a[title*="lái thử"]')),
        (f = l && l.closest("[class*=-body]"));
    f &&
        ((p = f.querySelector('input[data-field="DienThoai"]')),
        setTimeout(function () {
            r = document.querySelector(".gh-alert-content .msg");
            !r &&
                p &&
                p.value &&
                dataLayer.push({
                    event: "formmm",
                    phone:
                        "+84" +
                        p.value.replace(/\D/g, "").replace(/^(84|0)/, ""),
                });
        }, 200));
});
