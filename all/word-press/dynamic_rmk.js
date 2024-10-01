var dr_event_type = "",
	dr_value = 0,
	dr_items = [],
	businessType = "retail";

// var is_item = window.location.href.includes("/san-pham"); // /product
var is_item = document.querySelector(".product-container");
var is_cart = window.location.href.includes("/cart"); // /gio-hang
var is_CV = window.location.href.includes("/order-received");

if (is_cart) {
	// ----------------------------------------------
	// -----  Update Cart  -----
	var storage = JSON.parse(localStorage.getItem("item_storage")) || [];
	jQuery('a[class*="checkout"]').on("click", function () {
		var _arr = Array.from(document.querySelectorAll(".product-remove a")).map(
			function (e) {
				return +e.getAttribute("data-product_id");
			}
		);
		localStorage.setItem(
			"item_storage",
			JSON.stringify(
				storage.filter(function (e) {
					return _arr.includes(e.wpId);
				})
			)
		);
	});
}
else if (!is_item && !is_CV) {
	dataLayer.push({
		event: "remarketing",
	});
} else {
	if (is_item) {
		// ----------------------------------------------
		// -----  View Item  -----
		dr_event_type = "view_item";
		var item = {
			id: +jQuery('[name*="add-to-cart"]').val(),
			google_business_vertical: businessType,
		};
		dr_items.push(item);
		dr_value = +jQuery(".product-main ins .amount").text().replace(/\D/g, "");

		// ------------------------------------------------
		// -----  Add To Cart  -----
		jQuery('button[class*="add_to_cart"], button[class*="buy_now"]').on(
			"click",
			function () {
				dr_event_type = "add_to_cart";
				var current_cart =
					JSON.parse(localStorage.getItem("item_storage")) || [];
				current_cart.push(item);
				localStorage.setItem("item_storage", JSON.stringify(current_cart));

				dataLayer.push({
					dr_event_type: dr_event_type,
					dr_value: dr_value,
					dr_items: dr_items,
					event: "dynamic_remarketing",
				});
			});
	} else if (is_CV) {
		// ---------------------------------------------
		// -----  Purchase  -----
		dr_event_type = "purchase";
		var dr_items = JSON.parse(localStorage.getItem("item_storage"));

		var itemPrice = +jQuery(".woocommerce-order-overview__total bdi")
			.text()
			.replace(/\D/g, "");
		dr_value = itemPrice;
		localStorage.removeItem("item_storage");
	}

	dataLayer.push({
		dr_event_type: dr_event_type,
		dr_value: dr_value,
		dr_items: dr_items,
		event: "dynamic_remarketing",
	});
}