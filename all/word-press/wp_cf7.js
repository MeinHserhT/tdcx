// Normal
document.addEventListener("wpcf7mailsent", function (e) {
	window.dataLayer = window.dataLayer || [];
	window.dataLayer.push({
		event: "form_baogia",
		formID: e.detail.contactFormId,
	});
});

// obj.email  ----	obj.phone
// -----------------------------------------------------------------------------
// Email
document.addEventListener("wpcf7mailsent", function (e) {
	window.dataLayer = window.dataLayer || [];
	var o = {},
		d = e.detail.inputs,
		a = d.find(function (n) {
			return n.name.includes("email");
		});
	a.value.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/) && (o.email = a.value);
	Object.keys(o).length &&
		window.dataLayer.push({
			event: "form_lienhe",
			obj: o,
		});
});
// ======== No validate
document.addEventListener("wpcf7mailsent", function (e) {
	window.dataLayer = window.dataLayer || [];
	var d = e.detail.inputs,
		a = d.find(function (n) {
			return n.name.includes("email");
		});
	a.value &&
		window.dataLayer.push({
			event: "wpcf7Form",
			email: a.value,
		});
});

// -----------------------------------------------------------------------------
// Phone
document.addEventListener("wpcf7mailsent", function (e) {
	window.dataLayer = window.dataLayer || [];
	var o = {},
		d = e.detail.inputs,
		b = d.find(function (n) {
			return n.name.includes("tel");
		});
	9 === (b = b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
		(o.phone = "+84" + b);
	Object.keys(o).length &&
		window.dataLayer.push({
			event: "form_dangky",
			obj: o,
		});
});
// ======== No validate
document.addEventListener("wpcf7mailsent", function (e) {
	window.dataLayer = window.dataLayer || [];
	var d = e.detail.inputs,
		b = d.find(function (n) {
			return n.name.includes("tel");
		});
	b.value &&
		window.dataLayer.push({
			event: "wpcf7Form",
			phone: "+84" + b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
		});
});

// -----------------------------------------------------------------------------
// EC Phone + Email

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
		(9 === (b = b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
			(o.phone = "+84" + b));

	2 === Object.keys(o).length &&
		window.dataLayer.push({
			event: "form_dangky",
			formID: e.detail.contactFormId,
			obj: o,
		});
});

document.addEventListener("wpcf7mailsent", function (e) {
	window.dataLayer = window.dataLayer || [];
	var d = e.detail.inputs,
		a = d.find(function (n) {
			return n.name.includes("email");
		}),
		b = d.find(function (n) {
			return n.name.includes("dien-thoai");
		});

	a.value &&
		b.value &&
		window.dataLayer.push({
			event: "form_dangky",
			formID: e.detail.contactFormId,
			email: a.value,
			phone: "+84" + b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
		});
});

// WP Form
// .wpforms-submit, .wpforms-submit *
function f() {
	window.dataLayer = window.dataLayer || [];
	var o = {},
		n = document.querySelector('[name*="[fields][0]"]'),
		a = document.querySelector('[name*="[fields][1]"]'),
		b = document.querySelector('[name*="[fields][4]"]'),
		c = document.querySelector('[name*="[fields][2]"]');
	a.value.match(/^\w+([\.-]?\w+)([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/) &&
		(o.email = a.value);
	9 === (b = b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
		(o.phone = "+84" + b);
	2 === Object.keys(o).length &&
		n.value &&
		c.value &&
		window.dataLayer.push({
			event: "Form",
			obj: o,
		});
}
f();
// -----------------------------------------------------------------------------


