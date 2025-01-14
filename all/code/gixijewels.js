var dr_items = [],
  businessType = "retail",
  is_item = window.location.href.includes("/products"),
  is_CV = window.location.href.includes("/thank_you");

function dynamic(e, t) {
  dataLayer.push({ dr_event_type: e, dr_items: t, event: "drmkt" });
}

if (is_item) {
  // ------------------------
  // ------ VIEW ITEM  ------
  // ------------------------
  var items = {
    id: meta.product.variants[0].sku,
    google_business_vertical: businessType,
  };

  dr_items.push(items);
  dynamic("view_item", dr_items);
  // --------------------------
  // ------ ADD TO CART -------
  // --------------------------
  jQuery("#add-to-cart, #add-to-cart *, #buy-now, #buy-now *").on(
    "click",
    dynamic("add_to_cart", dr_items)
  );
} else if (is_CV) {
  // -----------------------
  // ------ PURCHASE -------
  // -----------------------
  dr_items = Haravan.checkout.line_items.map(function (e) {
    return { id: e.sku, google_business_vertical: businessType };
  });
  dynamic("purchase", dr_items);
} else dataLayer.push({ event: "rmkt" });
