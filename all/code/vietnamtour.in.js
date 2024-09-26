function _p() {
	var a = document.querySelector("#wpforms-6899-field_15"),
		b = document.querySelector("#wpforms-6899-field_17"),
		c = 0,
		d = document.querySelector("#wpforms-6899-field_16"),
		e = document.querySelector(".choices__item"),
		f = document.querySelector("#wpforms-6899-field_13"),
		o = {};

	document.querySelectorAll("input[id*='field_59']").forEach(function (e) {
		if (e.checked) c = 1;
	});
	a &&
		a.value.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)(\.\w{2,3})+$/) &&
		(o.email = a.value);
	1 === Object.keys(o).length &&
		b.value &&
		c &&
		d.value &&
		e.innerText !== "Your Travel Plan Stage" &&
		f.value &&
		(window.ec = o.email);
}
_p();

// .wpforms-page-button, .wpforms-page-button *

function _ec() {
	window.dataLayer = window.dataLayer || [];

	var a = document.querySelector("#wpforms-6899-field_58"),
		b = document.querySelector("#wpforms-6899-field_18"),
		c = 0,
		d = 0,
		z = 0,
		f = document.querySelector("#wpforms-6899-field_31"),
		g = document.querySelector("#wpforms-6899-field_34"),
		h = document.querySelector("#wpforms-6899-field_4"),
		o = {};

	document.querySelectorAll("input[id*='field_47']").forEach(function (e) {
		if (e.checked) c = 1;
	});
	document.querySelectorAll("input[id*='field_50']").forEach(function (e) {
		if (e.checked) d = 1;
	});
	document.querySelectorAll("input[id*='field_39']").forEach(function (e) {
		if (e.checked) z = 1;
	});

	a.value &&
		b.value &&
		c &&
		d &&
		z &&
		f.value &&
		g.value &&
		h.value &&
		window.dataLayer.push({ event: "form_design", email: window.ec });
}
_ec();

// #wpforms-submit-6899, #wpforms-submit-6899 *

jQuery(document).ready(function ($) {
	$("form.wpforms-form").on("wpformsAjaxSubmitSuccess", function (event) {
		var formId = $(event.target).attr("data-formid");

		var email = "";
		if ((email_elm = document.querySelector("#wpforms-6583-field_15"))) {
			email = email_elm.value;
		}
		if (email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)(\.\w{2,3})+$/))
			dataLayer.push({
				event: "form_inquire",
				formId: formId,
				email: email,
			});
	});
});
