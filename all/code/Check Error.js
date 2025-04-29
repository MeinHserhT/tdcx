dataLayer.push({
  phone:
    "+84" +
    document
      .querySelector("#txtPPhone")
      .value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
});
setTimeout(function a() {
  var check = true;
  document.querySelectorAll(".msgerr").forEach(function (e) {
    if (e.innerText.includes("không")) {
      check = false;
      return check;
    }
  });
  if (check)
    dataLayer.push({
      event: "test-form",
    });
}, 500);