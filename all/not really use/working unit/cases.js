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
                FOLLOWUP_ITEM: ".li-popup_lstcasefl",
                FOLLOWUP_BADGE: "#follow-up-badge",
                APPOINTMENT_TIME_BTN: '[data-infocase="appointment_time"]',
                FOLLOWUP_TIME_BTN: '[data-infocase="follow_up_time"]',
                DATEPICKER_TODAY: ".datepicker-grid .today",
                FOLLOWUP_INPUT: "#follow-up-days-input",
                PHONE_DIALOG: "[debug-id=phoneTakeDialog]",
                SET_FOLLOWUP_BTN: "[data-type=follow_up_time]",
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

        function getDayDifference(date1, date2) {
            const ONE_DAY_MS = 1000 * 60 * 60 * 24;
            return Math.round((date2 - date1) / ONE_DAY_MS);
        }

        function addBusinessDays(startDate, days) {
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
                await waitClick(CFG.SEL.FOLLOWUP_ITEM, 0);
            } catch (e) {
                console.error(e);
            }
        }

        function updateFLBadge() {
            const badge = document.getElementById(
                CFG.SEL.FOLLOWUP_BADGE.substring(1)
            );
            const item = document.querySelector(CFG.SEL.FOLLOWUP_ITEM);
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
            <span id="${CFG.SEL.FOLLOWUP_BADGE.substring(1)}" style="
                display: none; position: absolute; top: -5px; right: -5px;
                background: red; color: white; font-size: 10px; font-weight: bold;
                border-radius: 50%; padding: 2px 5px; line-height: 1;
            "></span>
        `;
            btn.addEventListener("click", handleFLClick);
            parent.appendChild(btn);

            waitEl(CFG.SEL.FOLLOWUP_ITEM)
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
                const apptBtn = document.querySelector(
                    CFG.SEL.APPOINTMENT_TIME_BTN
                );
                if (apptBtn && !apptBtn.dataset.valchoice) {
                    click(CFG.SEL.APPOINTMENT_TIME_BTN);
                    await waitClick(CFG.SEL.DATEPICKER_TODAY);
                }

                const input = document.getElementById(
                    CFG.SEL.FOLLOWUP_INPUT.substring(1)
                );
                const followUpDays = +input.value;

                if (!followUpDays) {
                    await waitClick(CFG.SEL.FINISH_BTN);
                } else {
                    const today = new Date();
                    const targetDate = addBusinessDays(today, followUpDays);
                    const calendarDays = getDayDifference(today, targetDate);

                    click(CFG.SEL.FOLLOWUP_TIME_BTN);
                    await waitClick(CFG.SEL.DATEPICKER_TODAY, calendarDays);
                }
                await waitClick(CFG.SEL.SET_FOLLOWUP_BTN);
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
            input.id = CFG.SEL.FOLLOWUP_INPUT.substring(1);
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
            #${CFG.SEL.FOLLOWUP_INPUT.substring(1)} {
                position: absolute; top: 50%; transform: translateY(-50%);
                right: 8px; width: 32px; height: 28px;
                padding: 0; border: none; border-radius: 3px; 
                background: rgba(255, 255, 255, 0.9); color: #333;
                font-weight: bold; font-size: 14px; text-align: center;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); 
                transition: box-shadow 0.2s ease; -moz-appearance: textfield;
            }
            #${CFG.SEL.FOLLOWUP_INPUT.substring(1)}:focus {
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
}
