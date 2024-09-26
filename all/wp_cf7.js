// Normal
function _f() {
	document.addEventListener("wpcf7mailsent", function (e) {
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			event: "form_dangky",
			formID: e.detail.contactFormId,
		});
	});
}
_f();

// EC Phone + Email
// obj.email  ----	obj.phone

function _ec() {
	document.addEventListener("wpcf7mailsent", function (e) {
		window.dataLayer = window.dataLayer || [];
		var o = {},
			d = e.detail.inputs,
			a = d.find(function (n) {
				return n.name.includes("email");
			}),
			b = d.find(function (n) {
				return n.name.includes("dien-thoai");
			});
		a &&
			a.value.match(
				/^\w+([\.-]?\w+)([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/
			) &&
			(o.email = a.value);
		!b ||
			(9 ===
				(b = b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
				(o.phone = "+84" + b));

		2 === Object.keys(o).length &&
			window.dataLayer.push({
				event: "form_dangky",
				formID: e.detail.contactFormId,
				obj: o,
			});
	});
}
_ec();
