document.querySelectorAll("form-embed").forEach(function (e) {
  e.shadowRoot
    .querySelector("button[type=submit]")
    .addEventListener("click", function () {
      console.log("a");
    });
});

document.querySelectorAll("chat-widget").forEach(function (widget) {
  var start_chat_btn = widget.shadowRoot.querySelector(
    ".message_form > button"
  );
  if (start_chat_btn) {
    start_chat_btn.addEventListener("click", function () {
      var name = widget.shadowRoot.querySelector('input[name="name"]');
      var phone = widget.shadowRoot.querySelector('input[name="phone"]');
      name.value &&
        phone.value &&
        dataLayer.push({
          event: "start_chat",
        });
    });
  } else {
    widget.shadowRoot
      .querySelectorAll(
        ".conv-item, .conv-item * , .create-new-conv button, .create-new-conv button *"
      )
      .forEach(function (e) {
        e.addEventListener("click", function () {
          dataLayer.push({
            event: "start_chat",
          });
        });
      });
  }
  widget.shadowRoot
    .querySelector("[href*='zalo.me'], [href*='zalo.me'] *")
    .addEventListener("click", function () {
      dataLayer.push({
        event: "ZaloClick",
      });
    });
  widget.shadowRoot
    .querySelector("[href*='tel:'], [href*='tel:'] *")
    .addEventListener("click", function () {
      dataLayer.push({
        event: "HotlineClick",
      });
    });
  widget.shadowRoot
    .querySelector("[href*='facebook.com'], [href*='facebook.com'] *")
    .addEventListener("click", function () {
      dataLayer.push({
        event: "MessClick",
      });
    });
  widget.shadowRoot
    .querySelector("[href*='mailto:'], [href*='mailto:'] *")
    .addEventListener("click", function () {
      dataLayer.push({
        event: "MailClick",
      });
    });
});

var a = Date.now();
(function (a, b) {
  var c = document.createElement("script");
  (c.type = "text/javascript"),
    c.readyState
      ? (c.onreadystatechange = function () {
          ("loaded" == c.readyState || "complete" == c.readyState) &&
            ((c.onreadystatechange = null), b());
        })
      : (c.onload = function () {
          b();
        });
  const d = trustedTypes.createPolicy("foo-js-static", {
    createScriptURL: () => a,
  });
  c.src = d.createScriptURL("");
  document.getElementsByTagName("head")[0].appendChild(c);
})(
  "https://cdtx.lyl.vn/cdtx-assistant/_Bookmark/bookmark_list/mirinGoogleUIRemind.js" +
    "?v=" +
    a,
  function () {
    console.log("DONE");
  }
);
