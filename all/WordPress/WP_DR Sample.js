var dr_items = [],
  businessType = "retail",
  is_item = window.location.href.includes("/san-pham"), // /product
  // is_item = document.querySelector(".pro-info"),
  is_cart = window.location.href.includes("/cart"), // /gio-hang
  is_CV = window.location.href.includes("/order-received");
function dynamic(e, t) {
  dataLayer.push({ dr_event_type: e, dr_items: t, event: "drmkt" });
}
if (is_cart) {
  // ------ UPDATE CART  ------
  var e = JSON.parse(localStorage.getItem("item_storage")) || [];
  jQuery('a[class*="checkout"]').on("click", function () {
    var t = Array.from(document.querySelectorAll(".product-remove a")).map(
      function (e) {
        return +e.getAttribute("data-product_id");
      }
    );
    localStorage.setItem(
      "item_storage",
      JSON.stringify(
        e.filter(function (e) {
          return t.includes(e.id);
        })
      )
    );
  });
} else if (is_item) {
  // ------ VIEW ITEM  ------
  var t = {
    id: +jQuery('[name*="add-to-cart"]').val(),
    google_business_vertical: businessType,
  };
  dr_items.push(t);
  dynamic("view_item", dr_items);
  // ------ ADD TO CART -------
  jQuery(
    'button[class*="add_to_cart"], button[class*="add_to_cart"] *, .devvn_buy_now, .devvn_buy_now *'
  ).on("click", function () {
    var store = JSON.parse(localStorage.getItem("item_storage")) || [];
    store.push(t);
    localStorage.setItem("item_storage", JSON.stringify(store));
    dynamic("add_to_cart", dr_items);
  });
} else if (is_CV) {
  // ------ PURCHASE -------
  var dr_items = JSON.parse(localStorage.getItem("item_storage"));
  dynamic("purchase", dr_items);
  localStorage.removeItem("item_storage");
} else dataLayer.push({ event: "rmkt" });
