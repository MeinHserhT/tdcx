// a[href*="tel:"], a[href*="tel:"] *
// a[href*="zalo.me"], a[href*="zalo.me"] *
// a[href*="m.me"], a[href*="m.me"] *
// a[href*="facebook"], a[href*="facebook"] *
// a[href*="messenger"], a[href*="messenger"] *
// a[href*="maps"], a[href*="maps"] *
// a[href*="whatsapp.com"], a[href*="whatsapp.com"] *
// a[href*="wa.me"], a[href*="wa.me"] *

// --------------------------------------------------------------------------
// obj.email  ----	obj.phone
document.querySelector(".btnSendComment").addEventListener("click", f);
function f() {
	window.dataLayer = window.dataLayer || [];
	var o = {},
		nm = document.querySelector('[name="hoten"]'),
		c = document.querySelector('[name="noidung"]'),
		a = document.querySelector('[name="email"]');
	a.value.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/) && (o.email = a.value);
	Object.keys(o).length &&
		nm.value &&
		c &&
		window.dataLayer.push({
			event: "form_baogia",
			obj: o,
		});
}

function f2() {
	window.dataLayer = window.dataLayer || [];
	var o = {},
		a = "",
		b = "",
		c = "";
	document.querySelectorAll('[id="dongxe"]').forEach(function (e) {
		if (e.value) a = e;
	});
	document.querySelectorAll('[id="xcywqj"]').forEach(function (e) {
		if (e.value) b = e;
	});
	document.querySelectorAll('[id="name"]').forEach(function (e) {
		if (e.value) c = e;
	});
	9 === (b = b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
		(o.phone = "+84" + b);
	Object.keys(o).length &&
		a.value &&
		c.value &&
		window.dataLayer.push({
			event: "form_lienhe",
			obj: o,
		});
}
f2();

function _ec() {
	window.dataLayer = window.dataLayer || [];
	var o = {},
		a = document.querySelector('input[id*="email"]'),
		b = document.querySelector('input[id*="phone"]'),
		c = document.querySelector('input[id*="name"]'),
		d = document.querySelector('select[id*="showroom"]'),
		e = document.querySelector('select[id*="car_category"]'),
		f = document.querySelector('select[id*="popupRequest"]'),
		g = document.querySelector('input[id*="popupContentInput"]');

	a.value.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/) && (o.email = a.value);
	9 === (b = b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
		(o.phone = "+84" + b);
	2 === Object.keys(o).length &&
		c.value &&
		d.value &&
		e.value &&
		(!["Khác", ""].includes(f.value) || ("Khác" === f.value && g.value)) &&
		window.dataLayer.push({ event: "form_dangky", obj: e });
}
_ec();

// -----------------------------------------------------------------------------
// Purchase
document.querySelector(".devvn-order-btn").addEventListener("click", p);
function p() {
	window.dataLayer = window.dataLayer || [];
	var ph = document.querySelector('input[id*="phone"]'),
		v_ph = document.querySelector('input[name*="valid-phone"]'),
		nm = document.querySelector('input[name*="name"]'),
		oj = {},
		t = 0,
		v = +document
			.querySelector(".popup_quickbuy_total_calc")
			.innerText.replace(/[^\d]/g, "");

	if (ph.value == v_ph.value) t = 1;
	9 === (ph = ph.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
		(oj.phone = "+84" + ph);
	Object.keys(oj).length &&
		t &&
		nm.value &&
		v &&
		window.dataLayer.push({ event: "muahang", total: v, obj: oj });
}

document.querySelector(".button.alt").addEventListener("click", function p() {
	window.dataLayer = window.dataLayer || [];
	var a = document.querySelector('input[id*="email"]'),
		b = document.querySelector('input[id*="phone"]'),
		c = document.querySelector('input[id*="first"]'),
		d = document.querySelector('input[id*="last"]'),
		e = document.querySelector('input[id*="address_1"]'),
		h = document.querySelector('input[id*="city"]'),
		o = {},
		v = +document
			.querySelector(".order-total .amount")
			.innerText.replace(/[^\d]/g, "");

	a.value.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)(\.\w{2,3})+$/) &&
		(o.email = a.value);
	9 === (b = b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
		(o.phone = "+84" + b);
	2 === Object.keys(o).length &&
		c.value &&
		d.value &&
		e.value &&
		h.value &&
		v &&
		window.dataLayer.push({ event: "muahang", total: v, obj: o });
});

// -----------------------------------------------------------------------------
document.querySelector(".btn-submit").addEventListener("click", function p() {
	window.dataLayer = window.dataLayer || [];
	var em = document.querySelector('input[id*="Email"]'),
		ph = document.querySelector('input[id*="Phone"]'),
		nm = document.querySelector('input[id*="Name"]'),
		pass = document.querySelector('input[id="Password"]'),
		c_pass = document.querySelector('input[id*="Confirm"]'),
		ct = document.querySelector('[id*="Province"]'),
		dt = document.querySelector('[id*="Dist"]'),
		oj = {};

	em.value.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)(\.\w{2,3})+$/) &&
		(oj.email = em.value);
	9 === (ph = ph.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
		(oj.phone = "+84" + ph);
	2 === Object.keys(oj).length &&
		nm.value &&
		ct.value !== "0" &&
		dt.value !== "0" &&
		pass.value == c_pass.value &&
		window.dataLayer.push({ event: "form_ct", obj: oj });
});
// -----------------------------------------------------------------------------

// [data-type="form_order"] [type="submit"], [data-type="form_order"] [type="submit"] *
function a() {
	var ph = document.querySelector('input[name*="phone"]').value,
		nm = document.querySelector('input[name*="name"]').value,
		ad = document.querySelector('input[name*="address"]').value,
		p = "";
	9 === (ph = ph.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")).length &&
		nm &&
		ad &&
		(p = "+84" + ph);
	return p;
}
