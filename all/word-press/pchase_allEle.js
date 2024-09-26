var fname = document.querySelector("#billing_first_name_field").value,
	lname = document.querySelector("#billing_last_name_field").value,
	add = document.querySelector("#billing_address_1").value,
	city = document.querySelector("#billing_city").value,
	phone = document.querySelector("#billing_phone").value,
	email = document.querySelector("#billing_email").value,
	value = parseFloat(
		document
			.querySelector("strong .woocommerce-Price-amount.amount")
			.innerText.replace(/[^\d.-]/g, "")
	);

if (
	phone.lenght > 8 &&
	email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g) &&
	fname &&
	lname &&
	add &&
	city
) {
	phone = phone.replace(/\D/g, "").replace(/^0|^84|^([^0])/, "+84");

	window.dataLayer = window.dataLayer || [];
	window.dataLayer.push({
		event: "muahang",
		phone: phone,
		email: email,
		value: value,
	});
}
