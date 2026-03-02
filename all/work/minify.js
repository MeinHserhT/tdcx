window.location.href.includes("cases.connect")
    ? (() => {
          let e = {
                  intervals: {
                      autoClick: 18e3,
                      removeDelay: 6e3,
                      waitPoll: 500,
                      waitTimeout: 3e3,
                  },
                  selectors: {
                      autoAddBtn: "#cdtx__uioncall--btn",
                      autoRemoveBtn: ".cdtx__uioncall_control-remove",
                      followUpListBtn: ".li-popup_lstcasefl",
                      datePickerToday: ".datepicker-grid .today",
                      dockHome: '[debug-id="dock-item-home"]',
                      apptTime: '[data-infocase="appointment_time"]',
                      followUpTime: '[data-infocase="follow_up_time"]',
                      setFollowUpBtn: "[data-type=follow_up_time]",
                      finishBtn: '[data-thischoice="Finish"]',
                      signatureTable:
                          'editor #email-body-content table[width="348"]',
                      uiPanel: "panelQM",
                      followUpInput: "flup-days-input",
                      badge: "flup-badge",
                  },
                  storage: {
                      name: "__signature_name",
                      logo: "__logo",
                      team: "__team",
                      comp: "__comp",
                  },
                  defaults: {
                      logo: "https://cdn-icons-png.flaticon.com/512/300/300221.png",
                      team: "Technical Solutions Team",
                      comp: "TDCX, on behalf of Google",
                  },
              },
              t = `
        #${e.selectors.uiPanel} {
          position: fixed; bottom: 16px; left: 16px; display: flex; gap: 8px;
          align-items: center; z-index: 9999;
        }
        .qm-btn {
          z-index: 10; color: white; padding: 12px; border: none;
          border-radius: 5px; cursor: pointer; font-weight: bold;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: all 0.3s ease;
          font-size: 14px; position: relative; display: flex;
          align-items: center; justify-content: center;
        }
        #${e.selectors.followUpInput} {
          position: absolute; top: 50%; transform: translateY(-50%);
          right: 8px; width: 32px; height: 28px; padding: 0; border: none;
          border-radius: 3px; background: rgba(255, 255, 255, 0.9);
          color: #333; font-weight: bold; font-size: 14px; text-align: center;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
          transition: box-shadow 0.2s ease; -moz-appearance: textfield;
        }
        #${e.selectors.followUpInput}:focus {
          outline: none;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px rgba(255, 255, 255, 0.7);
        }
        .qm-badge {
          display: none; position: absolute; top: -5px; right: -5px;
          background: red; border-radius: 50%; padding: 2px 5px; line-height: 1;
        }
      `,
              a = (e, t = document) => t.querySelector(e),
              o = (e, t = document) => [...t.querySelectorAll(e)],
              i = {
                  addBusinessDays(e, t) {
                      let a = new Date(e),
                          o = 0;
                      for (; o < t; ) {
                          a.setDate(a.getDate() + 1);
                          let i = a.getDay();
                          0 !== i && 6 !== i && o++;
                      }
                      return a;
                  },
                  getDayDiff: (e, t) => Math.round((t - e) / 864e5),
              },
              n = {
                  waitForElement: (t, o = e.intervals.waitTimeout) =>
                      new Promise((i, n) => {
                          let r = Date.now(),
                              l = setInterval(() => {
                                  let e = a(t);
                                  e?.offsetParent
                                      ? (clearInterval(l), i(e))
                                      : Date.now() - r > o &&
                                        (clearInterval(l),
                                        n(Error(`Timeout: ${t}`)));
                              }, e.intervals.waitPoll);
                      }),
                  async waitAndClick(e, t = 0) {
                      let a = await this.waitForElement(e),
                          o = a;
                      for (let i = 0; i < t; i++) o = o?.nextElementSibling;
                      return o?.click(), o;
                  },
                  create(e, { parent: t, onClick: a, style: o, ...i } = {}) {
                      let n = Object.assign(document.createElement(e), i);
                      return (
                          o && Object.assign(n.style, o),
                          a && n.addEventListener("click", a),
                          t && t.appendChild(n),
                          n
                      );
                  },
              },
              r = {
                  getStorageValue(e, t) {
                      let a = localStorage.getItem(e);
                      return a || (localStorage.setItem(e, t), t);
                  },
                  inject(t) {
                      let o = t || a(e.selectors.signatureTable);
                      if (!o || o.dataset.sigInjected) return;
                      let i = localStorage.getItem(e.storage.name);
                      !i &&
                          (i = prompt("Enter your name:")?.trim() || "") &&
                          localStorage.setItem(e.storage.name, i);
                      let n = this.getStorageValue(
                              e.storage.logo,
                              e.defaults.logo
                          ),
                          r = this.getStorageValue(
                              e.storage.team,
                              e.defaults.team
                          ),
                          l = this.getStorageValue(
                              e.storage.comp,
                              e.defaults.comp
                          );
                      (o.innerHTML = `
                <table style="border-collapse: collapse; margin-left: 30px;">
                  <tbody>
                    <tr>
                      <td style="padding-left: 10px;"/>
                      <td style="width: 64px; vertical-align: top;">
                        <img src="${n}" width="64" height="64" style="display: block; border-radius: 4px;">
                      </td>
                      <td style="width: 10px;"></td>
                      <td style="vertical-align: middle;">
                        <p style="font-size: 14px; font-family: Roboto, sans-serif; margin: 0; line-height: 1.4; color: #3c4043;">
                          <span style="font-size: 110%;">${i}</span>
                          <br><span style="font-style: italic; color: #70757a;">${r}</span>
                          <br><span style="font-style: italic; color: #70757a;">${l}</span>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>`),
                          (o.dataset.sigInjected = "true");
                  },
              },
              l = {
                  createAutoClicker(t) {
                      let o = null,
                          i = n.create("button", {
                              textContent: "OFF",
                              title: "Auto Click",
                              className: "qm-btn",
                              style: { backgroundColor: "#FF746C" },
                              parent: t,
                              onClick() {
                                  o
                                      ? (clearInterval(o),
                                        (o = null),
                                        (i.textContent = "OFF"),
                                        (i.style.backgroundColor = "#FF746C"))
                                      : ((o = setInterval(() => {
                                            a(e.selectors.autoAddBtn)?.click(),
                                                setTimeout(
                                                    () =>
                                                        a(
                                                            e.selectors
                                                                .autoRemoveBtn
                                                        )?.click(),
                                                    e.intervals.removeDelay
                                                );
                                        }, e.intervals.autoClick)),
                                        (i.textContent = "ON"),
                                        (i.style.backgroundColor = "#77DD77"));
                              },
                          });
                  },
                  createCheckButton(t) {
                      n.create("button", {
                          innerHTML: `
              <img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 20px; height: 20px;">
              <span id="${e.selectors.badge}" class="qm-badge">+</span>`,
                          title: "Click Follow-up Item",
                          className: "qm-btn",
                          style: { backgroundColor: "#A2BFFE" },
                          parent: t,
                          async onClick() {
                              a(e.selectors.dockHome)?.click(),
                                  await n.waitAndClick(
                                      e.selectors.followUpListBtn
                                  );
                          },
                      }),
                          n
                              .waitForElement(e.selectors.followUpListBtn)
                              .then((t) => {
                                  let o = a(`#${e.selectors.badge}`),
                                      i = () => {
                                          let e = t.getAttribute("data-attr");
                                          o &&
                                              (o.style.display =
                                                  e && "0" !== e
                                                      ? "block"
                                                      : "none");
                                      };
                                  new MutationObserver(i).observe(t, {
                                      attributes: !0,
                                      attributeFilter: ["data-attr"],
                                  }),
                                      i();
                              });
                  },
                  createFollowUpSetter(t) {
                      let o = n.create("button", {
                              textContent: "FL Up:",
                              title: "Set Follow-up",
                              className: "qm-btn",
                              style: {
                                  backgroundColor: "#55B4B0",
                                  paddingRight: "48px",
                              },
                              parent: t,
                              async onClick(t) {
                                  if (t.target.id === e.selectors.followUpInput)
                                      return;
                                  let o = a(e.selectors.apptTime);
                                  o &&
                                      !o.dataset.valchoice &&
                                      (o.click(),
                                      await n.waitAndClick(
                                          e.selectors.datePickerToday
                                      ));
                                  let l = parseInt(r.value, 10) || 0;
                                  if (
                                      (a(e.selectors.followUpTime)?.click(), l)
                                  ) {
                                      let s = new Date(),
                                          c = i.addBusinessDays(s, l),
                                          d = i.getDayDiff(s, c);
                                      await n.waitAndClick(
                                          e.selectors.datePickerToday,
                                          d
                                      );
                                  } else
                                      await n.waitAndClick(
                                          e.selectors.finishBtn
                                      );
                                  await n.waitAndClick(
                                      e.selectors.setFollowUpBtn
                                  );
                              },
                          }),
                          r = n.create("input", {
                              id: e.selectors.followUpInput,
                              type: "text",
                              value: "2",
                              parent: o,
                              onClick: (e) => e.stopPropagation(),
                              onfocus: (e) => e.target.select(),
                              oninput(e) {
                                  e.target.value = e.target.value
                                      .replace(/\D/g, "")
                                      .substring(0, 1);
                              },
                          });
                  },
              },
              s = () => {
                  if (window.scrRun) return;
                  (window.scrRun = !0),
                      n.create("style", {
                          textContent: t,
                          parent: document.head,
                      }),
                      o(e.selectors.signatureTable).forEach((e) => r.inject(e));
                  let a = n.create("div", {
                      id: e.selectors.uiPanel,
                      parent: document.body,
                  });
                  l.createAutoClicker(a),
                      l.createCheckButton(a),
                      l.createFollowUpSetter(a),
                      new MutationObserver((t) => {
                          for (let { addedNodes: a } of t)
                              for (let i of a)
                                  1 === i.nodeType &&
                                      (i.matches(e.selectors.signatureTable)
                                          ? r.inject(i)
                                          : o(
                                                e.selectors.signatureTable,
                                                i
                                            ).forEach((e) => r.inject(e)));
                      }).observe(document.body, { childList: !0, subtree: !0 });
              };
          s();
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
                          ((this.#e = document.querySelector(
                              this.#a.selectors.container
                          )),
                          !this.#e)
                      )
                          return;
                      (this.#c = this.#g()),
                          this.#h(),
                          this.#i(),
                          this.#j(),
                          this.#k(),
                          this.#l();
                  }
                  #h() {
                      this.#f = window.trustedTypes?.createPolicy(
                          "agent-dash-policy",
                          { createHTML: (e) => e }
                      ) ?? { createHTML: (e) => e };
                  }
                  #i() {
                      let { icons: t, iconBaseUrl: a } = this.#a.assets;
                      Object.entries(t).forEach(([e, o]) => {
                          "string" == typeof o
                              ? (t[e] = `${a}${o}`)
                              : (o.src = `${a}${o.src}`);
                      });
                  }
                  #g() {
                      return document
                          .querySelector("[alt='profile photo']")
                          ?.src?.match(/photos\/([^/?]+)/)?.[1];
                  }
                  #k() {
                      (this.#d =
                          document.getElementById(this.#a.selectors.uiId) ??
                          document.createElement("div")),
                          (this.#d.id = this.#a.selectors.uiId),
                          this.#d.parentElement ||
                              document.body.appendChild(this.#d),
                          this.#d.addEventListener("click", (e) => {
                              e.target.closest(".close-btn") && this.#m();
                          });
                  }
                  #l() {
                      (this.#b = new MutationObserver(() => this.#n())),
                          this.#b.observe(this.#e, {
                              attributes: !0,
                              childList: !0,
                              subtree: !0,
                              characterData: !0,
                          }),
                          this.#n();
                  }
                  #m() {
                      (this.#d.style.display = "none"),
                          this.#b?.disconnect(),
                          (window.dashRun = 0);
                  }
                  #o(o) {
                      let i = { h: 3600, m: 60, s: 1 };
                      return (o.match(/(\d+)(h|m|s)/g) ?? []).reduce((e, t) => {
                          let a = parseInt(t, 10),
                              o = t.slice(-1);
                          return e + a * (i[o] ?? 0);
                      }, 0);
                  }
                  #p() {
                      let n = this.#e.querySelectorAll("tbody tr");
                      return Array.from(n, (e) => {
                          let t = e.querySelectorAll("td");
                          if (t.length < 9) return null;
                          let a = (
                              t[5].innerText.match(/[a-zA-Z\s]+/)?.[0] ?? ""
                          )
                              .trim()
                              .toLowerCase()
                              .replace(/\s+/g, "-");
                          return {
                              img: e.querySelector("img")?.src,
                              ldap: t[1].innerText.trim(),
                              auxCode: t[3].innerText.trim(),
                              timeInState: t[4].innerText.trim(),
                              phoneCap: a,
                              lastChangeRaw: t[8].innerText.trim(),
                              durationSeconds: this.#o(t[8].innerText),
                          };
                      }).filter(Boolean);
                  }
                  #q(r) {
                      let { auxCode: l, phoneCap: s } = r,
                          c = l,
                          d = l.toLowerCase().replace(/\s+/g, "-");
                      return (
                          "Active" === l &&
                              "busy" === s &&
                              ((c = "Break"), (d = "break")),
                          {
                              ...r,
                              displayStatus: c,
                              statusKey: d,
                              cssClass: `stt-${d}`,
                          }
                      );
                  }
                  #r(p) {
                      let { priorities: u } = this.#a;
                      return p.sort((e, t) => {
                          let a = e.ldap === this.#c,
                              o = t.ldap === this.#c;
                          if (a !== o) return o - a;
                          let i = u[e.statusKey] ?? u.default,
                              n = u[t.statusKey] ?? u.default;
                          return i !== n
                              ? i - n
                              : t.durationSeconds - e.durationSeconds;
                      });
                  }
                  #n() {
                      let g = this.#p().map((e) => this.#q(e)),
                          $ = this.#r(g),
                          f = $.map((e) => {
                              let t = this.#a.assets.icons[e.statusKey],
                                  a = t
                                      ? `<img src="${t.src}" animation="${t.animation}" alt="${e.statusKey} icon"/>`
                                      : "";
                              return `
			  <div class="tr ${e.cssClass}">
				<div class="td left">
				  <img src="${e.img}" alt="Avatar for ${e.ldap}" />
				  <p>${e.ldap}</p>
				</div>
				<div class="td right">
				  <div>
					<p>${e.lastChangeRaw} <span>(${e.timeInState})</span></p>
					<p>${e.displayStatus}</p> 
				  </div>
				  ${a}
				</div>
			  </div>`;
                          }).join(""),
                          m = `
			<div class="ui-content-wrapper">
			  <button class="close-btn" title="Close">
				<img src="${this.#a.assets.icons.close}" alt="Close"/>
			  </button>
			  <div class="ui-table">${f}</div>
			</div>`;
                      (this.#d.innerHTML = this.#f.createHTML(m)),
                          (this.#d.style.display = "flex");
                  }
                  #j() {
                      if (document.getElementById(this.#a.selectors.styleId))
                          return;
                      let b = `
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
			  z-index: 10; background: transparent; transition: transform 0.2s ease; 
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
			  background-color: #F8F9FA; color: #495057;
			}
			.ui-table .left { justify-content: flex-start; font-weight: 500; font-size: clamp(12px, 4vw, 16px); }
			.ui-table .right { justify-content: flex-end; text-align: right; font-size: clamp(10px, 3.5vw, 14px); }
			
			.ui-table .tr.stt-active .td { background-color: #E6F4EA; color: #1E8449; }
			.ui-table .tr.stt-phone .td { background-color: #FEC7C0; color: #C0392B; }
			.ui-table .tr.stt-email .td { background-color: #ace0fe; color: #1d8fdcff; }
			.ui-table .tr.stt-coffee-break .td { background-color: #D2A993; color: #685347; }
			.ui-table .tr.stt-lunch-break .td { background-color: #FFEA99; color: #E58732; }
			.ui-table .tr.stt-break .td { background-color: #e9ecef; color: #495057; }
			
			.ui-table .tr:hover .td { transform: scale(1.05); z-index: 5; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
			.ui-table .td p { padding: 0 6px; margin: 1px 0; }
			.ui-table .td span { opacity: 0.6; font-size: 0.9em; }
			
			#${
                this.#a.selectors.uiId
            } img { border-radius: 12px; width: 36px; height: 36px; padding: 4px; object-fit: cover; }
			#${this.#a.selectors.uiId} .close-btn img { width: 20px; height: 20px; }
			
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
                          h = document.createElement("style");
                      (h.id = this.#a.selectors.styleId),
                          (h.textContent = this.#f.createHTML(b)),
                          document.head.appendChild(h);
                  }
              }
              new e();
          }
      })()
    : window.location.href.includes("adwords.corp") &&
      (() => {
          let e = {
                  MAX_TRIES: 3,
                  POLL_INTERVAL: 500,
                  PROCESS_DELAY: 1e3,
                  STYLES: {
                      GA4: {
                          backgroundColor: "rgb(255, 229, 180)",
                          borderRadius: "10px",
                          fontWeight: "500",
                      },
                      ADS: {
                          backgroundColor: "rgb(160, 251, 157)",
                          borderRadius: "10px",
                          fontWeight: "500",
                      },
                      UI_OVERLAY: {
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
                          cursor: "pointer",
                          userSelect: "none",
                      },
                  },
              },
              t = (e) => {
                  let t = e[11],
                      a = e[64];
                  if (1 === t) {
                      let o = a?.[2]?.[4]?.split("'")?.[7]?.split("/")?.[1];
                      return { type: "ADS", label: o ?? "no label" };
                  }
                  if (32 === t) {
                      let i = a?.[1]?.[4]?.split("'")?.[3];
                      return { type: "GA4", label: i ?? "no label" };
                  }
                  return { type: null, label: "no label" };
              },
              a = (e, { text: t, title: a, okText: o, timeout: i = 800 }) => {
                  e.dataset.copyListener ||
                      ((e.dataset.copyListener = "true"),
                      (e.style.cursor = "pointer"),
                      (e.style.userSelect = "none"),
                      (e.title = a),
                      e.addEventListener("click", async (a) => {
                          a.preventDefault(), a.stopPropagation();
                          try {
                              await navigator.clipboard.writeText(t);
                              let n = e.style.backgroundColor,
                                  r = e.style.color,
                                  l = e.textContent;
                              Object.assign(e.style, {
                                  backgroundColor: "#007bff",
                                  color: "white",
                              }),
                                  o && (e.textContent = o),
                                  setTimeout(() => {
                                      Object.assign(e.style, {
                                          backgroundColor: n,
                                          color: r,
                                      }),
                                          o && (e.textContent = l);
                                  }, i);
                          } catch (s) {
                              console.error("Copy failed", s);
                          }
                      }));
              },
              o = (t) => {
                  let o = document.getElementById("gpt-aw-id-display");
                  o ||
                      (((o = document.createElement("div")).id =
                          "gpt-aw-id-display"),
                      Object.assign(o.style, e.STYLES.UI_OVERLAY),
                      document.body.appendChild(o)),
                      (o.textContent = `AW-ID: ${t}`),
                      a(o, {
                          text: t,
                          title: "Click to copy ID",
                          okText: "Copied!",
                      });
              },
              i = (o) => {
                  let i = document.querySelectorAll(
                      ".conversion-name-cell .internal"
                  );
                  i.forEach((i) => {
                      let n = i.closest(".particle-table-row");
                      if (n) {
                          let r = n.querySelector(
                              '[essfield="aggregated_conversion_source"]'
                          );
                          if (!r?.innerText.toLowerCase().includes("web")) {
                              n.remove();
                              return;
                          }
                      }
                      let l = o.get(i.innerText);
                      if (!l) return;
                      let { type: s, label: c } = t(l);
                      s &&
                          "no label" !== c &&
                          ((i.innerHTML = c),
                          Object.assign(i.style, e.STYLES[s]),
                          a(i, {
                              text: c,
                              title: "Click to copy label",
                              timeout: 500,
                          }));
                  }),
                      document
                          .querySelectorAll(
                              "category-conversions-container-view, conversion-goal-card"
                          )
                          .forEach((e) => {
                              let t = !!e.querySelector(".particle-table-row");
                              t || (e.style.display = "none");
                          });
              },
              n = () => {
                  let t =
                      window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS;
                  if (!t) return;
                  let a = t.match(/AW-(\d*)/)?.[1];
                  if (!a) {
                      console.warn("AW-ID not found.");
                      return;
                  }
                  document
                      .querySelectorAll(".expand-more")
                      .forEach((e) => e.click());
                  try {
                      let n = JSON.parse(t)[1],
                          r = new Map(n.map((e) => [e[1], e]));
                      setTimeout(() => i(r), e.PROCESS_DELAY), o(a);
                  } catch (l) {
                      console.error("Data parsing failed", l);
                  }
              },
              r = 0,
              l = () => {
                  let t =
                      window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS;
                  t
                      ? n()
                      : r < e.MAX_TRIES &&
                        (r++, setTimeout(l, e.POLL_INTERVAL));
              };
          ["complete", "interactive"].includes(document.readyState)
              ? l()
              : window.addEventListener("DOMContentLoaded", l);
      })();
