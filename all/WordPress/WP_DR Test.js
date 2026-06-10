var businessType = "retail";
var currentUrl = window.location.href;

var is_item = jQuery(".akia-product-header");
var is_cart = currentUrl.indexOf("/gio-hang") > -1;
var is_cv = currentUrl.indexOf("/order-received/") > -1;

function pushDynamicRemarketing(eventType, itemsArray) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: "drmkt",
        dr_event_type: eventType,
        dr_items: itemsArray,
    });
}

function getStorageItems() {
    return JSON.parse(localStorage.getItem("dr_item_storage")) || [];
}

// --- PAGE LOGIC ---
if (is_item) {
    var productId = jQuery('[name*="add-to-cart"]').val();
    var productName = jQuery(".product_title").text().trim();
    var productVal = jQuery(".summary ins .amount")
        .text()
        .replace(/[^\d]/g, "");

    if (productId) {
        var item = {
            id: String(productId),
            name: productName,
            price: productVal,
            quantity: 1,
            google_business_vertical: businessType,
        };

        pushDynamicRemarketing("view_item", [item]);

        jQuery(
            ".akia-btn-buy-now, .akia-btn-buy-now *,.akia-add-cart-link, .akia-add-cart-link *"
        ).on("click", function () {
            var cartStore = getStorageItems();

            // Find if the item already exists in the cart array
            var existingItemIndex = cartStore.findIndex(function (el) {
                return el.id === item.id;
            });

            if (existingItemIndex > -1) {
                // Item exists: parse current quantity (fallback to 1) and increment
                var currentQty =
                    parseInt(cartStore[existingItemIndex].quantity, 10) || 1;
                cartStore[existingItemIndex].quantity = currentQty + 1;
            } else {
                // Item does not exist: add it to the cart store
                cartStore.push(item);
            }

            // Update local storage with the new cart store data
            localStorage.setItem("dr_item_storage", JSON.stringify(cartStore));

            // Push the event to the dataLayer (keeps quantity as 1 for the specific add_to_cart action)
            pushDynamicRemarketing("add_to_cart", [item]);
        });
    }
} else if (is_cv) {
    var purchaseItems = getStorageItems();
    if (purchaseItems && purchaseItems.length > 0) {
        pushDynamicRemarketing("purchase", purchaseItems);
        localStorage.removeItem("dr_item_storage");
    } else {
        pushDynamicRemarketing("purchase", [
            { google_business_vertical: businessType },
        ]);
    }
} else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "rmkt" });
}
