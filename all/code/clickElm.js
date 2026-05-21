var onElmClick = function (elm_str, callBack) {
    document.addEventListener("click", function (event) {
        if (event.target.closest(elm_str)) {
            callBack(event);
        }
    });
};

onElmClick("[type=submit]", function (e) {
    var _btn = e.target.closest("[type=submit]");
    var _parent = _btn.closest("form");
    var phone = "";
    console.log("a");
    if (_parent) {
        var _input = _parent.querySelector('[name="phone"]');
        if (_input && _input.value) {
            phone = _input.value;
        }
    }

    // Push to dataLayer safely
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: "form_submit_click", // Good practice to include an event name
        phone: phone,
    });
});
