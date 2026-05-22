/**
 * Immediately Invoked Function Expression (IIFE)
 * ------------------------------------------------
 * Wraps the entire script to create a private scope.
 * This prevents our internal variables (like `Utils` and `Modules`)
 * from leaking into the global `window` object, avoiding collisions
 * with the host website's native JavaScript.
 */
(() => {
    // ==========================================
    // 1. SHARED UTILITIES
    // ==========================================
    // A standard library of helper functions to reduce boilerplate
    // and standardize DOM manipulation across all modules.
    const Utils = {
        /**
         * Safely injects a <style> block into the document <head>.
         * Utilizes the Trusted Types API (if available) to comply with
         * strict Content Security Policies (CSP) found in enterprise apps.
         */
        addStyle: (id, css) => {
            // Prevent duplicate style injections
            if (document.getElementById(id)) return;

            const style = document.createElement("style");
            style.id = id;

            // Check for modern Trusted Types support to prevent XSS warnings
            const policy = window.trustedTypes?.createPolicy("default", {
                createHTML: (s) => s,
            }) ?? { createHTML: (s) => s }; // Fallback for older browsers

            style.textContent = policy.createHTML(css);
            document.head.appendChild(style);
        },

        /**
         * Factory pattern to create, configure, and append DOM elements in one step.
         * Instead of writing 5 lines of document.createElement and assignments,
         * we can do it in a single function call.
         */
        createEl: (
            tag,
            { parent, onClick, style, className, id, ...props } = {}
        ) => {
            const el = Object.assign(document.createElement(tag), props);
            if (id) el.id = id;
            if (className) el.className = className;
            if (style) Object.assign(el.style, style);
            if (onClick) el.addEventListener("click", onClick);
            if (parent) parent.appendChild(el); // Auto-append to a parent if provided
            return el;
        },

        /**
         * A jQuery-style micro-wrapper for querySelector to save keystrokes.
         * Defaults to searching the whole document, but accepts a context node.
         */
        $: (s, ctx = document) => ctx.querySelector(s),

        /**
         * Asynchronous DOM Polling
         * Returns a Promise that resolves when a dynamically rendered element
         * finally appears on the page. Crucial for Single Page Applications (SPAs).
         */
        waitForElement: (selector, timeout = 3000) =>
            new Promise((resolve, reject) => {
                const start = Date.now();
                // Check every 500ms if the element exists and is visible (offsetParent)
                const timer = setInterval(() => {
                    const el = Utils.$(selector);
                    if (el?.offsetParent) {
                        clearInterval(timer);
                        resolve(el);
                    } else if (Date.now() - start > timeout) {
                        clearInterval(timer); // Give up after timeout
                        reject(new Error(`Timeout: ${selector}`));
                    }
                }, 500);
            }),

        /**
         * Attaches modern Clipboard API copy functionality to an element.
         * Provides brief visual feedback by temporarily changing the text.
         */
        setupCopy: (el, text, successMsg = "Copied!") => {
            el.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(text);
                    const origText = el.innerText;
                    el.innerText = successMsg;
                    el.classList.add("aw-copied");

                    // Revert UI after 1.5 seconds
                    setTimeout(() => {
                        el.innerText = origText;
                        el.classList.remove("aw-copied");
                    }, 1500);
                } catch (e) {
                    console.error("Copy failed", e);
                }
            });
        },
    };

    // ==========================================
    // 2. MODULES
    // ==========================================
    // Domain-specific business logic isolated into distinct functions.
    const Modules = {
        // --- Dashboard Module (Casemon) ---
        // Builds a floating, real-time widget to monitor team statuses.
        casemon: () => {
            // State flag to ensure the widget only initializes once
            if (window.dashRun) return;
            window.dashRun = 1;

            // Automatically select/click the unselected element at initialization
            Utils.$('[aria-selected="false"]')?.click();

            const ICON_BASE = "https://cdn-icons-png.flaticon.com/512";

            // Centralized configuration for the widget
            const config = {
                uiId: "bento_agent_ui",
                styleId: "bento-dash-styles",
                target: ".agent-table-container", // The native DOM table we scrape data from

                // Maps statuses to colors and specific maximum time limits (in seconds)
                statusConfig: {
                    active: {
                        color: "#10B981",
                        track: "#D1FAE5",
                        maxSecs: 2700,
                    }, // 45m
                    phone: {
                        color: "#EF4444",
                        track: "#FFE4E6",
                        maxSecs: 2700,
                    }, // 45m
                    video: {
                        color: "#8B5CF6",
                        track: "#F3E8FF",
                        maxSecs: 2700,
                    }, // 45m
                    email: { color: "#0EA5E9", track: "#E0F2FE", maxSecs: 900 }, // 15m
                    "coffee-break": {
                        color: "#F59E0B",
                        track: "#FFEDD5",
                        maxSecs: 900,
                    }, // 15m
                    "lunch-break": {
                        color: "#EAB308",
                        track: "#FEF9C3",
                        maxSecs: 3600,
                    }, // 1h
                    break: { color: "#6B7280", track: "#F3F4F6", maxSecs: 900 }, // 15m
                    default: {
                        color: "#9CA3AF",
                        track: "#F3F4F6",
                        maxSecs: 2700,
                    },
                },
                // Icon assets and CSS animation mappings
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
                // Sorting order for the list
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

            const container = Utils.$(config.target);
            if (!container) return;

            // Attempt to grab the current user's LDAP from their profile photo URL
            // This is used later to sort the current user to the very top of the list.
            const currentUserLdap =
                Utils.$("[alt='profile photo']")?.src?.match(
                    /photos\/([^/?]+)/
                )?.[1] ?? "Unknown";

            // Inject the massive CSS block for the widget
            Utils.addStyle(
                config.styleId,
                `
                /* General structural CSS omitted for brevity in comments... */
                #bento_agent_ui { position: fixed; height: 100%; width: 100%; top: 0; right: 0; background-color: rgba(15, 17, 21, 0.12); z-index: 9999; display: flex; justify-content: flex-end; align-items: center; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; pointer-events: none; box-sizing: border-box; }
                .bento-wrapper { position: relative; pointer-events: auto; width: 100%; max-width: 320px; background: #FFFFFF; border-radius: 20px; box-shadow: 0 12px 32px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04); padding: 20px; border: 1px solid #E5E7EB; color: #1F2937; }
                .close-btn { position: absolute; top: 14px; right: 14px; background: #F3F4F6; border: none; cursor: pointer; z-index: 10; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
                .close-btn:hover { background: #E5E7EB; transform: scale(1.05); }
                .close-btn img { width: 10px; height: 10px; opacity: 0.6; }
                .bento-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
                .bento-card { background: transparent; display: flex; flex-direction: column; }
                .bento-card h3 { margin: 0 0 12px 0; font-size: 12px; color: #4B5563; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; }
                .header-counters { display: flex; gap: 6px; }
                .agent-count { font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
                .active-badge { background: #E6F4EA; color: #137333; border: 1px solid #CEEAD6; }
                .total-badge { background: #F1F3F4; color: #5F6368; border: 1px solid #E8EAED; }
                .agent-list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .agent-list-container { max-height: 80vh; overflow-y: auto; padding: 12px; background: #F8FAFC; border-radius: 14px; border: 1px solid #E2E8F0; }
                
                .agent-row { 
                    display: flex; justify-content: space-between; align-items: center; 
                    padding: 10px 14px; margin-bottom: 8px; border-radius: 12px; 
                    transition: transform 0.2s ease, box-shadow 0.2s ease; 
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                    position: relative;
                    background-clip: padding-box;
                    border: 2px solid transparent; 
                    z-index: 1;
                }
                .agent-row:last-child { margin-bottom: 0; }
                .agent-row:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
                
                /* * ADVANCED CSS TRICK: Circular Progress Ring
                 * Uses conic-gradient tied to CSS variables to draw a partial border based on a percentage.
                 * -webkit-mask is used to punch a hole in the middle so only the 'border' shows.
                 */
                .agent-row::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 12px;
                    padding: 2px; 
                    margin: -2px; 
                    background: conic-gradient(var(--st-color) var(--progress), var(--st-track) var(--progress));
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    pointer-events: none;
                    z-index: -1;
                }

                @keyframes pulseWarning {
                    0%, 100% { filter: drop-shadow(0 0 2px var(--st-color)); }
                    50% { filter: drop-shadow(0 0 8px var(--st-color)); }
                }

                /* Pulses the element if the agent exceeds their time limit */
                .agent-row.over-time::before {
                    animation: pulseWarning 1.5s infinite ease-in-out;
                }

                .agent-left { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 13px; }
                .agent-left img { width: 28px; height: 28px; border-radius: 6px; object-fit: cover; border: 1px solid rgba(0,0,0,0.04); }
                .agent-right { display: flex; align-items: center; gap: 12px; text-align: right; }
                .agent-meta { display: flex; flex-direction: column; }
                .time-state { font-size: 11px; font-weight: 500; opacity: 0.85; }
                .status-text { font-size: 11px; font-weight: 700; letter-spacing: 0.2px; display: inline-block; margin-top: 1px; }
                .agent-right img { width: 20px; height: 20px; opacity: 0.8; }
                
                /* Status specific gradients */
                .stt-active { background: linear-gradient(135deg, #D1FAE5 0%, #DBEAFE 100%); color: #064E3B; }
                .stt-active .status-text { color: #047857; }
                .stt-phone { background: linear-gradient(135deg, #FFE4E6 0%, #FEF3C7 100%); color: #7F1D1D; }
                .stt-phone .status-text { color: #B91C1C; }
                .stt-video { background: linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 100%); color: #4C1D95; }
                .stt-video .status-text { color: #6B21A8; }
                .stt-email { background: linear-gradient(135deg, #E0F2FE 0%, #FFE4E6 100%); color: #0C4A6E; }
                .stt-email .status-text { color: #0284C7; }
                .stt-coffee-break { background: linear-gradient(135deg, #FFEDD5 0%, #E0F2FE 100%); color: #78350F; }
                .stt-coffee-break .status-text { color: #B45309; }
                .stt-lunch-break { background: linear-gradient(135deg, #FEF9C3 0%, #F3E8FF 100%); color: #713F12; }
                .stt-lunch-break .status-text { color: #A16207; }
                .stt-break { background: linear-gradient(135deg, #F3F4F6 0%, #E2E8F0 100%); color: #374151; }
                .stt-break .status-text { color: #4B5563; }
                
                /* Animations mapped to the icons config */
                [animation="pulse"] { animation: pulse 2s infinite ease-in-out; }
                @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
                [animation="wiggle"] { animation: wiggle 0.9s infinite; }
                @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 15%, 45%, 75% { transform: rotate(4deg); } 30%, 60% { transform: rotate(-4deg); } }
                [animation="slide"] { animation: slide-lr 1.2s infinite alternate ease-in-out; }
                @keyframes slide-lr { from { transform: translateX(0); } to { transform: translateX(2px); } }
                .agent-list-container::-webkit-scrollbar { width: 5px; }
                .agent-list-container::-webkit-scrollbar-track { background: transparent; }
                .agent-list-container::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
            `
            );

            // Create or retrieve the main UI shell
            let uiElement =
                document.getElementById(config.uiId) ||
                Utils.createEl("div", {
                    id: config.uiId,
                    parent: document.body,
                });

            // Event delegation for the close button
            uiElement.addEventListener("click", (e) => {
                if (e.target.closest(".close-btn")) {
                    uiElement.remove();
                    window.dashRun = 0; // Reset flag so it can be re-launched
                }
            });

            // Utility to sanitize HTML strings before injecting them, preventing XSS
            const escapeHtml = (str) =>
                String(str || "").replace(
                    /[&<>"']/g,
                    (m) =>
                        ({
                            "&": "&amp;",
                            "<": "&lt;",
                            ">": "&gt;",
                            '"': "&quot;",
                            "'": "&#039;",
                        }[m])
                );

            // Utility: Converts strings like "1h 15m" into pure seconds for math calculations
            const parseSecs = (str) =>
                (str.match(/\d+[hms]/g) || []).reduce(
                    (acc, p) =>
                        acc +
                        parseInt(p) *
                            ({ h: 3600, m: 60, s: 1 }[p.slice(-1)] || 0),
                    0
                );

            // The main scrape and render loop
            const render = () => {
                // Scrape the DOM table to extract state
                const agents = Array.from(
                    container.querySelectorAll("tbody tr")
                )
                    .map((tr) => {
                        const cells = tr.querySelectorAll("td");
                        if (cells.length < 9) return null; // Ignore malformed rows

                        // Extract status logic based on multiple columns
                        const phoneStat = (
                            cells[5].innerText.match(/[a-zA-Z\s]+/)?.[0] || ""
                        )
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, "-");
                        const videoStat = (
                            cells[8].innerText.match(/[a-zA-Z\s]+/)?.[0] || ""
                        )
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, "-");
                        let displayStatus = cells[3].innerText.trim();
                        let statusKey = displayStatus
                            .toLowerCase()
                            .replace(/\s+/g, "-");

                        // Business Logic: Override status if 'Active' but completely busy.
                        if (
                            displayStatus === "Active" &&
                            phoneStat === "busy" &&
                            videoStat === "busy"
                        ) {
                            displayStatus = "Break";
                            statusKey = "break";
                        }

                        // Return clean data object
                        return {
                            img: tr.querySelector("img")?.src || "",
                            ldap: cells[1].innerText.trim(),
                            timeInState: cells[4].innerText.trim(),
                            lastChangeRaw: cells[9].innerText.trim(),
                            displayStatus,
                            statusKey,
                            cssClass: `stt-${statusKey}`,
                            durationSeconds: parseSecs(cells[9].innerText),
                        };
                    })
                    .filter(Boolean) // Remove nulls
                    .sort((a, b) => {
                        // Priority 1: Put the current user at the top
                        if (
                            (a.ldap === currentUserLdap) !==
                            (b.ldap === currentUserLdap)
                        )
                            return (
                                (b.ldap === currentUserLdap) -
                                (a.ldap === currentUserLdap)
                            );

                        // Priority 2: Sort by the predefined status order
                        const pA =
                            config.priorities[a.statusKey] ??
                            config.priorities.default;
                        const pB =
                            config.priorities[b.statusKey] ??
                            config.priorities.default;

                        // Priority 3: If same status, sort by longest time in state
                        return pA !== pB
                            ? pA - pB
                            : b.durationSeconds - a.durationSeconds;
                    });

                const activeCount = agents.filter(
                    (a) => a.statusKey === "active"
                ).length;

                // Build HTML string for the agent rows
                const rowsHtml = agents
                    .map((a) => {
                        const icon = config.icons[a.statusKey];
                        const stConf =
                            config.statusConfig[a.statusKey] ||
                            config.statusConfig.default;

                        // Calculate percentage towards their time limit for the gradient ring
                        const maxSecs = stConf.maxSecs || 2700;
                        const progressPercent = Math.min(
                            (a.durationSeconds / maxSecs) * 100,
                            100
                        ).toFixed(1);
                        const isOverTime = a.durationSeconds >= maxSecs;

                        // INLINE CSS VARIABLES: This is how we pass dynamic data (progress %) to the CSS pseudo-element
                        const inlineStyle = `--progress: ${progressPercent}%; --st-color: ${stConf.color}; --st-track: ${stConf.track};`;
                        const finalClass = `agent-row ${a.cssClass} ${
                            isOverTime ? "over-time" : ""
                        }`;

                        return `
                    <div class="${finalClass}" style="${inlineStyle}">
                        <div class="agent-left">
                            <img src="${escapeHtml(a.img)}" alt="${escapeHtml(
                            a.ldap
                        )}" onerror="this.style.display='none'" />
                            <span>${escapeHtml(a.ldap)}</span>
                        </div>
                        <div class="agent-right">
                            <div class="agent-meta">
                                <span class="time-state">${escapeHtml(
                                    a.lastChangeRaw
                                )} (${escapeHtml(a.timeInState)})</span>
                                <span class="status-text">${escapeHtml(
                                    a.displayStatus
                                )}</span> 
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

                // Inject the final HTML into the UI shell
                uiElement.innerHTML = `
                    <div class="bento-wrapper">
                        <button class="close-btn" title="Close"><img src="${config.icons.close}" alt="Close"/></button>
                        <div class="bento-grid">
                            <div class="bento-card">
                                <div class="agent-list-header">
                                    <h3>Team Status</h3>
                                    <div class="header-counters">
                                        <span class="agent-count active-badge">${activeCount} Active</span>
                                        <span class="agent-count total-badge">${agents.length} Total</span>
                                    </div>
                                </div>
                                <div class="agent-list-container">${rowsHtml}</div>
                            </div>
                        </div>
                    </div>`;
                uiElement.style.display = "flex";
            };

            // Reactivity: Instead of polling via setInterval, watch the DOM table for changes
            let debounce;
            new MutationObserver(() => {
                // Debounce pattern: Prevents the render function from firing hundreds
                // of times a second if multiple rows update simultaneously.
                clearTimeout(debounce);
                debounce = setTimeout(render, 100);
            }).observe(container, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true,
            });

            // Initial render
            render();
        },

        // --- Cases Connect Module ---
        // Adds floating utility buttons to a ticketing/case management system
        casesConnect: () => {
            if (window.scrRun) return;
            window.scrRun = true;

            Utils.addStyle(
                "cases-styles",
                `
                /* Button and panel styling */
                #panelQM { position: fixed; bottom: 20px; left: 20px; display: flex; gap: 10px; align-items: center; z-index: 9999; font-family: -apple-system, sans-serif; }
                .qm-btn { z-index: 10; color: white; padding: 10px 14px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(26,29,35,0.06); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); font-size: 13px; position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,0,0,0.03); }
                .qm-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(26,29,35,0.12); }
                #flup-days-input { position: absolute; top: 50%; transform: translateY(-50%); right: 6px; width: 28px; height: 24px; padding: 0; border: none; border-radius: 4px; background: rgba(255, 255, 255, 0.95); color: #1A1D23; font-weight: 700; font-size: 13px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.08); transition: all 0.2s ease; -moz-appearance: textfield; }
                #flup-days-input:focus { outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.08), 0 0 0 2px rgba(26, 29, 35, 0.2); }
                .qm-badge { display: none; position: absolute; top: -4px; right: -4px; background: #D94138; border-radius: 50%; padding: 2px 6px; font-size: 10px; font-weight: 700; line-height: 1; border: 1px solid #ffffff; }
                .aw-sig-table { margin: 12px 0; }
                `
            );

            // Container for the toolbelt
            const panel = Utils.createEl("div", {
                id: "panelQM",
                parent: document.body,
            });

            // 1. Auto Clicker Button
            // Automates clicking an "accept call/case" button to prevent going idle
            let timer = null;
            const autoBtn = Utils.createEl("button", {
                textContent: "OFF",
                title: "Auto Click",
                className: "qm-btn",
                style: { backgroundColor: "#D94138" },
                parent: panel,
                onClick: () => {
                    if (timer) {
                        // Toggle OFF
                        clearInterval(timer);
                        timer = null;
                        autoBtn.textContent = "OFF";
                        autoBtn.style.backgroundColor = "#D94138";
                    } else {
                        // Toggle ON: Click every 18 seconds, dismiss modal 6 seconds later
                        timer = setInterval(() => {
                            Utils.$("#cdtx__uioncall--btn")?.click();
                            setTimeout(
                                () =>
                                    Utils.$(
                                        ".cdtx__uioncall_control-remove"
                                    )?.click(),
                                6000
                            );
                        }, 18000);
                        autoBtn.textContent = "ON";
                        autoBtn.style.backgroundColor = "#1E7F4E";
                    }
                },
            });

            // 2. Follow Up Active Check Indicator Badge Setup
            // Opens a side panel when clicked.
            const checkBtn = Utils.createEl("button", {
                innerHTML: `<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 16px; height: 16px; filter: invert(1);"><span id="flup-badge" class="qm-badge">+</span>`,
                title: "Click Follow-up Item",
                className: "qm-btn",
                style: { backgroundColor: "#3B72E6" },
                parent: panel,
                onClick: async () => {
                    Utils.$('[debug-id="dock-item-home"]')?.click();
                    (
                        await Utils.waitForElement(".li-popup_lstcasefl")
                    )?.click();
                },
            });

            // Reactively watch an external DOM element (.li-popup_lstcasefl) for a 'data-attr' change
            // and show/hide the red badge if the value is not "0"
            Utils.waitForElement(".li-popup_lstcasefl")
                .then((el) => {
                    const badge = Utils.$("#flup-badge");
                    const updateBadge = () =>
                        badge &&
                        (badge.style.display =
                            el.dataset.attr && el.dataset.attr !== "0"
                                ? "block"
                                : "none");

                    new MutationObserver(updateBadge).observe(el, {
                        attributes: true,
                        attributeFilter: ["data-attr"],
                    });
                    updateBadge(); // initial check
                })
                .catch(() => {});

            // 3. Follow Up Setter Button
            // Automates the complex process of scheduling a follow-up date in the calendar UI
            const flBtn = Utils.createEl("button", {
                textContent: "FL Up:",
                title: "Set Follow-up",
                className: "qm-btn",
                style: { backgroundColor: "#1A827A", paddingRight: "44px" },
                parent: panel,
                onClick: async (e) => {
                    if (e.target.id === "flup-days-input") return; // Ignore clicks inside the input field

                    // Ensure an appointment time is selected first
                    const appt = Utils.$('[data-infocase="appointment_time"]');
                    if (appt && !appt.dataset.valchoice) {
                        appt.click();
                        (
                            await Utils.waitForElement(
                                ".datepicker-grid .today"
                            )
                        )?.click();
                    }

                    // Get input value
                    const days =
                        parseInt(Utils.$("#flup-days-input").value, 10) || 0;
                    Utils.$('[data-infocase="follow_up_time"]')?.click();

                    if (days) {
                        // MATH LOGIC: Calculate future date skipping weekends
                        let d = new Date();
                        for (let i = 0; i < days; ) {
                            d.setDate(d.getDate() + 1);
                            if (d.getDay() % 6 !== 0) i++; // Modulo 6: 0 is Sunday, 6 is Saturday
                        }

                        // Calculate raw difference in days to know how many DOM nodes to skip
                        const diff = Math.round((d - new Date()) / 86400000);
                        const todayEl = await Utils.waitForElement(
                            ".datepicker-grid .today"
                        );

                        // DOM Traversal: Move sibling by sibling to find the right calendar day node
                        let target = todayEl;
                        for (let s = 0; s < diff && target; s++)
                            target = target.nextElementSibling;
                        target?.click();
                    } else {
                        // If days is 0, just select "Finish"
                        (
                            await Utils.waitForElement(
                                '[data-thischoice="Finish"]'
                            )
                        )?.click();
                    }
                    (
                        await Utils.waitForElement("[data-type=follow_up_time]")
                    )?.click();
                },
            });

            // Input field embedded directly inside the FL Up button
            Utils.createEl("input", {
                id: "flup-days-input",
                type: "text",
                value: "2",
                parent: flBtn,
                onClick: (e) => e.stopPropagation(),
                onfocus: (e) => e.target.select(),
                oninput: (e) =>
                    (e.target.value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 1)), // Force 1 numeric digit
            });

            // 4. Signature Logic Managers
            // Creates a standard rich-HTML signature format
            const getSigHtml = (name) => `
                <table class="aw-sig-table" style="width: 348px; padding: 0 30px;" data-sig-injected="true">
                    <tbody>
                        <tr align="left">
                            <td style="width: 52px; vertical-align: top;"><img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="52" height="52" style="display: block; border-radius: 8px;"></td>
                            <td style="width: 12px;"/>
                            <td style="vertical-align: middle;">
                                <p style="font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; line-height: 1.4; color: #1A1D23;">
                                    <strong style="font-size: 105%; color: #111111;">${name}</strong><br>
                                    <span style="color: #5F6368;">Technical Solutions Team</span><br>
                                    <span style="color: #5F6368; font-weight: 500;">TDCX, on behalf of Google</span>
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </table>`;

            // Function to manually inject signature into email body
            const injectSig = () => {
                const container = Utils.$("#email-body-content-top-content");
                if (!container) return;

                // Clear any existing duplicates
                document
                    .querySelectorAll(".aw-sig-table")
                    .forEach((el) => el.remove());

                // Cache the name in localStorage to persist across page reloads
                const name =
                    localStorage.getItem("__signature_name") ||
                    prompt("Enter your name:") ||
                    "Agent";
                localStorage.setItem("__signature_name", name);

                const wrapper = document.createElement("div");
                wrapper.innerHTML = getSigHtml(name);

                // Safely append to the bottom of the email content
                container.appendChild(wrapper.firstElementChild);
            };

            // Auto-injector for when the email modal opens dynamically
            const autoInjectSig = () => {
                const savedName = localStorage.getItem("__signature_name");
                if (!savedName) return;

                const target = Utils.$(
                    "#email-body-content-top-content > table:nth-child(2)"
                );
                if (target && !Utils.$(".aw-sig-table"))
                    target.insertAdjacentHTML(
                        "afterend",
                        getSigHtml(savedName)
                    );
            };

            // Manual Signature button
            Utils.createEl("button", {
                textContent: "Sign",
                title: "Insert Signature at Cursor",
                className: "qm-btn",
                style: { backgroundColor: "#92400E", color: "#FFFFFF" },
                parent: panel,
                onmousedown: (e) => e.preventDefault(), // Prevents losing focus in the email composer
                onClick: () => injectSig(true),
            });

            // Watch document body to trigger auto-signature when composer modal spawns
            new MutationObserver(() => autoInjectSig()).observe(document.body, {
                childList: true,
                subtree: true,
            });
        },

        // --- Adwords Module ---
        // Enhances a specific Google Ads internal dashboard
        adwords: () => {
            Utils.addStyle(
                "aw-styles",
                `
                /* Styling for replaced data badges */
                .aw-ga4 { background-color: #FEF3D6; color: #B07505; border: 1px solid rgba(176,117,5,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; }
                .aw-ads { background-color: #E2F5E9; color: #1E7F4E; border: 1px solid rgba(30,127,78,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; }
                .aw-copied { background-color: #3B72E6 !important; color: white !important; border-color: transparent !important; }
                #gpt-aw-overlay { position: fixed; bottom: 20px; left: 20px; z-index: 999; padding: 8px 14px; background: #161920; color: #F1F3F5; border: 1px solid #2D323F; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: monospace; box-shadow: 0 4px 16px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s ease; user-select: none; }
                #gpt-aw-overlay:hover { background: #2D323F; }
                `
            );

            // Core processing function
            const init = (rawData) => {
                // 1. Extract the AdWords AW- ID from the raw string payload and make a floating copy button
                const awId = rawData.match(/AW-(\d*)/)?.[1];
                if (awId) {
                    const overlay =
                        Utils.$("#gpt-aw-overlay") ||
                        Utils.createEl("div", {
                            id: "gpt-aw-overlay",
                            parent: document.body,
                        });
                    overlay.textContent = `AW-${awId}`;
                    Utils.setupCopy(overlay, awId, "Copied!");
                }

                // Auto expand UI tables
                document
                    .querySelectorAll(".expand-more")
                    .forEach((btn) => btn.click());

                try {
                    // 2. Parse global deeply nested JSON structure representing tracking conversions.
                    // Creates a Map using the specific conversion ID (entry[1]) as the key.
                    const dataMap = new Map(
                        JSON.parse(rawData)[1].map((entry) => [entry[1], entry])
                    );

                    // Delay slightly to let the framework render the table after expanding
                    setTimeout(() => {
                        // Iterate over specific data cells in the table
                        document
                            .querySelectorAll(".conversion-name-cell .internal")
                            .forEach((cell) => {
                                const row = cell.closest(".particle-table-row");

                                // Cleanup: Remove rows that don't belong to the "web" category
                                if (
                                    row &&
                                    !row
                                        .querySelector(
                                            '[essfield="aggregated_conversion_source"]'
                                        )
                                        ?.innerText.toLowerCase()
                                        .includes("web")
                                )
                                    return row.remove();

                                const data = dataMap.get(cell.innerText);
                                if (!data) return;

                                // 3. Deep Array indexing to extract readable names.
                                // The payload format is a complex protobuf-to-JSON map.
                                // data[11] === 1 means Google Ads tracker, data[11] === 32 means GA4 tracker.
                                const [type, label] =
                                    data[11] === 1
                                        ? [
                                              "aw-ads",
                                              data[64]?.[2]?.[4]
                                                  ?.split("'")?.[7]
                                                  ?.split("/")?.[1],
                                          ] // Extracts label from nested string
                                        : data[11] === 32
                                        ? [
                                              "aw-ga4",
                                              data[64]?.[1]?.[4]?.split(
                                                  "'"
                                              )?.[3],
                                          ]
                                        : [null, null];

                                // If successfully mapped, replace the raw ID in the UI with a styled badge
                                if (type && label) {
                                    cell.innerHTML = label;
                                    cell.classList.add(type);
                                    Utils.setupCopy(cell, label); // Allow clicking the badge to copy the ID
                                }
                            });

                        // Hide container cards entirely if all their rows were removed
                        document
                            .querySelectorAll(
                                "category-conversions-container-view, conversion-goal-card"
                            )
                            .forEach((c) => {
                                if (!c.querySelector(".particle-table-row"))
                                    c.style.display = "none";
                            });
                    }, 1000);
                } catch (e) {
                    console.error("Data parsing failed", e);
                }
            };

            // SPA Polling setup:
            // The `window.conversions_data` variable might not be hydrated immediately when the script runs.
            // This polls up to 3 times (every 500ms) waiting for the framework to attach the data payload.
            const poll = (tries = 0) => {
                const rawData =
                    window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS;
                if (rawData) return init(rawData);
                if (tries < 3) setTimeout(() => poll(tries + 1), 500);
            };

            // Hook into DOM ready to start polling
            ["complete", "interactive"].includes(document.readyState)
                ? poll()
                : window.addEventListener("DOMContentLoaded", () => poll());
        },
    };

    // ==========================================
    // 3. ROUTER
    // ==========================================
    // Inspects the current URL domain to dynamically decide which module to execute.
    // This prevents AdWords logic from erroring out on the Cases dashboard, etc.
    const href = window.location.href;
    if (href.includes("casemon2.corp")) Modules.casemon();
    else if (href.includes("cases.connect")) Modules.casesConnect();
    else if (href.includes("adwords.corp")) Modules.adwords();
})();
