(() => {
    "use strict";
    // ============================================================================
    // SECTION 1: GLOBAL LIFECYCLE & TEARDOWN REGISTRY
    // ============================================================================
    const G = window.__OMNITOOL__ ||= {};
    try {
        G.teardown?.();
    } catch (e) {
        console.warn("Omnitool: previous cleanup failed", e);
    }
    const cleanups = [];
    const onTeardown = fn => cleanups.push(fn);
    G.teardown = () => {
        for (; cleanups.length;) try {
            cleanups.pop()();
        } catch (e) {
            console.warn("Omnitool: cleanup error", e);
        }
    };
    // ============================================================================
    // SECTION 2: TRUSTED TYPES SECURITY LAYER
    // ============================================================================
    const toSafeHTML = html => {
        if (!G.tt) {
            const pass = {
                createHTML: s => s
            };
            for (const name of ["omnitool", "default"]) try {
                G.tt ||= window.trustedTypes?.createPolicy?.(name, pass);
            } catch { }
            G.tt ||= window.trustedTypes?.defaultPolicy || pass;
        }
        return G.tt.createHTML(html);
    };
    // ============================================================================
    // SECTION 3: SHARED DOM & ASYNC UTILITY LIBRARY
    // ============================================================================
    const Utils = {
        sleep: ms => new Promise((resolve => setTimeout(resolve, ms))),
        $: (selector, parent = document) => parent.querySelector(selector),
        $$: (selector, parent = document) => [...parent.querySelectorAll(selector)],
        toSafeHTML,
        createEl(tag, { parent, onClick, style, text, html, ...props } = {}) {
            const el = document.createElement(tag);
            if (void 0 !== text) el.textContent = text;
            if (void 0 !== html) el.innerHTML = toSafeHTML(html);
            if (style) if ("string" === typeof style) el.style.cssText = style; else Object.assign(el.style, style);
            if (onClick) el.addEventListener("click", onClick);
            for (const [key, value] of Object.entries(props)) if (key.startsWith("data-")) el.setAttribute(key, value); else el[key] = value;
            if (parent) parent.appendChild(el);
            return el;
        },
        addStyle(id, cssText) {
            document.getElementById(id)?.remove();
            const styleEl = document.createElement("style");
            styleEl.id = id;
            styleEl.textContent = cssText;
            (document.head || document.documentElement).appendChild(styleEl);
        },
        waitForElement: (selector, timeout = 5e3) => new Promise(((resolve, reject) => {
            const existing = document.querySelector(selector);
            if (existing) return resolve(existing);
            const observer = new MutationObserver((() => {
                const found = document.querySelector(selector);
                if (found) {
                    observer.disconnect();
                    clearTimeout(timer);
                    resolve(found);
                }
            }));
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
            const timer = setTimeout((() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for: ${selector}`));
            }), timeout);
        })),
        setupCopy(element, text, successMsg = "✓ Copied!") {
            let timer;
            element.addEventListener("click", (async () => {
                try {
                    await navigator.clipboard.writeText(text);
                } catch (err) {
                    return console.error("Copy failed", err);
                }
                element.dataset.origText ||= element.textContent;
                element.textContent = successMsg;
                element.classList.add("is-copied");
                clearTimeout(timer);
                timer = setTimeout((() => {
                    element.textContent = element.dataset.origText;
                    element.classList.remove("is-copied");
                }), 1500);
            }));
        },
        escapeHtml: str => String(str ?? "").replace(/[&<>"']/g, (ch => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[ch]))),
        escapeRegExp: str => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    };
    const { $, $$ } = Utils;
    // ============================================================================
    // SECTION 4: TAG INSPECTOR MODULE (TagInspector)
    // ============================================================================
    const TagInspector = {
        CONFIG: {
            GTM: {
                prio: 1,
                label: "GTM ICS ↗",
                bg: "rgba(224, 242, 254, 0.6)",
                border: "rgba(186, 230, 253, 0.8)",
                color: "#0369a1"
            },
            G: {
                prio: 2,
                label: "GA4 ICS ↗",
                bg: "rgba(254, 249, 195, 0.6)",
                border: "rgba(254, 240, 138, 0.8)",
                color: "#854d0e"
            },
            AW: {
                prio: 3,
                label: "ADS ICS ↗",
                bg: "rgba(220, 252, 231, 0.6)",
                border: "rgba(187, 247, 208, 0.8)",
                color: "#166534"
            },
            DEF: {
                prio: 4,
                label: "Open ↗",
                bg: "rgba(243, 244, 246, 0.6)",
                border: "rgba(229, 231, 235, 0.8)",
                color: "#374151"
            }
        },
        injectStyles() {
            Utils.addStyle("ti-styles", '@import url(\'https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap\'); .ti-mask, .ti-mask * { font-family: "Exo 2", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important; } .ti-mask { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background-color: rgba(0, 0, 0, 0.55) !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important; } .ti-modal { background-color: rgba(255, 255, 255, 0.85) !important; backdrop-filter: blur(25px) !important; -webkit-backdrop-filter: blur(25px) !important; border-radius: 20px !important; padding: 24px !important; width: 90% !important; max-width: 420px !important; max-height: 80vh !important; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04) !important; border: none !important; display: flex !important; flex-direction: column !important; gap: 16px !important; box-sizing: border-box !important; } .ti-body { overflow-y: auto !important; max-height: 50vh !important; border-radius: 14px !important; background-color: rgba(255, 255, 255, 0.5) !important; backdrop-filter: blur(10px) !important; border: none !important; box-shadow: none !important; } .ti-modal table, .ti-modal thead, .ti-modal tbody, .ti-modal tr, .ti-modal th, .ti-modal td { border: none !important; outline: none !important; box-shadow: none !important; background-image: none !important; } .ti-modal table { width: 100% !important; border-collapse: collapse !important; border-spacing: 0 !important; margin: 0 !important; padding: 0 !important; } .ti-row { transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; } .ti-row:hover { background-color: rgba(255, 255, 255, 0.8) !important; } .ti-tag { font-weight: 600 !important; font-size: 12px !important; border-radius: 9999px !important; padding: 4px 12px !important; cursor: pointer !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; white-space: nowrap !important; display: inline-block !important; line-height: 1.4 !important; box-sizing: border-box !important; letter-spacing: 0.3px !important; } .ti-tag:hover { transform: scale(1.02) !important; } .ti-tag:active { transform: scale(0.97) !important; } .ti-btn { display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 92px !important; min-width: 92px !important; max-width: 92px !important; height: 28px !important; min-height: 28px !important; max-height: 28px !important; padding: 0 !important; margin: 0 !important; font-size: 11.5px !important; font-weight: 600 !important; line-height: 1 !important; white-space: nowrap !important; cursor: pointer !important; border: none !important; border-radius: 9999px !important; background-color: #0071E3 !important; color: #ffffff !important; box-shadow: 0 2px 8px rgba(0, 113, 227, 0.2) !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; box-sizing: border-box !important; text-transform: none !important; letter-spacing: 0.2px !important; } .ti-btn:hover { background-color: #0077ED !important; box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3) !important; transform: translateY(-1px) !important; } .ti-btn:active { transform: scale(0.96) !important; } .ti-gear { padding: 8px 16px !important; font-size: 13px !important; font-weight: 500 !important; cursor: pointer !important; border: none !important; border-radius: 9999px !important; background-color: rgba(0, 0, 0, 0.05) !important; color: #1D1D1F !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; box-sizing: border-box !important; white-space: nowrap !important; } .ti-gear:hover { background-color: rgba(0, 0, 0, 0.08) !important; } .ti-gear:active { transform: scale(0.96) !important; } .ti-close { padding: 8px 20px !important; font-size: 13px !important; font-weight: 500 !important; cursor: pointer !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; border-radius: 9999px !important; background-color: #FFFFFF !important; color: #1D1D1F !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; box-shadow: 0 2px 6px rgba(0,0,0,0.02) !important; box-sizing: border-box !important; white-space: nowrap !important; } .ti-close:hover { background-color: #F5F5F7 !important; border-color: rgba(0, 0, 0, 0.15) !important; } .ti-close:active { transform: scale(0.96) !important; }');
        },
        scanTags() {
            const tagSet = new Set;
            const scan = text => text?.match(/\b(GTM-[A-Z0-9]{4,10}|G-[A-Z0-9]{6,12}|AW-\d+)\b/g)?.forEach((t => tagSet.add(t)));
            for (const s of document.scripts) scan(s.outerHTML);
            performance?.getEntriesByType?.("resource").forEach((r => scan(r.name)));
            const prio = t => TagInspector.CONFIG[t.split("-")[0]]?.prio ?? 4;
            return [...tagSet].sort(((a, b) => prio(a) - prio(b) || a.localeCompare(b)));
        },
        init() {
            TagInspector.injectStyles();
            const tags = TagInspector.scanTags();
            $("#apple-gtag-overlay")?.remove();
            const overlay = Utils.createEl("div", {
                id: "apple-gtag-overlay",
                className: "ti-mask",
                parent: document.body,
                onClick: e => e.target === overlay && overlay.remove()
            });
            onTeardown((() => overlay.remove()));
            const modal = Utils.createEl("div", {
                className: "ti-modal",
                parent: overlay
            });
            const container = Utils.createEl("div", {
                className: "ti-body",
                parent: modal
            });
            if (!tags.length) Utils.createEl("div", {
                parent: container,
                style: "text-align: center; color: #86868B; padding: 32px 16px; font-size: 14px; font-weight: 500;",
                text: "No Google Tags found on this page."
            }); else {
                const th = "padding: 12px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #86868B;";
                const table = Utils.createEl("table", {
                    parent: container,
                    style: "width: 100%; border-collapse: collapse; text-align: left;",
                    html: `<thead><tr style="background-color: rgba(250, 250, 250, 0.6);"><th style="${th}">Tag ID</th><th style="${th} text-align: right;">Action</th></tr></thead>`
                });
                const tbody = Utils.createEl("tbody", {
                    parent: table
                });
                tags.forEach((tag => {
                    const prefix = tag.split("-")[0];
                    const meta = TagInspector.CONFIG[prefix] || TagInspector.CONFIG.DEF;
                    const row = Utils.createEl("tr", {
                        className: "ti-row",
                        parent: tbody
                    });
                    const tdTag = Utils.createEl("td", {
                        parent: row,
                        style: "padding: 12px 16px;"
                    });
                    const tagBtn = Utils.createEl("button", {
                        parent: tdTag,
                        className: "ti-tag",
                        text: tag,
                        title: "Click to copy",
                        style: `color: ${meta.color}; background-color: ${meta.bg}; border: 1px solid ${meta.border} !important;`
                    });
                    Utils.setupCopy(tagBtn, tag);
                    const tdAction = Utils.createEl("td", {
                        parent: row,
                        style: "padding: 12px 16px; text-align: right;"
                    });
                    Utils.createEl("button", {
                        parent: tdAction,
                        className: "ti-btn",
                        text: meta.label,
                        onClick: () => {
                            const url = "AW" === prefix ? `https://adwords.corp.google.com/aw_internalops/go?conversiontrackingid=${tag.replace("AW-", "")}` : `https://tagmanager-ics.corp.google.com/home?q=${encodeURIComponent(tag)}`;
                            window.open(url, "_blank");
                        }
                    });
                }));
            }
            const footer = Utils.createEl("div", {
                parent: modal,
                style: "display: flex; justify-content: space-between; align-items: center; padding-top: 4px;"
            });
            Utils.createEl("button", {
                parent: footer,
                className: "ti-gear",
                text: "Gearloose ↗",
                onClick: () => window.open(`https://gearloose.corp.google.com/#/search?q=${encodeURIComponent(location.host)}&tab=merchants`, "_blank")
            });
            Utils.createEl("button", {
                parent: footer,
                className: "ti-close",
                text: "Close",
                onClick: () => overlay.remove()
            });
        }
    };
    // ============================================================================
    // SECTION 5: QPLUS CASE FORM AUTOMATION (QPlusAutomator)
    // ============================================================================
    const QPlusAutomator = {
        SELECTORS: {
            questionContainer: ".question-container",
            questionText: ".question-text",
            label: "label.mdc-label, label, .mat-radio-label, .mat-mdc-radio-button, mat-radio-button, mat-checkbox",
            textarea: 'textarea[formcontrolname="selectedText"]',
            autoSuggestion: "span.auto-suggestion-text",
            radioParent: "mat-radio-button",
            checkboxParent: "mat-checkbox",
            input: "input",
            takeCase: '[aria-label="Take the task"]'
        },
        TASK_METRICS: {
            CT: {
                taskType: ["Ads Conversion Tracking"]
            },
            EC: {
                taskType: ["Enhanced Conversions for Web (ECW)"],
                ecFeasible: "No",
                ecOption: "Manual"
            },
            GA4: {
                taskType: ["GA4 Setup (no Analytics in place yet)"],
                ga4Features: ["Tagging"]
            },
            GA4_UPD: {
                taskType: ["Enhanced Conversions - GA4 User Provided Data"],
                ga4Features: ["Other Conversions"],
                ecFeasible: "No",
                ecOption: "Manual"
            },
            AUD: {
                taskType: ["Ads Standard Remarketing", "GA4 Standard Remarketing"],
                ga4Features: ["Standard Audiences"]
            }
        },
        STATUS_OPTIONS: [{
            id: "SO",
            label: "Solution Offered"
        }, {
            id: "NI",
            label: "Need Attention"
        }, {
            id: "IN",
            label: "Inactive"
        }],
        VALIDATION_SUBTASKS: [{
            id: "CT",
            label: "Conversion Tracking"
        }, {
            id: "EC",
            label: "Enhanced Conversion Tracking"
        }, {
            id: "GA4",
            label: "GA4 setup"
        }, {
            id: "GA4_UPD",
            label: "GA4 UPD"
        }, {
            id: "AUD",
            label: "Ads Audiences"
        }],
        NI_TASKS: [{
            id: "WAIT_INPUT",
            label: "Waiting Input"
        }, {
            id: "WAIT_VALIDATION",
            label: "Waiting Validation"
        }, {
            id: "IN_CONSULT",
            label: "In Consult"
        }],
        promptUser: () => new Promise((resolve => {
            const Q = QPlusAutomator;
            const tasksByStatus = {
                SO: Q.VALIDATION_SUBTASKS,
                NI: Q.NI_TASKS,
                IN: [{
                    id: "UNREACHABLE",
                    label: "Unreachable"
                }]
            };
            let selectedStatus = null;
            let selectedTask = null;
            let done = false;
            const overlay = Utils.createEl("div", {
                style: "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.55); z-index: 99999; display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif; opacity: 0; transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);",
                parent: document.body
            });
            const modal = Utils.createEl("div", {
                style: "background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); padding: 20px; border-radius: 20px; width: 90%; max-width: 280px; box-shadow: 0 16px 40px rgba(0,0,0,0.08); border: 1px solid rgba(255, 255, 255, 0.8); transform: translateY(12px) scale(0.96); transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; gap: 10px; box-sizing: border-box;",
                parent: overlay
            });
            const header = Utils.createEl("div", {
                style: "margin-bottom: 2px;",
                parent: modal
            });
            Utils.createEl("h3", {
                text: "Task Profile",
                style: "margin: 0; color: #1D1D1F; font-size: 16px; font-weight: 600; letter-spacing: -0.2px;",
                parent: header
            });
            const stepTitle = Utils.createEl("div", {
                style: "color: #86868B; font-size: 12px; font-weight: 500; margin-top: 2px;",
                parent: header
            });
            const optionsContainer = Utils.createEl("div", {
                style: "display: flex; flex-direction: column; gap: 6px; max-height: 55vh; overflow-y: auto; padding-right: 2px;",
                parent: modal
            });
            const navContainer = Utils.createEl("div", {
                style: "display: flex; gap: 6px; margin-top: 6px;",
                parent: modal
            });
            requestAnimationFrame((() => {
                overlay.style.opacity = "1";
                modal.style.transform = "translateY(0) scale(1)";
            }));
            const closeDialog = (result, instant = false) => {
                if (!done) {
                    done = true;
                    overlay.style.opacity = "0";
                    modal.style.transform = "translateY(12px) scale(0.96)";
                    setTimeout((() => {
                        overlay.remove();
                        resolve(result);
                    }), instant ? 0 : 200);
                }
            };
            onTeardown((() => closeDialog(null, true)));
            const createBtn = (text, parent, bg, hoverBg, textColor, onClick) => {
                const transparent = "transparent" === bg;
                Utils.createEl("button", {
                    text,
                    parent,
                    onClick,
                    onmouseover: e => e.currentTarget.style.background = hoverBg,
                    onmouseout: e => e.currentTarget.style.background = bg,
                    style: `flex: 1; padding: 10px 14px; cursor: pointer; background: ${bg}; border: 1px solid ${transparent ? "transparent" : "rgba(0,0,0,0.05)"}; border-radius: 12px; color: ${textColor}; font-size: 13px; font-weight: 500; text-align: ${transparent ? "center" : "left"}; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);`
                });
            };
            const renderStep = (title, items, onSelect, onBack) => {
                stepTitle.textContent = title;
                optionsContainer.textContent = "";
                navContainer.textContent = "";
                items.forEach((item => createBtn(item.label, optionsContainer, "rgba(255, 255, 255, 0.6)", "rgba(0, 113, 227, 0.08)", "#1D1D1F", (() => onSelect(item)))));
                if (onBack) createBtn("Back", navContainer, "rgba(0, 0, 0, 0.04)", "rgba(0, 0, 0, 0.08)", "#1D1D1F", onBack);
                createBtn("Cancel", navContainer, "transparent", "rgba(0, 0, 0, 0.04)", "#86868B", (() => closeDialog(null)));
            };
            const showStatusStep = () => renderStep("Step 1: Select Status", Q.STATUS_OPTIONS, (status => {
                selectedStatus = status;
                showTaskStep();
            }));
            const showTaskStep = () => renderStep("Step 2: Select Task", tasksByStatus[selectedStatus.id] || [], (task => {
                selectedTask = task;
                if ("NI" === selectedStatus.id && "WAIT_VALIDATION" === task.id) showSubTaskStep(); else closeDialog({
                    status: selectedStatus,
                    task: selectedTask
                });
            }), showStatusStep);
            const showSubTaskStep = () => renderStep("Step 3: Select Validation Task", Q.VALIDATION_SUBTASKS, (subTask => closeDialog({
                status: selectedStatus,
                task: selectedTask,
                subTask
            })), showTaskStep);
            showStatusStep();
        })),
        buildConfig({ status, task, subTask }) {
            const isWaitVal = "NI" === status.id && "WAIT_VALIDATION" === task.id;
            const isSO = "SO" === status.id;
            const fillExtra = isSO || isWaitVal;
            const NA = "Not Applicable (N/A)";
            const subStatus = isSO ? "SO - Implementation only" : "NI" === status.id ? {
                WAIT_INPUT: "NI - Awaiting Inputs",
                WAIT_VALIDATION: "NI - Awaiting Validation",
                IN_CONSULT: "NI - In Consult"
            }[task.id] || "" : "Inactive - Unreachable";
            const targetTaskId = isSO ? task.id : isWaitVal ? subTask?.id : null;
            const taskMeta = targetTaskId && QPlusAutomator.TASK_METRICS[targetTaskId] || {};
            return {
                ldap: "",
                date: "",
                status: isSO ? "Implemented" : "NI" === status.id ? "In Progress" : "Inactive",
                subStatus,
                radioQs: fillExtra ? [{
                    title: "If task type was EC",
                    choice: taskMeta.ecFeasible || NA
                }, {
                    title: "what option was used",
                    choice: taskMeta.ecOption || NA
                }, {
                    title: "Was it a GTM implementation",
                    choice: "Yes"
                }, {
                    title: "If COMO task was implemented",
                    choice: NA
                }, {
                    title: "If Customer Match",
                    choice: "None"
                }, {
                    title: "CMS / Platform",
                    choice: "Didn't check"
                }] : [],
                checkboxQs: fillExtra ? [{
                    title: "Task Type",
                    choices: taskMeta.taskType || []
                }, {
                    title: "For GA4 Cases, what exact features",
                    choices: taskMeta.ga4Features || [NA]
                }] : []
            };
        },
        dispatchAngularEvents(element) {
            element.dispatchEvent(new Event("input", {
                bubbles: true
            }));
            element.dispatchEvent(new Event("change", {
                bubbles: true
            }));
            element.blur();
        },
        selectOptions(choices, { title, isCheckbox = false } = {}) {
            const S = QPlusAutomator.SELECTORS;
            let context = document;
            if (title) {
                const titleLower = title.toLowerCase();
                context = $$(S.questionContainer).find((c => $(S.questionText, c)?.textContent.toLowerCase().includes(titleLower)));
                if (!context) return false;
            }
            const labels = $$(S.label, context).map((node => ({
                node,
                text: node.textContent.trim().replace(/\s+/g, " ")
            })));
            let found = false;
            for (const target of [].concat(choices)) {
                let hits = labels.filter((l => l.text === target));
                if (!hits.length) hits = labels.filter((l => l.text.startsWith(target)));
                for (const { node } of hits) {
                    const parent = node.closest(isCheckbox ? S.checkboxParent : S.radioParent) || node;
                    const forId = node.getAttribute("for");
                    const input = $(S.input, parent) || (forId ? document.getElementById(forId) : null);
                    if (!isCheckbox || input && !input.checked) {
                        if (!input?.checked) {
                            if (parent !== node) parent.click();
                            node.click();
                        }
                        if (input) {
                            if (!input.checked) input.click();
                            input.dispatchEvent(new Event("change", {
                                bubbles: true
                            }));
                            input.dispatchEvent(new Event("input", {
                                bubbles: true
                            }));
                        }
                        found = true;
                    }
                }
            }
            return found;
        },
        async init() {
            const Q = QPlusAutomator;
            const S = Q.SELECTORS;
            const options = await Q.promptUser();
            if (!options) return console.log("🛑 Form automation cancelled by user.");
            const config = Q.buildConfig(options);
            try {
                $(S.takeCase)?.click();
                await Utils.sleep(300);
                $(`.footer ${S.takeCase}`)?.click();
                await Utils.waitForElement(S.questionContainer);
                Q.selectOptions(config.status);
                await Utils.sleep(400);
                if (config.subStatus) {
                    const prefix = config.subStatus.split(" - ")[0];
                    for (let i = 0; i < 15 && !$$(S.label).some((l => l.textContent.includes(prefix))); i++) await Utils.sleep(150);
                    Q.selectOptions(config.subStatus);
                    await Utils.sleep(300);
                }
                const textareas = $$(S.textarea);
                [config.ldap, config.date].forEach(((val, idx) => {
                    const target = textareas[idx];
                    if (target) {
                        target.focus();
                        target.click();
                        target.value = val;
                        Q.dispatchAngularEvents(target);
                    }
                }));
                config.radioQs.forEach((q => Q.selectOptions(q.choice, {
                    title: q.title
                })));
                config.checkboxQs.forEach((q => Q.selectOptions(q.choices, {
                    title: q.title,
                    isCheckbox: true
                })));
                await Utils.sleep(200);
                $(S.autoSuggestion)?.click();
                console.log("✅ Form successfully populated.");
            } catch (error) {
                console.error("❌ Error during form automation:", error);
            }
        }
    };
    // ============================================================================
    // SECTION 6: REAL-TIME TEAM STATUS DASHBOARD (Dash)
    // ============================================================================
    const Dash = {
        STATUS_MAP: {
            active: {
                prio: 1,
                maxSecs: 3600,
                color: "#34C759",
                track: "rgba(52, 199, 89, 0.15)"
            },
            video: {
                prio: 2,
                maxSecs: 2700,
                color: "#AF52DE",
                track: "rgba(175, 82, 222, 0.15)",
                ico: "9571/9571236",
                anim: "breathe"
            },
            phone: {
                prio: 2.5,
                maxSecs: 2700,
                color: "#FF3B30",
                track: "rgba(255, 59, 48, 0.15)",
                ico: "13332/13332839",
                anim: "ring"
            },
            "lunch-break": {
                prio: 3,
                maxSecs: 3600,
                color: "#FFCC00",
                track: "rgba(255, 204, 0, 0.15)",
                ico: "1182/1182132",
                anim: "bounce-y"
            },
            email: {
                prio: 4,
                maxSecs: 900,
                color: "#0071E3",
                track: "rgba(0, 113, 227, 0.15)",
                ico: "7487/7487055",
                anim: "fly"
            },
            "coffee-break": {
                prio: 5,
                maxSecs: 900,
                color: "#FF9500",
                track: "rgba(255, 149, 0, 0.15)",
                ico: "16108/16108931",
                anim: "rock"
            },
            break: {
                prio: 6,
                maxSecs: 900,
                color: "#8E8E93",
                track: "rgba(142, 142, 147, 0.15)",
                ico: "5140/5140652",
                anim: "fade-pulse"
            },
            default: {
                prio: 99,
                maxSecs: 2700,
                color: "#8E8E93",
                track: "rgba(142, 142, 147, 0.15)"
            }
        },
        ICONS: {
            close: "https://cdn-icons-png.flaticon.com/512/9403/9403346.png",
            non_phone: "https://cdn-icons-png.flaticon.com/512/17720/17720299.png",
            non_video: "https://cdn-icons-png.flaticon.com/512/11305/11305490.png"
        },
        POOL_RANKS: {
            LM: 1,
            BAU: 2
        },
        formatTime: str => String(str || "").replace(/(\d+)\s*([hms])/gi, "$1 $2").replace(/\s+/g, " ").trim(),
        parseDuration: timeStr => (String(timeStr || "").match(/\d+[hms]/g) || []).reduce(((acc, curr) => acc + parseInt(curr, 10) * ({
            h: 3600,
            m: 60,
            s: 1
        }[curr.slice(-1)] || 0)), 0),
        extractState: cell => (cell?.innerText.match(/[a-zA-Z\s]+/)?.[0] || "").trim().toLowerCase().replace(/\s+/g, "-"),
        injectStyles() {
            Utils.addStyle("cm-styles", '@import url(\'https://fonts.googleapis.com/css2?family=Alegreya:wght@700&family=Cookie&family=Lexend:wght@700&family=Fraunces&display=swap\'); #cm-root, #cm-root * { box-sizing: border-box; font-family: "Lexend", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-weight: 700 !important; } #cm-root { position: fixed; height: 100%; width: 100%; top: 0; right: 0; background-color: rgba(0, 0, 0, 0.45); z-index: 9999; display: flex; justify-content: flex-end; align-items: center; padding: 20px; pointer-events: none; } #cm-root .cm-wrap { position: relative; pointer-events: auto; width: 100%; max-width: 320px; height: auto; max-height: 95vh; background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-radius: 20px; box-shadow: 0 16px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.02); padding: 16px; border: 1px solid rgba(255, 255, 255, 0.8); color: #1D1D1F; transition: max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), all 0.3s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; gap: 12px; overflow: hidden; } #cm-root .cm-wrap.cm-full { max-width: 400px; } #cm-root .cm-close { position: absolute; top: 10px; right: 10px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(0,0,0,0.06); cursor: pointer; z-index: 20; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); } #cm-root .cm-close:hover { background: #FFFFFF; transform: scale(1.08); } #cm-root .cm-close img { width: 11px; height: 11px; opacity: 0.6; } #cm-root .cm-card { display: flex; flex-direction: column; width: 100%; background: rgba(255, 255, 255, 0.5); border-radius: 14px; padding: 10px; border: 1px solid rgba(0,0,0,0.05); min-height: 0; height: auto; flex: 0 1 auto; } #cm-root #cm-card-bau { max-height: 100%; } #cm-root #cm-card-lm { max-height: 70%; } #cm-root .cm-head { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; width: 100%; flex-shrink: 0; } #cm-root .cm-head-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; } #cm-root .cm-head h3 { margin: 0; font-size: 11px; color: #86868B; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; gap: 6px; } #cm-root .cm-toggle { padding: 3px 9px; font-size: 10px; cursor: pointer; border: 1px solid rgba(0,0,0,0.1); border-radius: 9999px; background: rgba(255, 255, 255, 0.85); color: #1D1D1F; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.04); white-space: nowrap; } #cm-root .cm-toggle:hover { background: #FFFFFF; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.08); } #cm-root .cm-toggle:active { transform: scale(0.96); } #cm-root .cm-stats { display: flex; gap: 5px; justify-content: flex-start; align-items: center; width: 100%; } #cm-root .cm-pill { font-size: 9.5px; padding: 2px 7px; border-radius: 9999px; white-space: nowrap; } #cm-root .badge-act { background: rgba(52, 199, 89, 0.12); color: #248A3D; border: 1px solid rgba(52, 199, 89, 0.2); } #cm-root .badge-phn { background: rgba(255, 59, 48, 0.12); color: #D70015; border: 1px solid rgba(255, 59, 48, 0.2); } #cm-root .badge-brk { background: rgba(255, 149, 0, 0.12); color: #C77000; border: 1px solid rgba(255, 149, 0, 0.2); } #cm-root .badge-tot { background: rgba(142, 142, 147, 0.12); color: #636366; border: 1px solid rgba(142, 142, 147, 0.2); } #cm-root .cm-card.cm-warn { animation: pulseHealth 2.5s infinite; border-color: rgba(255, 59, 48, 0.6); box-shadow: 0 0 20px rgba(255, 59, 48, 0.2); } @keyframes pulseHealth { 0%, 100% { border-color: rgba(0, 0, 0, 0.05); } 50% { border-color: rgba(255, 59, 48, 0.6); } } #cm-root .cm-warn-txt { font-size: 9.5px; color: #FF3B30; text-transform: uppercase; letter-spacing: 0.5px; } #cm-root .cm-cols { display: flex; width: 100%; gap: 8px; align-items: center; padding: 0 2px 4px 2px; box-sizing: border-box; flex-shrink: 0; } #cm-root .col-spacer { width: 54px; min-width: 54px; flex-shrink: 0; } #cm-root .col-grid { flex-grow: 1; display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(56px, auto) minmax(56px, auto) minmax(20px, auto); gap: 6px; padding: 0 10px; font-size: 8.5px; color: #86868B; text-transform: uppercase; letter-spacing: 0.4px; } #cm-root .col-grid span { text-align: center; display: flex; align-items: center; justify-content: center; } #cm-root .cm-list { flex-grow: 1; overflow-y: auto; overflow-x: hidden; padding: 2px; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 10px; width: 100%; min-height: 0; } #cm-root .cm-group { display: flex; width: 100%; gap: 8px; align-items: flex-start; } #cm-root .grp-lbl { flex-shrink: 0; width: 54px; text-align: left; font-size: 15px !important; font-family: "Cookie", cursive !important; color: #86868B; letter-spacing: 0.3px; padding: 5px 2px; border-left: 2px solid rgba(0,0,0,0.1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; text-transform: none; } #cm-root .grp-lbl.is-me { color: #0071E3; border-left-color: #0071E3; background: rgba(0, 113, 227, 0.08); border-radius: 0 3px 3px 0; } #cm-root .grp-stack { flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; } #cm-root .cm-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-radius: 12px; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 2px 6px rgba(0,0,0,0.02); position: relative; background-clip: padding-box; border: 1px solid rgba(255, 255, 255, 0.6); z-index: 1; width: 100%; min-width: 0; } #cm-root .cm-row.is-full { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(56px, auto) minmax(56px, auto) minmax(20px, auto); gap: 6px; padding: 6px 10px; } #cm-root .cm-row:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); } #cm-root .cm-row::before { content: \'\'; position: absolute; inset: 0; border-radius: 12px; padding: 1.5px; margin: -1.5px; background: conic-gradient(var(--st-color) var(--progress), var(--st-track) var(--progress)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; z-index: -1; } @keyframes pulseWarning { 0%, 100% { filter: drop-shadow(0 0 2px var(--st-color)); } 50% { filter: drop-shadow(0 0 8px var(--st-color)); } } #cm-root .cm-row.is-over::before { animation: pulseWarning 1.5s infinite ease-in-out; } #cm-root .row-left { position: relative; z-index: 1; display: flex; align-items: center; gap: 8px; min-width: 0; flex-shrink: 1; } #cm-root .row-left span, #cm-root .row-left .row-name { font-size: 11.5px; letter-spacing: 0.2px; color: #1D1D1F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } #cm-root .row-name { font-family: "Alegreya", serif !important; font-size: 12px !important; } #cm-root .row-info { display: flex; flex-direction: column; min-width: 0; overflow: hidden; justify-content: center; } #cm-root .row-avatar { width: 24px; height: 24px; min-width: 24px; border-radius: 7px; object-fit: cover; border: 1px solid rgba(0,0,0,0.05); flex-shrink: 0; } #cm-root .row-right { position: relative; z-index: 1; display: flex; align-items: center; gap: 6px; text-align: right; flex-shrink: 0; } #cm-root .row-meta { display: flex; flex-direction: column; text-align: right; } #cm-root .row-col { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: center; text-align: center; min-width: 0; } #cm-root .row-time, #cm-root .row-subtime { font-family: "Fraunces", sans-serif !important; font-size: 11.5px !important; color: #1D1D1F; opacity: 0.95; font-variant-numeric: tabular-nums; letter-spacing: -0.2px; line-height: 1.2; white-space: nowrap; } #cm-root .row-subtime { display: inline; } #cm-root .row-status, #cm-root .row-info .row-status { font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; font-size: 9.5px; letter-spacing: 0.25px; display: inline-block; margin-top: 1px; line-height: 1.2; } #cm-root .row-info .row-status { font-size: 9px; margin-top: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } #cm-root .row-right img, #cm-root .row-ico img { width: 16px; height: 16px; min-width: 16px; max-width: 16px; max-height: 16px; object-fit: contain; opacity: 0.85; display: block; flex-shrink: 0; } #cm-root .row-ico { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 4px; min-width: 20px; flex-shrink: 0; } #cm-root .st-active { background: rgba(230, 248, 236, 0.7); color: #064E3B; } #cm-root .st-active .row-status { color: #248A3D; } #cm-root .st-phone { background: rgba(254, 238, 238, 0.7); color: #7F1D1D; } #cm-root .st-phone .row-status { color: #D70015; } #cm-root .st-video { background: rgba(245, 235, 255, 0.7); color: #4C1D95; } #cm-root .st-video .row-status { color: #8944AB; } #cm-root .st-email { background: rgba(230, 242, 255, 0.7); color: #0C4A6E; } #cm-root .st-email .row-status { color: #0071E3; } #cm-root .st-coffee-break { background: rgba(255, 244, 230, 0.7); color: #78350F; } #cm-root .st-coffee-break .row-status { color: #C77000; } #cm-root .st-lunch-break { background: rgba(255, 250, 230, 0.7); color: #713F12; } #cm-root .st-lunch-break .row-status { color: #A16207; } #cm-root .st-break { background: rgba(242, 242, 247, 0.7); color: #374151; } #cm-root .st-break .row-status { color: #636366; } [animation="breathe"] { animation: breathe 2s infinite ease-in-out; } @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.15); opacity: 1; } } [animation="rock"] { animation: rock 3s infinite ease-in-out; transform-origin: bottom center; } @keyframes rock { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } } [animation="bounce-y"] { animation: bounce-y 1.5s infinite ease-in-out; } @keyframes bounce-y { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } } [animation="ring"] { animation: ring 2s infinite ease-in-out; } @keyframes ring { 0%, 100% { transform: rotate(0); } 10%, 30%, 50% { transform: rotate(12deg); } 20%, 40%, 60% { transform: rotate(-12deg); } 70% { transform: rotate(0); } } [animation="fly"] { animation: fly 2.5s infinite ease-in-out; } @keyframes fly { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(3px, -3px); } } [animation="fade-pulse"] { animation: fade-pulse 3s infinite ease-in-out; } @keyframes fade-pulse { 0%, 100% { opacity: 0.4; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } } #cm-root .cm-list::-webkit-scrollbar { width: 4px; } #cm-root .cm-list::-webkit-scrollbar-track { background: transparent; } #cm-root .cm-list::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; } @media screen and (max-width: 380px) { #cm-root .grp-lbl { display: none !important; } } @media screen and (max-width: 320px) { #cm-root .cm-stats { display: none !important; } #cm-root .cm-head h3 { margin-bottom: 0; } } @media screen and (max-width: 280px) { #cm-root .row-info { display: none !important; } } @media screen and (max-width: 240px) { #cm-root .row-right img, #cm-root .row-ico img { display: none !important; } } @media screen and (max-width: 220px) { #cm-root .row-subtime { display: none !important; } }');
        },
        cardHtml(key, title, extraHead = "") {
            const pill = (cls, id, tip, label) => `<span class="cm-pill ${cls}" id="cnt-${id}-${key}" title="${tip}">${label}: 0</span>`;
            return `<div class="cm-card" id="cm-card-${key}"><div class="cm-head"><div class="cm-head-top"><h3><span>${title}</span><span class="cm-warn-txt" id="cm-health-warn-${key}" style="display:none;">⚠️ Low Availability</span></h3>${extraHead}</div><div class="cm-stats">${pill("badge-act", "act", "Active", "Actv")} + ${pill("badge-phn", "phn", "On Phone", "Phn")} + ${pill("badge-brk", "brk", "On Break", "Brk")} = ${pill("badge-tot", "tot", "Total", "Tot")}</div></div><div class="cm-list" id="cm-list-${key}"></div></div>`;
        },
        init() {
            $('[aria-selected="false"]')?.click();
            const targetContainer = $(".agent-table-container");
            if (!targetContainer) return console.warn("Dash: .agent-table-container not found on this page.");
            const currentUserName = $("[alt='profile photo']")?.src?.match(/photos\/([^/?]+)/)?.[1] ?? "Unknown";
            const isAdmin = "vongoc" === currentUserName.toLowerCase();
            let layout = isAdmin ? "simplicity" : "full";
            const layoutLabel = () => "full" === layout ? "Layout: Full" : "Layout: Simple";
            Dash.injectStyles();
            $("#cm-root")?.remove();
            const toggleBtnHtml = isAdmin ? `<button class="cm-toggle" id="cm-layout-toggle" title="Switch layout">${layoutLabel()}</button>` : "";
            const root = Utils.createEl("div", {
                id: "cm-root",
                parent: document.body,
                html: `<div class="cm-wrap ${"full" === layout ? "cm-full" : ""}" id="cm-wrap-shell"><button class="cm-close" title="Close"><img src="${Dash.ICONS.close}" alt="Close"/></button>${Dash.cardHtml("lm", "LM Team Status", toggleBtnHtml)}${Dash.cardHtml("bau", "BAU Team Status")}</div>`
            });
            const q = sel => root.querySelector(sel);
            const renderSection = (agents, suffix) => {
                const activeCount = agents.filter((a => "active" === a.statusKey)).length;
                const callCount = agents.filter((a => "phone" === a.statusKey || "video" === a.statusKey)).length;
                const totalCount = agents.length;
                const breakCount = totalCount - activeCount - callCount;
                const isLow = totalCount > 0 && activeCount / totalCount < .2;
                q(`#cnt-act-${suffix}`).textContent = `Actv: ${activeCount}`;
                q(`#cnt-phn-${suffix}`).textContent = `Phn: ${callCount}`;
                q(`#cnt-brk-${suffix}`).textContent = `Brk: ${breakCount}`;
                q(`#cnt-tot-${suffix}`).textContent = `Tot: ${totalCount}`;
                const cardEl = q(`#cm-card-${suffix}`);
                cardEl.classList.toggle("cm-warn", isLow);
                cardEl.style.display = 0 === totalCount ? "none" : "flex";
                q(`#cm-health-warn-${suffix}`).style.display = isLow ? "inline" : "none";
                const groups = [];
                let currentGroup = null;
                agents.forEach((agent => {
                    const isUser = agent.ldap === currentUserName;
                    let label = isUser ? "You" : agent.displayStatus;
                    if (!isUser) if ("phone" === agent.statusKey || "video" === agent.statusKey) label = "On Call"; else if (agent.statusKey.includes("break")) label = agent.statusKey.split("-")[0];
                    if (currentGroup?.label !== label) {
                        currentGroup = {
                            label,
                            isUser,
                            rows: []
                        };
                        groups.push(currentGroup);
                    }
                    currentGroup.rows.push(agent);
                }));
                const esc = Utils.escapeHtml;
                const isFull = "full" === layout;
                const fragment = document.createDocumentFragment();
                if (isFull) Utils.createEl("div", {
                    className: "cm-cols",
                    html: '<div class="col-spacer"></div><div class="col-grid"><span>Agent</span><span>Last Change</span><span>In State</span><span></span></div>',
                    parent: fragment
                });
                groups.forEach((group => {
                    const groupBlock = Utils.createEl("div", {
                        className: "cm-group",
                        parent: fragment
                    });
                    Utils.createEl("div", {
                        className: "grp-lbl " + (group.isUser ? "is-me" : ""),
                        text: group.label,
                        parent: groupBlock
                    });
                    const stack = Utils.createEl("div", {
                        className: "grp-stack",
                        parent: groupBlock
                    });
                    group.rows.forEach((agent => {
                        const st = Dash.STATUS_MAP[agent.statusKey] || Dash.STATUS_MAP.default;
                        const progressPct = Math.min(agent.durationSeconds / st.maxSecs * 100, 100).toFixed(1);
                        const isOverTime = agent.durationSeconds >= st.maxSecs;
                        const isActive = "active" === agent.statusKey;
                        const img = (src, alt, extra = "") => `<img src="${src}" alt="${esc(alt)}" loading="lazy"${extra} />`;
                        const iconsHtml = (st.ico ? img(`https://cdn-icons-png.flaticon.com/512/${st.ico}.png`, `${agent.statusKey} icon`, ` animation="${st.anim}"`) : "") + (isActive && "busy" === agent.rawStatus1 ? img(Dash.ICONS.non_phone, "non_phone") : "") + (isActive && "busy" === agent.rawStatus2 ? img(Dash.ICONS.non_video, "non_video") : "");
                        const avatar = `<img class="row-avatar" src="${esc(agent.img)}" alt="${esc(agent.ldap)}" loading="lazy" />`;
                        const name = `<span class="row-name">${esc(agent.ldap)}</span>`;
                        const status = `<span class="row-status">${esc(agent.displayStatus)}</span>`;
                        const rowInnerHtml = isFull ? `<div class="row-left">${avatar}<div class="row-info">${name}${status}</div></div><div class="row-col"><span class="row-time">${esc(agent.lastChangeRaw || "-")}</span></div><div class="row-col"><span class="row-time">${esc(agent.timeInState || "-")}</span></div><div class="row-ico">${iconsHtml}</div>` : `<div class="row-left">${avatar}${name}</div><div class="row-right"><div class="row-meta"><span class="row-time">${esc(agent.lastChangeRaw)} <span class="row-subtime">(${esc(agent.timeInState)})</span></span>${status}</div>${iconsHtml}</div>`;
                        Utils.createEl("div", {
                            className: `cm-row ${agent.cssClass}${isOverTime ? " is-over" : ""}${isFull ? " is-full" : ""}`,
                            style: `--progress: ${progressPct}%; --st-color: ${st.color}; --st-track: ${st.track};`,
                            html: rowInnerHtml,
                            "data-ldap": agent.ldap,
                            parent: stack
                        });
                    }));
                }));
                const listRoot = q(`#cm-list-${suffix}`);
                listRoot.textContent = "";
                listRoot.appendChild(fragment);
            };
            const statusPrio = a => (Dash.STATUS_MAP[a.statusKey] || Dash.STATUS_MAP.default).prio;
            const poolRank = a => Dash.POOL_RANKS[a.poolDisplay] || 3;
            const txt = cell => cell?.innerText.trim() || "";
            const updateDashboard = () => {
                if (root.isConnected) try {
                    const agents = $$("tbody tr", targetContainer).map((row => {
                        const cells = row.querySelectorAll("td");
                        if (cells.length < 10) return null;
                        const rawStatus1 = Dash.extractState(cells[5]);
                        const rawStatus2 = Dash.extractState(cells[8]);
                        let displayStatus = txt(cells[3]);
                        let statusKey = displayStatus.toLowerCase().replace(/\s+/g, "-");
                        if ("Active" === displayStatus && "busy" === rawStatus1 && "busy" === rawStatus2) {
                            displayStatus = "Break";
                            statusKey = "break";
                        }
                        const pool = `${txt(cells[10])},${txt(cells[13])}`;
                        const poolDisplay = pool.includes("3028872") || pool.includes("3014937") ? "LM" : pool.includes("3004773") ? "BAU" : "";
                        return {
                            img: row.querySelector("img")?.src || "",
                            ldap: txt(cells[1]),
                            timeInState: Dash.formatTime(txt(cells[4])),
                            lastChangeRaw: Dash.formatTime(txt(cells[9])),
                            displayStatus,
                            statusKey,
                            cssClass: `st-${statusKey}`,
                            durationSeconds: Dash.parseDuration(cells[9]?.innerText),
                            poolDisplay,
                            rawStatus1,
                            rawStatus2
                        };
                    })).filter(Boolean).sort(((a, b) => {
                        const aU = a.ldap === currentUserName;
                        const bU = b.ldap === currentUserName;
                        if (aU !== bU) return bU - aU; else return statusPrio(a) - statusPrio(b) || poolRank(a) - poolRank(b) || b.durationSeconds - a.durationSeconds;
                    }));
                    renderSection(agents.filter((a => "BAU" === a.poolDisplay)), "bau");
                    renderSection(agents.filter((a => "LM" === a.poolDisplay)), "lm");
                } catch (err) {
                    console.error("Dash render error:", err);
                }
            };
            let timer;
            const observer = new MutationObserver((() => {
                clearTimeout(timer);
                timer = setTimeout(updateDashboard, 150);
            }));
            observer.observe(targetContainer, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true
            });
            const stop = () => {
                observer.disconnect();
                clearTimeout(timer);
                root.remove();
            };
            onTeardown(stop);
            root.addEventListener("click", (e => {
                if (e.target.closest(".cm-close")) return stop();
                if (isAdmin && e.target.closest("#cm-layout-toggle")) {
                    layout = "simplicity" === layout ? "full" : "simplicity";
                    q("#cm-wrap-shell").classList.toggle("cm-full", "full" === layout);
                    q("#cm-layout-toggle").textContent = layoutLabel();
                    updateDashboard();
                }
            }));
            updateDashboard();
        }
    };
    // ============================================================================
    // SECTION 7&8: CASES CONNECT WORKFLOW & FOLLOW-UP AUTOMATION (CasesConnect)
    // ============================================================================
    const BASE_COMMENTS = ["Setup Conversion Linker", "Guided the advertiser how to see the report", "Survey pitched"];
    const GA4_COMMENTS = [...BASE_COMMENTS, "Linked GA4 and Google Ads", "Turned on Google signals data collection", "Turned on User Data Collection Acknowledgement", "Tested with Tag Assistant and Real time in GA4"];
    const CasesConnect = {
        NOTE_TEMPLATES: {
            EC: {
                subStatus: "NI - Awaiting Validation",
                subStatusReason: "Implemented Ads Enhanced Conversion",
                taskTypes: "Ads Enhanced Conversions for web",
                tagsImplemented: "Ads Enhanced Conversions",
                comments: ["Implemented Google Ads enhanced conversions for Purchase via GTM / Gtag", "Tested with Tag Assistant", "Turn on Enhanced Conversion in conversion action", "No recent conversions", "Awaiting enhanced conversion to record data", ...BASE_COMMENTS]
            },
            CONVERSION_TRACKING: {
                subStatus: "Completed",
                subStatusReason: "Implement Ads Conversion Tracking",
                tagsImplemented: "Ads Conversion Tracking",
                comments: ["Implemented Google Ads conversions for Hotline/Zalo via GTM / Gtag", "Tested with Tag Assistant", "No recent conversions", ...BASE_COMMENTS]
            },
            GA4_LINK: {
                subStatus: "SO - Implementation Only",
                subStatusReason: "Implement GA4",
                taskTypes: "GA4 Setup",
                comments: ["Implemented GA4 tag via GTM", ...GA4_COMMENTS]
            },
            WAITING_INPUT: {
                subStatus: "Waiting Input",
                subStatusReason: "waiting for Adv to setup GTM",
                comments: []
            },
            GA4: {
                subStatus: "Waiting Validation",
                subStatusReason: "Implement GA4 Event",
                tagsImplemented: "Analytics Event Tracking",
                comments: ["Implemented GA4 event (Hotline / Zalo) via GTM / Gtag code", "Recording data", "Awaiting events to be processed in GA4 Event Report", "Guide advertiser import GA4 event to Google Ads", ...GA4_COMMENTS]
            },
            REMARKETING: {
                subStatus: "Waiting Validation",
                subStatusReason: "Implement Ads Audiences",
                tagsImplemented: "Ads Remarketing",
                comments: ["Implemented GA4 Audiences for Pageview < 10s via GTM", ...GA4_COMMENTS]
            }
        },
        isDateToday(val) {
            if (!val) return false;
            const now = new Date;
            const timestamp = Number(val);
            if (!isNaN(timestamp) && timestamp > 1e11) return new Date(timestamp).toDateString() === now.toDateString();
            const pad = n => String(n).padStart(2, "0");
            const d = now.getDate();
            const m = now.getMonth() + 1;
            const y = now.getFullYear();
            const str = String(val).trim().toLowerCase();
            if (str.includes("today")) return true; else return [`${pad(d)}/${pad(m)}/${y}`, `${d}/${m}/${y}`, `${y}-${pad(m)}-${pad(d)}`, `${pad(m)}/${pad(d)}/${y}`].some((p => new RegExp(`(^|\\D)${p}(\\D|$)`).test(str)));
        },
        promptCaseType: daysOffset => new Promise((resolve => {
            $("#qm-modal-overlay")?.remove();
            const overlay = Utils.createEl("div", {
                id: "qm-modal-overlay",
                parent: document.body,
                style: "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.15); backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 2147483647;"
            });
            const modal = Utils.createEl("div", {
                parent: overlay,
                style: "background-color: #FFFFFF; border-radius: 16px; padding: 22px; width: 320px; box-shadow: 0 16px 36px rgba(0,0,0,0.12); text-align: center; font-family: 'Eczar', serif; border: 1px solid rgba(0,0,0,0.05);"
            });
            const close = value => {
                overlay.remove();
                resolve(value);
            };
            onTeardown((() => close(null)));
            const renderStep = (title, subtitle, buttons) => {
                modal.textContent = "";
                Utils.createEl("div", {
                    text: title,
                    parent: modal,
                    style: "font-size: 18px; font-weight: 700; color: #1D1D1F; margin-bottom: 4px;"
                });
                Utils.createEl("div", {
                    text: subtitle,
                    parent: modal,
                    style: "font-size: 14px; color: #86868B; margin-bottom: 18px;"
                });
                const actions = Utils.createEl("div", {
                    parent: modal,
                    style: "display: flex; flex-direction: column; gap: 8px;"
                });
                buttons.forEach((([label, bg, color, onClick]) => {
                    Utils.createEl("button", {
                        text: label,
                        parent: actions,
                        style: `padding: 10px 14px; border-radius: 10px; border: none; font-size: 16px; font-weight: 600; cursor: pointer; background-color: ${bg}; color: ${color}; transition: all 0.15s ease;`,
                        onmouseenter: e => e.currentTarget.style.filter = "brightness(0.96)",
                        onmouseleave: e => e.currentTarget.style.filter = "none",
                        onClick
                    });
                }));
            };
            const SKIP = ["Skip / Keep Default", "#F1F3F5", "#495057", () => close(null)];
            if (0 === daysOffset) return renderStep("Select Same-Day Task", "Appointment is today. Choose case type:", [["Ads CT", "#A5D8FF", "#183B56", () => close("CONVERSION_TRACKING")], ["GA4 Link", "#B2F2BB", "#1E5E2A", () => close("GA4_LINK")], SKIP]);
            const showValidationStep = () => renderStep("Validation Scope", "Select the task validated on call:", [["GA4 Event", "#B2F2BB", "#1E5E2A", () => close("GA4")], ["Ads Remarketing", "#D0BFFF", "#3A2A59", () => close("REMARKETING")], ["← Back", "#F1F3F5", "#495057", () => showInitialStep()]]);
            const showInitialStep = () => renderStep("Select Follow-Up Note", `Follow-up set to ${daysOffset} days. Choose status:`, [["Waiting Input", "#A5D8FF", "#183B56", () => close("WAITING_INPUT")], ["Waiting Validation", "#B2F2BB", "#1E5E2A", () => showValidationStep()], SKIP]);
            showInitialStep();
        })),
        buildNoteTemplateHTML(templateKey, followUpVal) {
            const cfg = CasesConnect.NOTE_TEMPLATES[templateKey];
            const esc = Utils.escapeHtml;
            const now = new Date;
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            const td = "border: 1pt solid #000; vertical-align: top; padding: 5pt; overflow: hidden; word-break: break-word; box-sizing: border-box;";
            const font = "font-size: 11pt; font-family: 'Google Sans', sans-serif; color: #000; white-space: pre-wrap;";
            const head = title => `<tr style="height:21pt"><td colspan="3" style="${td} background:#fff2cc; text-align:center;"><span style="${font} font-weight:700;">${title}</span> <span style="${font} font-style:italic;">(Mandatory)</span></td></tr>`;
            const row = (lbl, val, bg = "transparent") => `<tr style="height:21pt"><td colspan="2" style="${td}"><span style="${font} background:${bg}; font-weight:700;">${lbl}</span></td><td style="${td}"><span style="${font} background:${bg};">${val}</span></td></tr>`;
            const comments = cfg?.comments?.length ? `<ul dir="auto" style="margin:0; padding-left:18px;">${cfg.comments.map((c => `<li>${esc(c)}</li>`)).join("")}</ul>` : "NA";
            const consent = cfg?.subStatus && !/Attempted Contact|Not Reachable|Unreachable/i.test(cfg.subStatus) ? "Yes" : "NA";
            return `<div id="noteCaseUI" class="cdtx__uioncall"><div class="cdtx__uioncall_control"><span class="cdtx__uioncall_control-load" data-text="Split &amp; Transfer" data-btnclk="oncall_templ_lt_template">&nbsp;</span><span class="cdtx__uioncall_control-load" data-text="List" data-btnclk="oncall_templ_act_load">&nbsp;</span><span class="cdtx__uioncall_control-save" data-text="Save" data-btnclk="oncall_templ_act_save" data-btntooltip="Save template Reuse">&nbsp;</span><span class="cdtx__uioncall_control-remove" data-text="Remove" data-btnclk="oncall_templ_act_remove">&nbsp;</span></div><article class="cdtx__uioncall_outer"><table style="width:100% !important; table-layout:fixed !important; border-collapse:collapse !important; margin:8px 0 !important; box-sizing:border-box !important;"><tbody>${head("General Details") + row("Date:", today, "#c9daf8") + row("Speakeasy ID:", "NA") + row("Sub-status:", `<span class="_sub_i" data-btnclk="choice_status_list" data-infocase="status_case">${esc(cfg?.subStatus || "NA")}</span>`) + row("Next Follow-Up Date", `<span data-btnclk="oncall_templ_act_flchoice" data-dateformat="d/m/Y" data-text="oncall_templ_act_flchoice-text">${esc(followUpVal || "NA")}</span>`) + row("Task types:", esc(cfg?.taskTypes || cfg?.tagsImplemented || "NA")) + row("Implemented tags:", `<span data-btnclk="oncall_templ_act_taskchoice" data-text="oncall_templ_act_taskchoice-text">${esc(cfg?.tagsImplemented || "NA")}</span>`) + row("CID:", "NA") + row("Checked and obtained recording consent from the customer before proceeding with the call", consent) + row("Call Summary:", cfg?.comments?.length ? esc(cfg.comments[0]) : "NA") + row("Sub-status Reason :", `<span class="cdtx__uioncall-oct_test">${esc(cfg?.subStatusReason || "NA")}</span>`) + row("Additional information:&nbsp;", comments) + head("Screenshots") + ["Website URL worked upon:", "Q+ entry:", "GVC Chat:", "GAM:", "Additional Screenshots"].map((k => row(k, "NA"))).join("")}</tbody></table></article></div>`;
        },
        currentFollowUp: () => $('[data-infocase="follow_up_time"]')?.dataset?.valchoice || "NA",
        insertNote(templateHTML, replaceExisting) {
            const caseNote = $('[aria-label="Case Note"]');
            const existing = replaceExisting && $("#noteCaseUI");
            if (existing) existing.outerHTML = toSafeHTML(templateHTML); else if (caseNote) caseNote.insertAdjacentHTML("beforeend", toSafeHTML(templateHTML));
            caseNote?.dispatchEvent(new Event("input", {
                bubbles: true
            }));
            return Boolean(existing || caseNote);
        },
        async executeFollowUp(flupBtn) {
            if (!flupBtn.dataset.busy) {
                flupBtn.dataset.busy = "1";
                flupBtn.style.opacity = "0.6";
                flupBtn.style.pointerEvents = "none";
                try {
                    if (!$("._connectcase_info--outer")) $('[data-btnclk="_connectcase_info-act_recrawl"]')?.click();
                    $('[aria-label="Overview"]')?.click();
                    await Utils.sleep(300);
                    const daysOffset = parseInt($("#qm-flup-in")?.value, 10) || 0;
                    const apptEl = $('[data-infocase="appointment_time"]');
                    let isApptToday = false;
                    if (apptEl) if (!apptEl.dataset.valchoice) {
                        apptEl.click();
                        await Utils.sleep(150);
                        (await Utils.waitForElement(".datepicker-grid .today")).click();
                        await Utils.sleep(200);
                        isApptToday = true;
                    } else isApptToday = CasesConnect.isDateToday(apptEl.dataset.valchoice) || CasesConnect.isDateToday(apptEl.innerText);
                    let templateKey = null;
                    if (5 === daysOffset) templateKey = "EC"; else if (0 === daysOffset && isApptToday) templateKey = await CasesConnect.promptCaseType(0); else if (2 === daysOffset || 3 === daysOffset) templateKey = await CasesConnect.promptCaseType(daysOffset);
                    $('[data-infocase="follow_up_time"]')?.click();
                    await Utils.sleep(150);
                    if (daysOffset > 0) {
                        const start = new Date;
                        const targetDate = new Date(start);
                        for (let count = 0; count < daysOffset;) {
                            targetDate.setDate(targetDate.getDate() + 1);
                            if (targetDate.getDay() % 6 !== 0) count++;
                        }
                        const diffDays = Math.round((targetDate - start) / 864e5);
                        let dayEl = await Utils.waitForElement(".datepicker-grid .today");
                        for (let i = 0; i < diffDays && dayEl; i++) dayEl = dayEl.nextElementSibling;
                        if (dayEl) {
                            dayEl.click();
                            await Utils.sleep(200);
                        } else console.warn("Follow-up: target day not found in datepicker grid.");
                    } else {
                        (await Utils.waitForElement('[data-thischoice="Finish"]')).click();
                        await Utils.sleep(200);
                    }
                    (await Utils.waitForElement("[data-type=follow_up_time]")).click();
                    await Utils.sleep(200);
                    CasesConnect.insertNote(CasesConnect.buildNoteTemplateHTML(templateKey, CasesConnect.currentFollowUp()), true);
                } catch (err) {
                    console.error("Follow up script failed", err);
                } finally {
                    delete flupBtn.dataset.busy;
                    flupBtn.style.opacity = "1";
                    flupBtn.style.pointerEvents = "auto";
                }
            }
        },
        insertSignature() {
            const sel = window.getSelection();
            if (!sel?.rangeCount) return alert("Please click inside the email body to place your cursor first.");
            const start = sel.getRangeAt(0).startContainer;
            const node = start.nodeType === Node.ELEMENT_NODE ? start : start.parentElement;
            if (!node?.isContentEditable) return alert("Please place your cursor inside the text area where you want the signature.");
            $$(".qm-sig").forEach((el => el.remove()));
            let sigName = localStorage.getItem("__signature_name");
            if (!sigName) {
                sigName = prompt("Enter your name:") || "Agent";
                localStorage.setItem("__signature_name", sigName);
            }
            const html = `<table class="qm-sig" style="width: 348px; padding: 0 30px;" data-sig-injected="true"><tbody><tr align="left"> <td style="width: 52px; vertical-align: top;"><img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="52" height="52" style="display: block; border-radius: 10px;"></td> <td style="width: 12px;"></td> <td style="vertical-align: middle;"><p style="font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; margin: 0; line-height: 1.4; color: #1D1D1F;"> <strong style="font-size: 105%; color: #1D1D1F;">${Utils.escapeHtml(sigName)}</strong><br> <span style="color: #86868B;">Technical Solutions Team</span><br> <span style="color: #86868B; font-weight: 500;">TDCX, on behalf of Google</span> </p></td> </tr></tbody></table>`;
            document.execCommand("insertHTML", false, toSafeHTML(html));
        },
        init() {
            const C = CasesConnect;
            $("#qm-panel")?.remove();
            Utils.addStyle("qm-styles", "@import url('https://fonts.googleapis.com/css2?family=Eczar:wght@400;600;700&display=swap'); #qm-panel, #qm-panel *, #qm-modal-overlay, #qm-modal-overlay * { font-family: \"Eczar\", serif !important; } #qm-panel { position: fixed; bottom: 20px; left: 20px; display: flex; gap: 8px; align-items: center; z-index: 99999; font-size: 14px; } .qm-btn { z-index: 10; color: #1D1D1F; padding: 10px 16px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.6); } .qm-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); filter: brightness(0.97); } .qm-btn:active { transform: scale(0.96); } #qm-flup-in { position: absolute; top: 50%; transform: translateY(-50%); right: 6px; width: 28px; height: 24px; padding: 0; border: none; border-radius: 6px; background: rgba(255, 255, 255, 0.95); color: #1D1D1F; font-weight: 700; font-size: 14px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06); transition: all 0.2s ease; -moz-appearance: textfield; } #qm-flup-in:focus { outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06), 0 0 0 2px #74B9FF; } .qm-badge { display: none; position: absolute; top: -4px; right: -4px; background: #FF8787; border-radius: 9999px; padding: 2px 6px; font-size: 10px; font-weight: 700; line-height: 1; border: 1.5px solid #FFFFFF; color: #FFFFFF; } .qm-sig { margin: 12px 0; } .dock-container { max-height: 400px !important; overflow-y: auto !important; }");
            const panel = Utils.createEl("div", {
                id: "qm-panel",
                parent: document.body
            });
            let clickerInterval = null;
            let removeTimer = null;
            const autoClickTask = () => {
                if (C.insertNote(C.buildNoteTemplateHTML(null, C.currentFollowUp()), false)) {
                    clearTimeout(removeTimer);
                    removeTimer = setTimeout((() => $(".cdtx__uioncall_control-remove")?.click()), 6e3);
                }
            };
            const setAuto = (btn, on) => {
                clearInterval(clickerInterval);
                clickerInterval = on ? setInterval(autoClickTask, 16e3) : null;
                btn.textContent = on ? "OFF" : "ON";
                btn.style.backgroundColor = on ? "#FFA8A8" : "#B2F2BB";
                btn.style.color = on ? "#6A1A1A" : "#1E5E2A";
            };
            const autoBtn = Utils.createEl("button", {
                title: "Auto Click",
                className: "qm-btn",
                parent: panel,
                onClick: () => setAuto(autoBtn, !clickerInterval)
            });
            setAuto(autoBtn, true);
            Utils.createEl("button", {
                html: '<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 20px; height: 20px; filter: brightness(0.2);"><span id="flup-badge" class="qm-badge">+</span>',
                title: "Click Follow-up Item",
                className: "qm-btn",
                style: "background-color: #A5D8FF;",
                parent: panel,
                onClick: async () => {
                    $('[debug-id="dock-item-home"]')?.click();
                    try {
                        (await Utils.waitForElement(".li-popup_lstcasefl")).click();
                    } catch {
                        console.warn("Follow-up popup not found");
                    }
                }
            });
            let badgeObserver = null;
            Utils.waitForElement(".li-popup_lstcasefl").then((el => {
                if (!panel.isConnected) return;
                const badge = $("#flup-badge", panel);
                const updateBadge = () => badge.style.display = el.dataset.attr && "0" !== el.dataset.attr ? "block" : "none";
                badgeObserver = new MutationObserver(updateBadge);
                badgeObserver.observe(el, {
                    attributes: true,
                    attributeFilter: ["data-attr"]
                });
                updateBadge();
            })).catch((() => { }));
            const flupBtn = Utils.createEl("button", {
                text: "FL Up:",
                title: "Set Follow-up",
                className: "qm-btn",
                style: "background-color: #99E9F2; color: #0C5460; padding-right: 44px;",
                parent: panel,
                onClick: e => {
                    if ("qm-flup-in" !== e.target.id) C.executeFollowUp(flupBtn);
                }
            });
            Utils.createEl("input", {
                id: "qm-flup-in",
                type: "text",
                value: "2",
                parent: flupBtn,
                onClick: e => e.stopPropagation(),
                onfocus: e => e.target.select(),
                oninput: e => e.target.value = e.target.value.replace(/\D/g, "").slice(0, 1),
                onkeydown: e => {
                    if ("Enter" === e.key) {
                        e.preventDefault();
                        C.executeFollowUp(flupBtn);
                    }
                }
            });
            Utils.createEl("button", {
                text: "Sign",
                title: "Insert Signature at Cursor",
                className: "qm-btn",
                style: "background-color: #CED4DA; color: #343A40;",
                parent: panel,
                onmousedown: e => e.preventDefault(),
                onClick: () => C.insertSignature()
            });
            onTeardown((() => {
                clearInterval(clickerInterval);
                clearTimeout(removeTimer);
                badgeObserver?.disconnect();
                panel.remove();
            }));
        }
    };
    // ============================================================================
    // SECTION 9: GOOGLE ADS CONVERSION DIAGNOSTICS (AdWords)
    // ============================================================================
    const AdWords = {
        async init() {
            Utils.addStyle("aw-styles", ".aw-ga4 { background-color: #FEF3D6; color: #B07505; border: 1px solid rgba(176,117,5,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; } .aw-ads { background-color: #E2F5E9; color: #1E7F4E; border: 1px solid rgba(30,127,78,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; } .aw-ec-badge { background-color: #1E8E3E; color: #FFFFFF; padding: 2px 6px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-left: 6px; display: inline-block; vertical-align: middle; user-select: none; box-shadow: 0 1px 3px rgba(0,0,0,0.1); } .aw-hide { display: none !important; } .is-copied.aw-ga4, .is-copied.aw-ads { background-color: #3B72E6 !important; color: white !important; border-color: transparent !important; } #gpt-aw-container { position: fixed; bottom: 20px; left: 20px; z-index: 999; display: flex; flex-direction: column; gap: 8px; } .gpt-aw-row { display: flex; gap: 6px; align-items: center; } .gpt-aw-badge { padding: 8px 14px; background: #161920; color: #F1F3F5; border: 1px solid #2D323F; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: monospace; box-shadow: 0 4px 16px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s ease; user-select: none; } .gpt-aw-badge:hover { background: #2D323F; } .gpt-aw-btn { padding: 8px 12px; background: #0071e3; color: #ffffff; border: 1px solid #0071e3; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s ease; user-select: none; } .gpt-aw-btn:hover { background: #0077ed; }");
            let data;
            for (let i = 0; i < 5 && !data; i++) {
                data = window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS;
                if (!data) await Utils.sleep(600);
            }
            if (!data) return console.warn("AdWords: conversions_data not available on this page.");
            const navGoals = $('[id="navigation.goals"]');
            if (navGoals && !navGoals.querySelector(".selected")) $("a", navGoals)?.click();
            try {
                await Utils.waitForElement('[id*="diagnosticsHome"]');
            } catch (err) {
                console.warn("diagnosticsHome did not appear within timeout:", err);
            }
            AdWords.processData(data);
        },
        getSelectedConversionIds() {
            const ids = $$(".particle-table-row:not(.aw-hide)").filter((row => {
                const cb = row.querySelector("mat-checkbox");
                return row.classList.contains("particle-row-selected") || "true" === cb?.getAttribute("aria-checked") || cb?.hasAttribute("checked") || cb?.querySelector(".mat-checkbox-container")?.classList.contains("checked");
            })).map((row => {
                const cell = row.querySelector(".conversion-name-cell .internal");
                const hrefCtId = row.querySelector("a.ess-cell-link")?.href?.match(/ctId=(\d+)/)?.[1];
                const rawId = cell?.dataset?.originalId || hrefCtId || cell?.innerText?.trim() || "";
                return rawId.match(/\d+/)?.[0];
            })).filter(Boolean);
            return [...new Set(ids)];
        },
        processData(data) {
            const rawData = "string" === typeof data ? data : JSON.stringify(data);
            const uniqueIds = [...new Set([...rawData.matchAll(/AW-(\d+)/g)].map((m => m[1])))];
            $("#gpt-aw-container")?.remove();
            const container = Utils.createEl("div", {
                id: "gpt-aw-container",
                parent: document.body
            });
            let decorateTimer;
            onTeardown((() => {
                clearTimeout(decorateTimer);
                container.remove();
            }));
            uniqueIds.forEach((idStr => {
                const row = Utils.createEl("div", {
                    className: "gpt-aw-row",
                    parent: container
                });
                const badge = Utils.createEl("div", {
                    className: "gpt-aw-badge",
                    text: `AW-${idStr}`,
                    parent: row
                });
                Utils.setupCopy(badge, idStr, "Copied!");
            }));
            const btnRow = Utils.createEl("div", {
                className: "gpt-aw-row",
                parent: container
            });
            Utils.createEl("button", {
                className: "gpt-aw-btn",
                text: "EC Dashboard ↗",
                parent: btnRow,
                onClick: () => {
                    const base = "https://dashboards.corp.google.com/view/_0ded1099_6ef3_4bc9_bba0_2445840d1b69?f=";
                    const selectedIds = AdWords.getSelectedConversionIds();
                    if (selectedIds.length) return window.open(`${base}conversion_type_l3j54n:in:${selectedIds.join(",")}`, "_blank");
                    if (uniqueIds.length) return window.open(`${base}conversion_tracking_id_5nuehn:in:${uniqueIds.join(",")}`, "_blank");
                    alert("No conversion rows selected and no AW tracking IDs found!");
                }
            });
            $$(".expand-more").forEach((el => el.click()));
            let parsed;
            try {
                parsed = "string" === typeof data ? JSON.parse(data) : data;
            } catch (err) {
                return console.error("Adwords Data parsing failed", err);
            }
            if (!Array.isArray(parsed?.[1])) return;
            const dataMap = new Map(parsed[1].map((item => [item[1], item])));
            const rawDiag = window.conversions_data?.CONVERSION_DIAGNOSTICS;
            const diagData = "string" === typeof rawDiag ? rawDiag : "";
            const inDiag = id => Boolean(id && diagData && new RegExp(`\\b${Utils.escapeRegExp(id)}\\b`).test(diagData));
            decorateTimer = setTimeout((() => {
                try {
                    $$(".conversion-name-cell .internal").forEach((cell => {
                        const row = cell.closest(".particle-table-row");
                        const sourceText = row?.querySelector('[essfield="aggregated_conversion_source"]')?.innerText?.toLowerCase();
                        if (row && !sourceText?.includes("web")) return row.classList.add("aw-hide");
                        const hrefCtId = row?.querySelector("a.ess-cell-link")?.href?.match(/ctId=(\d+)/)?.[1];
                        const originalText = cell.innerText?.trim() || "";
                        const numericMatch = originalText.match(/\d+/);
                        if (numericMatch) cell.dataset.originalId = numericMatch[0];
                        const convActionId = cell.dataset.originalId || hrefCtId || "";
                        const mappedData = dataMap.get(originalText);
                        if (!mappedData) return;
                        const [type, convId] = 1 === mappedData[11] ? ["aw-ads", mappedData[64]?.[2]?.[4]?.split("'")?.[7]?.split("/")?.[1]] : 32 === mappedData[11] ? ["aw-ga4", mappedData[64]?.[1]?.[4]?.split("'")?.[3]] : [];
                        if (type && convId) {
                            cell.textContent = convId;
                            cell.classList.add(type);
                            Utils.setupCopy(cell, convId);
                        }
                        const host = cell.parentNode || cell;
                        if ((inDiag(convActionId) || inDiag(convId)) && !host.querySelector(".aw-ec-badge")) Utils.createEl("span", {
                            className: "aw-ec-badge",
                            text: "EC",
                            title: "Enhanced Conversions Enabled",
                            parent: host
                        });
                    }));
                    $$("category-conversions-container-view, conversion-goal-card").forEach((card => {
                        if (!card.querySelector(".particle-table-row:not(.aw-hide)")) card.style.display = "none";
                    }));
                } catch (err) {
                    console.error("Adwords decorate failed", err);
                }
            }), 1200);
        }
    };
    // ============================================================================
    // SECTION 10: CONTEXT-AWARE ROUTER & BOOTSTRAP DISPATCHER
    // ============================================================================
    const pickFeature = () => "chrome-extension:" === location.protocol ? QPlusAutomator : location.host.includes("casemon2.corp") ? Dash : location.host.includes("cases.connect") ? CasesConnect : location.host.includes("adwords.corp") ? AdWords : TagInspector;
    const start = () => Promise.resolve().then((() => pickFeature().init())).catch((err => console.error("Omnitool error:", err)));
    "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", start, {
        once: true
    }) : start();
})();