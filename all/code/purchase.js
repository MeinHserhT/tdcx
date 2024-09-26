function _p() {
	var n = document.querySelector('input[id*="name"]').value,
		add = document.querySelector('input[id*="add"]').value,
		a = document.querySelector('input[id*="mail"]').value,
		b = document.querySelector('input[id*="tel"]').value,
		v = +document.querySelector(".total").innerText.replace(/\D/g, ""),
		emReg = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/;
	b = b.replace(/^0*|^(84)0*|^(\+84)0*/, "");

	n &&
		v &&
		add &&
		a.match(emReg) &&
		b.length === 9 &&
		((clearInterval(t), (window.dataLayer = window.dataLayer || [])),
		window.dataLayer.push({
			event: "muahang",
			email: a,
			phone: "+84" + b,
			value: v,
			currency: "VND",
		}));
}
t = setInterval(_p, 1000);
