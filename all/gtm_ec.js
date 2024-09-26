function _GTM_EC() {
	var _obj = {};
	if ((elm = document.querySelector("input[name=billing_email]"))) {
		if (elm.value.trim() && elm.value.includes("@")) {
			_obj.email = elm.value;
		}
	}
	if ((elm = document.querySelector("input[name=billing_phone]"))) {
		var _phone = ("" + elm.value).replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
		if (_phone.length == 9) _obj.phone_number = "+84" + _phone;
	}
	if (_obj.phone_number || _obj.email) {
		console.log("_obj", _obj);
		return _obj;
	}
	return "NG";
}
