if (window.location.href.includes("cases.connect")) {
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
}
