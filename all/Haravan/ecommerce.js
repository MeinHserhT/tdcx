var arr = [],
  event = "",
  curr = "VND",
  is_item_list = window.location.href.includes("/collections"),
  is_item = window.location.href.includes("/products"),
  is_CV = window.location.href.includes("/thank_you");

function eccomerce(e, v, a) {
  dataLayer.push({
    event: "eccomerce",
    eec_event: e,
    value: v,
    items: a,
    currency: curr,
  });
}

if (is_item_list) {
  e_name = "view_item_list";
  arr = [];

  document.querySelectorAll(".proLoop-wrap-info").forEach(function (e) {
    var id = e.querySelector(".js-favorites").getAttribute("data-id"),
      name = e.querySelector(".productName").innerText,
      price = +e
        .querySelector(".productPriceDel")
        .innerText.split(" - ")[0]
        .replace(/[^\d]/g, ""),
      old_price = +e
        .querySelector(".productPrice del")
        .innerText.split(" - ")[0]
        .replace(/[^\d]/g, ""),
      brand = e.querySelector(".fill-vendor").getAttribute("data-vendor") || "";

    arr.push({
      item_id: id,
      item_name: name,
      price: price,
      affiliation: "",
      coupon: "",
      discount: old_price - price || 0,
      index: 0,
      item_brand: brand,
      item_category: "",
      item_variant: "",
      location_id: "",
      quantity: 1,
    });
  });

  eccomerce(e_name, 0, arr);
} else if (is_item) {
  arr = [];
  var item = meta.product.selected_or_first_available_variant,
    old_price = +document
      .querySelector(".page-product-info-oldprice")
      .innerText.replace(/[^\d]/g, ""),
    price = +document
      .querySelector(".page-product-info-newprice")
      .innerText.replace(/[^\d]/g, ""),
    brand =
      document.querySelector(".fill-vendor").getAttribute("data-vendor") || "";

  arr.push({
    item_id: item.id,
    item_name: item.title,
    price: price,
    affiliation: "",
    coupon: "",
    discount: old_price - price,
    index: 0,
    item_brand: brand,
    item_category: "",
    item_variant: item.variant_title,
    location_id: "",
    quantity: 1,
  });
}
