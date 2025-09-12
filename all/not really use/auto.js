!(function () {
  function c(c) {
    let l = document.querySelector(c);
    l && l.click();
  }
  setInterval(() => {
    c("#cdtx__uioncall--btn"),
      setTimeout(() => {
        c(".cdtx__uioncall_control-remove");
      }, 3e3);
  }, 18e3),
    console.log("Auto-click script is running.");
})();
