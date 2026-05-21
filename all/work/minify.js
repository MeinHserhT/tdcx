!(function () {
    "use strict";
    class t {
        static create(
            t,
            {
                parent: e,
                text: i,
                html: s,
                className: n,
                style: o,
                onClick: a,
                ...r
            } = {}
        ) {
            let l = document.createElement(t);
            return (
                i && (l.textContent = i),
                s && (l.innerHTML = s),
                n && (l.className = n),
                o && Object.assign(l.style, o),
                a && l.addEventListener("click", a),
                Object.entries(r).forEach(([t, e]) => {
                    t.startsWith("on") && "function" == typeof e
                        ? (l[t] = e)
                        : l.setAttribute(t, e);
                }),
                e && e.appendChild(l),
                l
            );
        }
        static select(t, e = document) {
            return e.querySelector(t);
        }
        static selectAll(t, e = document) {
            return Array.from(e.querySelectorAll(t));
        }
        static waitFor(t, e = 3e3, i = 500) {
            return new Promise((s, n) => {
                let o = Date.now(),
                    a = setInterval(() => {
                        let i = this.select(t);
                        i?.offsetParent
                            ? (clearInterval(a), s(i))
                            : Date.now() - o > e &&
                              (clearInterval(a),
                              n(Error(`Timeout waiting for: ${t}`)));
                    }, i);
            });
        }
        static async waitAndClick(t, e = 0) {
            let i = await this.waitFor(t),
                s = i;
            for (let n = 0; n < e; n++) s = s?.nextElementSibling;
            return s?.click(), s;
        }
    }
    class e {
        static async copyWithFeedback(
            t,
            e,
            { okText: i = "Copied!", timeout: s = 800 } = {}
        ) {
            if (!e.dataset.copying) {
                e.dataset.copying = "true";
                try {
                    await navigator.clipboard.writeText(t);
                    let {
                            backgroundColor: n,
                            color: o,
                            textContent: a,
                        } = e.style,
                        r = e.textContent;
                    Object.assign(e.style, {
                        backgroundColor: "#007bff",
                        color: "white",
                    }),
                        i && (e.textContent = i),
                        setTimeout(() => {
                            Object.assign(e.style, {
                                backgroundColor: n,
                                color: o,
                            }),
                                i && (e.textContent = r),
                                delete e.dataset.copying;
                        }, s);
                } catch (l) {
                    console.error("Clipboard copy failed", l),
                        delete e.dataset.copying;
                }
            }
        }
    }
    let i = window.location.href;
    i.includes("cases.connect")
        ? new (class e {
              constructor() {
                  (this.config = {
                      intervals: { autoClick: 18e3, removeDelay: 6e3 },
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
                  }),
                      (this.autoClickTimer = null);
              }
              init() {
                  window.__connectCrmInitialized ||
                      ((window.__connectCrmInitialized = !0),
                      this.injectStyles(),
                      this.setupObserver(),
                      t
                          .selectAll(this.config.selectors.signatureTable)
                          .forEach(() => this.injectSignature()),
                      this.buildUI());
              }
              injectStyles() {
                  let e = `
                #${this.config.selectors.uiPanel} { position: fixed; bottom: 16px; left: 16px; display: flex; gap: 8px; align-items: center; z-index: 9999; }
                .qm-btn { z-index: 10; color: white; padding: 12px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: all 0.3s ease; font-size: 14px; position: relative; display: flex; align-items: center; justify-content: center; }
                #${this.config.selectors.followUpInput} { position: absolute; top: 50%; transform: translateY(-50%); right: 8px; width: 32px; height: 28px; padding: 0; border: none; border-radius: 3px; background: rgba(255, 255, 255, 0.9); color: #333; font-weight: bold; font-size: 14px; text-align: center; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); transition: box-shadow 0.2s ease; -moz-appearance: textfield; }
                #${this.config.selectors.followUpInput}:focus { outline: none; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px rgba(255, 255, 255, 0.7); }
                .qm-badge { display: none; position: absolute; top: -5px; right: -5px; background: red; border-radius: 50%; padding: 2px 5px; line-height: 1; }
            `;
                  t.create("style", { text: e, parent: document.head });
              }
              buildUI() {
                  let e = t.create("div", {
                      id: this.config.selectors.uiPanel,
                      parent: document.body,
                  });
                  this.createAutoClickerBtn(e),
                      this.createCheckBtn(e),
                      this.createFollowUpBtn(e),
                      this.createSignBtn(e);
              }
              createAutoClickerBtn(e) {
                  let i = t.create("button", {
                      text: "OFF",
                      title: "Auto Click",
                      className: "qm-btn",
                      style: { backgroundColor: "#FF746C" },
                      parent: e,
                      onClick: () => {
                          this.autoClickTimer
                              ? (clearInterval(this.autoClickTimer),
                                (this.autoClickTimer = null),
                                Object.assign(i.style, {
                                    backgroundColor: "#FF746C",
                                }),
                                (i.textContent = "OFF"))
                              : ((this.autoClickTimer = setInterval(() => {
                                    t
                                        .select(
                                            this.config.selectors.autoAddBtn
                                        )
                                        ?.click(),
                                        setTimeout(
                                            () =>
                                                t
                                                    .select(
                                                        this.config.selectors
                                                            .autoRemoveBtn
                                                    )
                                                    ?.click(),
                                            this.config.intervals.removeDelay
                                        );
                                }, this.config.intervals.autoClick)),
                                Object.assign(i.style, {
                                    backgroundColor: "#77DD77",
                                }),
                                (i.textContent = "ON"));
                      },
                  });
              }
              createCheckBtn(e) {
                  t.create("button", {
                      html: `<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 20px; height: 20px;"><span id="${this.config.selectors.badge}" class="qm-badge">+</span>`,
                      title: "Click Follow-up Item",
                      className: "qm-btn",
                      style: { backgroundColor: "#A2BFFE" },
                      parent: e,
                      onClick: async () => {
                          t.select(this.config.selectors.dockHome)?.click(),
                              await t.waitAndClick(
                                  this.config.selectors.followUpListBtn
                              );
                      },
                  }),
                      t
                          .waitFor(this.config.selectors.followUpListBtn)
                          .then((e) => {
                              let i = t.select(
                                      `#${this.config.selectors.badge}`
                                  ),
                                  s = () => {
                                      let t = e.getAttribute("data-attr");
                                      i &&
                                          (i.style.display =
                                              t && "0" !== t
                                                  ? "block"
                                                  : "none");
                                  };
                              new MutationObserver(s).observe(e, {
                                  attributes: !0,
                                  attributeFilter: ["data-attr"],
                              }),
                                  s();
                          });
              }
              createFollowUpBtn(e) {
                  let i = t.create("button", {
                      text: "FL Up:",
                      title: "Set Follow-up",
                      className: "qm-btn",
                      style: {
                          backgroundColor: "#55B4B0",
                          paddingRight: "48px",
                      },
                      parent: e,
                      onClick: async (e) => {
                          if (
                              e.target.id ===
                              this.config.selectors.followUpInput
                          )
                              return;
                          let i = t.select(this.config.selectors.apptTime);
                          i &&
                              !i.dataset.valchoice &&
                              (i.click(),
                              await t.waitAndClick(
                                  this.config.selectors.datePickerToday
                              ));
                          let s = t.select(
                                  `#${this.config.selectors.followUpInput}`
                              ),
                              n = parseInt(s.value, 10) || 0;
                          if (
                              (t
                                  .select(this.config.selectors.followUpTime)
                                  ?.click(),
                              n)
                          ) {
                              let o = this.addBusinessDays(new Date(), n),
                                  a = Math.round((o - new Date()) / 864e5);
                              await t.waitAndClick(
                                  this.config.selectors.datePickerToday,
                                  a
                              );
                          } else
                              await t.waitAndClick(
                                  this.config.selectors.finishBtn
                              );
                          await t.waitAndClick(
                              this.config.selectors.setFollowUpBtn
                          );
                      },
                  });
                  t.create("input", {
                      id: this.config.selectors.followUpInput,
                      type: "text",
                      value: "2",
                      parent: i,
                      onClick: (t) => t.stopPropagation(),
                      onfocus: (t) => t.target.select(),
                      oninput(t) {
                          t.target.value = t.target.value
                              .replace(/\D/g, "")
                              .substring(0, 1);
                      },
                  });
              }
              createSignBtn(e) {
                  t.create("button", {
                      text: "Sign",
                      title: "Insert Signature at Cursor",
                      className: "qm-btn",
                      style: { backgroundColor: "#FFB347", color: "#333" },
                      parent: e,
                      onmousedown: (t) => t.preventDefault(),
                      onClick: () => this.insertSignatureAtCursor(),
                  });
              }
              getStorageData() {
                  let t = localStorage.getItem(this.config.storage.name);
                  return (
                      !t &&
                          (t =
                              prompt(
                                  "Enter your name (saves to localStorage):"
                              )?.trim() || "") &&
                          localStorage.setItem(this.config.storage.name, t),
                      {
                          name: t,
                          logo:
                              localStorage.getItem(this.config.storage.logo) ||
                              this.config.defaults.logo,
                          team:
                              localStorage.getItem(this.config.storage.team) ||
                              this.config.defaults.team,
                          comp:
                              localStorage.getItem(this.config.storage.comp) ||
                              this.config.defaults.comp,
                      }
                  );
              }
              buildSignatureElement() {
                  let t = this.getStorageData(),
                      e = document.createElement("table");
                  return (
                      e.setAttribute(
                          "style",
                          "width:348px; padding: 0px 30px;"
                      ),
                      (e.innerHTML = `
                <tbody><tr align="left">
                    <td style="width: 64px; vertical-align: top;"><img src="${t.logo}" width="64" height="64" style="display: block; border-radius: 4px;"></td>
                    <td style="width: 10px;"/>
                    <td style="vertical-align: middle;"><p style="font-size: 14px; font-family: Roboto, sans-serif; margin: 0; line-height: 1.4; color: #3c4043;">
                        <strong data-infosetting="your-name" style="font-size: 110%;">${t.name}</strong><br>
                        <span style="font-style: italic; color: #70757a;">${t.team}</span><br>
                        <span style="font-style: italic; color: #70757a;">${t.comp}</span>
                    </p></td>
                </tr></tbody>`),
                      e
                  );
              }
              injectSignature() {
                  let e = t.select(
                      "#email-body-content-top-content > table:nth-child(3)"
                  );
                  e && e.remove();
                  let i = t.select(
                      "#email-body-content-top-content > table:nth-child(2)"
                  );
                  if (!i || i.nextElementSibling?.dataset?.sigInjected) return;
                  let s = this.buildSignatureElement();
                  (s.dataset.sigInjected = "true"),
                      i.insertAdjacentElement("afterend", s);
              }
              insertSignatureAtCursor() {
                  let t = window.getSelection();
                  if (t && t.rangeCount > 0) {
                      let e = t.getRangeAt(0),
                          i = document.createElement("br");
                      e.deleteContents(),
                          e.insertNode(i),
                          e.insertNode(this.buildSignatureElement()),
                          e.setStartAfter(i),
                          e.collapse(!0),
                          t.removeAllRanges(),
                          t.addRange(e);
                  } else
                      alert(
                          "Please place your text cursor inside the email body first."
                      );
              }
              setupObserver() {
                  new MutationObserver((e) => {
                      for (let { addedNodes: i } of e)
                          for (let s of i)
                              1 === s.nodeType &&
                                  (s.matches(
                                      this.config.selectors.signatureTable
                                  )
                                      ? this.injectSignature()
                                      : t
                                            .selectAll(
                                                this.config.selectors
                                                    .signatureTable,
                                                s
                                            )
                                            .forEach(() =>
                                                this.injectSignature()
                                            ));
                  }).observe(document.body, { childList: !0, subtree: !0 });
              }
              addBusinessDays(t, e) {
                  let i = new Date(t),
                      s = 0;
                  for (; s < e; )
                      i.setDate(i.getDate() + 1),
                          0 !== i.getDay() && 6 !== i.getDay() && s++;
                  return i;
              }
          })().init()
        : i.includes("casemon2.corp")
        ? new (class e {
              constructor() {
                  (this.config = {
                      selectors: {
                          container: ".agent-table-container",
                          uiId: "agent_ui",
                          styleId: "agent-dash-styles",
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
                      priorities: {
                          active: 1,
                          phone: 2,
                          "lunch-break": 3,
                          email: 4,
                          "coffee-break": 5,
                          break: 6,
                          default: 99,
                      },
                  }),
                      (this.iconBaseUrl =
                          "https://cdn-icons-png.flaticon.com/512"),
                      (this.observer = null);
              }
              init() {
                  !window.__agentDashInitialized &&
                      ((window.__agentDashInitialized = !0),
                      (this.targetContainer = t.select(
                          this.config.selectors.container
                      )),
                      this.targetContainer &&
                          ((this.currentUserLdap = this.getCurrentUserLdap()),
                          (this.trustedPolicy =
                              window.trustedTypes?.createPolicy(
                                  "agent-dash-policy",
                                  { createHTML: (t) => t }
                              ) ?? { createHTML: (t) => t }),
                          this.normalizeIcons(),
                          this.injectStyles(),
                          this.createOverlay(),
                          this.initObserver()));
              }
              normalizeIcons() {
                  Object.keys(this.config.icons).forEach((t) => {
                      let e = this.config.icons[t];
                      "string" == typeof e
                          ? (this.config.icons[t] = `${this.iconBaseUrl}${e}`)
                          : (e.src = `${this.iconBaseUrl}${e.src}`);
                  });
              }
              getCurrentUserLdap() {
                  return t
                      .select("[alt='profile photo']")
                      ?.src?.match(/photos\/([^/?]+)/)?.[1];
              }
              createOverlay() {
                  (this.uiElement =
                      t.select(`#${this.config.selectors.uiId}`) ||
                      t.create("div", {
                          id: this.config.selectors.uiId,
                          parent: document.body,
                      })),
                      this.uiElement.addEventListener("click", (t) => {
                          t.target.closest(".close-btn") && this.destroy();
                      });
              }
              initObserver() {
                  (this.observer = new MutationObserver(() => this.render())),
                      this.observer.observe(this.targetContainer, {
                          attributes: !0,
                          childList: !0,
                          subtree: !0,
                          characterData: !0,
                      }),
                      this.render();
              }
              destroy() {
                  (this.uiElement.style.display = "none"),
                      this.observer?.disconnect(),
                      (window.__agentDashInitialized = !1);
              }
              parseDurationToSeconds(t) {
                  let e = { h: 3600, m: 60, s: 1 };
                  return (t.match(/(\d+)(h|m|s)/g) ?? []).reduce((t, i) => {
                      let s = parseInt(i, 10),
                          n = i.slice(-1);
                      return t + s * (e[n] ?? 0);
                  }, 0);
              }
              scrapeData() {
                  let e = t.selectAll("tbody tr", this.targetContainer);
                  return e
                      .map((e) => {
                          let i = t.selectAll("td", e);
                          if (i.length < 9) return null;
                          let s = i[3].innerText.trim(),
                              n = (
                                  i[5].innerText.match(/[a-zA-Z\s]+/)?.[0] ?? ""
                              )
                                  .trim()
                                  .toLowerCase()
                                  .replace(/\s+/g, "-"),
                              o = s,
                              a = s.toLowerCase().replace(/\s+/g, "-");
                          return (
                              "Active" === s &&
                                  "busy" === n &&
                                  ((o = "Break"), (a = "break")),
                              {
                                  img: t.select("img", e)?.src,
                                  ldap: i[1].innerText.trim(),
                                  displayStatus: o,
                                  statusKey: a,
                                  cssClass: `stt-${a}`,
                                  timeInState: i[4].innerText.trim(),
                                  lastChangeRaw: i[8].innerText.trim(),
                                  durationSeconds: this.parseDurationToSeconds(
                                      i[8].innerText
                                  ),
                              }
                          );
                      })
                      .filter(Boolean);
              }
              sortAgents(t) {
                  return t.sort((t, e) => {
                      let i = t.ldap === this.currentUserLdap,
                          s = e.ldap === this.currentUserLdap;
                      if (i !== s) return s - i;
                      let n =
                              this.config.priorities[t.statusKey] ??
                              this.config.priorities.default,
                          o =
                              this.config.priorities[e.statusKey] ??
                              this.config.priorities.default;
                      return n !== o
                          ? n - o
                          : e.durationSeconds - t.durationSeconds;
                  });
              }
              render() {
                  let t = this.sortAgents(this.scrapeData()),
                      e = t
                          .map((t) => {
                              let e = this.config.icons[t.statusKey],
                                  i = e
                                      ? `<img src="${e.src}" animation="${e.animation}" alt="${t.statusKey} icon"/>`
                                      : "";
                              return `
                    <div class="tr ${t.cssClass}">
                        <div class="td left"><img src="${t.img}" alt="Avatar" /><p>${t.ldap}</p></div>
                        <div class="td right">
                            <div><p>${t.lastChangeRaw} <span>(${t.timeInState})</span></p><p>${t.displayStatus}</p></div>
                            ${i}
                        </div>
                    </div>`;
                          })
                          .join(""),
                      i = `
                <div class="ui-content-wrapper">
                    <button class="close-btn" title="Close"><img src="${this.config.icons.close}" alt="Close"/></button>
                    <div class="ui-table">${e}</div>
                </div>`;
                  (this.uiElement.innerHTML = this.trustedPolicy.createHTML(i)),
                      (this.uiElement.style.display = "flex");
              }
              injectStyles() {
                  if (t.select(`#${this.config.selectors.styleId}`)) return;
                  let e = `
                #${this.config.selectors.uiId} { position: fixed; height: 100%; width: 100%; top: 0; right: 0; background-color: rgba(0,0,0,0.1); z-index: 999; display: flex; justify-content: flex-end; align-items: center; padding: 20px; font-family: system-ui, sans-serif; pointer-events: none; box-sizing: border-box; }
                .ui-content-wrapper { position: relative; pointer-events: auto; width: 100%; max-width: 380px; }
                .close-btn { position: absolute; top: 0; right: 0; transform: translate(40%, -40%); border: none; cursor: pointer; z-index: 10; background: transparent; transition: transform 0.2s ease; }
                .close-btn:hover { transform: translate(40%, -40%) scale(1.4); }
                .ui-table { display: grid; grid-template-columns: repeat(2, 1fr); width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
                .ui-table .tr { display: contents; }
                .ui-table .td { padding: 8px 12px; display: flex; align-items: center; transition: background-color 0.4s ease, transform 0.2s ease; background-color: #F8F9FA; color: #495057; }
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
                #${this.config.selectors.uiId} img { border-radius: 12px; width: 36px; height: 36px; padding: 4px; object-fit: cover; }
                #${this.config.selectors.uiId} .close-btn img { width: 20px; height: 20px; }
                [animation="pulse"] { animation: pulse 2s infinite ease-in-out; }
                @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
                [animation="wiggle"] { animation: wiggle 0.9s infinite; }
                @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 15%, 45%, 75% { transform: rotate(8deg); } 30%, 60% { transform: rotate(-8deg); } }
                [animation="slide"] { animation: slide-lr 1.2s infinite alternate ease-in-out; }
                @keyframes slide-lr { from { transform: translateX(0); } to { transform: translateX(8px); } }
                @media (max-width: 350px) { .ui-table .right img[alt*="icon"] { display: none; } }
                @media (max-width: 280px) { .ui-table .left img[alt*="Avatar"] { display: none; } }
                @media (max-width: 240px) { .ui-table .right span { display: none; } }
            `;
                  t.create("style", {
                      id: this.config.selectors.styleId,
                      text: this.trustedPolicy.createHTML(e),
                      parent: document.head,
                  });
              }
          })().init()
        : i.includes("adwords.corp") &&
          new (class i {
              constructor() {
                  (this.config = {
                      MAX_TRIES: 3,
                      POLL_INTERVAL: 500,
                      PROCESS_DELAY: 1e3,
                  }),
                      (this.styles = {
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
                          OVERLAY: {
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
                              cursor: "pointer",
                              userSelect: "none",
                          },
                      }),
                      (this.attempts = 0);
              }
              init() {
                  ["complete", "interactive"].includes(document.readyState)
                      ? this.pollData()
                      : window.addEventListener("DOMContentLoaded", () =>
                            this.pollData()
                        );
              }
              pollData() {
                  let t =
                      window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS;
                  t
                      ? this.process(t)
                      : this.attempts < this.config.MAX_TRIES &&
                        (this.attempts++,
                        setTimeout(
                            () => this.pollData(),
                            this.config.POLL_INTERVAL
                        ));
              }
              process(e) {
                  let i = e.match(/AW-(\d*)/)?.[1];
                  if (!i) return console.warn("AW-ID not found.");
                  t.selectAll(".expand-more").forEach((t) => t.click());
                  try {
                      let s = JSON.parse(e)[1],
                          n = new Map(s.map((t) => [t[1], t]));
                      setTimeout(
                          () => this.updateTableRows(n),
                          this.config.PROCESS_DELAY
                      ),
                          this.renderUIOverlay(i);
                  } catch (o) {
                      console.error("Data parsing failed", o);
                  }
              }
              parseConversionData(t) {
                  let e = t[11],
                      i = t[64];
                  if (1 === e) {
                      let s = i?.[2]?.[4]?.split("'")?.[7]?.split("/")?.[1];
                      return { type: "ADS", label: s ?? "no label" };
                  }
                  if (32 === e) {
                      let n = i?.[1]?.[4]?.split("'")?.[3];
                      return { type: "GA4", label: n ?? "no label" };
                  }
                  return { type: null, label: "no label" };
              }
              updateTableRows(i) {
                  t
                      .selectAll(".conversion-name-cell .internal")
                      .forEach((s) => {
                          let n = s.closest(".particle-table-row");
                          if (n) {
                              let o = t.select(
                                  '[essfield="aggregated_conversion_source"]',
                                  n
                              );
                              if (!o?.innerText.toLowerCase().includes("web")) {
                                  n.remove();
                                  return;
                              }
                          }
                          let a = i.get(s.innerText);
                          if (!a) return;
                          let { type: r, label: l } =
                              this.parseConversionData(a);
                          r &&
                              "no label" !== l &&
                              ((s.innerHTML = l),
                              Object.assign(s.style, this.styles[r]),
                              (s.style.cursor = "pointer"),
                              (s.title = "Click to copy label"),
                              s.addEventListener("click", (t) => {
                                  t.preventDefault(),
                                      t.stopPropagation(),
                                      e.copyWithFeedback(l, s);
                              }));
                      }),
                      t
                          .selectAll(
                              "category-conversions-container-view, conversion-goal-card"
                          )
                          .forEach((e) => {
                              t.select(".particle-table-row", e) ||
                                  (e.style.display = "none");
                          });
              }
              renderUIOverlay(i) {
                  let s = t.select("#gpt-aw-id-display");
                  s ||
                      (s = t.create("div", {
                          id: "gpt-aw-id-display",
                          text: `AW-ID: ${i}`,
                          title: "Click to copy ID",
                          style: this.styles.OVERLAY,
                          parent: document.body,
                          onClick(t) {
                              t.preventDefault(), e.copyWithFeedback(i, s);
                          },
                      }));
              }
          })().init();
})();