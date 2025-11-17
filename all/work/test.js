if (window.location.href.includes("cases.connect")) {
    (() => {
        "use strict";

        if (window.scrRun) return;
        window.scrRun = 1;

        const CFG = {
            SOUND_URL:
                "https://cdn.pixabay.com/audio/2025/07/18/audio_da35bc65d2.mp3",
            AUTO_CLICK_INTERVAL: 18000,
            AUTO_REMOVE_DELAY: 6000,
            SEL: {
                AUTO_CLICK_BTN: "#cdtx__uioncall--btn",
                AUTO_REMOVE_BTN: ".cdtx__uioncall_control-remove",
                HOME_BUTTON: '[debug-id="dock-item-home"]',
                FLUP_ITEM: ".li-popup_lstcasefl",
                FLUP_BADGE: "#follow-up-badge",
                APT__BTN: '[data-infocase="appointment_time"]',
                FLUP__BTN: '[data-infocase="follow_up_time"]',
                TODAY_BTN: ".datepicker-grid .today",
                FLUP_INPUT: "#follow-up-days-input",
                PHONE_DIALOG: "[debug-id=phoneTakeDialog]",
                SET_FLUP_BTN: "[data-type=follow_up_time]",
                FINISH_BTN: '[data-thischoice="Finish"]',
                UI_PANEL: "#script-btn-panel",
            },
        };

        const BTN_STYLE = {
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
        };

        const click = (selector) => document.querySelector(selector)?.click();

        function waitEl(selector, { interval = 500, timeout = 3000 } = {}) {
            return new Promise((resolve, reject) => {
                const start = Date.now();
                const timer = setInterval(() => {
                    const el = document.querySelector(selector);
                    if (el && el.offsetParent !== null) {
                        clearInterval(timer);
                        resolve(el);
                        return;
                    }
                    if (Date.now() - start > timeout) {
                        clearInterval(timer);
                        reject(new Error(`Timeout for ${selector}`));
                    }
                }, interval);
            });
        }

        async function waitClick(selector, steps = 0, opts = {}) {
            const el = await waitEl(selector, opts);
            let target = el;
            if (steps > 0) {
                for (let i = 0; i < steps; i++) {
                    if (target) {
                        target = target.nextElementSibling;
                    } else {
                        throw new Error(`No sibling at ${i} for ${selector}`);
                    }
                }
            }
            if (target) {
                target.click();
                return target;
            } else {
                throw new Error(`No target for ${selector}`);
            }
        }

        function observeNode(selector, cb) {
            const observer = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    for (const n of m.addedNodes) {
                        if (n.nodeType !== 1) continue;
                        if (n.matches(selector)) {
                            cb(n);
                        } else {
                            n.querySelectorAll(selector).forEach(cb);
                        }
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            return observer;
        }

        function dayDiff(date1, date2) {
            const ONE_DAY_MS = 1000 * 60 * 60 * 24;
            return Math.round((date2 - date1) / ONE_DAY_MS);
        }

        function addWorkDays(startDate, days) {
            const date = new Date(startDate.getTime());
            let daysAdded = 0;
            while (daysAdded < days) {
                date.setDate(date.getDate() + 1);
                const dayOfWeek = date.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    daysAdded++;
                }
            }
            return date;
        }

        const autoClick = {
            id: null,
            on: false,
            btn: null,
            start() {
                if (this.id) return;
                this.on = true;
                this.id = setInterval(() => {
                    click(CFG.SEL.AUTO_CLICK_BTN);
                    setTimeout(
                        () => click(CFG.SEL.AUTO_REMOVE_BTN),
                        CFG.AUTO_REMOVE_DELAY
                    );
                }, CFG.AUTO_CLICK_INTERVAL);
                this.updateBtn();
            },
            stop() {
                if (!this.id) return;
                clearInterval(this.id);
                this.id = null;
                this.on = false;
                this.updateBtn();
            },
            toggle() {
                this.on ? this.stop() : this.start();
            },
            updateBtn() {
                if (!this.btn) return;
                this.btn.textContent = this.on ? "ON" : "OFF";
                this.btn.style.backgroundColor = this.on
                    ? "#77DD77"
                    : "#FF746C";
            },
            createBtn(parent) {
                this.btn = document.createElement("button");
                this.btn.id = "auto-btn";
                Object.assign(this.btn.style, BTN_STYLE);
                this.btn.addEventListener("click", () => this.toggle());
                parent.appendChild(this.btn);
                this.updateBtn();
            },
        };

        async function handleFLClick() {
            try {
                click(CFG.SEL.HOME_BUTTON);
                await waitClick(CFG.SEL.FLUP_ITEM, 0);
            } catch (e) {
                console.error(e);
            }
        }

        function updateFLBadge() {
            const badge = document.getElementById(
                CFG.SEL.FLUP_BADGE.substring(1)
            );
            const item = document.querySelector(CFG.SEL.FLUP_ITEM);
            if (item && badge) {
                const count = item.dataset.attr;
                badge.textContent = count;
                badge.style.display = count ? "block" : "none";
            }
        }

        function createFLBtn(parent) {
            const btn = document.createElement("button");
            btn.id = "follow-up-btn";
            btn.title = "Click Follow-up Item";
            btn.style.position = "relative";
            Object.assign(btn.style, BTN_STYLE, {
                padding: "10px 12px",
                backgroundColor: "#A2BFFE",
                lineHeight: "0",
            });
            btn.innerHTML = `
            <img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 20px; height: 20px; vertical-align: middle;">
            <span id="${CFG.SEL.FLUP_BADGE.substring(1)}" style="
                display: none; position: absolute; top: -5px; right: -5px;
                background: red; color: white; font-size: 10px; font-weight: bold;
                border-radius: 50%; padding: 2px 5px; line-height: 1;
            "></span>
        `;
            btn.addEventListener("click", handleFLClick);
            parent.appendChild(btn);

            waitEl(CFG.SEL.FLUP_ITEM)
                .then((el) => {
                    const observer = new MutationObserver(updateFLBadge);
                    observer.observe(el, {
                        attributes: true,
                        attributeFilter: ["data-attr"],
                    });
                    updateFLBadge();
                })
                .catch((e) => console.error(e));
        }

        async function handleApptClick() {
            try {
                const apptBtn = document.querySelector(CFG.SEL.APT__BTN);
                if (apptBtn && !apptBtn.dataset.valchoice) {
                    click(CFG.SEL.APT__BTN);
                    await waitClick(CFG.SEL.TODAY_BTN);
                }

                const input = document.getElementById(
                    CFG.SEL.FLUP_INPUT.substring(1)
                );
                const followUpDays = +input.value;

                if (!followUpDays) {
                    await waitClick(CFG.SEL.FINISH_BTN);
                } else {
                    const today = new Date();
                    const targetDate = addWorkDays(today, followUpDays);
                    const calendarDays = dayDiff(today, targetDate);

                    click(CFG.SEL.FLUP__BTN);
                    await waitClick(CFG.SEL.TODAY_BTN, calendarDays);
                }
                await waitClick(CFG.SEL.SET_FLUP_BTN);
            } catch (e) {
                console.error(e);
            }
        }

        function createApptBtn(parent) {
            const div = document.createElement("div");
            div.id = "today-btn-group";
            const span = document.createElement("span");
            span.id = "today-btn-label";
            span.textContent = "FL Up:";
            span.title = "Set appointment to Today + Follow-up";
            span.addEventListener("click", handleApptClick);
            const input = document.createElement("input");
            input.id = CFG.SEL.FLUP_INPUT.substring(1);
            input.type = "text";
            input.value = "2";
            input.title = "Days to follow-up";

            input.addEventListener("input", (e) => {
                e.target.value = e.target.value
                    .replace(/\D/g, "")
                    .substring(0, 1);
            });
            input.addEventListener("focus", (e) => e.target.select());

            div.appendChild(span);
            div.appendChild(input);
            parent.appendChild(div);
        }

        async function handleDialog() {
            const sound = new Audio(CFG.SOUND_URL);
            try {
                await sound.play();
                window.focus();
            } catch (err) {
                console.error(err);
            }
        }

        function createPanel() {
            const div = document.createElement("div");
            div.id = CFG.SEL.UI_PANEL.substring(1);
            Object.assign(div.style, {
                position: "fixed",
                bottom: "16px",
                left: "16px",
                display: "flex",
                gap: "8px",
                alignItems: "center",
                zIndex: "9999",
            });
            document.body.appendChild(div);
            return div;
        }

        function injectCSS() {
            const id = "cases-connect-enhanced-styles";
            if (document.getElementById(id)) return;
            const rules = `
            #${CFG.SEL.UI_PANEL.substring(1)} button:hover { 
                opacity: 0.9; transform: translateY(-1px); 
            }
            #${CFG.SEL.UI_PANEL.substring(1)} button:active { 
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
            #${CFG.SEL.FLUP_INPUT.substring(1)} {
                position: absolute; top: 50%; transform: translateY(-50%);
                right: 8px; width: 32px; height: 28px;
                padding: 0; border: none; border-radius: 3px; 
                background: rgba(255, 255, 255, 0.9); color: #333;
                font-weight: bold; font-size: 14px; text-align: center;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); 
                transition: box-shadow 0.2s ease; -moz-appearance: textfield;
            }
            #${CFG.SEL.FLUP_INPUT.substring(1)}:focus {
                outline: none;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px rgba(255, 255, 255, 0.7);
            }
        `;
            const el = document.createElement("style");
            el.id = id;
            el.textContent = rules;
            document.head.appendChild(el);
        }

        function init() {
            observeNode(CFG.SEL.PHONE_DIALOG, handleDialog);
            injectCSS();
            const panel = createPanel();
            autoClick.createBtn(panel);
            createFLBtn(panel);
            createApptBtn(panel);
        }

        init();
    })();
} else if (window.location.href.includes("casemon2.corp")) {
    (() => {
        if (window.dashRun) return;
        window.dashRun = 1;

        class AgentDash {
            #cfg = {
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
                    phone: { src: "/1959/1959283.png", animation: "wiggle" },
                    email: { src: "/15781/15781499.png", animation: "slide" },
                    break: { src: "/2115/2115487.png", animation: "wiggle" },
                    close: "/9403/9403346.png",
                },
            };

            #obs = null;
            #ldap = null;
            #ui = null;
            #tbl = null;
            #policy = null;

            constructor() {
                this.#ldap = this.#getLdap();
                this.#tbl = document.querySelector(this.#cfg.tblSel);
                if (!this.#tbl) return;

                this.#policy = window.trustedTypes.createPolicy(
                    "agent-dash-policy",
                    { createHTML: (s) => s }
                );

                for (const [key, icon] of Object.entries(this.#cfg.icons)) {
                    if (typeof icon === "string") {
                        this.#cfg.icons[key] = this.#cfg.link + icon;
                    } else {
                        icon.src = this.#cfg.link + icon.src;
                    }
                }

                this.#styles();
                this.#initUi();
                this.#initObs();
            }

            #getLdap() {
                return document
                    .querySelector("[alt='profile photo']")
                    ?.src?.match(/\/([^\/]+)\?/)?.[1];
            }

            #initUi() {
                let ui = document.getElementById(this.#cfg.uiId);
                if (!ui) {
                    ui = document.createElement("div");
                    ui.id = this.#cfg.uiId;
                    document.body.appendChild(ui);
                }
                this.#ui = ui;
                this.#ui.addEventListener("click", (e) => {
                    if (e.target.closest(".close-btn")) this.#close();
                });
            }

            #initObs() {
                this.#obs = new MutationObserver(this.#render.bind(this));
                this.#obs.observe(this.#tbl, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    characterData: true,
                });
                this.#render();
            }

            #close() {
                if (this.#ui) this.#ui.style.display = "none";
                if (this.#obs) this.#obs.disconnect();
                window.dashRun = 0;
            }

            #show() {
                if (this.#ui) this.#ui.style.display = "flex";
            }

            #parse() {
                const rows = this.#tbl.querySelectorAll("tbody tr");

                return Array.from(rows, (row) => {
                    const cells = row.querySelectorAll("td");
                    if (cells.length < 9) return null;

                    const phoneCap = (
                        cells[5].innerText.match(/[a-zA-Z\s]+/)?.[0] ?? ""
                    )
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "-");

                    return {
                        img: row.querySelector("img").src,
                        ldap: cells[1].innerText,
                        aux: cells[3].innerText,
                        time: cells[4].innerText,
                        phoneCap: phoneCap,
                        lastChg: cells[8].innerText.trim(),
                        lastSec: this.#toSec(cells[8].innerText),
                    };
                }).filter(Boolean);
            }

            #proc(agent) {
                let statusKey = agent.aux.toLowerCase().replace(/\s+/g, "-");
                let aux = agent.aux;

                if (agent.aux === "Active" && agent.phoneCap === "busy") {
                    aux = "Break";
                    statusKey = "break";
                }

                return { ...agent, aux, statusKey, css: `stt-${statusKey}` };
            }

            #sort(agents) {
                const { prior } = this.#cfg;

                return agents.sort((a, b) => {
                    const aPri = prior[a.statusKey] ?? prior.default;
                    const bPri = prior[b.statusKey] ?? prior.default;

                    return (
                        (b.ldap === this.#ldap) - (a.ldap === this.#ldap) ||
                        aPri - bPri ||
                        b.lastSec - a.lastSec
                    );
                });
            }

            #render() {
                const agents = this.#parse();
                const processed = agents.map(this.#proc.bind(this));
                const sorted = this.#sort(processed);

                const rows = sorted.map(this.#rowHtml).join("");
                const closeBtn = this.#closeHtml();

                const html = `
                  <div class="ui-content-wrapper">
                    ${closeBtn}
                    <div class="ui-table">${rows}</div>
                  </div>`;

                this.#ui.innerHTML = this.#policy.createHTML(html);
                this.#show();
            }

            #rowHtml = (agent) => {
                const icon = this.#iconHtml(agent.statusKey);
                const alt = `Avatar for ${agent.ldap}`;

                return `
                <div class="tr ${agent.css}">
                  <div class="td left">
                    <img src="${agent.img}" alt="${alt}" />
                    <p>${agent.ldap}</p>
                  </div>
                  <div class="td right">
                    <div>
                      <p>${agent.lastChg} <span>(${agent.time})</span></p>
                      <p>${agent.aux}</p> 
                    </div>
                    ${icon}
                  </div>
                </div>`;
            };

            #iconHtml(key) {
                const icon = this.#cfg.icons[key];
                return icon
                    ? `<img src="${icon.src}" animation="${icon.animation}" alt="${key} icon"/>`
                    : "";
            }

            #closeHtml() {
                return `<button class="close-btn" title="Close">
                        <img src="${this.#cfg.icons.close}" alt="Close"/>
                      </button>`;
            }

            #toSec(timeStr) {
                const parts = timeStr.match(/(\d+)(h|m|s)/g) ?? [];
                const factors = { h: 3600, m: 60, s: 1 };

                return parts.reduce((total, part) => {
                    const val = parseInt(part, 10);
                    const unit = part.slice(-1);
                    return total + val * (factors[unit] ?? 0);
                }, 0);
            }

            #styles() {
                const css = `
                #${this.#cfg.uiId} { 
                  position: fixed; height: 100%; width: 100%; top: 0; right: 0; 
                  background-color: rgba(0,0,0,0.1); z-index: 999; 
                  display: flex; justify-content: flex-end; align-items: center; 
                  padding: 20px;
                  font-family: 'Noto Serif', serif; pointer-events: none; 
                  box-sizing: border-box;
                }
                .ui-content-wrapper { position: relative; pointer-events: auto; width: 100%; max-width: 0px; }
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
              `;

                const styleEl =
                    document.getElementById(this.#cfg.styleId) ||
                    document.createElement("style");
                styleEl.id = this.#cfg.styleId;
                styleEl.innerHTML = this.#policy.createHTML(css);
                document.head.appendChild(styleEl);
            }
        }

        new AgentDash();
    })();
} else if (window.location.href.includes("adwords.corp")) {
    (() => {
        "use strict";

        const ga4Style = {
            backgroundColor: "rgb(255, 229, 180)",
            borderRadius: "10px",
            fontWeight: "500",
        };
        const adsStyle = {
            backgroundColor: "rgb(160, 251, 157)",
            borderRadius: "10px",
            fontWeight: "500",
        };
        const maxTries = 3;
        let tries = 0;

        function initCopy({
            el,
            text,
            title = "Click to copy",
            okText,
            okBg = "#007bff",
            okColor = "white",
            timeout = 800,
        }) {
            if (el.dataset.copyListener) return;
            el.dataset.copyListener = true;

            Object.assign(el.style, { cursor: "pointer", userSelect: "none" });
            el.title = title;

            el.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();

                navigator.clipboard.writeText(text).then(() => {
                    const { backgroundColor: origBg, color: origColor } =
                        el.style;
                    const origText = el.textContent;

                    Object.assign(el.style, {
                        backgroundColor: okBg,
                        color: okColor,
                    });
                    if (okText) el.textContent = okText;

                    setTimeout(() => {
                        Object.assign(el.style, {
                            backgroundColor: origBg,
                            color: origColor,
                        });
                        if (okText) el.textContent = origText;
                    }, timeout);
                });
            });
        }

        function getDetails(data) {
            let type = null,
                label = null;
            const typeId = data[11];

            if (typeId === 1) {
                type = "Ads Conversion: ";
                const labelStr = data[64]?.[2]?.[4];
                label = labelStr?.split("'")?.[7]?.split("/")?.[1];
            } else if (typeId === 32) {
                type = "GA4: ";
                const labelStr = data[64]?.[1]?.[4];
                label = labelStr?.split("'")?.[3];
            }
            return { type, label: label || "no label" };
        }

        function showAwId(id) {
            let el = document.getElementById("gpt-aw-id-display");
            if (!el) {
                el = document.createElement("div");
                el.id = "gpt-aw-id-display";
                Object.assign(el.style, {
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
                });
                document.body.appendChild(el);
            }

            el.textContent = `AW-ID: ${id}`;
            initCopy({
                el: el,
                text: id,
                title: "Click to copy ID",
                okText: "Copied!",
                timeout: 800,
            });
        }

        function processRows(dataMap) {
            document
                .querySelectorAll(".conversion-name-cell .internal")
                .forEach((cell) => {
                    const row = cell.closest(".particle-table-row");
                    if (row) {
                        const srcEl = row.querySelector(
                            '[essfield="aggregated_conversion_source"]'
                        );
                        if (!srcEl?.innerText.match(/.*web.*/gi)) {
                            row.remove();
                            return;
                        }
                    }

                    const name = cell.innerText;
                    const match = dataMap.get(name);

                    if (match) {
                        const { type, label } = getDetails(match);

                        if (type && label !== "no label") {
                            cell.innerHTML = `${label}`;
                            const style =
                                type === "GA4: " ? ga4Style : adsStyle;
                            Object.assign(cell.style, style);

                            initCopy({
                                el: cell,
                                text: label,
                                title: "Click to copy label",
                                timeout: 500,
                            });
                        }
                    }
                });

            document
                .querySelectorAll(
                    "category-conversions-container-view, conversion-goal-card"
                )
                .forEach((container) => {
                    if (
                        !container.querySelectorAll(".particle-table-row")
                            .length
                    ) {
                        container.style.display = "none";
                    }
                });
        }

        function run() {
            const dataStr =
                window.conversions_data.SHARED_ALL_ENABLED_CONVERSIONS;
            const awID = dataStr.match(/AW-(\d*)/)?.[1];

            if (!awID) {
                console.warn("Adwords script: Could not find AW-ID.");
                return;
            }

            document
                .querySelectorAll(".expand-more")
                .forEach((btn) => btn.click());

            const allData = JSON.parse(dataStr)[1];
            const dataMap = new Map(allData.map((d) => [d[1], d]));

            setTimeout(() => processRows(dataMap), 1000);

            showAwId(awID);
        }

        function poll() {
            if (
                typeof window.conversions_data !== "undefined" &&
                window.conversions_data.SHARED_ALL_ENABLED_CONVERSIONS
            ) {
                run();
            } else if (tries < maxTries) {
                tries++;
                setTimeout(poll, 500);
            } else {
                console.warn(
                    "Adwords script: Could not find `conversions_data`. Aborting."
                );
            }
        }

        if (
            document.readyState === "complete" ||
            document.readyState === "interactive"
        ) {
            poll();
        } else {
            window.addEventListener("DOMContentLoaded", poll);
        }
    })();
}
