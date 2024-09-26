function _gtm_form() {
	var fst = "",
		snd = "",
		ph = "",
		phRegex = /^\d{10}|^\d{11}/;
	document.querySelectorAll("input").forEach(function (e) {
		if (e.name.includes("number") && e.value.match(phRegex))
			ph = e.value.replace(/^0|^84|^([^0])/, "+84");
		if (e.name.includes("first") && e.value) fst = e.value;
		if (e.name.includes("last") && e.value) snd = e.value;
	});

	if (fst && snd && ph) {
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			event: "form_dangky",
			phone: ph,
		});
	}
}
_gtm_form();
