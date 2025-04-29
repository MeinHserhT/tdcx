var dr_items = [],
  businessType = "retail",
  is_item = document.querySelector(".product-main"), 
  is_CV = window.location.href.includes("/order-received");
function dynamic(e, t) {
  dataLayer.push({ dr_event_type: e, dr_items: t, event: "drmkt" });
}
if (is_item) {
  // ------ VIEW ITEM  ------
  var t = {
    id: window.location.href.split('/').pop(),
    google_business_vertical: businessType,
  };
  dr_items.push(t);
  dynamic("view_item", dr_items);
  // ------ ADD TO CART -------
  jQuery('button[class*="add_to_cart"], button[class*="add_to_cart"] *, [name=ux-buy-now], [name=ux-buy-now] *').on(
    "click",
    function () {
      var store = JSON.parse(localStorage.getItem("item_storage")) || [];
      store.push(t);
      localStorage.setItem("item_storage", JSON.stringify(store));
      dynamic("add_to_cart", dr_items);
    }
  );
} else if (is_CV) {
  // ------ PURCHASE -------
  var dr_items = JSON.parse(localStorage.getItem("item_storage"));
  dynamic("purchase", dr_items);
  localStorage.removeItem("item_storage");
} else dataLayer.push({ event: "rmkt" });
