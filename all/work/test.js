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

                const logo = this.getStorageValue(
                    CONFIG.storage.logo,
                    CONFIG.defaults.logo
                );
                const team = this.getStorageValue(
                    CONFIG.storage.team,
                    CONFIG.defaults.team
                );
                const comp = this.getStorageValue(
                    CONFIG.storage.comp,
                    CONFIG.defaults.comp
                );

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
            },
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
} else if (window.location.href.includes("casemon2.corp")) {
    (() => {
        if (window.dashRun) return;
        window.dashRun = 1;

        class AgentDashboard {
            #config = {
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

            #observer = null;
            #currentUserLdap = null;
            #uiElement = null;
            #targetContainer = null;
            #trustedPolicy = null;

            constructor() {
                this.#targetContainer = document.querySelector(
                    this.#config.selectors.container
                );
                if (!this.#targetContainer) return;

                this.#currentUserLdap = this.#getCurrentUserLdap();
                this.#initTrustedTypes();
                this.#normalizeIconUrls();
                this.#injectStyles();
                this.#createOverlay();
                this.#initObserver();
            }

            #initTrustedTypes() {
                this.#trustedPolicy = window.trustedTypes?.createPolicy(
                    "agent-dash-policy",
                    {
                        createHTML: (string) => string,
                    }
                ) ?? { createHTML: (s) => s };
            }

            #normalizeIconUrls() {
                const { icons, iconBaseUrl } = this.#config.assets;
                Object.entries(icons).forEach(([key, value]) => {
                    if (typeof value === "string") {
                        icons[key] = `${iconBaseUrl}${value}`;
                    } else {
                        value.src = `${iconBaseUrl}${value.src}`;
                    }
                });
            }

            #getCurrentUserLdap() {
                return document
                    .querySelector("[alt='profile photo']")
                    ?.src?.match(/photos\/([^/?]+)/)?.[1];
            }

            #createOverlay() {
                this.#uiElement =
                    document.getElementById(this.#config.selectors.uiId) ??
                    document.createElement("div");
                this.#uiElement.id = this.#config.selectors.uiId;

                if (!this.#uiElement.parentElement) {
                    document.body.appendChild(this.#uiElement);
                }

                this.#uiElement.addEventListener("click", (e) => {
                    if (e.target.closest(".close-btn")) this.#destroy();
                });
            }

            #initObserver() {
                this.#observer = new MutationObserver(() => this.#render());
                this.#observer.observe(this.#targetContainer, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    characterData: true,
                });
                this.#render();
            }

            #destroy() {
                this.#uiElement.style.display = "none";
                this.#observer?.disconnect();
                window.dashRun = 0;
            }

            #parseDurationToSeconds(timeStr) {
                const multipliers = { h: 3600, m: 60, s: 1 };
                return (timeStr.match(/(\d+)(h|m|s)/g) ?? []).reduce(
                    (total, part) => {
                        const value = parseInt(part, 10);
                        const unit = part.slice(-1);
                        return total + value * (multipliers[unit] ?? 0);
                    },
                    0
                );
            }

            #scrapeTableData() {
                const rows = this.#targetContainer.querySelectorAll("tbody tr");

                return Array.from(rows, (tr) => {
                    const cells = tr.querySelectorAll("td");
                    if (cells.length < 9) return null;

                    const phoneCap = (
                        cells[5].innerText.match(/[a-zA-Z\s]+/)?.[0] ?? ""
                    )
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "-");

                    return {
                        img: tr.querySelector("img")?.src,
                        ldap: cells[1].innerText.trim(),
                        auxCode: cells[3].innerText.trim(),
                        timeInState: cells[4].innerText.trim(),
                        phoneCap,
                        lastChangeRaw: cells[8].innerText.trim(),
                        durationSeconds: this.#parseDurationToSeconds(
                            cells[8].innerText
                        ),
                    };
                }).filter(Boolean);
            }

            #normalizeAgentStatus(agent) {
                let { auxCode, phoneCap } = agent;
                let displayStatus = auxCode;
                let statusKey = auxCode.toLowerCase().replace(/\s+/g, "-");

                if (auxCode === "Active" && phoneCap === "busy") {
                    displayStatus = "Break";
                    statusKey = "break";
                }

                return {
                    ...agent,
                    displayStatus,
                    statusKey,
                    cssClass: `stt-${statusKey}`,
                };
            }

            #sortAgents(agents) {
                const { priorities } = this.#config;

                return agents.sort((a, b) => {
                    const isUserA = a.ldap === this.#currentUserLdap;
                    const isUserB = b.ldap === this.#currentUserLdap;

                    if (isUserA !== isUserB) return isUserB - isUserA;

                    const priorityA =
                        priorities[a.statusKey] ?? priorities.default;
                    const priorityB =
                        priorities[b.statusKey] ?? priorities.default;

                    if (priorityA !== priorityB) return priorityA - priorityB;

                    return b.durationSeconds - a.durationSeconds;
                });
            }

            #render() {
                const agents = this.#scrapeTableData().map((agent) =>
                    this.#normalizeAgentStatus(agent)
                );

                const sortedAgents = this.#sortAgents(agents);

                const rowsHtml = sortedAgents
                    .map((agent) => {
                        const iconConfig =
                            this.#config.assets.icons[agent.statusKey];
                        const iconHtml = iconConfig
                            ? `<img src="${iconConfig.src}" animation="${iconConfig.animation}" alt="${agent.statusKey} icon"/>`
                            : "";

                        return `
			  <div class="tr ${agent.cssClass}">
				<div class="td left">
				  <img src="${agent.img}" alt="Avatar for ${agent.ldap}" />
				  <p>${agent.ldap}</p>
				</div>
				<div class="td right">
				  <div>
					<p>${agent.lastChangeRaw} <span>(${agent.timeInState})</span></p>
					<p>${agent.displayStatus}</p> 
				  </div>
				  ${iconHtml}
				</div>
			  </div>`;
                    })
                    .join("");

                const uiHtml = `
			<div class="ui-content-wrapper">
			  <button class="close-btn" title="Close">
				<img src="${this.#config.assets.icons.close}" alt="Close"/>
			  </button>
			  <div class="ui-table">${rowsHtml}</div>
			</div>`;

                this.#uiElement.innerHTML =
                    this.#trustedPolicy.createHTML(uiHtml);
                this.#uiElement.style.display = "flex";
            }

            #injectStyles() {
                if (document.getElementById(this.#config.selectors.styleId))
                    return;

                const css = `
			#${this.#config.selectors.uiId} { 
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
                this.#config.selectors.uiId
            } img { border-radius: 12px; width: 36px; height: 36px; padding: 4px; object-fit: cover; }
			#${this.#config.selectors.uiId} .close-btn img { width: 20px; height: 20px; }
			
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

                const styleEl = document.createElement("style");
                styleEl.id = this.#config.selectors.styleId;
                styleEl.textContent = this.#trustedPolicy.createHTML(css);
                document.head.appendChild(styleEl);
            }
        }

        new AgentDashboard();
    })();
} else if (window.location.href.includes("adwords.corp")) {
    (() => {
        const CONFIG = {
            MAX_TRIES: 3,
            POLL_INTERVAL: 500,
            PROCESS_DELAY: 1000,
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
        };

        const parseConversionData = (data) => {
            const typeId = data[11];
            const rawLabelStr = data[64];

            if (typeId === 1) {
                const label = rawLabelStr?.[2]?.[4]
                    ?.split("'")?.[7]
                    ?.split("/")?.[1];
                return { type: "ADS", label: label ?? "no label" };
            }

            if (typeId === 32) {
                const label = rawLabelStr?.[1]?.[4]?.split("'")?.[3];
                return { type: "GA4", label: label ?? "no label" };
            }

            return { type: null, label: "no label" };
        };

        const setupCopyFeature = (
            el,
            { text, title, okText, timeout = 800 }
        ) => {
            if (el.dataset.copyListener) return;
            el.dataset.copyListener = "true";

            el.style.cursor = "pointer";
            el.style.userSelect = "none";
            el.title = title;

            el.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();

                try {
                    await navigator.clipboard.writeText(text);
                    const originalBg = el.style.backgroundColor;
                    const originalColor = el.style.color;
                    const originalContent = el.textContent;

                    Object.assign(el.style, {
                        backgroundColor: "#007bff",
                        color: "white",
                    });
                    if (okText) el.textContent = okText;

                    setTimeout(() => {
                        Object.assign(el.style, {
                            backgroundColor: originalBg,
                            color: originalColor,
                        });
                        if (okText) el.textContent = originalContent;
                    }, timeout);
                } catch (err) {
                    console.error("Copy failed", err);
                }
            });
        };

        const updateUIOverlay = (id) => {
            let el = document.getElementById("gpt-aw-id-display");
            if (!el) {
                el = document.createElement("div");
                el.id = "gpt-aw-id-display";
                Object.assign(el.style, CONFIG.STYLES.UI_OVERLAY);
                document.body.appendChild(el);
            }

            el.textContent = `AW-ID: ${id}`;
            setupCopyFeature(el, {
                text: id,
                title: "Click to copy ID",
                okText: "Copied!",
            });
        };

        const processRows = (dataMap) => {
            const cells = document.querySelectorAll(
                ".conversion-name-cell .internal"
            );

            cells.forEach((cell) => {
                const row = cell.closest(".particle-table-row");
                if (row) {
                    const sourceField = row.querySelector(
                        '[essfield="aggregated_conversion_source"]'
                    );
                    if (!sourceField?.innerText.toLowerCase().includes("web")) {
                        row.remove();
                        return;
                    }
                }

                const match = dataMap.get(cell.innerText);
                if (!match) return;

                const { type, label } = parseConversionData(match);
                if (type && label !== "no label") {
                    cell.innerHTML = label;
                    Object.assign(cell.style, CONFIG.STYLES[type]);

                    setupCopyFeature(cell, {
                        text: label,
                        title: "Click to copy label",
                        timeout: 500,
                    });
                }
            });

            document
                .querySelectorAll(
                    "category-conversions-container-view, conversion-goal-card"
                )
                .forEach((container) => {
                    const hasRows = !!container.querySelector(
                        ".particle-table-row"
                    );
                    if (!hasRows) container.style.display = "none";
                });
        };

        const initialize = () => {
            const rawData =
                window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS;
            if (!rawData) return;

            const awId = rawData.match(/AW-(\d*)/)?.[1];
            if (!awId) {
                console.warn("AW-ID not found.");
                return;
            }

            document
                .querySelectorAll(".expand-more")
                .forEach((btn) => btn.click());

            try {
                const parsedEntries = JSON.parse(rawData)[1];
                const dataMap = new Map(
                    parsedEntries.map((entry) => [entry[1], entry])
                );

                setTimeout(() => processRows(dataMap), CONFIG.PROCESS_DELAY);
                updateUIOverlay(awId);
            } catch (e) {
                console.error("Data parsing failed", e);
            }
        };

        let attempts = 0;
        const poll = () => {
            const isDataReady =
                window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS;

            if (isDataReady) {
                initialize();
            } else if (attempts < CONFIG.MAX_TRIES) {
                attempts++;
                setTimeout(poll, CONFIG.POLL_INTERVAL);
            }
        };

        if (["complete", "interactive"].includes(document.readyState)) {
            poll();
        } else {
            window.addEventListener("DOMContentLoaded", poll);
        }
    })();
}
