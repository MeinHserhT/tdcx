window.location.href.includes("cases.connect")
  ? (() => {
      if (window.scrRun) return;
      window.scrRun = 1;
      let e = {
          soundUrl:
            "https://cdn.pixabay.com/audio/2025/07/18/audio_da35bc65d2.mp3",
          autoClickInterval: 18e3,
          autoRemoveDelay: 6e3,
          selectors: {
            autoClickBtn: "#cdtx__uioncall--btn",
            autoRemoveBtn: ".cdtx__uioncall_control-remove",
            flupItem: ".li-popup_lstcasefl",
            todayBtn: ".datepicker-grid .today",
            flupInputId: "flup-days-input",
            flupBadgeId: "flup-badge",
            uiPanelId: "btn-panel",
            homeButton: '[debug-id="dock-item-home"]',
            apptBtn: '[data-infocase="appointment_time"]',
            flupBtn: '[data-infocase="follow_up_time"]',
            phoneDialog: "[debug-id=phoneTakeDialog]",
            setFlupBtn: "[data-type=follow_up_time]",
            finishBtn: '[data-thischoice="Finish"]',
          },
        },
        t = (e) => document.querySelector(e)?.click(),
        n = (e, t) => Math.round((t - e) / 864e5),
        i = (e, t, n = []) => {
          let i = new Date(e),
            a = 0,
            s = (e) => n.includes(e.toISOString().split("T")[0]);
          for (; a < t; ) {
            i.setDate(i.getDate() + 1);
            let o = i.getDay();
            0 !== o && 6 !== o && !s(i) && a++;
          }
          return i;
        },
        a = (e, { interval: t = 500, timeout: n = 3e3 } = {}) =>
          new Promise((i, a) => {
            let s = Date.now(),
              o = setInterval(() => {
                let t = document.querySelector(e);
                if (t && null !== t.offsetParent) {
                  clearInterval(o), i(t);
                  return;
                }
                Date.now() - s > n &&
                  (clearInterval(o), a(Error(`Timeout for ${e}`)));
              }, t);
          }),
        s = async (e, t = 0, n = {}) => {
          let i = await a(e, n),
            s = i;
          for (let o = 0; o < t; o++) s = s?.nextElementSibling;
          return s && s.click(), s;
        },
        o = (e, t) => {
          let n = new MutationObserver((n) => {
            n.forEach((n) => {
              1 === n.nodeType && n.matches(e) && t();
            });
          });
          return n.observe(document.body, { childList: !0, subtree: !0 }), n;
        };
      class r {
        constructor({
          text: e = "",
          html: t = "",
          onClick: n = null,
          id: i = "",
          title: a = "",
          bgColor: s = "#555",
          extraStyles: o = {},
        }) {
          (this.element = document.createElement("button")),
            (this.element.id = i),
            (this.element.title = a),
            t ? (this.element.innerHTML = t) : (this.element.innerText = e),
            Object.assign(this.element.style, {
              zIndex: "10",
              color: "white",
              padding: "12px 12px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              transition: "all 0.3s ease",
              fontSize: "14px",
              backgroundColor: s,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...o,
            }),
            n && this.element.addEventListener("click", (e) => n(e));
        }
        render = (e) => {
          e.appendChild(this.element);
        };
        setText = (e) => {
          this.element.innerText = e;
        };
        setColor = (e) => {
          this.element.style.backgroundColor = e;
        };
        appendChild = (e) => {
          this.element.appendChild(e);
        };
      }
      let l = {
          timerId: null,
          on: !1,
          btnInstance: null,
          start() {
            this.timerId ||
              ((this.on = !0),
              (this.timerId = setInterval(() => {
                t(e.selectors.autoClickBtn),
                  setTimeout(
                    () => t(e.selectors.autoRemoveBtn),
                    e.autoRemoveDelay
                  );
              }, e.autoClickInterval)),
              this.updateView());
          },
          stop() {
            this.timerId &&
              (clearInterval(this.timerId),
              (this.timerId = null),
              (this.on = !1),
              this.updateView());
          },
          toggle() {
            this.on ? this.stop() : this.start();
          },
          updateView() {
            this.btnInstance &&
              (this.btnInstance.setText(this.on ? "ON" : "OFF"),
              this.btnInstance.setColor(this.on ? "#77DD77" : "#FF746C"));
          },
          create(e) {
            (this.btnInstance = new r({
              text: "OFF",
              onClick: () => this.toggle(),
              id: "auto-btn",
              title: "Auto Click",
              bgColor: "#FF746C",
            })),
              this.btnInstance.render(e);
          },
        },
        d = {
          async handleClick() {
            t(e.selectors.homeButton), await s(e.selectors.flupItem, 0);
          },
          updateBadge(t) {
            let n = document.getElementById(e.selectors.flupBadgeId);
            if (t && n) {
              let i = t.getAttribute("data-attr") || "0";
              n.style.display = "0" !== i ? "block" : "none";
            }
          },
          create(t) {
            let n = `
                    <img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" 
                        style="width: 20px; height: 20px;">
                    <span id="${e.selectors.flupBadgeId}" style="
                        display: none; position: absolute; top: -5px; right: -5px;
                        background: red; border-radius: 50%; padding: 2px 5px; line-height: 1;
                    ">+</span>
                `,
              i = new r({
                html: n,
                onClick: () => this.handleClick(),
                id: "follow-up-btn",
                title: "Click Follow-up Item",
                bgColor: "#A2BFFE",
              });
            i.render(t),
              a(e.selectors.flupItem).then((e) => {
                let t = new MutationObserver(() => this.updateBadge(e));
                t.observe(e, {
                  attributes: !0,
                  attributeFilter: ["data-attr"],
                }),
                  this.updateBadge(e);
              });
          },
        },
        c = {
          inputEl: null,
          async handleFlupClick(a) {
            if (a.target.id === e.selectors.flupInputId) return;
            let o = document.querySelector(e.selectors.apptBtn);
            o &&
              !o.dataset.valchoice &&
              (t(e.selectors.apptBtn), await s(e.selectors.todayBtn));
            let r = +this.inputEl.value;
            if ((t(e.selectors.flupBtn), r)) {
              let l = new Date(),
                d = i(l, r),
                c = n(l, d);
              await s(e.selectors.todayBtn, c);
            } else await s(e.selectors.finishBtn);
            await s(e.selectors.setFlupBtn);
          },
          create(t) {
            let n = new r({
                text: "FL Up:",
                onClick: (e) => this.handleFlupClick(e),
                title: "Set Follow-up",
                bgColor: "#55B4B0",
                extraStyles: { paddingRight: "48px" },
              }),
              i = document.createElement("input");
            (i.id = e.selectors.flupInputId),
              (i.type = "text"),
              (i.value = "2"),
              (i.title = "Days to follow-up"),
              i.addEventListener("click", (e) => e.stopPropagation()),
              i.addEventListener("input", (e) => {
                e.target.value = e.target.value
                  .replace(/\D/g, "")
                  .substring(0, 1);
              }),
              i.addEventListener("focus", (e) => e.target.select()),
              (this.inputEl = i),
              n.appendChild(i),
              n.render(t);
          },
        },
        p = async () => {
          let t = new Audio(e.soundUrl);
          await t.play(), window.focus();
        },
        u = () => {
          let t = "cases-connect-enhanced-styles";
          if (document.getElementById(t)) return;
          let n = `
                #${e.selectors.flupInputId} {
                    position: absolute; top: 50%; transform: translateY(-50%);
                    right: 8px; width: 32px; height: 28px;
                    padding: 0; border: none; border-radius: 3px; 
                    background: rgba(255, 255, 255, 0.9); color: #333;
                    font-weight: bold; font-size: 14px; text-align: center;
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); 
                    transition: box-shadow 0.2s ease; -moz-appearance: textfield;
                }
                #${e.selectors.flupInputId}:focus {
                    outline: none;
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px rgba(255, 255, 255, 0.7);
                }
            `,
            i = document.createElement("style");
          (i.id = t), (i.textContent = n), document.head.appendChild(i);
        },
        h = () => {
          let t = document.createElement("div");
          return (
            (t.id = e.selectors.uiPanelId),
            Object.assign(t.style, {
              position: "fixed",
              bottom: "16px",
              left: "16px",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              zIndex: "9999",
            }),
            document.body.appendChild(t),
            t
          );
        },
        g = () => {
          o(e.selectors.phoneDialog, p), u();
          let t = h();
          l.create(t), d.create(t), c.create(t);
        };
      g();
    })()
  : window.location.href.includes("casemon2.corp")
  ? (() => {
      if (!window.dashRun) {
        window.dashRun = 1;
        class e {
          #a = {
            selectors: {
              container: ".agent-table-container",
              uiId: "agent_ui",
              styleId: "agent-dash-styles",
            },
            assets: {
              iconBaseUrl: "https://cdn-icons-png.flaticon.com/512",
              icons: {
                "coffee-break": {
                  src: "/2935/2935413.png",
                  animation: "wiggle",
                },
                "lunch-break": { src: "/4252/4252424.png", animation: "pulse" },
                phone: { src: "/1959/1959283.png", animation: "wiggle" },
                email: { src: "/15781/15781499.png", animation: "slide" },
                break: { src: "/2115/2115487.png", animation: "wiggle" },
                close: "/9403/9403346.png",
              },
            },
            priorities: {
              active: 1,
              phone: 2,
              "lunch-break": 3,
              email: 4,
              "coffee-break": 5,
              break: 6,
              default: 99,
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
              (this.#e = document.querySelector(this.#a.selectors.container)),
              !this.#e)
            ) {
              console.error(
                "Agent Dashboard: Target table container not found."
              );
              return;
            }
            this.#h(), this.#i(), this.#j(), this.#k(), this.#l();
          }
          #h = () => {
            window.trustedTypes && window.trustedTypes.createPolicy
              ? (this.#f = window.trustedTypes.createPolicy(
                  "agent-dash-policy",
                  { createHTML: (e) => e }
                ))
              : (this.#f = { createHTML: (e) => e });
          };
          #i = () => {
            let { icons: e, iconBaseUrl: t } = this.#a.assets;
            for (let [n, i] of Object.entries(e))
              "string" == typeof i ? (e[n] = t + i) : (i.src = t + i.src);
          };
          #g = () => {
            let e = document.querySelector("[alt='profile photo']");
            return e?.src?.match(/\/([^\/]+)\?/)?.[1];
          };
          #k = () => {
            let e = document.getElementById(this.#a.selectors.uiId);
            e ||
              (((e = document.createElement("div")).id =
                this.#a.selectors.uiId),
              document.body.appendChild(e)),
              (this.#d = e),
              this.#d.addEventListener("click", (e) => {
                e.target.closest(".close-btn") && this.#m();
              });
          };
          #l = () => {
            (this.#b = new MutationObserver(this.#n)),
              this.#b.observe(this.#e, {
                attributes: !0,
                childList: !0,
                subtree: !0,
                characterData: !0,
              }),
              this.#n();
          };
          #m = () => {
            this.#d && (this.#d.style.display = "none"),
              this.#b && this.#b.disconnect(),
              (window.dashRun = 0);
          };
          #n = () => {
            let e = this.#o(),
              t = e.map(this.#p),
              n = this.#q(t),
              i = n.map(this.#r).join(""),
              a = `
                    <div class="ui-content-wrapper">
                        ${this.#s()}
                        <div class="ui-table">${i}</div>
                    </div>`;
            (this.#d.innerHTML = this.#f.createHTML(a)),
              (this.#d.style.display = "flex");
          };
          #o = () => {
            let e = this.#e.querySelectorAll("tbody tr");
            return Array.from(e, (e) => {
              let t = e.querySelectorAll("td");
              if (t.length < 9) return null;
              let n = (t[5].innerText.match(/[a-zA-Z\s]+/)?.[0] ?? "")
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "-");
              return {
                img: e.querySelector("img").src,
                ldap: t[1].innerText,
                auxCode: t[3].innerText,
                timeInState: t[4].innerText,
                phoneCap: n,
                lastChangeRaw: t[8].innerText.trim(),
                durationSeconds: this.#t(t[8].innerText),
              };
            }).filter(Boolean);
          };
          #p = (e) => {
            let t = e.auxCode,
              n = e.auxCode.toLowerCase().replace(/\s+/g, "-");
            return (
              "Active" === e.auxCode &&
                "busy" === e.phoneCap &&
                ((t = "Break"), (n = "break")),
              { ...e, displayStatus: t, statusKey: n, cssClass: `stt-${n}` }
            );
          };
          #q = (e) => {
            let t = this.#a.priorities;
            return e.sort((e, n) => {
              let i = t[e.statusKey] ?? t.default,
                a = t[n.statusKey] ?? t.default,
                s = e.ldap === this.#c,
                o = n.ldap === this.#c;
              return o - s || i - a || n.durationSeconds - e.durationSeconds;
            });
          };
          #r = (e) => {
            let t = this.#u(e.statusKey),
              n = `Avatar for ${e.ldap}`;
            return `<div class="tr ${e.cssClass}">
                            <div class="td left">
                            <img src="${e.img}" alt="${n}" />
                            <p>${e.ldap}</p>
                            </div>
                            <div class="td right">
                            <div>
                                <p>${e.lastChangeRaw} <span>(${e.timeInState})</span></p>
                                <p>${e.displayStatus}</p> 
                            </div>
                            ${t}
                            </div>
                        </div>`;
          };
          #u = (e) => {
            let t = this.#a.assets.icons[e];
            return t
              ? `<img src="${t.src}" animation="${t.animation}" alt="${e} icon"/>`
              : "";
          };
          #s = () => `<button class="close-btn" title="Close">
                        <img src="${this.#a.assets.icons.close}" alt="Close"/>
                    </button>`;
          #t = (e) => {
            let t = e.match(/(\d+)(h|m|s)/g) ?? [],
              n = { h: 3600, m: 60, s: 1 };
            return t.reduce((e, t) => {
              let i = parseInt(t, 10),
                a = t.slice(-1);
              return e + i * (n[a] ?? 0);
            }, 0);
          };
          #j = () => {
            if (document.getElementById(this.#a.selectors.styleId)) return;
            let e = `
                    #${this.#a.selectors.uiId} { 
                        position: fixed; height: 100%; width: 100%; top: 0; right: 0; 
                        background-color: rgba(0,0,0,0.1); z-index: 999; 
                        display: flex; justify-content: flex-end; align-items: center; 
                        padding: 20px; font-family: system-ui, sans-serif; 
                        pointer-events: none; box-sizing: border-box;
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
              t = document.createElement("style");
            (t.id = this.#a.selectors.styleId),
              (t.innerHTML = this.#f.createHTML(e)),
              document.head.appendChild(t);
          };
        }
        new e();
      }
    })()
  : window.location.href.includes("adwords.corp") &&
    (() => {
      let e = {
          backgroundColor: "rgb(255, 229, 180)",
          borderRadius: "10px",
          fontWeight: "500",
        },
        t = {
          backgroundColor: "rgb(160, 251, 157)",
          borderRadius: "10px",
          fontWeight: "500",
        },
        n = 0,
        i = ({
          el: e,
          text: t,
          title: n = "Click to copy",
          okText: i,
          okBg: a = "#007bff",
          okColor: s = "white",
          timeout: o = 800,
        }) => {
          e.dataset.copyListener ||
            ((e.dataset.copyListener = !0),
            Object.assign(e.style, { cursor: "pointer", userSelect: "none" }),
            (e.title = n),
            e.addEventListener("click", (n) => {
              n.preventDefault(),
                n.stopPropagation(),
                navigator.clipboard.writeText(t).then(() => {
                  let { backgroundColor: t, color: n } = e.style,
                    r = e.textContent;
                  Object.assign(e.style, { backgroundColor: a, color: s }),
                    i && (e.textContent = i),
                    setTimeout(() => {
                      Object.assign(e.style, { backgroundColor: t, color: n }),
                        i && (e.textContent = r);
                    }, o);
                });
            }));
        },
        a = (e) => {
          let t = null,
            n = null,
            i = e[11];
          if (1 === i) {
            t = "Ads Conversion: ";
            let a = e[64]?.[2]?.[4];
            n = a?.split("'")?.[7]?.split("/")?.[1];
          } else if (32 === i) {
            t = "GA4: ";
            let s = e[64]?.[1]?.[4];
            n = s?.split("'")?.[3];
          }
          return { type: t, label: n || "no label" };
        },
        s = (e) => {
          let t = document.getElementById("gpt-aw-id-display");
          t ||
            (((t = document.createElement("div")).id = "gpt-aw-id-display"),
            Object.assign(t.style, {
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
              fontFamily: "system-ui, sans-serif",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              transition: "background-color 0.3s ease",
            }),
            document.body.appendChild(t)),
            (t.textContent = `AW-ID: ${e}`),
            i({
              el: t,
              text: e,
              title: "Click to copy ID",
              okText: "Copied!",
              timeout: 800,
            });
        },
        o = (n) => {
          document
            .querySelectorAll(".conversion-name-cell .internal")
            .forEach((s) => {
              let o = s.closest(".particle-table-row");
              if (o) {
                let r = o.querySelector(
                  '[essfield="aggregated_conversion_source"]'
                );
                if (!r?.innerText.match(/.*web.*/gi)) {
                  o.remove();
                  return;
                }
              }
              let l = s.innerText,
                d = n.get(l);
              if (d) {
                let { type: c, label: p } = a(d);
                if (c && "no label" !== p) {
                  s.innerHTML = `${p}`;
                  let u = "GA4: " === c ? e : t;
                  Object.assign(s.style, u),
                    i({
                      el: s,
                      text: p,
                      title: "Click to copy label",
                      timeout: 500,
                    });
                }
              }
            }),
            document
              .querySelectorAll(
                "category-conversions-container-view, conversion-goal-card"
              )
              .forEach((e) => {
                e.querySelectorAll(".particle-table-row").length ||
                  (e.style.display = "none");
              });
        },
        r = () => {
          let e = window.conversions_data.SHARED_ALL_ENABLED_CONVERSIONS,
            t = e.match(/AW-(\d*)/)?.[1];
          if (!t) {
            console.warn("Adwords script: Could not find AW-ID.");
            return;
          }
          document.querySelectorAll(".expand-more").forEach((e) => e.click());
          let n = JSON.parse(e)[1],
            i = new Map(n.map((e) => [e[1], e]));
          setTimeout(() => o(i), 1e3), s(t);
        },
        l = () => {
          void 0 !== window.conversions_data &&
          window.conversions_data.SHARED_ALL_ENABLED_CONVERSIONS
            ? r()
            : n < 3
            ? (n++, setTimeout(l, 500))
            : console.warn(
                "Adwords script: Could not find `conversions_data`. Aborting."
              );
        };
      "complete" === document.readyState ||
      "interactive" === document.readyState
        ? l()
        : window.addEventListener("DOMContentLoaded", l);
    })();
