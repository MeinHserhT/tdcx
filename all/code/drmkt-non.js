var dr_items = [],
  businessType = "travel",
  is_item = document.querySelector(".destination-image");

function dynamic(e, t) {
  dataLayer.push({ dr_event_type: e, dr_items: t, event: "drmkt" });
}
if (is_item) {
  // ------ VIEW ITEM  ------
  var ori = document.querySelector(
      "#tourInfo div:nth-child(1) div.ms-2 span"
    ).innerText,
    dest = document.querySelector(".tours-info > div > .shadow-sm.p-3 > div.pt-3 > a").href.split("tourname=")[1];

  item = [
    {
      origin: ori,
      destination: dest,
      google_business_vertical: businessType,
    },
  ];
  dr_items.push(item);
  dynamic("view_item", dr_items);
  // ------ ADD TO CART -------
  jQuery(
    ".position-sticky a[href*=request-quote], .position-sticky a[href*=request-quote] *"
  ).on("click", function () {
    dynamic("add_to_cart", dr_items);
  });
} else dataLayer.push({ event: "rmkt" });

// thankyouModal
// comfirmModal
