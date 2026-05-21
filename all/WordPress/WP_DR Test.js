(function ($) {
    "use strict";

    var businessType = "retail";
    var currentUrl = window.location.href;

    var is_item = currentUrl.indexOf("/san-pham") > -1;
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
        var productId = $(".btn-muanhanh").attr("data-id");
        var productName = $(".py-60 h1").text().trim();

        if (productId) {
            var item = {
                id: String(productId),
                name: productName,
                google_business_vertical: businessType,
            };

            pushDynamicRemarketing("view_item", [item]);

            $(".single_add_to_cart_button, .btn-muanhanh, .btn-muanhanh *").on(
                "click",
                function () {
                    var cartStore = getStorageItems();
                    var exists = cartStore.some(function (el) {
                        return el.id === item.id;
                    });
                    if (!exists) {
                        cartStore.push(item);
                        localStorage.setItem(
                            "dr_item_storage",
                            JSON.stringify(cartStore)
                        );
                    }
                    pushDynamicRemarketing("add_to_cart", [item]);
                }
            );
        }
    } else if (is_cart) {
        $("#pagecart").on("click", '[onclick*="deleteqty"]', function () {
            var $button = $(this);
            var cartStore = getStorageItems();
            var $itemCard = $button.closest(".card");
            var removedName = $itemCard.find("h3 a.grow").text().trim();

            if (removedName) {
                var updatedCart = cartStore.filter(function (storedItem) {
                    return !removedName
                        .toLowerCase()
                        .includes(storedItem.name.toLowerCase());
                });

                if (updatedCart.length === 0) {
                    localStorage.removeItem("dr_item_storage");
                } else {
                    localStorage.setItem(
                        "dr_item_storage",
                        JSON.stringify(updatedCart)
                    );
                }
            }
        });
        $(document).ready(function () {
            setTimeout(function () {
                var remainingTitles = [];
                $("#pagecart h3 a.grow").each(function () {
                    remainingTitles.push($(this).text().trim());
                });

                if (remainingTitles.length === 0) {
                    localStorage.removeItem("dr_item_storage");
                } else {
                    var storedCart = getStorageItems();
                    var filteredCart = storedCart.filter(function (storedItem) {
                        return remainingTitles.some(function (title) {
                            return title
                                .toLowerCase()
                                .includes(storedItem.name.toLowerCase());
                        });
                    });
                    localStorage.setItem(
                        "dr_item_storage",
                        JSON.stringify(filteredCart)
                    );
                }
            }, 800);
        });
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
})(jQuery);
