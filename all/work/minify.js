window.location.href.includes("cases.connect")
    ? (() => {
          "use strict";
          if (window.scrRun) return;
          window.scrRun = 1;
          let t = {
                  SOUND_URL:
                      "https://cdn.pixabay.com/audio/2025/07/18/audio_da35bc65d2.mp3",
                  AUTO_CLICK_INTERVAL: 18e3,
                  AUTO_REMOVE_DELAY: 6e3,
                  SEL: {
                      AUTO_CLICK_BTN: "#cdtx__uioncall--btn",
                      AUTO_REMOVE_BTN: ".cdtx__uioncall_control-remove",
                      HOME_BUTTON: '[debug-id="dock-item-home"]',
                      FOLLOWUP_ITEM: ".li-popup_lstcasefl",
                      FOLLOWUP_BADGE: "#follow-up-badge",
                      APPOINTMENT_TIME_BTN:
                          '[data-infocase="appointment_time"]',
                      FOLLOWUP_TIME_BTN: '[data-infocase="follow_up_time"]',
                      DATEPICKER_TODAY: ".datepicker-grid .today",
                      FOLLOWUP_INPUT: "#follow-up-days-input",
                      PHONE_DIALOG: "[debug-id=phoneTakeDialog]",
                      SET_FOLLOWUP_BTN: "[data-type=follow_up_time]",
                      FINISH_BTN: '[data-thischoice="Finish"]',
                      UI_PANEL: "#script-btn-panel",
                  },
              },
              e = {
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
                  fontSize: "14px",
              },
              i = (t) => document.querySelector(t)?.click();
          function n(t, { interval: e = 500, timeout: i = 3e3 } = {}) {
              return new Promise((n, o) => {
                  let a = Date.now(),
                      r = setInterval(() => {
                          let e = document.querySelector(t);
                          if (e && null !== e.offsetParent) {
                              clearInterval(r), n(e);
                              return;
                          }
                          Date.now() - a > i &&
                              (clearInterval(r), o(Error(`Timeout for ${t}`)));
                      }, e);
              });
          }
          async function o(t, e = 0, i = {}) {
              let o = await n(t, i),
                  a = o;
              if (e > 0)
                  for (let r = 0; r < e; r++)
                      if (a) a = a.nextElementSibling;
                      else throw Error(`No sibling at ${r} for ${t}`);
              if (a) return a.click(), a;
              throw Error(`No target for ${t}`);
          }
          function a(t, e) {
              let i = new MutationObserver((i) => {
                  for (let n of i)
                      for (let o of n.addedNodes)
                          1 === o.nodeType &&
                              (o.matches(t)
                                  ? e(o)
                                  : o.querySelectorAll(t).forEach(e));
              });
              return (
                  i.observe(document.body, { childList: !0, subtree: !0 }), i
              );
          }
          function r(t, e) {
              return Math.round((e - t) / 864e5);
          }
          function l(t, e) {
              let i = new Date(t.getTime()),
                  n = 0;
              for (; n < e; ) {
                  i.setDate(i.getDate() + 1);
                  let o = i.getDay();
                  0 !== o && 6 !== o && n++;
              }
              return i;
          }
          let s = {
              id: null,
              on: !1,
              btn: null,
              start() {
                  this.id ||
                      ((this.on = !0),
                      (this.id = setInterval(() => {
                          i(t.SEL.AUTO_CLICK_BTN),
                              setTimeout(
                                  () => i(t.SEL.AUTO_REMOVE_BTN),
                                  t.AUTO_REMOVE_DELAY
                              );
                      }, t.AUTO_CLICK_INTERVAL)),
                      this.updateBtn());
              },
              stop() {
                  this.id &&
                      (clearInterval(this.id),
                      (this.id = null),
                      (this.on = !1),
                      this.updateBtn());
              },
              toggle() {
                  this.on ? this.stop() : this.start();
              },
              updateBtn() {
                  this.btn &&
                      ((this.btn.textContent = this.on ? "ON" : "OFF"),
                      (this.btn.style.backgroundColor = this.on
                          ? "#77DD77"
                          : "#FF746C"));
              },
              createBtn(t) {
                  (this.btn = document.createElement("button")),
                      (this.btn.id = "auto-btn"),
                      Object.assign(this.btn.style, e),
                      this.btn.addEventListener("click", () => this.toggle()),
                      t.appendChild(this.btn),
                      this.updateBtn();
              },
          };
          async function d() {
              try {
                  i(t.SEL.HOME_BUTTON), await o(t.SEL.FOLLOWUP_ITEM, 0);
              } catch (e) {
                  console.error(e);
              }
          }
          function c() {
              let e = document.getElementById(
                      t.SEL.FOLLOWUP_BADGE.substring(1)
                  ),
                  i = document.querySelector(t.SEL.FOLLOWUP_ITEM);
              if (i && e) {
                  let n = i.dataset.attr;
                  (e.textContent = n), (e.style.display = n ? "block" : "none");
              }
          }
          function p(i) {
              let o = document.createElement("button");
              (o.id = "follow-up-btn"),
                  (o.title = "Click Follow-up Item"),
                  (o.style.position = "relative"),
                  Object.assign(o.style, e, {
                      padding: "10px 12px",
                      backgroundColor: "#A2BFFE",
                      lineHeight: "0",
                  }),
                  (o.innerHTML = `
            <img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 20px; height: 20px; vertical-align: middle;">
            <span id="${t.SEL.FOLLOWUP_BADGE.substring(1)}" style="
                display: none; position: absolute; top: -5px; right: -5px;
                background: red; color: white; font-size: 10px; font-weight: bold;
                border-radius: 50%; padding: 2px 5px; line-height: 1;
            "></span>
        `),
                  o.addEventListener("click", d),
                  i.appendChild(o),
                  n(t.SEL.FOLLOWUP_ITEM)
                      .then((t) => {
                          let e = new MutationObserver(c);
                          e.observe(t, {
                              attributes: !0,
                              attributeFilter: ["data-attr"],
                          }),
                              c();
                      })
                      .catch((t) => console.error(t));
          }
          async function u() {
              try {
                  let e = document.querySelector(t.SEL.APPOINTMENT_TIME_BTN);
                  e &&
                      !e.dataset.valchoice &&
                      (i(t.SEL.APPOINTMENT_TIME_BTN),
                      await o(t.SEL.DATEPICKER_TODAY));
                  let n = document.getElementById(
                          t.SEL.FOLLOWUP_INPUT.substring(1)
                      ),
                      a = +n.value;
                  if (a) {
                      let s = new Date(),
                          d = l(s, a),
                          c = r(s, d);
                      i(t.SEL.FOLLOWUP_TIME_BTN),
                          await o(t.SEL.DATEPICKER_TODAY, c);
                  } else await o(t.SEL.FINISH_BTN);
                  await o(t.SEL.SET_FOLLOWUP_BTN);
              } catch (p) {
                  console.error(p);
              }
          }
          function g(e) {
              let i = document.createElement("div");
              i.id = "today-btn-group";
              let n = document.createElement("span");
              (n.id = "today-btn-label"),
                  (n.textContent = "FL Up:"),
                  (n.title = "Set appointment to Today + Follow-up"),
                  n.addEventListener("click", u);
              let o = document.createElement("input");
              (o.id = t.SEL.FOLLOWUP_INPUT.substring(1)),
                  (o.type = "text"),
                  (o.value = "2"),
                  (o.title = "Days to follow-up"),
                  o.addEventListener("input", (t) => {
                      t.target.value = t.target.value
                          .replace(/\D/g, "")
                          .substring(0, 1);
                  }),
                  o.addEventListener("focus", (t) => t.target.select()),
                  i.appendChild(n),
                  i.appendChild(o),
                  e.appendChild(i);
          }
          async function h() {
              let e = new Audio(t.SOUND_URL);
              try {
                  await e.play(), window.focus();
              } catch (i) {
                  console.error(i);
              }
          }
          function $() {
              let e = document.createElement("div");
              return (
                  (e.id = t.SEL.UI_PANEL.substring(1)),
                  Object.assign(e.style, {
                      position: "fixed",
                      bottom: "16px",
                      left: "16px",
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      zIndex: "9999",
                  }),
                  document.body.appendChild(e),
                  e
              );
          }
          function b() {
              let e = "cases-connect-enhanced-styles";
              if (document.getElementById(e)) return;
              let i = `
            #${t.SEL.UI_PANEL.substring(1)} button:hover { 
                opacity: 0.9; transform: translateY(-1px); 
            }
            #${t.SEL.UI_PANEL.substring(1)} button:active { 
                transform: scale(0.96); box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
            }
            #today-btn-group { 
                position: relative; display: inline-block; 
            }
            #today-btn-label {
                display: inline-block; padding: 12px 48px 12px 16px; 
                color: white; background-color: #55B4B0; border-radius: 4px;
                font-weight: bold; font-size: 14px; cursor: pointer;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                transition: background-color 0.3s ease; user-select: none;
            }
            #today-btn-label:hover { background-color: #4a9d9a; }
            #${t.SEL.FOLLOWUP_INPUT.substring(1)} {
                position: absolute; top: 50%; transform: translateY(-50%);
                right: 8px; width: 32px; height: 28px;
                padding: 0; border: none; border-radius: 3px; 
                background: rgba(255, 255, 255, 0.9); color: #333;
                font-weight: bold; font-size: 14px; text-align: center;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); 
                transition: box-shadow 0.2s ease; -moz-appearance: textfield;
            }
            #${t.SEL.FOLLOWUP_INPUT.substring(1)}:focus {
                outline: none;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px rgba(255, 255, 255, 0.7);
            }
        `,
                  n = document.createElement("style");
              (n.id = e), (n.textContent = i), document.head.appendChild(n);
          }
          function f() {
              a(t.SEL.PHONE_DIALOG, h), b();
              let e = $();
              s.createBtn(e), p(e), g(e);
          }
          f();
      })()
    : window.location.href.includes("casemon2.corp")
    ? (() => {
          if (!window.dashRun) {
              window.dashRun = 1;
              class t {
                  #a = {
                      tblSel: ".agent-table-container",
                      uiId: "agent_ui",
                      styleId: "agent-dash-styles",
                      link: "https://cdn-icons-png.flaticon.com/512",
                      prior: {
                          active: 1,
                          phone: 2,
                          "lunch-break": 3,
                          email: 4,
                          "coffee-break": 5,
                          break: 6,
                          default: 99,
                      },
                      icons: {
                          "coffee-break": {
                              src: "/2935/2935413.png",
                              animation: "wiggle",
                          },
                          "lunch-break": {
                              src: "/4252/4252424.png",
                              animation: "pulse",
                          },
                          phone: {
                              src: "/1959/1959283.png",
                              animation: "wiggle",
                          },
                          email: {
                              src: "/15781/15781499.png",
                              animation: "slide",
                          },
                          break: {
                              src: "/2115/2115487.png",
                              animation: "wiggle",
                          },
                          close: "/9403/9403346.png",
                      },
                  };
                  #b = null;
                  #c = null;
                  #d = null;
                  #e = null;
                  #f = null;
                  constructor() {
                      if (
                          ((this.#c = this.#g()),
                          (this.#e = document.querySelector(this.#a.tblSel)),
                          !this.#e)
                      )
                          return;
                      for (let [t, e] of ((this.#f =
                          window.trustedTypes.createPolicy(
                              "agent-dash-policy",
                              { createHTML: (t) => t }
                          )),
                      Object.entries(this.#a.icons)))
                          "string" == typeof e
                              ? (this.#a.icons[t] = this.#a.link + e)
                              : (e.src = this.#a.link + e.src);
                      this.#h(), this.#i(), this.#j();
                  }
                  #g() {
                      return document
                          .querySelector("[alt='profile photo']")
                          ?.src?.match(/\/([^\/]+)\?/)?.[1];
                  }
                  #i() {
                      let e = document.getElementById(this.#a.uiId);
                      e ||
                          (((e = document.createElement("div")).id =
                              this.#a.uiId),
                          document.body.appendChild(e)),
                          (this.#d = e),
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
                          let i = (
                              e[5].innerText.match(/[a-zA-Z\s]+/)?.[0] ?? ""
                          )
                              .trim()
                              .toLowerCase()
                              .replace(/\s+/g, "-");
                          return {
                              img: t.querySelector("img").src,
                              ldap: e[1].innerText,
                              aux: e[3].innerText,
                              time: e[4].innerText,
                              phoneCap: i,
                              lastChg: e[8].innerText.trim(),
                              lastSec: this.#o(e[8].innerText),
                          };
                      }).filter(Boolean);
                  }
                  #p(n) {
                      let o = n.aux.toLowerCase().replace(/\s+/g, "-"),
                          a = n.aux;
                      return (
                          "Active" === n.aux &&
                              "busy" === n.phoneCap &&
                              ((a = "Break"), (o = "break")),
                          { ...n, aux: a, statusKey: o, css: `stt-${o}` }
                      );
                  }
                  #q(r) {
                      let { prior: l } = this.#a;
                      return r.sort((t, e) => {
                          let i = l[t.statusKey] ?? l.default,
                              n = l[e.statusKey] ?? l.default;
                          return (
                              (e.ldap === this.#c) - (t.ldap === this.#c) ||
                              i - n ||
                              e.lastSec - t.lastSec
                          );
                      });
                  }
                  #l() {
                      let s = this.#n(),
                          d = s.map(this.#p.bind(this)),
                          c = this.#q(d),
                          p = c.map(this.#r).join(""),
                          u = this.#s(),
                          g = `
                  <div class="ui-content-wrapper">
                    ${u}
                    <div class="ui-table">${p}</div>
                  </div>`;
                      (this.#d.innerHTML = this.#f.createHTML(g)), this.#m();
                  }
                  #r = (t) => {
                      let e = this.#t(t.statusKey),
                          i = `Avatar for ${t.ldap}`;
                      return `
                <div class="tr ${t.css}">
                  <div class="td left">
                    <img src="${t.img}" alt="${i}" />
                    <p>${t.ldap}</p>
                  </div>
                  <div class="td right">
                    <div>
                      <p>${t.lastChg} <span>(${t.time})</span></p>
                      <p>${t.aux}</p> 
                    </div>
                    ${e}
                  </div>
                </div>`;
                  };
                  #t(h) {
                      let $ = this.#a.icons[h];
                      return $
                          ? `<img src="${$.src}" animation="${$.animation}" alt="${h} icon"/>`
                          : "";
                  }
                  #s() {
                      return `<button class="close-btn" title="Close">
                        <img src="${this.#a.icons.close}" alt="Close"/>
                      </button>`;
                  }
                  #o(b) {
                      let f = b.match(/(\d+)(h|m|s)/g) ?? [],
                          x = { h: 3600, m: 60, s: 1 };
                      return f.reduce((t, e) => {
                          let i = parseInt(e, 10),
                              n = e.slice(-1);
                          return t + i * (x[n] ?? 0);
                      }, 0);
                  }
                  #h() {
                      let m = `
                #${this.#a.uiId} { 
                  position: fixed; height: 100%; width: 100%; top: 0; right: 0; 
                  background-color: rgba(0,0,0,0.1); z-index: 999; 
                  display: flex; justify-content: flex-end; align-items: center; 
                  padding: 20px;
                  font-family: 'Noto Serif', serif; pointer-events: none; 
                  box-sizing: border-box;
                }
                .ui-content-wrapper { position: relative; pointer-events: auto; width: 100%; max-width: 380px; }
                .close-btn { 
                  position: absolute; top: 0; right: 0;
                  transform: translate(40%, -40%); border: none; cursor: pointer;
                  z-index: 10; background: rgba(0, 0, 0, 0); transition: transform 0.2s ease; 
                }
                .close-btn:hover { transform: translate(40%, -40%) scale(1.4); }
                .ui-table { 
                  display: grid; grid-template-columns: repeat(2, 1fr); 
                  width: 100%; border-radius: 12px; 
                  overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); 
                }
                .ui-table .tr { display: contents; }
                .ui-table .td { 
                  padding: 8px 12px; display: flex; align-items: center; 
                  transition: background-color 0.4s ease, transform 0.2s ease; 
                }
                .ui-table .left { justify-content: flex-start; font-weight: 500; font-size: clamp(12px, 4vw, 16px); }
                .ui-table .right { justify-content: flex-end; text-align: right; font-size: clamp(10px, 3.5vw, 14px); }
                .ui-table .td { background-color: #F8F9FA; color: #495057; }
                .ui-table .tr.stt-active .td { background-color: #E6F4EA; color: #1E8449; }
                .ui-table .tr.stt-phone .td { background-color: #FEC7C0; color: #C0392B; }
                .ui-table .tr.stt-email .td { background-color: #ace0fe; color: #1d8fdcff; }
                .ui-table .tr.stt-coffee-break .td { background-color: #D2A993; color: #685347; }
                .ui-table .tr.stt-lunch-break .td { background-color: #FFEA99; color: #E58732; }
                .ui-table .tr.stt-break .td { background-color: #e9ecef; color: #495057; }
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
                @media (max-width: 350px) { .ui-table .right img[alt*="icon"] { display: none; } }
                @media (max-width: 280px) { .ui-table .left img[alt*="Avatar"] { display: none; } }
                @media (max-width: 240px) { .ui-table .right span { display: none; } }
              `,
                          y =
                              document.getElementById(this.#a.styleId) ||
                              document.createElement("style");
                      (y.id = this.#a.styleId),
                          (y.innerHTML = this.#f.createHTML(m)),
                          document.head.appendChild(y);
                  }
              }
              new t();
          }
      })()
    : window.location.href.includes("adwords.corp") &&
      (() => {
          "use strict";
          let t = {
                  backgroundColor: "rgb(255, 229, 180)",
                  borderRadius: "10px",
                  fontWeight: "500",
              },
              e = {
                  backgroundColor: "rgb(160, 251, 157)",
                  borderRadius: "10px",
                  fontWeight: "500",
              },
              i = 0;
          function n({
              el: t,
              text: e,
              title: i = "Click to copy",
              okText: n,
              okBg: o = "#007bff",
              okColor: a = "white",
              timeout: r = 800,
          }) {
              t.dataset.copyListener ||
                  ((t.dataset.copyListener = !0),
                  Object.assign(t.style, {
                      cursor: "pointer",
                      userSelect: "none",
                  }),
                  (t.title = i),
                  t.addEventListener("click", (i) => {
                      i.preventDefault(),
                          i.stopPropagation(),
                          navigator.clipboard.writeText(e).then(() => {
                              let { backgroundColor: e, color: i } = t.style,
                                  l = t.textContent;
                              Object.assign(t.style, {
                                  backgroundColor: o,
                                  color: a,
                              }),
                                  n && (t.textContent = n),
                                  setTimeout(() => {
                                      Object.assign(t.style, {
                                          backgroundColor: e,
                                          color: i,
                                      }),
                                          n && (t.textContent = l);
                                  }, r);
                          });
                  }));
          }
          function o(t) {
              let e = null,
                  i = null,
                  n = t[11];
              if (1 === n) {
                  e = "Ads Conversion: ";
                  let o = t[64]?.[2]?.[4];
                  i = o?.split("'")?.[7]?.split("/")?.[1];
              } else if (32 === n) {
                  e = "GA4: ";
                  let a = t[64]?.[1]?.[4];
                  i = a?.split("'")?.[3];
              }
              return { type: e, label: i || "no label" };
          }
          function a(t) {
              let e = document.getElementById("gpt-aw-id-display");
              e ||
                  (((e = document.createElement("div")).id =
                      "gpt-aw-id-display"),
                  Object.assign(e.style, {
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
                  document.body.appendChild(e)),
                  (e.textContent = `AW-ID: ${t}`),
                  n({
                      el: e,
                      text: t,
                      title: "Click to copy ID",
                      okText: "Copied!",
                      timeout: 800,
                  });
          }
          function r(i) {
              document
                  .querySelectorAll(".conversion-name-cell .internal")
                  .forEach((a) => {
                      let r = a.closest(".particle-table-row");
                      if (r) {
                          let l = r.querySelector(
                              '[essfield="aggregated_conversion_source"]'
                          );
                          if (!l?.innerText.match(/.*web.*/gi)) {
                              r.remove();
                              return;
                          }
                      }
                      let s = a.innerText,
                          d = i.get(s);
                      if (d) {
                          let { type: c, label: p } = o(d);
                          c &&
                              "no label" !== p &&
                              ((a.innerHTML = `${p}`),
                              Object.assign(a.style, "GA4: " === c ? t : e),
                              n({
                                  el: a,
                                  text: p,
                                  title: "Click to copy label",
                                  timeout: 500,
                              }));
                      }
                  }),
                  document
                      .querySelectorAll(
                          "category-conversions-container-view, conversion-goal-card"
                      )
                      .forEach((t) => {
                          t.querySelectorAll(".particle-table-row").length ||
                              (t.style.display = "none");
                      });
          }
          function l() {
              let t = window.conversions_data.SHARED_ALL_ENABLED_CONVERSIONS,
                  e = t.match(/AW-(\d*)/)?.[1];
              if (!e) {
                  console.warn("Adwords script: Could not find AW-ID.");
                  return;
              }
              document
                  .querySelectorAll(".expand-more")
                  .forEach((t) => t.click());
              let i = JSON.parse(t)[1],
                  n = new Map(i.map((t) => [t[1], t]));
              setTimeout(() => r(n), 1e3), a(e);
          }
          function s() {
              void 0 !== window.conversions_data &&
              window.conversions_data.SHARED_ALL_ENABLED_CONVERSIONS
                  ? l()
                  : i < 3
                  ? (i++, setTimeout(s, 500))
                  : console.warn(
                        "Adwords script: Could not find `conversions_data`. Aborting."
                    );
          }
          "complete" === document.readyState ||
          "interactive" === document.readyState
              ? s()
              : window.addEventListener("DOMContentLoaded", s);
      })();
