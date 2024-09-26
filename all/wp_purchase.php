// woocommerce_thankyou
add_action('woocommerce_order_details_after_order_table', 'gtm_send_purchaseinfo', 10, 1);
add_action('woocomwoocommerce_order_items_tablemerce_thankyou', 'gtm_send_purchaseinfo', 10, 1);
// add_action('woocommerce_thankyou_order_received_text', 'gtm_send_purchaseinfo', 10, 1);
add_action('woocommerce_thankyou', 'gtm_send_purchaseinfo', 10, 1);
add_action('woocommerce_before_thankyou', 'gtm_send_purchaseinfo', 10, 1);

function gtm_send_purchaseinfo($order_id)
{  
	// Check order detail function isset with order id
	$order = wc_get_order($order_id);
	if(!method_exists($order, 'get_data')) return false;
	
	// Once display
	if(isset($GLOBALS['_ONCE_SHOW'])) {
		if($GLOBALS['_ONCE_SHOW'] > 0) return false; 
	}    
	$GLOBALS['_ONCE_SHOW'] = 1;

	// Start
	$order_data = $order->get_data();
	$currency = 'VND';

	$email = $order_data['billing']['email'];
	$phone = $order_data['billing']['phone'];


	echo '<script>
	var transaction_id = "' . $order_id . '";
	var revenue = parseFloat("' . $order->get_total() . '");
	var email = "'. $email .'";
	var phone = "'. $phone .'";
	var currency = "'. $currency .'";

	// conversion
	window.dataLayer = window.dataLayer || [];

	dataLayer.push({
		"event": "purchase_woo",
		"value": revenue,
		"transaction_id": transaction_id,
		"currency": currency,
		"email": email,
		"phone": phone,
	});
	</script>';
}