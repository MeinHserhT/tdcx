// Custom JS
function _a() {
	return +document
		.querySelector("tfoot tr:last-child span")
		.innerText.replace(/[^\d]/g, "");
}
function _b() {
	return document
		.querySelector(".order")
		.innerText.replace(/[Mã đơn hàng:]/g, "");
}
function _c() {
	return (
		"+84" +
		document
			.querySelector(".woocommerce-customer-details--phone")
			.innerText.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "")
	);
}
// order-received

// HTML Full form
// obj.email  ----	obj.phone
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
		h.value &&
		v &&
		window.dataLayer.push({ event: "muahang", total: v, obj: o });
});

// orderData.customer.billing.email  //  orderData.customer.billing.phone


// https://jsfiddle.net/q6k0xupy/
document.querySelector(".button.alt").addEventListener("click", function p() {
	window.dataLayer = window.dataLayer || [];
	var a = document.querySelector('input[id*="email"]'),
		b = document.querySelector('input[id*="phone"]'),
		c = document.querySelector('input[id*="first"]'),
		d = document.querySelector('input[id*="address_1"]'),
		o = {},
		v = +document
			.querySelector(".order-total .amount")
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
		v &&
		window.dataLayer.push({ event: "muahang", total: v, obj: o });
});
