var dr_event_type = "",
	dr_value = 0,
	dr_items = [],
	businessType = "retail";

var is_item = window.location.href.includes("/san-pham");
var is_cart = window.location.href.includes("/thanh-toan");
var is_CV = window.location.href.includes("/order-received");

if (!(is_item || is_CV)) {
	dataLayer.push({
		event: "remarketing",
	});
} else if (is_cart) {
	var storage = JSON.parse(localStorage.getItem("item_storage")) || [];
	jQuery('[name*="checkout"]').on("click", function () {
		var _arr = jQuery(".product-remove a")
			.map(function () {
				return +this.getAttribute("data-product_id");
			})
			.toArray();
		localStorage.setItem(
			"item_storage",
			JSON.stringify(
				storage.filter(function (e) {
					return _arr.includes(e.wpId);
				})
			)
		);
	});
} else {
	if (is_item) {
		// -----------------------
		// -----  View Item  -----
		dr_event_type = "view_item";
		var itemId = jQuery(".chitiet > li:nth-child(1)").text().split(": ")[1];

		var item = {
			id: itemId,
			wpId: +jQuery('[name="add-to-cart"]')[0].value,
			google_business_vertical: businessType,
		};
		dr_items.push(item);
		dr_value = +jQuery("ins .amount")[0].innerText.replace(/\D/g, "");

		// -------------------------
		// -----  Add To Cart  -----
		jQuery('[class*="add_to_cart"], [class*="buy_now"]').on(
			"click",
			function () {
				dr_event_type = "add_to_cart";
				var current_cart =
					JSON.parse(localStorage.getItem("item_storage")) || [];
				current_cart.push(item);
				localStorage.setItem(
					"item_storage",
					JSON.stringify(current_cart)
				);

				dataLayer.push({
					dr_event_type: dr_event_type,
					dr_value: dr_value,
					dr_items: dr_items,
					event: "dynamic_remarketing",
				});
			}
		);
	} else if (is_CV) {
		// ----------------------
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
