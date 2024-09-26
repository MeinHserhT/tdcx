function _check_form_submit() {
	var em = "",
		ph = "",
		nm = "",
		emReg = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/;

	document.querySelectorAll("input").forEach(function (e) {
		if (e.name.includes("email") && e.value.match(emReg)) em = e.value;
		if (e.name.includes("tel") && e.value) ph = e.value;
		if (e.name.includes("text") && e.value) nm = e.value;
	});

	if (em && ph && nm) {
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			event: "form_dangky",
			email: em,
		});
	}
}
_check_form_submit();
