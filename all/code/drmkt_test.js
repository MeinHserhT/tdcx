var dr_items = [],
  businessType = "retail",
  is_item = document.querySelector(".section_product"),
  is_CV = window.location.href.includes("order");
function dynamic(e, t) {
  dataLayer.push({ dr_event_type: e, dr_items: t, event: "drmkt" });
}
if (is_item) {
  // ------ VIEW ITEM  ------
  var t = {
    id: document.querySelector(".remove_favourite_product_page").getAttribute("data_product_id"),
    google_business_vertical: businessType,
  };
  dr_items.push(t);
  dynamic("view_item", dr_items);
  // ------ ADD TO CART -------
  jQuery(".add_to_cart_btn, .add_to_cart_btn *").on(
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
