function checkMobile() {
	return navigator.userAgent.match(
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
	)
		? "M"
		: "D";
}