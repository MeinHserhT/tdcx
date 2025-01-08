var dr_event_type = "",
	dr_value = 0,
	dr_items = [],
	businessType = "custom";

var is_item = window.location.href.includes("/san-pham"); // /product
// var is_item = document.querySelector(".container");
var is_cart = window.location.href.includes("/gio-hang"); // /gio-hang
var is_CV = window.location.href.includes("/order-received");

function dynamic(event, items, value) {
	dataLayer.push({
		event: "dynamic_remarketing",
		dr_event_type: event,
		dr_value: value,
		dr_items: items,
	});
}

if (is_cart) {
	// ----------------------------------------------
	// -----  Update Cart  -----
	var storage = JSON.parse(localStorage.getItem("item_storage")) || [];
	jQuery("#place_order").on("click", function () {
		var _arr = Array.from(jQuery(".removee")).map(function (e) {
			return +e.getAttribute("data-product_id");
		});
		localStorage.setItem(
			"item_storage",
			JSON.stringify(
				storage.filter(function (e) {
					return _arr.includes(e.id);
				})
			)
		);
	});
} else if (is_item) {
	// ----------------------------------------------
	// -----  View Item  -----
	dr_event_type = "view_item";
	var item = {
		id: +jQuery('[name*="add-to-cart"]').val(),
		google_business_vertical: businessType,
	};
	dr_items.push(item);
	dr_value = +jQuery(".zek_detail_head ins .amount")
		.text()
		.replace(/\D/g, "");

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

			dynamic(dr_event_type, dr_items, dr_value);
		}
	);

	dynamic(dr_event_type, dr_items, dr_value);
} else if (is_CV) {
	// ---------------------------------------------
	// -----  Purchase  -----
	dr_event_type = "purchase";
	var dr_items = JSON.parse(localStorage.getItem("item_storage"));

	localStorage.removeItem("item_storage");

	dynamic(dr_event_type, dr_items, 0);
}
