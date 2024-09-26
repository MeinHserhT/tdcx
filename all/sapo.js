function a() {
	return +document
		.querySelector(".payment-due__price")
		.innerText.replace(/[^\d]/g, "");
}

function b() {
	return document
		.querySelector(".order-summary__title")
		.innerText.split(" ")[2];
}

function c() {
	return document.querySelector(".col:nth-child(1) p:nth-child(3)").innerText;
}
