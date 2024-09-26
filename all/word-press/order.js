function a() {
	var ordTotal = +document
		.querySelector("strong .amount")
		.innerText.replace(/[^\d]/g, "");
	return ordTotal;
}

function b() {
	var ordId = document
		.querySelector(".woocommerce-order-overview__order.order")
		.innerText.replace(/\D/g, "");
	return ordId;
}

function c() {
	return document.querySelector(".woocommerce-customer-details--email")
		.innerText;
}

// checkout/order-received/
