var dr_event_type = "",
	dr_value = 0,
	dr_items = [],
	businessType = "retail";

var is_item = window.location.href.includes("/products");
var is_CV = window.location.href.includes("/thank_you");

function dynamic(event, items, value) {
	dataLayer.push({
		dr_event_type: event,
		dr_value: value,
		dr_items: items,
		event: "dynamic_remarketing",
	});
}
if (!is_item && !is_CV) {
	dataLayer.push({
		event: "remarketing",
	});
} else {
	if (is_item) {
		// ----------------------------------------------
		// -----  View Item  -----
		dr_event_type = "view_item";
		var items = meta.product.variants.map(function (e) {
			return { id: e.id, google_business_vertical: "retail" };
		});
		dr_items.push(items);
		dr_value = +document
			.querySelector(".pro-price")
			.innerText.replace(/\D/g, "");

		// ------------------------------------------------
		// -----  Add To Cart  -----
		jQuery("#add-to-cart, #add-to-cart *, #buy-now, #buy-now *").on(
			"click",
			function () {
				dr_event_type = "add_to_cart";
				dr_items = [
					{
						id: selectedVariant.id,
						google_business_vertical: "retail",
					},
				];
				dr_value = +jQuery(".pro-price").text().replace(/\D/g, "");

				dynamic(dr_event_type, dr_items, dr_value);
			}
		);
	} else if (is_CV) {
		// ---------------------------------------------
		// -----  Purchase  -----
		dr_event_type = "purchase";
		dr_items = Haravan.checkout.line_items.map(function (e) {
			return { id: e.id, google_business_vertical: "retail" };
		});
		dr_value = +Haravan.checkout.total_price;
	}

	dynamic(dr_event_type, dr_items, dr_value);
}
