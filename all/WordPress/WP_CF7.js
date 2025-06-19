document.addEventListener("wpcf7mailsent", function (e) {
  window.dataLayer.push({
    event: "gui_form",
    formID: e.detail,
  });
});

// -----------------------------------------------------------------------------
document.addEventListener("wpcf7mailsent", function (e) {
  var a = e.detail.inputs.find(function (e) {
    return e.name.includes("email");
  });
  if (a.value) {
    window.dataLayer.push({
      event: "data",
      email: a.value,
    });

    window.dataLayer.push({
      event: "gui_form",
      formID: e.detail.contactFormId,
    });
  }
});
// -----------------------------------------------------------------------------
document.addEventListener("wpcf7mailsent", function (e) {
  var b = e.detail.inputs.find(function (n) {
    return n.name.includes("so-dien-thoai");
  });
  b.value &&
    window.dataLayer.push({
      event: "gui_form",
      formID: e.detail.contactFormId,
      phone: "+84" + b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
    });
});

dataLayer.push({
  phone:
    "+84" +
    document
      .querySelector("[type='tel']")
      .replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
});
