function _p() {
	window.dataLayer = window.dataLayer || [];
	var a = document.querySelector('[name*="email"]'),
		b = document.querySelector('.phoneNumber [name*="phone"]'),
		c = document.querySelector('[name="firstname"]'),
		d = document.querySelector('[name="distict_id"]'),
		e = document.querySelector('[name="zone_id"]'),
		f = document.querySelector('[name="ward_id"]'),
		g = document.querySelector('[name="address_1"]'),
		o = {},
		v = +document
			.querySelector(".text-tp-total")
			.innerText.replace(/[^\d]/g, "");
	a &&
		a.value.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)(\.\w{2,3})+$/) &&
		(o.email = a.value);
	!b ||
		(9 === (b = b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
			(o.phone = "+84" + b));
	2 === Object.keys(o).length &&
		c.value &&
		d.value &&
		e.value &&
		f.value &&
		g.value &&
		v &&
		window.dataLayer.push({ event: "muahangngay", total: v, obj: o });
}
_p();

function _p() {
	var a = document.querySelector('[name*="firstName"]').value,
		b = document.querySelector('[name*="lastName"]').value,
		c = document.querySelector('[name="phone"]').value,
		d = document.querySelector('[name="email"]').value,
		e = document.querySelector('[name="isPaymnetRequired"]').checked;
	if (a && b && c && d && e) return "Y";
	return "N";
}
_p();
