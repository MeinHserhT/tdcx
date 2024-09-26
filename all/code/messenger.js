window.addEventListener("message", function (event) {
	var decodedData = decodeURIComponent(event.data);
	var params = new URLSearchParams(decodedData);
	var type = params.get("type");
	var state = JSON.parse(params.get("state"));
	var shouldHide = params.get("shouldHide");
	var titleText = params.get("titleText");
	var bottom = params.get("bottom");
	// Boxchat Click
	if (type == "mpn.updateGreetingAppearance" && bottom == "358px") {
		dataLayer.push({
			event: "messengerBoxOpened",
		});
	}
	// Login Page Showed
	if (type == "mpn.storeState" && state.shouldShowLoginPage == true) {
		dataLayer.push({
			event: "mesengerLoginPageShowed",
		});
	}
	// Chatbox Showed
	if (
		type == "mpn.storeState" &&
		state.chatState == 3 &&
		state.shouldShowLoginPage == false
	) {
		dataLayer.push({
			event: "messengerChatboxAppeared",
		});
	}
	// Message Replied
	if (type == "mpn.updatePageTitle" && titleText != null) {
		dataLayer.push({
			event: "ownerRepliedMessage",
			message: titleText,
		});
	}
});

// Custom Event ||     messengerBoxOpened|mesengerLoginPageShowed|messengerChatboxAppeared|ownerRepliedMessage  || Tick match Regex
