document.querySelectorAll("form-embed").forEach(function (e) {
	e.shadowRoot
		.querySelector("button[type=submit]")
		.addEventListener("click", function () {
			console.log("a");
		});
});
