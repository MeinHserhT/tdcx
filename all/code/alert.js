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
    if (arguments[0].includes("Success"))
		dataLayer.push({
			event: "alert_success",
			msg: arguments[0],
		});
	};
})();
// -----------------------------------------------------------------------------

var onElmClick = function (elm_str, callBack) {
  document.addEventListener("click", function (event) {
    if (event.target.closest(elm_str)) {
      callBack(event);
    }
  });
};

var _btn = null;
onElmClick(
  ".fusion-form-5631 [type=submit], .fusion-form-3270 [type=submit]",
  function (e) {
    _btn = e.target;
    var email = "";
    var _parent = _btn.closest("form");
    if (_parent) {
      var _input = null;
      // Email
      if ((_input = _parent.querySelector('[type="email"]'))) {
        if (_input.value) {
          email = _input.value;
        }
      }
    }
    dataLayer.push({
      event: "formsubmission",
      email: email,
    });
  }
);
