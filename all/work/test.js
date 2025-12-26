if (window.location.href.includes("cases.connect")) {
    (() => {
        if (window.scrRun) return;
        window.scrRun = 1;

        const CFG = {
            SOUND_URL: "https://cdn.pixabay.com/audio/2025/07/18/audio_da35bc65d2.mp3",
            AUTO_CLICK_INTERVAL: 18000,
            AUTO_REMOVE_DELAY: 6000,
            CSS: {
                AUTO_CLICK_BTN: "#cdtx__uioncall--btn",
                AUTO_REMOVE_BTN: ".cdtx__uioncall_control-remove",
                FLUP_ITEM: ".li-popup_lstcasefl",
                TODAY_BTN: ".datepicker-grid .today",
                FLUP_INPUT_ID: "flup-days-input",
                FLUP_BADGE_ID: "flup-badge",
                UI_PANEL_ID: "btn-panel",
                HOME_BUTTON: '[debug-id="dock-item-home"]',
                APT__BTN: '[data-infocase="appointment_time"]',
                FLUP__BTN: '[data-infocase="follow_up_time"]',
                PHONE_DIALOG: "[debug-id=phoneTakeDialog]",
                SET_FLUP_BTN: "[data-type=follow_up_time]",
                FINISH_BTN: '[data-thischoice="Finish"]',
            },
        };

        // --- Helpers ---
        const click = (selector) => document.querySelector(selector)?.click();
        const dayDiff = (date1, date2) => Math.round((date2 - date1) / (1000 * 60 * 60 * 24));

        const addWorkDays = (startDate, days, holidays = []) => {
            const date = new Date(startDate);
            let daysAdded = 0;
            const isHoliday = (d) => holidays.includes(d.toISOString().split('T')[0]);

            while (daysAdded < days) {
                date.setDate(date.getDate() + 1);
                const dayOfWeek = date.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(date)) {
                    daysAdded++;
                }
            }
            return date;
        };

        const waitEl = (selector, { interval = 500, timeout = 3000 } = {}) => new Promise((resolve, reject) => {
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

        const waitClick = async (selector, steps = 0, opts = {}) => {
            const el = await waitEl(selector, opts);
            let target = el;
            for (let i = 0; i < steps; i++) target = target?.nextElementSibling;
            if (target) target.click();
            return target;
        };

        const observeNode = (selector, cb) => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((m) => {
                    if (m.nodeType === 1 && m.matches(selector)) cb();
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
            return observer;
        };

        // --- UI Components ---
        class Button {
            constructor({
                text = "",
                html = "",
                onClick = null,
                id = "",
                title = "",
                bgColor = "#555",
                extraStyles = {}
            }) {
                this.element = document.createElement("button");
                this.element.id = id;
                this.element.title = title;

                if (html) this.element.innerHTML = html;
                else this.element.innerText = text;

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
                    backgroundColor: bgColor,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...extraStyles
                });

                if (onClick) {
                    this.element.addEventListener("click", (e) => onClick(e));
                }
            }

            render(targetElement) {
                targetElement.appendChild(this.element);
            }

            setText(text) {
                this.element.innerText = text;
            }

            setColor(color) {
                this.element.style.backgroundColor = color;
            }

            appendChild(childElement) {
                this.element.appendChild(childElement);
            }
        }

        const autoBtn = {
            timerId: null,
            on: false,
            btnInstance: null,

            start() {
                if (this.timerId) return;
                this.on = true;
                this.timerId = setInterval(() => {
                    click(CFG.CSS.AUTO_CLICK_BTN);
                    setTimeout(() => click(CFG.CSS.AUTO_REMOVE_BTN), CFG.AUTO_REMOVE_DELAY);
                }, CFG.AUTO_CLICK_INTERVAL);
                this.updateView();
            },

            stop() {
                if (!this.timerId) return;
                clearInterval(this.timerId);
                this.timerId = null;
                this.on = false;
                this.updateView();
            },

            toggle() {
                this.on ? this.stop() : this.start();
            },

            updateView() {
                if (!this.btnInstance) return;
                this.btnInstance.setText(this.on ? "ON" : "OFF");
                this.btnInstance.setColor(this.on ? "#77DD77" : "#FF746C");
            },

            create(parent) {
                this.btnInstance = new Button({
                    text: "OFF",
                    onClick: () => this.toggle(),
                    id: "auto-btn",
                    title: "Auto Click",
                    bgColor: "#FF746C"
                });
                this.btnInstance.render(parent);
            }
        };

        const checkBtn = {
            async handleClick() {
                click(CFG.CSS.HOME_BUTTON);
                await waitClick(CFG.CSS.FLUP_ITEM, 0);
            },

            updateBadge(el) {
                const badge = document.getElementById(CFG.CSS.FLUP_BADGE_ID);
                if (el && badge) {
                    const count = el.getAttribute("data-attr") || "0";
                    badge.style.display = (count !== "0") ? "block" : "none";
                }
            },

            create(parent) {
                const htmlContent = `
                    <img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" 
                        style="width: 20px; height: 20px;">
                    <span id="${CFG.CSS.FLUP_BADGE_ID}" style="
                        display: none; position: absolute; top: -5px; right: -5px;
                        background: red; border-radius: 50%; padding: 2px 5px; line-height: 1;
                    ">+</span>
                `;

                const btn = new Button({
                    html: htmlContent,
                    onClick: () => this.handleClick(),
                    id: "follow-up-btn",
                    title: "Click Follow-up Item",
                    bgColor: "#A2BFFE"
                });

                btn.render(parent);
                waitEl(CFG.CSS.FLUP_ITEM).then((el) => {
                    const observer = new MutationObserver(() => this.updateBadge(el));
                    observer.observe(el, { attributes: true, attributeFilter: ["data-attr"] });
                    this.updateBadge(el);
                });
            },
        };

        const followUpBtn = {
            inputEl: null,

            async handleFLUpClick(e) {
                if (e.target.id === CFG.CSS.FLUP_INPUT_ID) return;

                const apptBtn = document.querySelector(CFG.CSS.APT__BTN);
                if (apptBtn && !apptBtn.dataset.valchoice) {
                    click(CFG.CSS.APT__BTN);
                    await waitClick(CFG.CSS.TODAY_BTN);
                }

                const flDays = +this.inputEl.value;
                if (!flDays) {
                    await waitClick(CFG.CSS.FINISH_BTN);
                } else {
                    const today = new Date();
                    const addDay = addWorkDays(today, flDays);
                    const calendarDays = dayDiff(today, addDay);
                    click(CFG.CSS.FLUP__BTN);
                    await waitClick(CFG.CSS.TODAY_BTN, calendarDays);
                }
                await waitClick(CFG.CSS.SET_FLUP_BTN);
            },

            create(parent) {
                const btn = new Button({
                    text: "FL Up:",
                    onClick: (e) => this.handleFLUpClick(e),
                    title: "Set Follow-up",
                    bgColor: "#55B4B0",
                    extraStyles: { paddingRight: "48px" }
                });

                const input = document.createElement("input");
                input.id = CFG.CSS.FLUP_INPUT_ID;
                input.type = "text";
                input.value = "2";
                input.title = "Days to follow-up";

                input.addEventListener("click", (e) => e.stopPropagation());
                input.addEventListener("input", (e) => {
                    e.target.value = e.target.value.replace(/\D/g, "").substring(0, 1);
                });
                input.addEventListener("focus", (e) => e.target.select());

                this.inputEl = input;
                btn.appendChild(input);
                btn.render(parent);
            }
        };

        // --- Initialization ---
        async function handleDialog() {
            const sound = new Audio(CFG.SOUND_URL);
            await sound.play();
            window.focus();
        }

        function injectCSS() {
            const id = "cases-connect-enhanced-styles";
            if (document.getElementById(id)) return;
            const rules = `
                #${CFG.CSS.FLUP_INPUT_ID} {
                    position: absolute; top: 50%; transform: translateY(-50%);
                    right: 8px; width: 32px; height: 28px;
                    padding: 0; border: none; border-radius: 3px; 
                    background: rgba(255, 255, 255, 0.9); color: #333;
                    font-weight: bold; font-size: 14px; text-align: center;
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); 
                    transition: box-shadow 0.2s ease; -moz-appearance: textfield;
                }
                #${CFG.CSS.FLUP_INPUT_ID}:focus {
                    outline: none;
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px rgba(255, 255, 255, 0.7);
                }
            `;
            const el = document.createElement("style");
            el.id = id;
            el.textContent = rules;
            document.head.appendChild(el);
        }

        function createPanel() {
            const div = document.createElement("div");
            div.id = CFG.CSS.UI_PANEL_ID;
            Object.assign(div.style, {
                position: "fixed", bottom: "16px", left: "16px",
                display: "flex", gap: "8px", alignItems: "center", zIndex: "9999",
            });
            document.body.appendChild(div);
            return div;
        }

        function init() {
            observeNode(CFG.CSS.PHONE_DIALOG, handleDialog);
            injectCSS();
            const panel = createPanel();

            autoBtn.create(panel);
            checkBtn.create(panel);
            followUpBtn.create(panel);
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
