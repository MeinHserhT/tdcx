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

(function () {
  var HOST_SELECTOR = '[id^="ldg-frame14-"]';   // id suffix may change per page
  var TARGET = '.f14-msg.success.show';

  // Desktop, tablet and mobile each have their own .f14-msg; only one is displayed
  function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function onSuccess(el, host) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'f14_form_success',
      f14_host_id: host.id,
      f14_message: (el.textContent || '').trim()
    });
    console.log('[f14] success message shown:', el.textContent);
  }

  function watch(host) {
    if (host.__f14Watched) return;
    var root = host.shadowRoot;
    if (!root) {
      console.warn('[f14] No shadowRoot on', host, '- declarative shadow DOM not attached');
      return;
    }
    host.__f14Watched = true;
    var fired = false;

    function check() {
      var els = root.querySelectorAll(TARGET);
      var hit = null;
      for (var i = 0; i < els.length; i++) {
        if (isVisible(els[i])) { hit = els[i]; break; }
      }
      if (hit && !fired) { fired = true; onSuccess(hit, host); }
      else if (!hit) { fired = false; } // reset so the next submit fires again
    }

    check(); // in case it's already showing
    new MutationObserver(check).observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  function init() {
    var hosts = document.querySelectorAll(HOST_SELECTOR);
    for (var i = 0; i < hosts.length; i++) watch(hosts[i]);
    return hosts.length > 0;
  }

  // Wait for the host if it's injected later (e.g. by the page builder or lazy load)
  if (!init()) {
    var docObs = new MutationObserver(function () {
      if (init()) docObs.disconnect();
    });
    docObs.observe(document.documentElement, { childList: true, subtree: true });
  }
})();

