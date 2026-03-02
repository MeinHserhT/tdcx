if (window.location.href.includes("cases.connect")) {
    (() => {
        const CONFIG = {
            intervals: {
                autoClick: 18000,
                removeDelay: 6000,
                waitPoll: 500,
                waitTimeout: 3000,
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
                signatureTable: 'editor #email-body-content table[width="348"]',
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
        };

        const STYLES = `
        #${CONFIG.selectors.uiPanel} {
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
        #${CONFIG.selectors.followUpInput} {
          position: absolute; top: 50%; transform: translateY(-50%);
          right: 8px; width: 32px; height: 28px; padding: 0; border: none;
          border-radius: 3px; background: rgba(255, 255, 255, 0.9);
          color: #333; font-weight: bold; font-size: 14px; text-align: center;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
          transition: box-shadow 0.2s ease; -moz-appearance: textfield;
        }
        #${CONFIG.selectors.followUpInput}:focus {
          outline: none;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px rgba(255, 255, 255, 0.7);
        }
        .qm-badge {
          display: none; position: absolute; top: -5px; right: -5px;
          background: red; border-radius: 50%; padding: 2px 5px; line-height: 1;
        }
      `;

        const $ = (s, ctx = document) => ctx.querySelector(s);
        const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

        const dateUtils = {
            addBusinessDays(startDate, days) {
                const date = new Date(startDate);
                let added = 0;
                while (added < days) {
                    date.setDate(date.getDate() + 1);
                    const day = date.getDay();
                    if (day !== 0 && day !== 6) added++;
                }
                return date;
            },
            getDayDiff: (d1, d2) => Math.round((d2 - d1) / 86400000),
        };

        const domUtils = {
            waitForElement(selector, timeout = CONFIG.intervals.waitTimeout) {
                return new Promise((resolve, reject) => {
                    const start = Date.now();
                    const timer = setInterval(() => {
                        const el = $(selector);
                        if (el?.offsetParent) {
                            clearInterval(timer);
                            resolve(el);
                        } else if (Date.now() - start > timeout) {
                            clearInterval(timer);
                            reject(new Error(`Timeout: ${selector}`));
                        }
                    }, CONFIG.intervals.waitPoll);
                });
            },

            async waitAndClick(selector, siblingSteps = 0) {
                const el = await this.waitForElement(selector);
                let target = el;
                for (let i = 0; i < siblingSteps; i++) {
                    target = target?.nextElementSibling;
                }
                target?.click();
                return target;
            },

            create(tag, { parent, onClick, style, ...props } = {}) {
                const el = Object.assign(document.createElement(tag), props);
                if (style) Object.assign(el.style, style);
                if (onClick) el.addEventListener("click", onClick);
                if (parent) parent.appendChild(el);
                return el;
            },
        };

        const signatureManager = {
            getStorageValue(key, fallback) {
              const val = localStorage.getItem(key);
              if (val) return val;
              localStorage.setItem(key, fallback);
              return fallback;
            },
          
            inject(target) {
              const table = target || $(CONFIG.selectors.signatureTable);
              if (!table || table.dataset.sigInjected) return;
          
              let name = localStorage.getItem(CONFIG.storage.name);
              if (!name) {
                name = prompt("Enter your name:")?.trim() || "";
                if (name) localStorage.setItem(CONFIG.storage.name, name);
              }
          
              const logo = this.getStorageValue(CONFIG.storage.logo, CONFIG.defaults.logo);
              const team = this.getStorageValue(CONFIG.storage.team, CONFIG.defaults.team);
              const comp = this.getStorageValue(CONFIG.storage.comp, CONFIG.defaults.comp);
          
              table.innerHTML = `
                <table style="border-collapse: collapse; margin-left: 30px;">
                  <tbody>
                    <tr>
                      <td style="padding-left: 10px;"/>
                      <td style="width: 64px; vertical-align: top;">
                        <img src="${logo}" width="64" height="64" style="display: block; border-radius: 4px;">
                      </td>
                      <td style="width: 10px;"></td>
                      <td style="vertical-align: middle;">
                        <p style="font-size: 14px; font-family: Roboto, sans-serif; margin: 0; line-height: 1.4; color: #3c4043;">
                          <span style="font-size: 110%;">${name}</span>
                          <br><span style="font-style: italic; color: #70757a;">${team}</span>
                          <br><span style="font-style: italic; color: #70757a;">${comp}</span>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>`;
              table.dataset.sigInjected = "true";
            }
          };

        const components = {
            createAutoClicker(parent) {
                let timer = null;
                const btn = domUtils.create("button", {
                    textContent: "OFF",
                    title: "Auto Click",
                    className: "qm-btn",
                    style: { backgroundColor: "#FF746C" },
                    parent,
                    onClick: () => {
                        if (timer) {
                            clearInterval(timer);
                            timer = null;
                            btn.textContent = "OFF";
                            btn.style.backgroundColor = "#FF746C";
                        } else {
                            timer = setInterval(() => {
                                $(CONFIG.selectors.autoAddBtn)?.click();
                                setTimeout(
                                    () =>
                                        $(
                                            CONFIG.selectors.autoRemoveBtn
                                        )?.click(),
                                    CONFIG.intervals.removeDelay
                                );
                            }, CONFIG.intervals.autoClick);
                            btn.textContent = "ON";
                            btn.style.backgroundColor = "#77DD77";
                        }
                    },
                });
            },

            createCheckButton(parent) {
                domUtils.create("button", {
                    innerHTML: `
              <img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 20px; height: 20px;">
              <span id="${CONFIG.selectors.badge}" class="qm-badge">+</span>`,
                    title: "Click Follow-up Item",
                    className: "qm-btn",
                    style: { backgroundColor: "#A2BFFE" },
                    parent,
                    onClick: async () => {
                        $(CONFIG.selectors.dockHome)?.click();
                        await domUtils.waitAndClick(
                            CONFIG.selectors.followUpListBtn
                        );
                    },
                });

                domUtils
                    .waitForElement(CONFIG.selectors.followUpListBtn)
                    .then((el) => {
                        const badge = $(`#${CONFIG.selectors.badge}`);
                        const update = () => {
                            const count = el.getAttribute("data-attr");
                            if (badge)
                                badge.style.display =
                                    count && count !== "0" ? "block" : "none";
                        };
                        new MutationObserver(update).observe(el, {
                            attributes: true,
                            attributeFilter: ["data-attr"],
                        });
                        update();
                    });
            },

            createFollowUpSetter(parent) {
                const wrapper = domUtils.create("button", {
                    textContent: "FL Up:",
                    title: "Set Follow-up",
                    className: "qm-btn",
                    style: { backgroundColor: "#55B4B0", paddingRight: "48px" },
                    parent,
                    onClick: async (e) => {
                        if (e.target.id === CONFIG.selectors.followUpInput)
                            return;

                        const appt = $(CONFIG.selectors.apptTime);
                        if (appt && !appt.dataset.valchoice) {
                            appt.click();
                            await domUtils.waitAndClick(
                                CONFIG.selectors.datePickerToday
                            );
                        }

                        const days = parseInt(input.value, 10) || 0;
                        $(CONFIG.selectors.followUpTime)?.click();

                        if (!days) {
                            await domUtils.waitAndClick(
                                CONFIG.selectors.finishBtn
                            );
                        } else {
                            const today = new Date();
                            const targetDate = dateUtils.addBusinessDays(
                                today,
                                days
                            );
                            const diff = dateUtils.getDayDiff(
                                today,
                                targetDate
                            );
                            await domUtils.waitAndClick(
                                CONFIG.selectors.datePickerToday,
                                diff
                            );
                        }
                        await domUtils.waitAndClick(
                            CONFIG.selectors.setFollowUpBtn
                        );
                    },
                });

                const input = domUtils.create("input", {
                    id: CONFIG.selectors.followUpInput,
                    type: "text",
                    value: "2",
                    parent: wrapper,
                    onClick: (e) => e.stopPropagation(),
                    onfocus: (e) => e.target.select(),
                    oninput: (e) => {
                        e.target.value = e.target.value
                            .replace(/\D/g, "")
                            .substring(0, 1);
                    },
                });
            },
        };

        const init = () => {
            if (window.scrRun) return;
            window.scrRun = true;

            domUtils.create("style", {
                textContent: STYLES,
                parent: document.head,
            });
            $$(CONFIG.selectors.signatureTable).forEach((el) =>
                signatureManager.inject(el)
            );

            const panel = domUtils.create("div", {
                id: CONFIG.selectors.uiPanel,
                parent: document.body,
            });
            components.createAutoClicker(panel);
            components.createCheckButton(panel);
            components.createFollowUpSetter(panel);

            new MutationObserver((mutations) => {
                for (const { addedNodes } of mutations) {
                    for (const node of addedNodes) {
                        if (node.nodeType !== 1) continue;
                        if (node.matches(CONFIG.selectors.signatureTable)) {
                            signatureManager.inject(node);
                        } else {
                            $$(CONFIG.selectors.signatureTable, node).forEach(
                                (el) => signatureManager.inject(el)
                            );
                        }
                    }
                }
            }).observe(document.body, { childList: true, subtree: true });
        };

        init();
    })();
}
