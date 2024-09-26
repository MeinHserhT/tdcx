// https://jsfiddle.net/5ug0weLv/

function _gtm_tracking_purchase() {
	window.dataLayer = window.dataLayer || [];
	var e = {},
		c = "VND";
	"object" == typeof Haravan && (e = Haravan),
		"object" == typeof Bizweb &&
			((e = Bizweb), (c = BizwebAnalytics.meta.currency || c)),
		"object" == typeof Shopify &&
			((e = Shopify), (c = ShopifyAnalytics.meta.currency || c));
	var a = "";
	e.checkout.order_number && (a = e.checkout.order_number),
		e.checkout.order_id && (a = e.checkout.order_id);
	var t = {
		event: "purchase_complete",
		total_price: +e.checkout.total_price,
		transaction_id: a,
		currency: c,
		phone: e.checkout.billing_address.phone.replace(
			/^0|^(84)|^(\+84)[0]*/,
			"+84"
		),
		email: e.checkout.email,
		addrData: {
			first_name: e.checkout.billing_address.first_name,
			last_name: e.checkout.billing_address.last_name,
			country: e.checkout.billing_address.country,
			postal_code: e.checkout.billing_address.zip,
		},
	};
	e.checkout.phone && (t.phone = e.checkout.phone),
		e.checkout.email && (t.email = e.checkout.email),
		a && dataLayer.push(t);
}
_gtm_tracking_purchase();

// function a() {
// return Haravan.checkout.total_price
// }
// function a() {
// 	return Haravan.checkout.order_number;
// }
// function a() {
// 	return Haravan.checkout.billing_address.phone.replace(
// 		/^0|^(84)|^(\+84)[0]*/,
// 		"+84"
// 	);
// }
