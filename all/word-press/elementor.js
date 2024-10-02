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
