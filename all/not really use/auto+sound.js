!(function () {
  "use strict";
  if (window.scrRun) {
    return;
  }
  window.scrRun = 1;

  // --- 1. Setup for Element Observer ---
  function observeElement(selector, callback) {
    const checkNode = (node) => {
      if (node.nodeType !== 1) return;
      if (node.matches(selector)) callback(node);
      try {
        for (const element of node.querySelectorAll(selector)) {
          if (element !== node) callback(element);
        }
      } catch {}
    };
    const observer = new MutationObserver((mutations) => {
      for (const { addedNodes } of mutations) {
        for (const node of addedNodes) checkNode(node);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    for (const element of document.querySelectorAll(selector)) {
      callback(element);
    }
    return observer;
  }

  const dialogSelector = "[debug-id=phoneTakeDialog]";
  const soundUrl =
    "https://cdn.pixabay.com/audio/2025/07/18/audio_da35bc65d2.mp3";
  const notificationSound = new Audio(soundUrl);

  // --- MODIFIED SECTION ---
  observeElement(dialogSelector, () => {
    // 1. Play sound (your original code)
    notificationSound.play().catch(console.error);

    // 2. Attempt to focus the window (may be blocked by the browser)
    window.focus();

    // 3. Flash the tab title to reliably get attention
    const originalTitle = document.title;
    const alertMessage = ">>> ALERT!!! <<<";
    let isFlashing = true;

    const titleFlasher = setInterval(() => {
      document.title =
        document.title === originalTitle ? alertMessage : originalTitle;
    }, 1000); // Flashes every second

    // 4. Stop flashing when the user returns to the tab
    window.onfocus = () => {
      if (isFlashing) {
        isFlashing = false;
        clearInterval(titleFlasher);
        document.title = originalTitle; // Restore the original title
        window.onfocus = null; // Clean up the event listener
      }
    };
  });

  // --- 2. Setup for Auto-Clicker ---
  // function clickElement(selector) {
  //   const element = document.querySelector(selector);
  //   if (element) {
  //     element.click();
  //   }
  // }
  // setInterval(() => {
  //   clickElement("#cdtx__uioncall--btn");
  //   setTimeout(() => {
  //     clickElement(".cdtx__uioncall_control-remove");
  //   }, 3000); // 3 seconds
  // }, 18000); // 18 seconds

  // console.log("%cScript run", "color: green");
})();
