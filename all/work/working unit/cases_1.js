
// if (window.scrRun) return;
//         window.scrRun = 1;

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
            click(CFG.SEL.AUTO_CLICK_BTN);
            setTimeout(
                () => click(CFG.SEL.AUTO_REMOVE_BTN),
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

async function handleFLClick() {
    click(CFG.SEL.HOME_BUTTON);
    await waitClick(CFG.SEL.FLUP_ITEM, 0);
}

function updateFLBadge() {
    const badge = document.getElementById(CFG.SEL.FLUP_BADGE.substring(1));
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