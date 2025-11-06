window.location.href.includes("cases.connect")
    ? (function () {
          if (window.scrRun) return;
          function t(t) {
              document.querySelector(t)?.click();
          }
          function e() {
              t('[debug-id="dock-item-home"]'),
                  setTimeout(() => {
                      t(".li-popup_lstcasefl");
                  }, 500);
          }
          async function n() {
              let t = new Audio(
                  "https://cdn.pixabay.com/audio/2025/07/18/audio_da35bc65d2.mp3"
              );
              await t.play(), window.focus();
          }
          window.scrRun = 1;
          let i = {
                  zIndex: "10",
                  padding: "12px 16px",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                  transition:
                      "background-color 0.3s ease, transform 0.1s ease, box-shadow 0.1s ease",
              },
              o = {
                  intervalId: null,
                  isOn: !1,
                  button: null,
                  CLICK_INTERVAL: 18e3,
                  REMOVE_DELAY: 3e3,
                  start() {
                      !this.intervalId &&
                          ((this.isOn = !0),
                          (this.intervalId = setInterval(() => {
                              t("#cdtx__uioncall--btn"),
                                  setTimeout(() => {
                                      t(".cdtx__uioncall_control-remove");
                                  }, this.REMOVE_DELAY);
                          }, this.CLICK_INTERVAL)),
                          this.button &&
                              ((this.button.textContent = "ON"),
                              (this.button.style.backgroundColor = "#77DD77")));
                  },
                  stop() {
                      this.intervalId &&
                          (clearInterval(this.intervalId),
                          (this.intervalId = null),
                          (this.isOn = !1),
                          this.button &&
                              ((this.button.textContent = "OFF"),
                              (this.button.style.backgroundColor = "#FF746C")));
                  },
                  toggle() {
                      this.isOn ? this.stop() : this.start();
                  },
                  createButton(t) {
                      (this.button = document.createElement("button")),
                          (this.button.id = "auto-btn"),
                          Object.assign(this.button.style, i, {
                              backgroundColor: "#FF746C",
                              fontSize: "14px",
                          }),
                          (this.button.textContent = "OFF"),
                          this.button.addEventListener(
                              "click",
                              this.toggle.bind(this)
                          ),
                          t.appendChild(this.button);
                  },
              };
          !(function t() {
              !(function t(e, n) {
                  let i = new MutationObserver((t) => {
                      for (let i of t)
                          for (let o of i.addedNodes)
                              1 === o.nodeType &&
                                  (o.matches(e) && n(o),
                                  o.querySelectorAll(e).forEach(n));
                  });
                  return (
                      i.observe(document.body, { childList: !0, subtree: !0 }),
                      document.querySelectorAll(e).forEach(n),
                      i
                  );
              })("[debug-id=phoneTakeDialog]", n);
              let a = (function t() {
                  let e = document.createElement("div");
                  return (
                      (e.id = "script-button-container"),
                      Object.assign(e.style, {
                          position: "fixed",
                          bottom: "16px",
                          left: "16px",
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                      }),
                      document.body.appendChild(e),
                      e
                  );
              })();
              !(function t() {
                  let e = "cases-connect-styles";
                  if (document.getElementById(e)) return;
                  let n = `
                /* Target all buttons inside your container */
                [id='script-button-container'] button:hover {
                    opacity: 0.9; /* A simple hover effect */
                }
        
                [id='script-button-container'] button:active {
                    transform: scale(0.96); /* The "click" effect */
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2); /* Smaller shadow on click */
                }
            `,
                      i = document.createElement("style");
                  (i.id = e), (i.textContent = n), document.head.appendChild(i);
              })(),
                  o.createButton(a),
                  (function t(n) {
                      let o = document.createElement("button");
                      (o.id = "follow-up-btn"),
                          (o.title = "Click Follow-up Item"),
                          (o.style.position = "relative"),
                          Object.assign(o.style, i, {
                              padding: "10px 12px",
                              backgroundColor: "#A2BFFE",
                              fontSize: "16px",
                              lineHeight: "0",
                          }),
                          (o.innerHTML = `
                <img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 20px; height: 20px; vertical-align: middle;">
                <span id="follow-up-badge" style="
                    display: none; 
                    position: absolute; 
                    top: -5px; 
                    right: -5px; 
                    background: red; 
                    color: white; 
                    font-size: 10px; 
                    font-weight: bold; 
                    border-radius: 50%; 
                    padding: 2px 5px; 
                    line-height: 1;
                "></span>
            `),
                          o.addEventListener("click", e),
                          n.appendChild(o);
                  })(a),
                  (function t() {
                      let e = document.getElementById("follow-up-badge"),
                          n = document.querySelector(".li-popup_lstcasefl");
                      if (n && e) {
                          let i = n.dataset.attr;
                          (e.textContent = i), (e.style.display = "block");
                      }
                  })();
          })();
      })()
    : window.location.href.includes("casemon2.corp")
    ? (function () {
          if (window.dashRun) return;
          window.dashRun = 1;
          let t = "https://cdn-icons-png.flaticon.com/512";
          new (class e {
              #a = {
                  AGENT_TABLE_SELECTOR: ".agent-table-container",
                  UI_CONTAINER_ID: "agent_ui",
                  STYLE_ID: "agent-dash-styles",
                  PRIOR: {
                      active: 1,
                      phone: 2,
                      "lunch-break": 3,
                      email: 4,
                      "coffee-break": 5,
                      break: 6,
                      default: 99,
                  },
                  ICONS: {
                      "coffee-break": {
                          src: t + "/2935/2935413.png",
                          animation: "wiggle",
                      },
                      "lunch-break": {
                          src: t + "/4252/4252424.png",
                          animation: "pulse",
                      },
                      phone: {
                          src: t + "/1959/1959283.png",
                          animation: "wiggle",
                      },
                      email: {
                          src: t + "/15781/15781499.png",
                          animation: "slide",
                      },
                      break: {
                          src: t + "/2115/2115487.png",
                          animation: "wiggle",
                      },
                      close: t + "/9403/9403346.png",
                  },
              };
              #b = null;
              #c = null;
              #d = null;
              #e = null;
              #f = null;
              constructor() {
                  (this.#c = this.#g()),
                      (this.#e = document.querySelector(
                          this.#a.AGENT_TABLE_SELECTOR
                      )),
                      (this.#f = window.trustedTypes.createPolicy(
                          "agent-dash-policy",
                          { createHTML: (t) => t }
                      )),
                      this.#h(),
                      this.#i(),
                      this.#j(),
                      console.log(
                          "%cAgent Dashboard Initialized",
                          "color: blue; font-weight: bold;"
                      );
              }
              #g() {
                  return document
                      .querySelector("[alt='profile photo']")
                      ?.src?.match(/\/([^\/]+)\?/)?.[1];
              }
              #i() {
                  let n = document.getElementById(this.#a.UI_CONTAINER_ID);
                  n ||
                      (((n = document.createElement("div")).id =
                          this.#a.UI_CONTAINER_ID),
                      document.body.appendChild(n)),
                      (this.#d = n),
                      this.#d.addEventListener("click", (t) => {
                          t.target.closest(".close-btn") && this.#k();
                      });
              }
              #j() {
                  (this.#b = new MutationObserver(this.#l.bind(this))),
                      this.#b.observe(this.#e, {
                          attributes: !0,
                          childList: !0,
                          subtree: !0,
                          characterData: !0,
                      }),
                      this.#l();
              }
              #k() {
                  this.#d && (this.#d.style.display = "none"),
                      this.#b && this.#b.disconnect(),
                      (window.dashRun = 0);
              }
              #m() {
                  this.#d && (this.#d.style.display = "flex");
              }
              #n() {
                  let i = this.#e.querySelectorAll("tbody tr");
                  return Array.from(i, (t) => {
                      let e = t.querySelectorAll("td");
                      if (e.length < 9) return null;
                      let n = (
                          e[5].innerText.match(/([a-zA-Z\s]+)/g)?.[0] ?? ""
                      )
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, "-");
                      return {
                          imgSrc: t.querySelector("img").src,
                          agentLdap: e[1].innerText,
                          auxCode: e[3].innerText,
                          timeSpent: e[4].innerText,
                          phoneCapacity: n,
                          lastChange: e[8].innerText.trim(),
                          lastChangeInSec: this.#o(e[8].innerText),
                      };
                  }).filter(Boolean);
              }
              #p(o) {
                  let a = o.auxCode,
                      r;
                  return (
                      "Active" === o.auxCode && "busy" === o.phoneCapacity
                          ? ((a = "Break"), (r = "break"))
                          : (r = o.auxCode.toLowerCase().replace(/\s+/g, "-")),
                      {
                          ...o,
                          processedAuxCode: a,
                          statusKey: r,
                          cssClass: `stt-${r}`,
                      }
                  );
              }
              #q(l) {
                  let { PRIOR: s } = this.#a;
                  return l.sort((t, e) => {
                      let n = s[t.statusKey] ?? s.default,
                          i = s[e.statusKey] ?? s.default;
                      return (
                          (e.agentLdap === this.#c) -
                              (t.agentLdap === this.#c) ||
                          n - i ||
                          e.lastChangeInSec - t.lastChangeInSec
                      );
                  });
              }
              #l() {
                  let c = this.#n(),
                      d = c.map(this.#p.bind(this)),
                      p = this.#q(d),
                      u = p.map(this.#r).join(""),
                      h = this.#s(),
                      g = `
                  <div class="ui-content-wrapper">
                    ${h}
                    <div class="ui-table">${u}</div>
                  </div>`;
                  (this.#d.innerHTML = this.#f.createHTML(g)), this.#m();
              }
              #r = (t) => {
                  let [e, n] = [t.lastChange, t.timeSpent],
                      i = this.#t(t.statusKey),
                      o = `Avatar for ${t.agentLdap}`;
                  return `
                <div class="tr ${t.cssClass}">
                  <div class="td left">
                    <img src="${t.imgSrc}" alt="${o}" />
                    <p>${t.agentLdap}</p>
                  </div>
                  <div class="td right">
                    <div>
                      <p>${e} <span>(${n})</span></p>
                      <p>${t.processedAuxCode}</p> 
                    </div>
                    ${i}
                  </div>
                </div>`;
              };
              #t(b) {
                  let $ = this.#a.ICONS[b];
                  return $
                      ? `<img src="${$.src}" animation="${$.animation}" alt="${b} icon"/>`
                      : "";
              }
              #s() {
                  return `<button class="close-btn" title="Close">
                        <img src="${this.#a.ICONS.close}" alt="Close"/>
                      </button>`;
              }
              #o(f) {
                  let m = f.match(/(\d+)(h|m|s)/g) ?? [],
                      x = { h: 3600, m: 60, s: 1 };
                  return m.reduce((t, e) => {
                      let n = parseInt(e, 10),
                          i = e.slice(-1);
                      return t + n * (x[i] ?? 0);
                  }, 0);
              }
              #h() {
                  let y = `
                #${this.#a.UI_CONTAINER_ID} { 
                  position: fixed; height: 100%; width: 100%; top: 0; right: 0; 
                  background-color: rgba(0,0,0,0.1); z-index: 999; 
                  display: flex; justify-content: flex-end; align-items: center; 
                  padding: 20px;
                  font-family: 'Noto Serif', serif; pointer-events: none; 
                  box-sizing: border-box;
                }
                .ui-content-wrapper { 
                  position: relative; 
                  pointer-events: auto; 
                  width: 100%;
                  max-width: 400px;
                }
                .close-btn { 
                  position: absolute; top: 0; right: 0;
                  transform: translate(40%, -40%); border: none; cursor: pointer;
                  z-index: 10; background: rgba(0, 0, 0, 0); transition: transform 0.2s ease; 
                }
                .close-btn:hover { transform: translate(40%, -40%) scale(1.4); }
                .ui-table { 
                  display: grid; grid-template-columns: repeat(2, 1fr); 
                  width: 100%;
                  border-radius: 12px; 
                  overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); 
                }
                .ui-table .tr { display: contents; }
                .ui-table .td { 
                  padding: 8px 12px; display: flex; align-items: center; 
                  transition: background-color 0.4s ease, transform 0.2s ease; 
                }
                .ui-table .left { 
                  justify-content: flex-start; 
                  font-weight: 500; 
                  font-size: clamp(12px, 4vw, 16px); 
                }
                .ui-table .right { 
                  justify-content: flex-end; 
                  text-align: right; 
                  font-size: clamp(10px, 3.5vw, 14px); 
                }
                .ui-table .td { background-color: #F8F9FA; color: #495057; }
                .ui-table .tr.stt-active .td { background-color: #E6F4EA; color: #1E8449; }
                .ui-table .tr.stt-phone .td { background-color: #FEC7C0; color: #C0392B; }
                .ui-table .tr.stt-email .td { background-color: #ace0fe; color: #1d8fdcff; }
                .ui-table .tr.stt-coffee-break .td { background-color: #D2A993; color: #685347; }
                .ui-table .tr.stt-lunch-break .td { background-color: #FFEA99; color: #E58732; }
                .ui-table .tr.stt-break .td { background-color: #e9ecef; color: #495057; } /* Added style for 'break' */
                .ui-table .tr:hover .td { transform: scale(1.05); z-index: 5; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .ui-table .td p { padding: 0 6px; margin: 1px 0; }
                .ui-table .td span { opacity: 0.6; font-size: 0.9em; }
                img { border-radius: 12px; width: 36px; height: 36px; padding: 4px; object-fit: cover; }
                .close-btn img { width: 20px; height: 20px; }
                [animation="pulse"] { animation: pulse 2s infinite ease-in-out; }
                @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
                [animation="wiggle"] { animation: wiggle 0.9s infinite; }
                @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 15%, 45%, 75% { transform: rotate(8deg); } 30%, 60% { transform: rotate(-8deg); } }
                [animation="slide"] { animation: slide-lr 1.2s infinite alternate ease-in-out; }
                @keyframes slide-lr { from { transform: translateX(0); } to { transform: translateX(8px); } }
                @media (max-width: 350px) {
                    .ui-table .right img[alt*="icon"] {
                        display: none;
                    }
                }
                @media (max-width: 280px) {
                    .ui-table .left img[alt*="Avatar"] {
                        display: none;
                    }
                }
                @media (max-width: 240px) {
                    .ui-table .right span {
                        display: none;
                    }
                }
              `,
                      C =
                          document.getElementById(this.#a.STYLE_ID) ||
                          document.createElement("style");
                  (C.id = this.#a.STYLE_ID),
                      (C.innerHTML = this.#f.createHTML(y)),
                      document.head.appendChild(C);
              }
          })();
      })()
    : window.location.href.includes("adwords.corp") &&
      (function () {
          function t({
              element: t,
              textToCopy: e,
              title: n = "Click to copy",
              successText: i,
              successBg: o = "#007bff",
              successColor: a = "white",
              timeout: r = 800,
          }) {
              (t.style.cursor = "pointer"),
                  (t.style.userSelect = "none"),
                  (t.title = n),
                  t.dataset.copyListenerAdded ||
                      ((t.dataset.copyListenerAdded = !0),
                      t.addEventListener("click", (n) => {
                          n.preventDefault(),
                              n.stopPropagation(),
                              navigator.clipboard.writeText(e).then(() => {
                                  let e = t.style.backgroundColor,
                                      n = t.style.color,
                                      l = t.textContent;
                                  (t.style.backgroundColor = o),
                                      (t.style.color = a),
                                      i && (t.textContent = i),
                                      setTimeout(() => {
                                          (t.style.backgroundColor = e),
                                              (t.style.color = n),
                                              i && (t.textContent = l);
                                      }, r);
                              });
                      }));
          }
          function e(t) {
              var e = null,
                  n = null;
              return (
                  1 == t[11] &&
                      ((e = "Ads Conversion: "),
                      (n = t[64]?.[2]?.[4]?.split("'")?.[7]?.split("/")?.[1])),
                  32 == t[11] &&
                      ((e = "GA4: "), (n = t[64]?.[1]?.[4]?.split("'")?.[3])),
                  { type_cv: e, label_event: n }
              );
          }
          let n = {
                  backgroundColor: "rgb(255, 229, 180)",
                  borderRadius: "10px",
                  fontWeight: "500",
              },
              i = {
                  backgroundColor: "rgb(160, 251, 157)",
                  borderRadius: "10px",
                  fontWeight: "500",
              },
              o = 0;
          function a() {
              "undefined" != typeof conversions_data &&
              conversions_data.SHARED_ALL_ENABLED_CONVERSIONS
                  ? (function o() {
                        var a;
                        let r =
                            conversions_data.SHARED_ALL_ENABLED_CONVERSIONS.match(
                                /AW-(\d*)/
                            )[1];
                        document
                            .querySelectorAll(".expand-more")
                            .forEach((t) => {
                                t.click();
                            });
                        let l = JSON.parse(
                            conversions_data.SHARED_ALL_ENABLED_CONVERSIONS
                        )[1];
                        setTimeout(() => {
                            document
                                .querySelectorAll(
                                    ".conversion-name-cell .internal"
                                )
                                .forEach((o) => {
                                    let a = o.innerText;
                                    var r = "",
                                        s = "no label",
                                        c = null,
                                        d = o.closest(".particle-table-row");
                                    d &&
                                        (d
                                            .querySelector(
                                                '[essfield="aggregated_conversion_source"]'
                                            )
                                            ?.innerText.match(/.*web.*/gi) ||
                                            d.remove());
                                    for (let p = 0; p < l.length; p++)
                                        if (l[p][1] == a) {
                                            (c = l[p]),
                                                ({
                                                    type_cv: r,
                                                    label_event: s,
                                                } = e(c));
                                            break;
                                        }
                                    if (r) {
                                        o.innerHTML = `${s}`;
                                        let u = "GA4: " == r ? n : i;
                                        Object.assign(o.style, u);
                                    }
                                    r &&
                                        s &&
                                        t({
                                            element: o,
                                            textToCopy: s,
                                            title: "Click to copy label",
                                            timeout: 500,
                                        });
                                }),
                                document
                                    .querySelectorAll(
                                        "category-conversions-container-view, conversion-goal-card"
                                    )
                                    .forEach((t) => {
                                        t.querySelectorAll(
                                            ".particle-table-row"
                                        ).length || (t.style.display = "none");
                                    });
                        }, 1e3);
                        let s;
                        (a = r),
                            (s =
                                document.getElementById("gpt-aw-id-display")) ||
                                (((s = document.createElement("div")).id =
                                    "gpt-aw-id-display"),
                                Object.assign(s.style, {
                                    position: "fixed",
                                    bottom: "16px",
                                    left: "16px",
                                    zIndex: "999",
                                    padding: "8px 12px",
                                    backgroundColor: "rgba(0, 0, 0, 0.75)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                    fontFamily: "monospace",
                                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                                    transition: "background-color 0.3s ease",
                                }),
                                document.body.appendChild(s)),
                            (s.textContent = `AW-ID: ${a}`),
                            t({
                                element: s,
                                textToCopy: a,
                                title: "Click to copy ID",
                                successText: "Copied!",
                                timeout: 800,
                            });
                    })()
                  : o < 3
                  ? (o++, setTimeout(a, 500))
                  : console.warn(
                        "Adwords script: Could not find `conversions_data` object. Aborting."
                    );
          }
          "complete" === document.readyState ||
          "interactive" === document.readyState
              ? a()
              : window.addEventListener("DOMContentLoaded", a);
      })();
