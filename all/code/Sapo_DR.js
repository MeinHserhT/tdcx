var dr_event_type = "",
	dr_value = 0,
	dr_items = [],
	businessType = "retail";

var is_item = jQuery(".details-product").length; // details-product
var is_CV = window.location.href.includes("/thankyou");

if (!is_item && !is_CV) {
	dataLayer.push({
		event: "remarketing",
	});
} else {
	if (is_item) {
		// ----------------------------------------------
		// -----  View Item  -----
		dr_event_type = "view_item";
		var item = {
			id: +variant_id_pro,
			google_business_vertical: businessType,
		};
		dr_items.push(item);
		dr_value = +document
			.querySelector(".product-price")
			.innerText.replace(/\D/g, "");

		// ------------------------------------------------
		// -----  Add To Cart  -----
		jQuery(".add_to_cart").on("click", function () {
			dr_event_type = "add_to_cart";

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
		dr_items = Bizweb.checkout.line_items.map(function (e) {
			return { id: e.variant_id, google_business_vertical: businessType };
		});
		dr_value = +Bizweb.checkout.total_price;
	}

	dataLayer.push({
		dr_event_type: dr_event_type,
		dr_value: dr_value,
		dr_items: dr_items,
		event: "dynamic_remarketing",
	});
}
