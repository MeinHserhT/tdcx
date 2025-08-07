Bizweb.checkout.total_price


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

// Bizweb.checkout.billing_address.phone
// Bizweb.checkout.total_price
// Bizweb.checkout.order_id

// add to cart
function a() {
	return +document
		.querySelector(".product-price")
		.innerText.replace(/[^\d]/g, "");
}

// dataLayer.push({
//   event: "add_to_cart",
//   eventModel: {
//     currency: "VND",
//     items: [
//       {
//         id: 38319293,
//         name: "Sữa Tắm Hatomugi Dưỡng Ẩm Và Làm Sáng Da 800ml",
//         brand: "Hatomugi",
//         variant: "Default Title",
//         price: "99000",
//         quantity: 1
//       }
//     ]
//   },
//   gtm.uniqueEventId: 10
// })
