if (window.location.href.includes("casemon2.corp")) {
    (() => {
        if (window.dashRun) return;
        window.dashRun = 1;

        const ICON_BASE = "https://cdn-icons-png.flaticon.com/512";

        class BentoAgentDashboard {
            #config = {
                selectors: {
                    container: ".agent-table-container",
                    uiId: "bento_agent_ui",
                    styleId: "bento-dash-styles",
                },
                icons: {
                    video: {
                        src: `${ICON_BASE}/9571/9571236.png`,
                        animation: "wiggle",
                    },
                    "coffee-break": {
                        src: `${ICON_BASE}/16108/16108931.png`,
                        animation: "wiggle",
                    },
                    "lunch-break": {
                        src: `${ICON_BASE}/1182/1182132.png`,
                        animation: "pulse",
                    },
                    phone: {
                        src: `${ICON_BASE}/13332/13332839.png`,
                        animation: "wiggle",
                    },
                    email: {
                        src: `${ICON_BASE}/7487/7487055.png`,
                        animation: "slide",
                    },
                    break: {
                        src: `${ICON_BASE}/5140/5140652.png`,
                        animation: "wiggle",
                    },
                    close: `${ICON_BASE}/9403/9403346.png`,
                },
                priorities: {
                    active: 1,
                    video: 2,
                    phone: 2.5,
                    "lunch-break": 3,
                    email: 4,
                    "coffee-break": 5,
                    break: 6,
                    default: 99,
                },
            };

            #observer = null;
            #debounceTimer = null;
            #currentUserLdap = null;
            #uiElement = null;
            #targetContainer = null;
            #trustedPolicy = null;

            constructor() {
                this.#targetContainer = document.querySelector(
                    this.#config.selectors.container
                );
                if (!this.#targetContainer) return;

                this.#currentUserLdap =
                    document
                        .querySelector("[alt='profile photo']")
                        ?.src?.match(/photos\/([^/?]+)/)?.[1] ?? "Unknown";

                this.#trustedPolicy = window.trustedTypes?.createPolicy(
                    "agent-dash-policy",
                    { createHTML: (s) => s }
                ) ?? { createHTML: (s) => s };

                this.#injectStyles();
                this.#createOverlay();
                this.#initObserver();
            }

            #escapeHtml = (str) => {
                const map = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;",
                };
                return String(str || "").replace(/[&<>"']/g, (m) => map[m]);
            };

            #createOverlay() {
                this.#uiElement =
                    document.getElementById(this.#config.selectors.uiId) ??
                    document.createElement("div");
                this.#uiElement.id = this.#config.selectors.uiId;
                if (!this.#uiElement.parentElement)
                    document.body.appendChild(this.#uiElement);

                this.#uiElement.addEventListener("click", (e) => {
                    if (e.target.closest(".close-btn")) this.#destroy();
                    const quickReply = e.target.closest(".quick-reply-btn");
                    if (quickReply)
                        console.log(
                            "Quick reply triggered:",
                            quickReply.dataset.action
                        );
                });
            }

            #initObserver() {
                this.#observer = new MutationObserver(() => {
                    clearTimeout(this.#debounceTimer);
                    this.#debounceTimer = setTimeout(() => this.#render(), 100);
                });
                this.#observer.observe(this.#targetContainer, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    characterData: true,
                });
                this.#render();
            }

            #destroy() {
                this.#uiElement.remove();
                this.#observer?.disconnect();
                clearTimeout(this.#debounceTimer);
                window.dashRun = 0;
            }

            #parseDurationToSeconds(timeStr) {
                return (timeStr.match(/\d+[hms]/g) || []).reduce(
                    (acc, p) =>
                        acc +
                        parseInt(p) *
                            ({ h: 3600, m: 60, s: 1 }[p.slice(-1)] || 0),
                    0
                );
            }

            #scrapeAndNormalizeData() {
                return Array.from(
                    this.#targetContainer.querySelectorAll("tbody tr")
                )
                    .map((tr) => {
                        const cells = tr.querySelectorAll("td");
                        if (cells.length < 9) return null;

                        const phoneCap = (
                            cells[5].innerText.match(/[a-zA-Z\s]+/)?.[0] || ""
                        )
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, "-");
                        let auxCode = cells[3].innerText.trim();
                        let statusKey = auxCode
                            .toLowerCase()
                            .replace(/\s+/g, "-");
                        let displayStatus = auxCode;

                        if (auxCode === "Active" && phoneCap === "busy") {
                            displayStatus = "Break";
                            statusKey = "break";
                        }

                        return {
                            img: tr.querySelector("img")?.src || "",
                            ldap: cells[1].innerText.trim(),
                            timeInState: cells[4].innerText.trim(),
                            lastChangeRaw: cells[8].innerText.trim(),
                            displayStatus,
                            statusKey,
                            cssClass: `stt-${statusKey}`,
                            durationSeconds: this.#parseDurationToSeconds(
                                cells[8].innerText
                            ),
                        };
                    })
                    .filter(Boolean);
            }

            #render() {
                const agents = this.#scrapeAndNormalizeData().sort((a, b) => {
                    if (
                        (a.ldap === this.#currentUserLdap) !==
                        (b.ldap === this.#currentUserLdap)
                    )
                        return (
                            (b.ldap === this.#currentUserLdap) -
                            (a.ldap === this.#currentUserLdap)
                        );
                    const pA =
                        this.#config.priorities[a.statusKey] ??
                        this.#config.priorities.default;
                    const pB =
                        this.#config.priorities[b.statusKey] ??
                        this.#config.priorities.default;
                    return pA !== pB
                        ? pA - pB
                        : b.durationSeconds - a.durationSeconds;
                });

                const activeCount = agents.filter(
                    (a) => a.statusKey === "active"
                ).length;

                const agentRowsHtml = agents
                    .map((a) => {
                        const icon = this.#config.icons[a.statusKey];
                        const safe = {
                            ldap: this.#escapeHtml(a.ldap),
                            img: this.#escapeHtml(a.img),
                            status: this.#escapeHtml(a.displayStatus),
                            state: this.#escapeHtml(a.timeInState),
                            change: this.#escapeHtml(a.lastChangeRaw),
                        };

                        return `
                        <div class="agent-row ${a.cssClass}">
                            <div class="agent-left">
                                <img src="${safe.img}" alt="${
                            safe.ldap
                        }" onerror="this.style.display='none'" />
                                <span>${safe.ldap}</span>
                            </div>
                            <div class="agent-right">
                                <div class="agent-meta">
                                    <span class="time-state">${safe.change} (${
                            safe.state
                        })</span>
                                    <span class="status-text">${
                                        safe.status
                                    }</span> 
                                </div>
                                ${
                                    icon
                                        ? `<img src="${icon.src}" animation="${icon.animation}" alt="${a.statusKey} icon"/>`
                                        : ""
                                }
                            </div>
                        </div>`;
                    })
                    .join("");

                this.#uiElement.innerHTML = this.#trustedPolicy.createHTML(`
                    <div class="bento-wrapper">
                        <button class="close-btn" title="Close"><img src="${
                            this.#config.icons.close
                        }" alt="Close"/></button>
                        <div class="bento-grid">
                            <div class="bento-card card-full card-agents">
                                <div class="agent-list-header">
                                    <h3>Team Status</h3>
                                    <div class="header-counters">
                                        <span class="agent-count active-badge" title="Active Agents">${activeCount} Active</span>
                                        <span class="agent-count total-badge">${
                                            agents.length
                                        } Total</span>
                                    </div>
                                </div>
                                <div class="agent-list-container">${agentRowsHtml}</div>
                            </div>
                        </div>
                    </div>
                `);
                this.#uiElement.style.display = "flex";
            }

            #injectStyles() {
                if (document.getElementById(this.#config.selectors.styleId))
                    return;
                const styleEl = document.createElement("style");
                styleEl.id = this.#config.selectors.styleId;

                // Condensed CSS (formatting retained for rendering readability, line breaks collapsed)
                styleEl.textContent = this.#trustedPolicy.createHTML(`
                    #bento_agent_ui { position: fixed; height: 100%; width: 100%; top: 0; right: 0; background-color: rgba(0,0,0,0.3); z-index: 9999; display: flex; justify-content: flex-end; align-items: center; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; pointer-events: none; box-sizing: border-box; }
                    .bento-wrapper { position: relative; pointer-events: auto; width: 100%; max-width: 320px; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.6); padding: 20px; border: 1px solid rgba(255, 255, 255, 0.4); }
                    .close-btn { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.05); border: none; cursor: pointer; z-index: 10; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
                    .close-btn:hover { background: rgba(0,0,0,0.1); transform: scale(1.1); }
                    .close-btn img { width: 12px; height: 12px; opacity: 0.6; }
                    .bento-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                    .bento-card { background: #ffffff; border-radius: 16px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.04); display: flex; flex-direction: column; }
                    .card-full { grid-column: span 2; }
                    .bento-card h3 { margin: 0 0 12px 0; font-size: 14px; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
                    .header-counters { display: flex; gap: 8px; }
                    .agent-count { font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 600; text-transform: uppercase; }
                    .active-badge { background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
                    .total-badge { background: #F8FAFC; color: #334155; border: 1px solid #E2E8F0; }
                    .card-agents { padding: 0; overflow: hidden; }
                    .agent-list-header { padding: 16px 16px 12px; border-bottom: 1px solid #f1f3f5; display: flex; justify-content: space-between; align-items: center; }
                    .agent-list-header h3 { margin: 0; }
                    .agent-list-container { max-height: 80vh; overflow-y: auto; padding: 12px 6px 12px 12px; }
                    .agent-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; margin-bottom: 8px; border-radius: 14px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
                    .agent-row:last-child { margin-bottom: 0; }
                    .agent-row:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 8px 20px rgba(0,0,0,0.08); cursor: default; }
                    .agent-left { display: flex; align-items: center; gap: 10px; font-weight: 500; font-size: 14px; color: #343a40; }
                    .agent-left img { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; }
                    .agent-right { display: flex; align-items: center; gap: 12px; text-align: right; }
                    .agent-meta { display: flex; flex-direction: column; }
                    .time-state { font-size: 11px; opacity: 0.6; }
                    .status-text { font-size: 12px; font-weight: 600; letter-spacing: 0.3px; padding: 2px 6px; border-radius: 6px; display: inline-block; }
                    .agent-right img { width: 24px; height: 24px; }
                    .stt-active { background: linear-gradient(145deg, #ffffff 0%, #ecfdf5 100%); color: #065F46; border: 1px solid #d1fae5; }
                    .stt-active:hover { background: linear-gradient(145deg, #f0fdf4 0%, #d1fae5 100%); border-color: #a7f3d0; }
                    .stt-phone { background: linear-gradient(145deg, #ffffff 0%, #fef2f2 100%); color: #991B1B; border: 1px solid #fee2e2; }
                    .stt-phone:hover { background: linear-gradient(145deg, #fef2f2 0%, #fecaca 100%); border-color: #fca5a5; }
                    .stt-video { background: linear-gradient(145deg, #ffffff 0%, #eef2ff 100%); color: #3730A3; border: 1px solid #e0e7ff; }
                    .stt-video:hover { background: linear-gradient(145deg, #eef2ff 0%, #c7d2fe 100%); border-color: #a5b4fc; }
                    .stt-email { background: linear-gradient(145deg, #ffffff 0%, #eff6ff 100%); color: #1E40AF; border: 1px solid #dbeafe; }
                    .stt-email:hover { background: linear-gradient(145deg, #eff6ff 0%, #bfdbfe 100%); border-color: #93c5fd; }
                    .stt-coffee-break { background: linear-gradient(145deg, #ffffff 0%, #fff7ed 100%); color: #9A3412; border: 1px solid #ffedd5; }
                    .stt-coffee-break:hover { background: linear-gradient(145deg, #fff7ed 0%, #fed7aa 100%); border-color: #fdba74; }
                    .stt-lunch-break { background: linear-gradient(145deg, #ffffff 0%, #fefce8 100%); color: #854D0E; border: 1px solid #fef08a; }
                    .stt-lunch-break:hover { background: linear-gradient(145deg, #fefce8 0%, #fde047 100%); border-color: #facc15; }
                    .stt-break { background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%); color: #334155; border: 1px solid #f1f5f9; }
                    .stt-break:hover { background: linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%); border-color: #cbd5e1; }
                    [animation="pulse"] { animation: pulse 2s infinite ease-in-out; }
                    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
                    [animation="wiggle"] { animation: wiggle 0.9s infinite; }
                    @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 15%, 45%, 75% { transform: rotate(8deg); } 30%, 60% { transform: rotate(-8deg); } }
                    [animation="slide"] { animation: slide-lr 1.2s infinite alternate ease-in-out; }
                    @keyframes slide-lr { from { transform: translateX(0); } to { transform: translateX(5px); } }
                    .agent-list-container::-webkit-scrollbar { width: 6px; }
                    .agent-list-container::-webkit-scrollbar-track { background: transparent; }
                    .agent-list-container::-webkit-scrollbar-thumb { background-color: #dee2e6; border-radius: 10px; }
                `);
                document.head.appendChild(styleEl);
            }
        }

        new BentoAgentDashboard();
    })();
} else if (window.location.href.includes("cases.connect")) {
    (() => {
        if (window.scrRun) return;
        window.scrRun = true;

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
            #${CONFIG.selectors.uiPanel} { position: fixed; bottom: 16px; left: 16px; display: flex; gap: 8px; align-items: center; z-index: 9999; }
            .qm-btn { z-index: 10; color: white; padding: 12px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: all 0.3s ease; font-size: 14px; position: relative; display: flex; align-items: center; justify-content: center; }
            #${CONFIG.selectors.followUpInput} { position: absolute; top: 50%; transform: translateY(-50%); right: 8px; width: 32px; height: 28px; padding: 0; border: none; border-radius: 3px; background: rgba(255, 255, 255, 0.9); color: #333; font-weight: bold; font-size: 14px; text-align: center; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); transition: box-shadow 0.2s ease; -moz-appearance: textfield; }
            #${CONFIG.selectors.followUpInput}:focus { outline: none; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px rgba(255, 255, 255, 0.7); }
            .qm-badge { display: none; position: absolute; top: -5px; right: -5px; background: red; border-radius: 50%; padding: 2px 5px; line-height: 1; }
        `;

        const $ = (s, ctx = document) => ctx.querySelector(s);

        const dateUtils = {
            addBusinessDays: (startDate, days) => {
                const d = new Date(startDate);
                for (let i = 0; i < days; ) {
                    d.setDate(d.getDate() + 1);
                    if (d.getDay() % 6 !== 0) i++; // Skips weekends (0: Sun, 6: Sat)
                }
                return d;
            },
            getDayDiff: (d1, d2) => Math.round((d2 - d1) / 86400000),
        };

        const domUtils = {
            waitForElement: (
                selector,
                timeout = CONFIG.intervals.waitTimeout
            ) =>
                new Promise((resolve, reject) => {
                    const start = Date.now();
                    const timer = setInterval(() => {
                        const el = $(selector);
                        if (el?.offsetParent)
                            return clearInterval(timer), resolve(el);
                        if (Date.now() - start > timeout)
                            return (
                                clearInterval(timer),
                                reject(new Error(`Timeout: ${selector}`))
                            );
                    }, CONFIG.intervals.waitPoll);
                }),
            waitAndClick: async function (selector, siblingSteps = 0) {
                let target = await this.waitForElement(selector);
                while (siblingSteps-- > 0 && target)
                    target = target.nextElementSibling;
                return target?.click(), target;
            },
            create: (tag, { parent, onClick, style, ...props } = {}) => {
                const el = Object.assign(document.createElement(tag), props);
                if (style) Object.assign(el.style, style);
                if (onClick) el.addEventListener("click", onClick);
                if (parent) parent.appendChild(el);
                return el;
            },
        };

        const signatureManager = {
            getOrSet: (k, d) =>
                localStorage.getItem(k) || (localStorage.setItem(k, d), d),
            buildSignatureElement() {
                const nameKey = CONFIG.storage.name;
                const userName =
                    localStorage.getItem(nameKey) ||
                    prompt(
                        "Enter your name (saves to localStorage): "
                    )?.trim() ||
                    "";
                if (userName) localStorage.setItem(nameKey, userName);

                const getVal = (keyStr) =>
                    this.getOrSet(
                        CONFIG.storage[keyStr],
                        CONFIG.defaults[keyStr]
                    );

                const sig = document.createElement("table");
                sig.style.cssText = "width:348px; padding: 0px 30px;";
                sig.innerHTML = `
                    <tbody>
                        <tr align="left">
                            <td style="width: 64px; vertical-align: top;"><img src="${getVal(
                                "logo"
                            )}" width="64" height="64" style="display: block; border-radius: 4px;"></td>
                            <td style="width: 10px;"/>
                            <td style="vertical-align: middle;">
                                <p style="font-size: 14px; font-family: Roboto, sans-serif; margin: 0; line-height: 1.4; color: #3c4043;">
                                    <strong style="font-size: 110%;">${userName}</strong><br>
                                    <span style="font-style: italic; color: #70757a;">${getVal(
                                        "team"
                                    )}</span><br>
                                    <span style="font-style: italic; color: #70757a;">${getVal(
                                        "comp"
                                    )}</span>
                                </p>
                            </td>
                        </tr>
                    </tbody>`;
                return sig;
            },
            inject() {
                $(
                    "#email-body-content-top-content > table:nth-child(3)"
                )?.remove();
                const target = $(
                    "#email-body-content-top-content > table:nth-child(2)"
                );
                if (
                    target &&
                    !target.nextElementSibling?.dataset?.sigInjected
                ) {
                    const sig = this.buildSignatureElement();
                    sig.dataset.sigInjected = "true";
                    target.insertAdjacentElement("afterend", sig);
                }
            },
            insertAtCursor() {
                const sel = window.getSelection();
                if (!sel || sel.rangeCount === 0)
                    return alert(
                        "Please place your text cursor inside the email body first."
                    );

                const range = sel.getRangeAt(0);
                const br = document.createElement("br");
                range.deleteContents();
                range.insertNode(br);
                range.insertNode(this.buildSignatureElement());
                range.setStartAfter(br);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            },
        };

        const components = {
            createAutoClicker: (parent) => {
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
                            Object.assign(btn, {
                                textContent: "OFF",
                            }).style.backgroundColor = "#FF746C";
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
                            Object.assign(btn, {
                                textContent: "ON",
                            }).style.backgroundColor = "#77DD77";
                        }
                    },
                });
            },
            createCheckButton: (parent) => {
                domUtils.create("button", {
                    innerHTML: `<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 20px; height: 20px;"><span id="${CONFIG.selectors.badge}" class="qm-badge">+</span>`,
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
                        const update = () =>
                            badge &&
                            (badge.style.display =
                                el.dataset.attr && el.dataset.attr !== "0"
                                    ? "block"
                                    : "none");
                        new MutationObserver(update).observe(el, {
                            attributes: true,
                            attributeFilter: ["data-attr"],
                        });
                        update();
                    });
            },
            createFollowUpSetter: (parent) => {
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

                        const days =
                            parseInt(
                                $(`#${CONFIG.selectors.followUpInput}`).value,
                                10
                            ) || 0;
                        $(CONFIG.selectors.followUpTime)?.click();

                        if (!days) {
                            await domUtils.waitAndClick(
                                CONFIG.selectors.finishBtn
                            );
                        } else {
                            const today = new Date();
                            await domUtils.waitAndClick(
                                CONFIG.selectors.datePickerToday,
                                dateUtils.getDayDiff(
                                    today,
                                    dateUtils.addBusinessDays(today, days)
                                )
                            );
                        }
                        await domUtils.waitAndClick(
                            CONFIG.selectors.setFollowUpBtn
                        );
                    },
                });
                domUtils.create("input", {
                    id: CONFIG.selectors.followUpInput,
                    type: "text",
                    value: "2",
                    parent: wrapper,
                    onClick: (e) => e.stopPropagation(),
                    onfocus: (e) => e.target.select(),
                    oninput: (e) =>
                        (e.target.value = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 1)),
                });
            },
            createInsertSigButton: (parent) => {
                domUtils.create("button", {
                    textContent: "Sign",
                    title: "Insert Signature at Cursor",
                    className: "qm-btn",
                    style: { backgroundColor: "#FFB347", color: "#333" },
                    parent,
                    onmousedown: (e) => e.preventDefault(),
                    onClick: () => signatureManager.insertAtCursor(),
                });
            },
        };

        const init = () => {
            domUtils.create("style", {
                textContent: STYLES,
                parent: document.head,
            });
            const panel = domUtils.create("div", {
                id: CONFIG.selectors.uiPanel,
                parent: document.body,
            });

            [
                "createAutoClicker",
                "createCheckButton",
                "createFollowUpSetter",
                "createInsertSigButton",
            ].forEach((fn) => components[fn](panel));

            signatureManager.inject();

            new MutationObserver((mutations) => {
                if (
                    mutations.some((m) =>
                        Array.from(m.addedNodes).some(
                            (n) =>
                                n.nodeType === 1 &&
                                (n.matches?.(CONFIG.selectors.signatureTable) ||
                                    n.querySelector?.(
                                        CONFIG.selectors.signatureTable
                                    ))
                        )
                    )
                ) {
                    signatureManager.inject();
                }
            }).observe(document.body, { childList: true, subtree: true });
        };

        init();
    })();
} else if (window.location.href.includes("adwords.corp")) {
    (() => {
        const STYLES = `
            .aw-ga4 { background-color: rgb(255, 229, 180); border-radius: 10px; font-weight: 500; cursor: pointer; user-select: none; }
            .aw-ads { background-color: rgb(160, 251, 157); border-radius: 10px; font-weight: 500; cursor: pointer; user-select: none; }
            .aw-copied { background-color: #007bff !important; color: white !important; }
            #gpt-aw-overlay { position: fixed; bottom: 16px; left: 16px; z-index: 999; padding: 8px 12px; background: rgba(0,0,0,0.75); color: white; border: none; border-radius: 4px; font-size: 14px; font-weight: bold; font-family: monospace; box-shadow: 0 4px 8px rgba(0,0,0,0.2); cursor: pointer; transition: background-color 0.3s ease; user-select: none; }
        `;

        const setupCopy = (el, text, tempText = null) => {
            if (el.dataset.cp) return;
            el.dataset.cp = "1";
            el.title = "Click to copy";

            el.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    await navigator.clipboard.writeText(text);
                    const origText = el.textContent;

                    el.classList.add("aw-copied");
                    if (tempText) el.textContent = tempText;

                    setTimeout(() => {
                        el.classList.remove("aw-copied");
                        if (tempText) el.textContent = origText;
                    }, 800);
                } catch (err) {
                    console.error("Copy failed", err);
                }
            });
        };

        const init = (rawData) => {
            document.head.insertAdjacentHTML(
                "beforeend",
                `<style>${STYLES}</style>`
            );

            const awId = rawData.match(/AW-(\d*)/)?.[1];
            if (awId) {
                const overlay =
                    document.getElementById("gpt-aw-overlay") ||
                    document.createElement("div");
                overlay.id = "gpt-aw-overlay";
                overlay.textContent = `AW-${awId}`;
                setupCopy(overlay, awId, "Copied!");
                if (!overlay.parentNode) document.body.appendChild(overlay);
            } else {
                console.warn("AW-ID not found.");
            }

            document
                .querySelectorAll(".expand-more")
                .forEach((btn) => btn.click());

            try {
                const dataMap = new Map(
                    JSON.parse(rawData)[1].map((entry) => [entry[1], entry])
                );

                setTimeout(() => {
                    // Process Rows
                    document
                        .querySelectorAll(".conversion-name-cell .internal")
                        .forEach((cell) => {
                            const row = cell.closest(".particle-table-row");
                            if (
                                row &&
                                !row
                                    .querySelector(
                                        '[essfield="aggregated_conversion_source"]'
                                    )
                                    ?.innerText.toLowerCase()
                                    .includes("web")
                            ) {
                                return row.remove();
                            }

                            const data = dataMap.get(cell.innerText);
                            if (!data) return;

                            let type, label;
                            const tId = data[11],
                                rawLbl = data[64];

                            if (tId === 1) {
                                type = "aw-ads";
                                label = rawLbl?.[2]?.[4]
                                    ?.split("'")?.[7]
                                    ?.split("/")?.[1];
                            } else if (tId === 32) {
                                type = "aw-ga4";
                                label = rawLbl?.[1]?.[4]?.split("'")?.[3];
                            }

                            if (type && label) {
                                cell.innerHTML = label;
                                cell.classList.add(type);
                                setupCopy(cell, label);
                            }
                        });

                    // Hide empty containers
                    document
                        .querySelectorAll(
                            "category-conversions-container-view, conversion-goal-card"
                        )
                        .forEach((c) => {
                            if (!c.querySelector(".particle-table-row"))
                                c.style.display = "none";
                        });
                }, 1000); // PROCESS_DELAY
            } catch (e) {
                console.error("Data parsing failed", e);
            }
        };

        const poll = (tries = 0) => {
            const rawData =
                window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS;
            if (rawData) return init(rawData);
            if (tries < 3) setTimeout(() => poll(tries + 1), 500);
        };

        ["complete", "interactive"].includes(document.readyState)
            ? poll()
            : window.addEventListener("DOMContentLoaded", () => poll());
    })();
}
