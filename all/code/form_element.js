// document
// {{Form Element}}

function a() {
	var e = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
		a = {{Form Element}}.querySelector('[name="email"]').value;
	if (a.match(e)) return a;
	return "";
}

function a() {
	var e = /^(\d{3})[-]?(\d{3})[-]?(\d{4})$/,
		a = {{Form Element}}.querySelector('[name="phone"]').value;
	if (a.match(e)) return "+84" + a.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
	return "";
}

function a() {
	var e = /^(\d{3})[-]?(\d{3})[-]?(\d{4})$/,
		a = {{Form Element}}.querySelector('#form-field-field_2b6f2c6').value;
	if (a.match(e)) return "+84" + a.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
	return "";
}