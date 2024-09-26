var product =
	window.location.href.includes("/ords/product") ||
	window.location.href.includes("/ords/p--");
var cartPage = window.location.href.includes("/ords/cart");

var eec_items = [];

if (product) {
	var eec_value = +$("dd>div")[0].innerText.split("\n")[0].replace(/\D/g, "");

	var eec_item = {
		item_id: $("dl>dd:nth-child(2)")[0].innerText,
		item_name: $("h1").text(),
		price: eec_value,
		affiliation: "",
		coupon: "",
		discount: 0,
		index: 0,
		item_brand: "",
		item_category: "",
		item_category2: "",
		item_category3: "",
		item_category4: "",
		item_category5: "",
		item_list_id: "",
		item_list_name: "",
		item_variant: "",
		location_id: "",
		quantity: +$("#P3_QTY")[0].value,
	};

	eec_items.push(eec_item);

	window.dataLayer = window.dataLayer || [];
	dataLayer.push({
		ecommerce: null,
	}); // Clear the previous ecommerce object.
	dataLayer.push({
		event: "view_item",
		ecommerce: {
			currency: "VND",
			value: eec_value,
			items: eec_items,
		},
	});

	$(".t-ButtonRegion-col--left .t-Button--success").on("click", function () {
		dataLayer.push({
			ecommerce: null,
		}); // Clear the previous ecommerce object.
		// Add to cart ----------------
		dataLayer.push({
			event: "add_to_cart",
			ecommerce: {
				currency: "VND",
				value: eec_value,
				items: eec_items,
			},
		});
	});
} else if (cartPage) {
	var eec_value = +$("td strong")[6].innerText.replace(/\D/g, "");

	document
		.querySelectorAll(
			'[aria-label="Giỏ hàng"] .t-Report-report tbody tr:has(img)'
		)
		.forEach(function (e) {
			var ele = e.querySelector('[headers="ITEM_NAME"] a');
			eec_items.push({
				item_name: ele.innerText.split("\n")[0],
				item_id: ele
					.querySelector("img")
					.src.match(/media\/(.*)_/)[1]
					.replace(/(\_DESKTOP)/, ""),
				quantity: +e
					.querySelector('[headers="QTY"]')
					.innerText.replace(/\D/g, ""),
				price: +e
					.querySelector('[headers="TOTAL"]')
					.innerText.replace(/\D/g, ""),
				affiliation: "",
				coupon: "",
				discount: 0,
				index: 0,
				item_brand: "",
				item_category: "",
				item_category2: "",
				item_category3: "",
				item_category4: "",
				item_category5: "",
				item_list_id: "",
				item_list_name: "",
				item_variant: "",
				location_id: "",
			});
		});

	window.dataLayer = window.dataLayer || [];
	dataLayer.push({
		ecommerce: null,
	}); // Clear the previous ecommerce object.

	// View cart -----------
	dataLayer.push({
		event: "view_cart",
		ecommerce: {
			currency: "VND",
			value: eec_value,
			items: eec_items,
		},
	});

	// Checkout -------------
	dataLayer.push({
		event: "begin_checkout",
		ecommerce: {
			currency: "VND",
			value: eec_value,
			items: eec_items,
		},
	});

	// Purchase -------------
	$('[aria-label="Buttons"] .t-Button').on("click", function () {
		var nm = $("#P6_NAME").val(),
			ph = $("#P6_MOBILE").val(),
			type =
				$("#P6_FOP_0").is(":checked") || $("#P6_FOP_1").is(":checked"),
			city = $("#P6_PROVINCE").val(),
			dist = $("#P6_DISTRICT").val(),
			add = $("#P6_ADDRESS").val();

		if (nm && ph && type && city && dist && add) {
			dataLayer.push({
				event: "purchase-eec",
				ecommerce: {
					transaction_id: new Date().getTime(),
					value: eec_value,
					currency: "VND",
					items: eec_items,
				},
			});
		}
	});
}
