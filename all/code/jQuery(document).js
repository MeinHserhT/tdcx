jQuery(document).on(
	"click",
	'[class*="zzzzz"], [class*="zzzzz"] *',
	function () {
		window.__em = window.__em || "";
		var em = "",
			ph = "",
			nm = "",
			emReg = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/;

		document.querySelectorAll("input").forEach(function (e) {
			if (e.value.match(emReg)) em = e.value;
		});

		if (em && ph && nm) {
			window.__em = em;
			window.dataLayer.push({
				event: "f7submit",
				email: em,
			});
		}
	}
);
