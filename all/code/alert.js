function getAlert() {
	// get all scripts
	var elem = document.scripts;

	// loop and check
	for (var i = 0, len = elem.length; i < len; i++) {
		var txt = elem[i].textContent.match(/alert\(['"]([^'"]+)['"]\)/);
		if (txt) {
			return txt[1];
		} // if matched, return the alert text and stop
	}
}

(function () {
	var _old_alert = window.alert;
	window.alert = function () {
		// run some code when the alert pops up
		_old_alert.apply(window, arguments);
		// run some code after the alert
		dataLayer.push({
			event: "alert_success",
			msg: arguments[0],
		});
	};
})();
