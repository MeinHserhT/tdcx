var onElmClick = function (e, f) {
    document.addEventListener("click", function (n) {
      n.target.matches(e) && f(n);
    });
  },
  btn = null;
onElmClick(".btn", function (e) {
  setTimeout(function () {
    var element = document.querySelector(".gh-alert-content .msg");
    if (!element) {
      btn = e.target;

      var parent = btn.closest(".modal-body") || btn.closest(".container");
      if (parent) {
        var ph = parent.querySelector("[id*=txtDienThoai]").value;
        ph &&
          dataLayer.push({
            event: "gui_form",
            phone: "+84" + ph.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
          });
      }
    }
  }, 500);
});
