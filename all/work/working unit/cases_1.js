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
            }, interval)
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