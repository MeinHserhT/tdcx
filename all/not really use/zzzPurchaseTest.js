 (function () {
  var originalFetch = window.fetch;
  window.fetch = function () {
    var args = arguments;
    return originalFetch.apply(window, args).then(function (response) {
      if (response.ok) {
        response
          .clone()
          .text()
          .then(function (data) {
            try {
              if (typeof data === "string" && data.trim() !== "") {
                var jsonData = JSON.parse(data);
                var paymentStatus = jsonData.payment_result.payment_status;
                if (paymentStatus === "success") {
                  window.phonePurchase = jsonData.billing_address.phone.replace(
                    /(0|84|^\+84)/,
                    "+84"
                  );
                  window.emailPurchase = jsonData.billing_address.email;

                  window.dataLayer = window.dataLayer || [];
                  window.dataLayer.push({
                    event: "order-received",
                    transaction_id: jsonData.order_number,
                    phone: window.phonePurchase,
                    email: window.emailPurchase,
                    value: parseFloat(
                      document
                        .querySelector(
                          ".wc-block-components-order-summary-item__total-price"
                        )
                        .textContent.replace(/[^\d]/g, "")
                    ),
                  });
                }
              } else {
                console.error(
                  "Dữ liệu không phải chuỗi hợp lệ hoặc chuỗi rỗng"
                );
              }
            } catch (error) {
              console.error("Lỗi khi parse JSON: ", error);
            }
          });
      }
      return response;
    });
  };
})();