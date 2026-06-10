document.addEventListener("wpcf7mailsent", function (e) {
    dataLayer.push({
        event: "gui_form",
        formID: e.detail.contactFormId,
    });
});

// -----------------------------------------------------------------------------
document.addEventListener("wpcf7mailsent", function (e) {
    var a = e.detail.inputs.find(function (e) {
        return e.name.includes("email");
    });
    if (a.value) {
        dataLayer.push({
            event: "data",
            email: a.value,
        });

        dataLayer.push({
            event: "gui_form",
            formID: e.detail.contactFormId,
        });
    }
});

document.addEventListener("wpcf7mailsent", function (e) {
    var a = e.detail.inputs.find(function (e) {
        return e.name.includes("email");
    });
    a.value &&
        dataLayer.push({
            event: "gui_form",
            formID: e.detail.contactFormId,
            email: a.value,
        });
});
// -----------------------------------------------------------------------------
document.addEventListener("wpcf7mailsent", function (e) {
    var b = e.detail.inputs.find(function (n) {
        return n.name.includes("phone");
    });
    b.value &&
        dataLayer.push({
            event: "gui_form",
            formID: e.detail.contactFormId,
            phone: "+84" + b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
        });
});

dataLayer.push({
    email: document.querySelector("[type='email']").value,
});

document.addEventListener("wpcf7mailsent", function (e) {
    var a = e.detail.inputs.find(function (i) {
        return i.name.includes("email");
    })?.value;
    var b = e.detail.inputs.find(function (i) {
        return i.name.includes("phone");
    })?.value;

    (a || b) &&
        dataLayer.push({
            event: "gui_form",
            formID: e.detail.contactFormId,
            email: a || "",
            phone: b ? "+84" + b.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "") : "",
        });
});


(function() {
  window.dataLayer = window.dataLayer || [];

  // ADD: tránh gắn listeners 2 lần do script bị load trùng
  if (window.__cf7Hooked) return;
  window.__cf7Hooked = true;
  // END ADD

  function push(status, e) {
    var path = location.pathname || '/';
    var formLocation = /^\/contact-us(\/|$)/i.test(path) ? 'contact_page' : 'footer';
    window.dataLayer.push({
      event: 'cf7_submit',
      cf7_status: status,                // 'mailsent' | 'mailfailed' | 'spam' | 'invalid'
      cf7_formId: e && e.detail ? e.detail.contactFormId : undefined,
      cf7_unitTag: e && e.detail ? e.detail.unitTag : undefined,
      page_path: path,
      form_location: formLocation
    });

    // ADD: chỉ push form_submit 1 lần cho mỗi form instance
    if (status === 'mailsent') {
      window.__cf7Sent = window.__cf7Sent || {};
      var key = e && e.detail && e.detail.unitTag ? String(e.detail.unitTag) : 'default';
      if (!window.__cf7Sent[key]) {
        window.__cf7Sent[key] = true;
        window.dataLayer.push({ event: 'form_submit' });
      }
    }
    // END ADD
  }

  document.addEventListener('wpcf7mailsent',  function(e){ push('mailsent',  e); }, false);
  document.addEventListener('wpcf7mailfailed',function(e){ push('mailfailed',e); }, false);
  document.addEventListener('wpcf7spam',      function(e){ push('spam',      e); }, false);
  document.addEventListener('wpcf7invalid',   function(e){ push('invalid',   e); }, false);
})();

