(function () {
  function autoClickElementById(elementId) {
    const elementToClick = document.getElementById(elementId);

    if (elementToClick) {
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });

      elementToClick.dispatchEvent(clickEvent);
    }
  }

  function autoClickElementByClass(className) {
    const elementToClick = document.querySelector(`.${className}`);
    if (elementToClick) {
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      elementToClick.dispatchEvent(clickEvent);
    }
  }

  setInterval(() => {
    autoClickElementById("cdtx__uioncall--btn");
    setTimeout(() => {
      autoClickElementByClass("cdtx__uioncall_control-remove");
    }, 3000);
  }, 20000);
})();
