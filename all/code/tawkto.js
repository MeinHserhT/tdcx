var Tawk_API = window.Tawk_API || {};
window.dataLayer = window.dataLayer || [];
Tawk_API.onChatStarted = function () {
	if (Tawk_API.isVisitorEngaged()) {
		window.dataLayer.push({ event: "Chat" });
	}
};
Tawk_API.onOfflineSubmit = function () {
	window.dataLayer.push({ event: "Chat" });
};
Tawk_API.onPrechatSubmit = function () {
	window.dataLayer.push({ event: "Chat" });
};
