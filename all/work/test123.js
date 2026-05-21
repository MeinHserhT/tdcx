(function () {
    "use strict";
    class DOMUtils {
        static create(
            tag,
            { parent, text, html, className, style, onClick, ...props } = {}
        ) {
            const el = document.createElement(tag);
            if (text) el.textContent = text;
            if (html) el.innerHTML = html;
            if (className) el.className = className;
            if (style) Object.assign(el.style, style);
            if (onClick) el.addEventListener("click", onClick);

            // Handle remaining attributes
            Object.entries(props).forEach(([key, value]) => {
                // Handle specific events mapped via props (e.g., onmousedown)
                if (key.startsWith("on") && typeof value === "function") {
                    el[key] = value;
                } else {
                    el.setAttribute(key, value);
                }
            });

            if (parent) parent.appendChild(el);
            return el;
        }

        static select(selector, context = document) {
            return context.querySelector(selector);
        }

        static selectAll(selector, context = document) {
            return Array.from(context.querySelectorAll(selector));
        }

        static waitFor(selector, timeout = 3000, pollInterval = 500) {
            return new Promise((resolve, reject) => {
                const start = Date.now();
                const timer = setInterval(() => {
                    const el = this.select(selector);
                    if (el?.offsetParent) {
                        clearInterval(timer);
                        resolve(el);
                    } else if (Date.now() - start > timeout) {
                        clearInterval(timer);
                        reject(new Error(`Timeout waiting for: ${selector}`));
                    }
                }, pollInterval);
            });
        }

        static async waitAndClick(selector, siblingSteps = 0) {
            const el = await this.waitFor(selector);
            let target = el;
            for (let i = 0; i < siblingSteps; i++) {
                target = target?.nextElementSibling;
            }
            target?.click();
            return target;
        }
    }

    class ClipboardUtils {
        static async copyWithFeedback(
            text,
            element,
            { okText = "Copied!", timeout = 800 } = {}
        ) {
            if (element.dataset.copying) return;
            element.dataset.copying = "true";

            try {
                await navigator.clipboard.writeText(text);

                const { backgroundColor, color, textContent } = element.style;
                const originalText = element.textContent;

                Object.assign(element.style, {
                    backgroundColor: "#007bff",
                    color: "white",
                });
                if (okText) element.textContent = okText;

                setTimeout(() => {
                    Object.assign(element.style, { backgroundColor, color });
                    if (okText) element.textContent = originalText;
                    delete element.dataset.copying;
                }, timeout);
            } catch (err) {
                console.error("Clipboard copy failed", err);
                delete element.dataset.copying;
            }
        }
    }

    class ConnectCRMModule {
        constructor() {
            this.config = {
                intervals: { autoClick: 18000, removeDelay: 6000 },
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
            };
            this.autoClickTimer = null;
        }

        init() {
            if (window.__connectCrmInitialized) return;
            window.__connectCrmInitialized = true;

            this.injectStyles();
            this.setupObserver();

            // Initial Injection
            DOMUtils.selectAll(this.config.selectors.signatureTable).forEach(
                () => this.injectSignature()
            );

            this.buildUI();
        }

        injectStyles() {
            const css = `
                #${this.config.selectors.uiPanel} { position: fixed; bottom: 16px; left: 16px; display: flex; gap: 8px; align-items: center; z-index: 9999; }
                .qm-btn { z-index: 10; color: white; padding: 12px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: all 0.3s ease; font-size: 14px; position: relative; display: flex; align-items: center; justify-content: center; }
                #${this.config.selectors.followUpInput} { position: absolute; top: 50%; transform: translateY(-50%); right: 8px; width: 32px; height: 28px; padding: 0; border: none; border-radius: 3px; background: rgba(255, 255, 255, 0.9); color: #333; font-weight: bold; font-size: 14px; text-align: center; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); transition: box-shadow 0.2s ease; -moz-appearance: textfield; }
                #${this.config.selectors.followUpInput}:focus { outline: none; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px rgba(255, 255, 255, 0.7); }
                .qm-badge { display: none; position: absolute; top: -5px; right: -5px; background: red; border-radius: 50%; padding: 2px 5px; line-height: 1; }
            `;
            DOMUtils.create("style", { text: css, parent: document.head });
        }

        buildUI() {
            const panel = DOMUtils.create("div", {
                id: this.config.selectors.uiPanel,
                parent: document.body,
            });

            this.createAutoClickerBtn(panel);
            this.createCheckBtn(panel);
            this.createFollowUpBtn(panel);
            this.createSignBtn(panel);
        }

        createAutoClickerBtn(parent) {
            const btn = DOMUtils.create("button", {
                text: "OFF",
                title: "Auto Click",
                className: "qm-btn",
                style: { backgroundColor: "#FF746C" },
                parent,
                onClick: () => {
                    if (this.autoClickTimer) {
                        clearInterval(this.autoClickTimer);
                        this.autoClickTimer = null;
                        Object.assign(btn.style, {
                            backgroundColor: "#FF746C",
                        });
                        btn.textContent = "OFF";
                    } else {
                        this.autoClickTimer = setInterval(() => {
                            DOMUtils.select(
                                this.config.selectors.autoAddBtn
                            )?.click();
                            setTimeout(
                                () =>
                                    DOMUtils.select(
                                        this.config.selectors.autoRemoveBtn
                                    )?.click(),
                                this.config.intervals.removeDelay
                            );
                        }, this.config.intervals.autoClick);
                        Object.assign(btn.style, {
                            backgroundColor: "#77DD77",
                        });
                        btn.textContent = "ON";
                    }
                },
            });
        }

        createCheckBtn(parent) {
            DOMUtils.create("button", {
                html: `<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 20px; height: 20px;"><span id="${this.config.selectors.badge}" class="qm-badge">+</span>`,
                title: "Click Follow-up Item",
                className: "qm-btn",
                style: { backgroundColor: "#A2BFFE" },
                parent,
                onClick: async () => {
                    DOMUtils.select(this.config.selectors.dockHome)?.click();
                    await DOMUtils.waitAndClick(
                        this.config.selectors.followUpListBtn
                    );
                },
            });

            DOMUtils.waitFor(this.config.selectors.followUpListBtn).then(
                (el) => {
                    const badge = DOMUtils.select(
                        `#${this.config.selectors.badge}`
                    );
                    const updateBadge = () => {
                        const count = el.getAttribute("data-attr");
                        if (badge)
                            badge.style.display =
                                count && count !== "0" ? "block" : "none";
                    };
                    new MutationObserver(updateBadge).observe(el, {
                        attributes: true,
                        attributeFilter: ["data-attr"],
                    });
                    updateBadge();
                }
            );
        }

        createFollowUpBtn(parent) {
            const wrapper = DOMUtils.create("button", {
                text: "FL Up:",
                title: "Set Follow-up",
                className: "qm-btn",
                style: { backgroundColor: "#55B4B0", paddingRight: "48px" },
                parent,
                onClick: async (e) => {
                    if (e.target.id === this.config.selectors.followUpInput)
                        return;

                    const appt = DOMUtils.select(
                        this.config.selectors.apptTime
                    );
                    if (appt && !appt.dataset.valchoice) {
                        appt.click();
                        await DOMUtils.waitAndClick(
                            this.config.selectors.datePickerToday
                        );
                    }

                    const input = DOMUtils.select(
                        `#${this.config.selectors.followUpInput}`
                    );
                    const days = parseInt(input.value, 10) || 0;
                    DOMUtils.select(
                        this.config.selectors.followUpTime
                    )?.click();

                    if (!days) {
                        await DOMUtils.waitAndClick(
                            this.config.selectors.finishBtn
                        );
                    } else {
                        const targetDate = this.addBusinessDays(
                            new Date(),
                            days
                        );
                        const diff = Math.round(
                            (targetDate - new Date()) / 86400000
                        );
                        await DOMUtils.waitAndClick(
                            this.config.selectors.datePickerToday,
                            diff
                        );
                    }
                    await DOMUtils.waitAndClick(
                        this.config.selectors.setFollowUpBtn
                    );
                },
            });

            DOMUtils.create("input", {
                id: this.config.selectors.followUpInput,
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
        }

        createSignBtn(parent) {
            DOMUtils.create("button", {
                text: "Sign",
                title: "Insert Signature at Cursor",
                className: "qm-btn",
                style: { backgroundColor: "#FFB347", color: "#333" },
                parent,
                onmousedown: (e) => e.preventDefault(), // Prevent focus loss
                onClick: () => this.insertSignatureAtCursor(),
            });
        }

        // --- Signature Management ---

        getStorageData() {
            let userName = localStorage.getItem(this.config.storage.name);
            if (!userName) {
                userName =
                    prompt(
                        "Enter your name (saves to localStorage):"
                    )?.trim() || "";
                if (userName)
                    localStorage.setItem(this.config.storage.name, userName);
            }
            return {
                name: userName,
                logo:
                    localStorage.getItem(this.config.storage.logo) ||
                    this.config.defaults.logo,
                team:
                    localStorage.getItem(this.config.storage.team) ||
                    this.config.defaults.team,
                comp:
                    localStorage.getItem(this.config.storage.comp) ||
                    this.config.defaults.comp,
            };
        }

        buildSignatureElement() {
            const data = this.getStorageData();
            const table = document.createElement("table");
            table.setAttribute("style", "width:348px; padding: 0px 30px;");
            table.innerHTML = `
                <tbody><tr align="left">
                    <td style="width: 64px; vertical-align: top;"><img src="${data.logo}" width="64" height="64" style="display: block; border-radius: 4px;"></td>
                    <td style="width: 10px;"/>
                    <td style="vertical-align: middle;"><p style="font-size: 14px; font-family: Roboto, sans-serif; margin: 0; line-height: 1.4; color: #3c4043;">
                        <strong data-infosetting="your-name" style="font-size: 110%;">${data.name}</strong><br>
                        <span style="font-style: italic; color: #70757a;">${data.team}</span><br>
                        <span style="font-style: italic; color: #70757a;">${data.comp}</span>
                    </p></td>
                </tr></tbody>`;
            return table;
        }

        injectSignature() {
            const removeTarget = DOMUtils.select(
                "#email-body-content-top-content > table:nth-child(3)"
            );
            if (removeTarget) removeTarget.remove();

            const target = DOMUtils.select(
                "#email-body-content-top-content > table:nth-child(2)"
            );
            if (!target || target.nextElementSibling?.dataset?.sigInjected)
                return;

            const signature = this.buildSignatureElement();
            signature.dataset.sigInjected = "true";
            target.insertAdjacentElement("afterend", signature);
        }

        insertSignatureAtCursor() {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const br = document.createElement("br");

                range.deleteContents();
                range.insertNode(br);
                range.insertNode(this.buildSignatureElement());

                range.setStartAfter(br);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                alert(
                    "Please place your text cursor inside the email body first."
                );
            }
        }

        setupObserver() {
            new MutationObserver((mutations) => {
                for (const { addedNodes } of mutations) {
                    for (const node of addedNodes) {
                        if (node.nodeType !== 1) continue;
                        if (
                            node.matches(this.config.selectors.signatureTable)
                        ) {
                            this.injectSignature();
                        } else {
                            DOMUtils.selectAll(
                                this.config.selectors.signatureTable,
                                node
                            ).forEach(() => this.injectSignature());
                        }
                    }
                }
            }).observe(document.body, { childList: true, subtree: true });
        }

        addBusinessDays(startDate, days) {
            const date = new Date(startDate);
            let added = 0;
            while (added < days) {
                date.setDate(date.getDate() + 1);
                if (date.getDay() !== 0 && date.getDay() !== 6) added++;
            }
            return date;
        }
    }

    class AgentDashboardModule {
        constructor() {
            this.config = {
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
                    phone: { src: "/1959/1959283.png", animation: "wiggle" },
                    email: { src: "/15781/15781499.png", animation: "slide" },
                    break: { src: "/2115/2115487.png", animation: "wiggle" },
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
            };
            this.iconBaseUrl = "https://cdn-icons-png.flaticon.com/512";
            this.observer = null;
        }

        init() {
            if (window.__agentDashInitialized) return;
            window.__agentDashInitialized = true;

            this.targetContainer = DOMUtils.select(
                this.config.selectors.container
            );
            if (!this.targetContainer) return;

            this.currentUserLdap = this.getCurrentUserLdap();
            this.trustedPolicy = window.trustedTypes?.createPolicy(
                "agent-dash-policy",
                { createHTML: (s) => s }
            ) ?? { createHTML: (s) => s };

            this.normalizeIcons();
            this.injectStyles();
            this.createOverlay();
            this.initObserver();
        }

        normalizeIcons() {
            Object.keys(this.config.icons).forEach((key) => {
                const item = this.config.icons[key];
                if (typeof item === "string") {
                    this.config.icons[key] = `${this.iconBaseUrl}${item}`;
                } else {
                    item.src = `${this.iconBaseUrl}${item.src}`;
                }
            });
        }

        getCurrentUserLdap() {
            return DOMUtils.select("[alt='profile photo']")?.src?.match(
                /photos\/([^/?]+)/
            )?.[1];
        }

        createOverlay() {
            this.uiElement =
                DOMUtils.select(`#${this.config.selectors.uiId}`) ||
                DOMUtils.create("div", {
                    id: this.config.selectors.uiId,
                    parent: document.body,
                });
            this.uiElement.addEventListener("click", (e) => {
                if (e.target.closest(".close-btn")) this.destroy();
            });
        }

        initObserver() {
            this.observer = new MutationObserver(() => this.render());
            this.observer.observe(this.targetContainer, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true,
            });
            this.render();
        }

        destroy() {
            this.uiElement.style.display = "none";
            this.observer?.disconnect();
            window.__agentDashInitialized = false;
        }

        parseDurationToSeconds(timeStr) {
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

        scrapeData() {
            const rows = DOMUtils.selectAll("tbody tr", this.targetContainer);
            return rows
                .map((tr) => {
                    const cells = DOMUtils.selectAll("td", tr);
                    if (cells.length < 9) return null;

                    const auxCode = cells[3].innerText.trim();
                    const phoneCap = (
                        cells[5].innerText.match(/[a-zA-Z\s]+/)?.[0] ?? ""
                    )
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "-");

                    let displayStatus = auxCode;
                    let statusKey = auxCode.toLowerCase().replace(/\s+/g, "-");

                    if (auxCode === "Active" && phoneCap === "busy") {
                        displayStatus = "Break";
                        statusKey = "break";
                    }

                    return {
                        img: DOMUtils.select("img", tr)?.src,
                        ldap: cells[1].innerText.trim(),
                        displayStatus,
                        statusKey,
                        cssClass: `stt-${statusKey}`,
                        timeInState: cells[4].innerText.trim(),
                        lastChangeRaw: cells[8].innerText.trim(),
                        durationSeconds: this.parseDurationToSeconds(
                            cells[8].innerText
                        ),
                    };
                })
                .filter(Boolean);
        }

        sortAgents(agents) {
            return agents.sort((a, b) => {
                const isUserA = a.ldap === this.currentUserLdap;
                const isUserB = b.ldap === this.currentUserLdap;
                if (isUserA !== isUserB) return isUserB - isUserA;

                const priorityA =
                    this.config.priorities[a.statusKey] ??
                    this.config.priorities.default;
                const priorityB =
                    this.config.priorities[b.statusKey] ??
                    this.config.priorities.default;
                if (priorityA !== priorityB) return priorityA - priorityB;

                return b.durationSeconds - a.durationSeconds;
            });
        }

        render() {
            const agents = this.sortAgents(this.scrapeData());
            const rowsHtml = agents
                .map((agent) => {
                    const iconConfig = this.config.icons[agent.statusKey];
                    const iconHtml = iconConfig
                        ? `<img src="${iconConfig.src}" animation="${iconConfig.animation}" alt="${agent.statusKey} icon"/>`
                        : "";

                    return `
                    <div class="tr ${agent.cssClass}">
                        <div class="td left"><img src="${agent.img}" alt="Avatar" /><p>${agent.ldap}</p></div>
                        <div class="td right">
                            <div><p>${agent.lastChangeRaw} <span>(${agent.timeInState})</span></p><p>${agent.displayStatus}</p></div>
                            ${iconHtml}
                        </div>
                    </div>`;
                })
                .join("");

            const uiHtml = `
                <div class="ui-content-wrapper">
                    <button class="close-btn" title="Close"><img src="${this.config.icons.close}" alt="Close"/></button>
                    <div class="ui-table">${rowsHtml}</div>
                </div>`;

            this.uiElement.innerHTML = this.trustedPolicy.createHTML(uiHtml);
            this.uiElement.style.display = "flex";
        }

        injectStyles() {
            if (DOMUtils.select(`#${this.config.selectors.styleId}`)) return;
            const css = `
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
            DOMUtils.create("style", {
                id: this.config.selectors.styleId,
                text: this.trustedPolicy.createHTML(css),
                parent: document.head,
            });
        }
    }

    class AdwordsHelperModule {
        constructor() {
            this.config = {
                MAX_TRIES: 3,
                POLL_INTERVAL: 500,
                PROCESS_DELAY: 1000,
            };
            this.styles = {
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
            };
            this.attempts = 0;
        }

        init() {
            if (["complete", "interactive"].includes(document.readyState)) {
                this.pollData();
            } else {
                window.addEventListener("DOMContentLoaded", () =>
                    this.pollData()
                );
            }
        }

        pollData() {
            const rawData =
                window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS;
            if (rawData) {
                this.process(rawData);
            } else if (this.attempts < this.config.MAX_TRIES) {
                this.attempts++;
                setTimeout(() => this.pollData(), this.config.POLL_INTERVAL);
            }
        }

        process(rawData) {
            const awId = rawData.match(/AW-(\d*)/)?.[1];
            if (!awId) return console.warn("AW-ID not found.");

            DOMUtils.selectAll(".expand-more").forEach((btn) => btn.click());

            try {
                const parsedEntries = JSON.parse(rawData)[1];
                const dataMap = new Map(
                    parsedEntries.map((entry) => [entry[1], entry])
                );

                setTimeout(
                    () => this.updateTableRows(dataMap),
                    this.config.PROCESS_DELAY
                );
                this.renderUIOverlay(awId);
            } catch (e) {
                console.error("Data parsing failed", e);
            }
        }

        parseConversionData(data) {
            const typeId = data[11];
            const rawLabelStr = data[64];

            if (typeId === 1) {
                // Google Ads
                const label = rawLabelStr?.[2]?.[4]
                    ?.split("'")?.[7]
                    ?.split("/")?.[1];
                return { type: "ADS", label: label ?? "no label" };
            }
            if (typeId === 32) {
                // GA4
                const label = rawLabelStr?.[1]?.[4]?.split("'")?.[3];
                return { type: "GA4", label: label ?? "no label" };
            }
            return { type: null, label: "no label" };
        }

        updateTableRows(dataMap) {
            DOMUtils.selectAll(".conversion-name-cell .internal").forEach(
                (cell) => {
                    const row = cell.closest(".particle-table-row");
                    if (row) {
                        const sourceField = DOMUtils.select(
                            '[essfield="aggregated_conversion_source"]',
                            row
                        );
                        if (
                            !sourceField?.innerText
                                .toLowerCase()
                                .includes("web")
                        ) {
                            row.remove();
                            return;
                        }
                    }

                    const match = dataMap.get(cell.innerText);
                    if (!match) return;

                    const { type, label } = this.parseConversionData(match);
                    if (type && label !== "no label") {
                        cell.innerHTML = label;
                        Object.assign(cell.style, this.styles[type]);

                        cell.style.cursor = "pointer";
                        cell.title = "Click to copy label";
                        cell.addEventListener("click", (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ClipboardUtils.copyWithFeedback(label, cell);
                        });
                    }
                }
            );

            // Cleanup empty containers
            DOMUtils.selectAll(
                "category-conversions-container-view, conversion-goal-card"
            ).forEach((container) => {
                if (!DOMUtils.select(".particle-table-row", container)) {
                    container.style.display = "none";
                }
            });
        }

        renderUIOverlay(id) {
            let el = DOMUtils.select("#gpt-aw-id-display");
            if (!el) {
                el = DOMUtils.create("div", {
                    id: "gpt-aw-id-display",
                    text: `AW-ID: ${id}`,
                    title: "Click to copy ID",
                    style: this.styles.OVERLAY,
                    parent: document.body,
                    onClick: (e) => {
                        e.preventDefault();
                        ClipboardUtils.copyWithFeedback(id, el);
                    },
                });
            }
        }
    }

    const href = window.location.href;

    if (href.includes("cases.connect")) {
        new ConnectCRMModule().init();
    } else if (href.includes("casemon2.corp")) {
        new AgentDashboardModule().init();
    } else if (href.includes("adwords.corp")) {
        new AdwordsHelperModule().init();
    }
})();
