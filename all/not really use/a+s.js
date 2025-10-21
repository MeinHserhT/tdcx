!(function () {
  "use strict";
  if (window.scrRun) return;
  window.scrRun = 1;
  let e = "[debug-id=phoneTakeDialog]",
    t = new Audio(
      "https://cdn.pixabay.com/audio/2025/07/18/audio_da35bc65d2.mp3"
    );
  function o(e) {
    let t = document.querySelector(e);
    t && t.click();
  }
  !(function e(t, o) {
    let c = (e) => {
        if (1 === e.nodeType) {
          e.matches(t) && o(e);
          try {
            for (let c of e.querySelectorAll(t)) c !== e && o(c);
          } catch {}
        }
      },
      l = new MutationObserver((e) => {
        for (let { addedNodes: t } of e) for (let o of t) c(o);
      });
    for (let r of (l.observe(document.body, { childList: !0, subtree: !0 }),
    document.querySelectorAll(t)))
      o(r);
    return l;
  })(e, (o) => {
    t.play().catch(console.error);
  }),
    setInterval(() => {
      o("#cdtx__uioncall--btn"),
        setTimeout(() => {
          o(".cdtx__uioncall_control-remove");
        }, 3e3);
    }, 18e3),
    console.log("%cScript run", "color: green");
})();
