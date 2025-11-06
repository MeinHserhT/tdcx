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
})()
var dataLayerPush = function (event) {
  dataLayer.push({
    event: "tawkto",
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

var Tawk_API = window.Tawk_API || {};
Tawk_API.onChatStarted = function (data) {
  if (Tawk_API.isVisitorEngaged()) {
    window.dataLayer.push({ event: "tawkto", data: data });
  }
};
Tawk_API.onOfflineSubmit = function (data) {
  window.dataLayer.push({ event: "tawkto", data: data });
};
Tawk_API.onPrechatSubmit = function (data) {
  window.dataLayer.push({
    event: "tawkto",
    data: data,
  });
};
