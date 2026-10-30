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
  var btn = e.target && e.target.closest ? e.target.closest("a.btn") : null;
  var container = btn && btn.closest("[class*=-body]");
  var phoneInput = container && container.querySelector('input[data-field="DienThoai"]');

  if (!phoneInput) return;

  setTimeout(function () {
    var errorMsg = document.querySelector(".gh-alert-content .msg");
    if (!errorMsg && phoneInput.value) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "formmm",
        phone: "+84" + phoneInput.value.replace(/\D/g, "").replace(/^(84|0)/, "")
      });
    }
  }, 200);
});
