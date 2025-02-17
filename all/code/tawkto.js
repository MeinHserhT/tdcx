var Tawk_API = Tawk_API || {},
  Tawk_LoadStart = new Date();
(function () {
  var s1 = document.createElement("script"),
    s0 = document.getElementsByTagName("script")[0];
  s1.async = true;
  s1.src = "https://embed.tawk.to/5cc27f52ee912b07bec4eabf/default";
  s1.charset = "UTF-8";
  s1.setAttribute("crossorigin", "*");
  s0.parentNode.insertBefore(s1, s0);
})();

// Day su kien tawk.to từ API tawk.to thong qua GTM

var dataLayerPush = function (event) {
  dataLayer.push({
    event: "tawk.to",
    eventAction: event,
  });
  console.log({
    event: "tawk.to",
    eventAction: event,
  });
};

Tawk_API.onChatStarted = function () {
  dataLayerPush("Chat Started");
};
Tawk_API.onPrechatSubmit = function (data) {
  dataLayerPush("Prechat form submitted");
};
Tawk_API.onOfflineSubmit = function (data) {
  dataLayerPush("Offline Chat submit");
};

