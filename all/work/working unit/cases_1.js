// if (window.scrRun) return;
//         window.scrRun = 1;

const CFG = {
    SOUND_URL:
        "https://cdn.pixabay.com/audio/2025/07/18/audio_da35bc65d2.mp3",
    AUTO_CLICK_INTERVAL: 18000,
    AUTO_REMOVE_DELAY: 6000,
    CSS: {
        AUTO_CLICK_BTN: "#cdtx__uioncall--btn",
        AUTO_REMOVE_BTN: ".cdtx__uioncall_control-remove",
        FLUP_ITEM: ".li-popup_lstcasefl",
        TODAY_BTN: ".datepicker-grid .today",
        FLUP_BADGE_ID: "follow-up-badge",
        FLUP_INPUT_ID: "follow-up-days-input",
        UI_PANEL_ID: "script-btn-panel",
        HOME_BUTTON: '[debug-id="dock-item-home"]',
        APT__BTN: '[data-infocase="appointment_time"]',
        FLUP__BTN: '[data-infocase="follow_up_time"]',
        PHONE_DIALOG: "[debug-id=phoneTakeDialog]",
        SET_FLUP_BTN: "[data-type=follow_up_time]",
        FINISH_BTN: '[data-thischoice="Finish"]',
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

function waitEl(selector, { interval = 500, timeout = 3000 } = {}) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            setInterval(() => {
                const el = document.querySelector(selector);
                if (el !== null) {
                    clearInterval(timer);
                    resolve(el);
                    return;
                }
            }, interval);
        }, timeout);
    });
}

async function waitClick(selector, steps = 0, opts = {}) {
    const el = await waitEl(selector, opts);
    let target = el;
    if (steps > 0) {
        for (let i = 0; i < steps; i++) {
            if (target) {
                target = target.nextElementSibling;
            }
        }
    }
    if (target) {
        target.click();
        return target;
    }
}

function observeNode(selector, cb) {
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.nodeType !== 1) continue;
            m.matches(selector) && cb();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
}

const autoClick = {
    func: null,
    on: false,
    btn: null,
    start() {
        if (this.func) return;
        this.on = true;
        this.func = setInterval(() => {
            click(CFG.CSS.AUTO_CLICK_BTN);
            setTimeout(
                () => click(CFG.CSS.AUTO_REMOVE_BTN),
                CFG.AUTO_REMOVE_DELAY
            );
        }, CFG.AUTO_CLICK_INTERVAL);
        this.updateBtn();
    },
    stop() {
        if (!this.func) return;
        clearInterval(this.id);
        this.func = null;
        this.on = false;
        this.updateBtn();
    },
    toggle() {
        this.on ? this.stop() : this.start();
    },
    updateBtn() {
        if (!this.btn) return;
        this.btn.textContent = this.on ? "ON" : "OFF";
        this.btn.style.backgroundColor = this.on ? "#77DD77" : "#FF746C";
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

const checkBtn = {
    async click() {
        click(CFG.CSS.HOME_BUTTON);
        await waitClick(CFG.CSS.FLUP_ITEM, 0);
    },
    updateBadge() {
        const badge = document.getElementById(CFG.CSS.FLUP_BADGE_ID);
        const item = document.querySelector(CFG.CSS.FLUP_ITEM);
        if (item && badge) {
            const count = item.dataset.attr;
            badge.textContent = count;
            badge.style.display = count ? "block" : "none";
        }
    },
    createCheckBtn(parent) {
        const btn = document.createElement("button");
        btn.id = "follow-up-btn";
        btn.title = "Click Follow-up Item";
        btn.style.position = "relative";
        Object.assign(btn.style, BTN_STYLE, {
            backgroundColor: "#A2BFFE",
            lineHeight: "0",
        });
        btn.innerHTML = `
        <img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 20px; height: 20px; vertical-align: middle;">
        <span id="${CFG.CSS.FLUP_BADGE_ID}" style="
            display: none; position: absolute; top: -5px; right: -5px;
            background: red; color: white; font-size: 10px; font-weight: bold;
            border-radius: 50%; padding: 2px 5px; line-height: 1;
        "></span>
    `;
        btn.addEventListener("click", clickFLBtn);
        parent.appendChild(btn);

        waitEl(CFG.CSS.FLUP_ITEM)
            .then((el) => {
                const observer = new MutationObserver(updateFLBadge);
                observer.observe(el, {
                    attributes: true,
                    attributeFilter: ["data-attr"],
                });
                updateFLBadge();
            });
    }

}

async function clickCheckBtn() {
    click(CFG.CSS.HOME_BUTTON);
    await waitClick(CFG.CSS.FLUP_ITEM, 0);
}

function updateCheckBadge() {
    const badge = document.getElementById(CFG.CSS.FLUP_BADGE_ID);
    const item = document.querySelector(CFG.CSS.FLUP_ITEM);
    if (item && badge) {
        const count = item.dataset.attr;
        badge.textContent = count;
        badge.style.display = count ? "block" : "none";
    }
}

function createCheckBtn(parent) {
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
        <span id="${CFG.CSS.FLUP_BADGE_ID}" style="
            display: none; position: absolute; top: -5px; right: -5px;
            background: red; color: white; font-size: 10px; font-weight: bold;
            border-radius: 50%; padding: 2px 5px; line-height: 1;
        "></span>
    `;
    btn.addEventListener("click", clickFLBtn);
    parent.appendChild(btn);

    waitEl(CFG.CSS.FLUP_ITEM)
        .then((el) => {
            const observer = new MutationObserver(updateFLBadge);
            observer.observe(el, {
                attributes: true,
                attributeFilter: ["data-attr"],
            });
            updateFLBadge();
        });
}

async function handleApptClick() {
    const apptBtn = document.querySelector(CFG.CSS.APT__BTN);
    if (apptBtn && !apptBtn.dataset.valchoice) {
        click(CFG.CSS.APT__BTN);
        await waitClick(CFG.CSS.TODAY_BTN);
    }

    const input = document.getElementById(CFG.CSS.FLUP_INPUT_ID);
    const flDays = +input.value;

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
}

function createFLUpBtn(parent) {
    const div = document.createElement("div");
    div.id = "today-btn-group";
    const span = document.createElement("span");
    span.id = "today-btn-label";
    span.textContent = "FL Up:";
    span.title = "Set Follow-up";
    span.addEventListener("click", handleApptClick);
    const input = document.createElement("input");
    input.id = CFG.CSS.FLUP_INPUT_ID;
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
    await sound.play();
    window.focus();
}

function createPanel() {
    const div = document.createElement("div");
    div.id = CFG.CSS.UI_PANEL_ID;
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
        #${CFG.CSS.UI_PANEL_ID} button:hover { 
            opacity: 0.9; transform: translateY(-1px); 
        }
        #${CFG.CSS.UI_PANEL_ID} button:active { 
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

function init() {
    observeNode(CFG.CSS.PHONE_DIALOG, handleDialog);
    injectCSS();
    const panel = createPanel();
    autoClick.createBtn(panel);
    createCheckBtn(panel);
    createFLUpBtn(panel);
}

init();