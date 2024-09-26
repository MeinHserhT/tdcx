function _gtm_form() {
	document.addEventListener("wpcf7mailsent", function (event) {
		var data = event.detail.inputs;
		var em = data.find(function (e) {
				return e.name.includes("email");
			}),
			ph = data.find(function (e) {
				return e.name.includes("phone");
			});

		var emReg = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/,
			phReg = /^\d{10}|^\d{11}/;

		if (em.value.match(emReg) && ph.value.match(phReg)) {
			window.dataLayer = window.dataLayer || [];
			window.dataLayer.push({
				event: "form_dangky",
				formId: event.detail.contactFormId,
				email: em.value,
				phone: ph.value.replace(/^0|^84|^([^0])/, "+84"),
			});
		}
	});
}
_gtm_form();
