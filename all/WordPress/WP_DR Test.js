var businessType = "retail";
var currentUrl = window.location.href;

var is_item = jQuery(".product-cart");
var is_cart = currentUrl.indexOf("/gio-hang") > -1;
var is_cv = currentUrl.indexOf("order-received") > -1;

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

if (is_cv) {
    var purchaseItems = getStorageItems();

    pushDynamicRemarketing("purchase", purchaseItems);
    localStorage.removeItem("dr_item_storage");
} else if (is_item) {
    var productId = jQuery("#product-sku p").text().trim();
    var productName = jQuery(".item-name").text().trim();
    var productVal = +jQuery("#span-price").text().replace(/[^\d]/g, "");

    if (productId) {
        var item = {
            id: productId,
            name: productName,
            price: productVal,
            google_business_vertical: businessType,
        };

        pushDynamicRemarketing("view_item", [item]);

        jQuery('[name="add-to-cart"], [name="add-to-cart"] *').on(
            "click",
            function () {
                var cartStore = getStorageItems();
                cartStore.push(item);
                localStorage.setItem(
                    "dr_item_storage",
                    JSON.stringify(cartStore)
                );
                pushDynamicRemarketing("add_to_cart", [item]);
            }
        );
    }
} else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "rmkt" });
}
