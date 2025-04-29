jQuery(document).on("submit_success", function (evt) {
  // console.log(evt);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "lead_form",
    email: evt.target.querySelector('input[type="email"]').value,
    phone: evt.target.querySelector('input[placeholder="Phone"]').value,
    eventAction: evt.target.name,
  });
});

jQuery(document).on("submit_success", function (evt) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "form_dangky",
    email: evt.target.querySelector('input[type="email"]').value,
    phone:
      "+84" +
      evt.target
        .querySelector('input[type="tel"]')
        .value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
    eventAction: evt.target.name,
  });
});

jQuery(document).on("submit_success", function (evt) {
  console.log(evt);

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "form_dangky",
  });
});
