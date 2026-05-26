(() => {
    // ==========================================
    // 1. SHARED UTILITIES
    // ==========================================
    const Utils = {
        debounce: (func, wait) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func(...args), wait);
            };
        },
        addStyle: (id, css) => {
            if (document.getElementById(id)) return;
            const style = document.createElement("style");
            style.id = id;
            const policy = window.trustedTypes?.createPolicy("default", {
                createHTML: (s) => s,
            }) ?? { createHTML: (s) => s };
            style.textContent = policy.createHTML(css);
            document.head.appendChild(style);
        },
        createEl: (
            tag,
            { parent, onClick, style, className, id, ...props } = {}
        ) => {
            const el = Object.assign(document.createElement(tag), props);
            if (id) el.id = id;
            if (className) el.className = className;
            if (style) Object.assign(el.style, style);
            if (onClick) el.addEventListener("click", onClick);
            if (parent) parent.appendChild(el);
            return el;
        },
        $: (s, ctx = document) => ctx.querySelector(s),
        waitForElement: (selector, timeout = 3000) =>
            new Promise((resolve, reject) => {
                const start = Date.now();
                const timer = setInterval(() => {
                    const el = Utils.$(selector);
                    if (el?.offsetParent) {
                        clearInterval(timer);
                        resolve(el);
                    } else if (Date.now() - start > timeout) {
                        clearInterval(timer);
                        reject(new Error(`Timeout waiting for: ${selector}`));
                    }
                }, 250); // Increased polling frequency slightly for better responsiveness
            }),
        setupCopy: (el, text, successMsg = "Copied!") => {
            let resetTimeout;
            el.addEventListener("click", async (e) => {
                try {
                    await navigator.clipboard.writeText(text);
                    // Store original text on the element dataset to prevent overwriting with "Copied!" on spam clicks
                    if (!el.dataset.origText)
                        el.dataset.origText = el.innerText;

                    el.innerText = successMsg;
                    el.classList.add("aw-copied");

                    clearTimeout(resetTimeout);
                    resetTimeout = setTimeout(() => {
                        el.innerText = el.dataset.origText;
                        el.classList.remove("aw-copied");
                    }, 1500);
                } catch (err) {
                    console.error("Copy failed", err);
                }
            });
        },
        escapeHtml: (str) =>
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
            ),
    };

    // ==========================================
    // 2. MODULES
    // ==========================================
    const Modules = {
        // --- Dashboard Module (Casemon) ---
        casemon: () => {
            if (window.dashRun) return;
            window.dashRun = 1;

            Utils.$('[aria-selected="false"]')?.click();

            const ICON_BASE = "https://cdn-icons-png.flaticon.com/512";
            const config = {
                uiId: "bento_agent_ui",
                styleId: "bento-dash-styles",
                target: ".agent-table-container",
                statusConfig: {
                    active: {
                        color: "#10B981",
                        track: "#D1FAE5",
                        maxSecs: 3600,
                    },
                    phone: {
                        color: "#EF4444",
                        track: "#FFE4E6",
                        maxSecs: 2700,
                    },
                    video: {
                        color: "#8B5CF6",
                        track: "#F3E8FF",
                        maxSecs: 2700,
                    },
                    email: { color: "#0EA5E9", track: "#E0F2FE", maxSecs: 900 },
                    "coffee-break": {
                        color: "#F59E0B",
                        track: "#FFEDD5",
                        maxSecs: 900,
                    },
                    "lunch-break": {
                        color: "#EAB308",
                        track: "#FEF9C3",
                        maxSecs: 3600,
                    },
                    break: { color: "#6B7280", track: "#F3F4F6", maxSecs: 900 },
                    default: {
                        color: "#9CA3AF",
                        track: "#F3F4F6",
                        maxSecs: 2700,
                    },
                },
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
            if (!container) {
                window.dashRun = 0;
                return;
            }

            const currentUserLdap =
                Utils.$("[alt='profile photo']")?.src?.match(
                    /photos\/([^/?]+)/
                )?.[1] ?? "Unknown";

            Utils.addStyle(
                config.styleId,
                `
                #bento_agent_ui { position: fixed; height: 100%; width: 100%; top: 0; right: 0; background-color: rgba(15, 17, 21, 0.12); z-index: 9999; display: flex; justify-content: flex-end; align-items: center; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; pointer-events: none; box-sizing: border-box; }
                .bento-wrapper { position: relative; pointer-events: auto; width: 100%; max-width: 320px; background: #FFFFFF; border-radius: 20px; box-shadow: 0 12px 32px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04); padding: 20px; border: 1px solid #E5E7EB; color: #1F2937; transition: border-color 0.3s ease; }
                .close-btn { position: absolute; top: -10px; right: -10px; background: #FFFFFF; border: 1px solid #E5E7EB; cursor: pointer; z-index: 20; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.1); transition: all 0.2s ease; }
                .close-btn:hover { background: #F3F4F6; transform: scale(1.1); }
                .close-btn img { width: 11px; height: 11px; opacity: 0.7; }
                .bento-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
                .bento-card { background: transparent; display: flex; flex-direction: column; }
                .agent-list-header { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
                .agent-list-header h3 { margin: 0; font-size: 12px; color: #4B5563; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; justify-content: space-between; }
                .header-counters { display: flex; gap: 6px; justify-content: flex-start; width: 100%; }
                .agent-count { font-size: 10px; padding: 3px 8px; border-radius: 6px; font-weight: 700; white-space: nowrap; }
                .active-badge { background: #E6F4EA; color: #137333; border: 1px solid #CEEAD6; }
                .phone-badge { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
                .break-badge { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
                .total-badge { background: #F1F3F4; color: #5F6368; border: 1px solid #E8EAED; }
                .health-warning { animation: pulseHealth 2.5s infinite; border-color: #EF4444; box-shadow: 0 0 15px rgba(239, 68, 68, 0.15); }
                @keyframes pulseHealth { 0%, 100% { border-color: #E5E7EB; } 50% { border-color: #EF4444; } }
                .health-text { font-size: 10px; color: #DC2626; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                .agent-list-container { max-height: 72vh; overflow-y: auto; padding: 2px; display: flex; flex-direction: column; gap: 12px; border-top: 1px solid #F1F5F9; padding-top: 12px; }
                .status-group-block { display: flex; width: 100%; gap: 10px; align-items: flex-start; }
                .status-inline-label { width: 50px; min-width: 35px; text-align: left; font-size: 9px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 4px; border-left: 2px solid #E2E8F0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
                .status-inline-label.user-label { color: #2563EB; border-left-color: #2563EB; background: #EFF6FF; border-radius: 0 4px 4px 0; }
                .status-rows-stack { flex-grow: 1; display: flex; flex-direction: column; gap: 6px; }
                .agent-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 10px; transition: transform 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.02); position: relative; background-clip: padding-box; border: 2px solid transparent; z-index: 1; }
                .agent-row:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
                .agent-row::before { content: ''; position: absolute; inset: 0; border-radius: 10px; padding: 2px; margin: -2px; background: conic-gradient(var(--st-color) var(--progress), var(--st-track) var(--progress)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; z-index: -1; }
                @keyframes pulseWarning { 0%, 100% { filter: drop-shadow(0 0 2px var(--st-color)); } 50% { filter: drop-shadow(0 0 8px var(--st-color)); } }
                .agent-row.over-time::before { animation: pulseWarning 1.5s infinite ease-in-out; }
                .agent-left { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 12px; }
                .agent-left img { width: 26px; height: 26px; border-radius: 6px; object-fit: cover; border: 1px solid rgba(0,0,0,0.04); }
                .agent-right { display: flex; align-items: center; gap: 10px; text-align: right; }
                .agent-meta { display: flex; flex-direction: column; }
                .time-state { font-size: 10px; font-weight: 500; opacity: 0.85; }
                .status-text { font-size: 10px; font-weight: 700; letter-spacing: 0.2px; display: inline-block; margin-top: 1px; }
                .agent-right img { width: 18px; height: 18px; opacity: 0.8; }
                .stt-active { background: linear-gradient(135deg, #D1FAE5 0%, #DBEAFE 100%); color: #064E3B; } .stt-active .status-text { color: #047857; }
                .stt-phone { background: linear-gradient(135deg, #FFE4E6 0%, #FEF3C7 100%); color: #7F1D1D; } .stt-phone .status-text { color: #B91C1C; }
                .stt-video { background: linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 100%); color: #4C1D95; } .stt-video .status-text { color: #6B21A8; }
                .stt-email { background: linear-gradient(135deg, #E0F2FE 0%, #FFE4E6 100%); color: #0C4A6E; } .stt-email .status-text { color: #0284C7; }
                .stt-coffee-break { background: linear-gradient(135deg, #FFEDD5 0%, #E0F2FE 100%); color: #78350F; } .stt-coffee-break .status-text { color: #B45309; }
                .stt-lunch-break { background: linear-gradient(135deg, #FEF9C3 0%, #F3E8FF 100%); color: #713F12; } .stt-lunch-break .status-text { color: #A16207; }
                .stt-break { background: linear-gradient(135deg, #F3F4F6 0%, #E2E8F0 100%); color: #374151; } .stt-break .status-text { color: #4B5563; }
                [animation="pulse"] { animation: pulse 2s infinite ease-in-out; }
                @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
                [animation="wiggle"] { animation: wiggle 0.9s infinite; }
                @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 15%, 45%, 75% { transform: rotate(4deg); } 30%, 60% { transform: rotate(-4deg); } }
                [animation="slide"] { animation: slide-lr 1.2s infinite alternate ease-in-out; }
                @keyframes slide-lr { from { transform: translateX(0); } to { transform: translateX(2px); } }
                .agent-list-container::-webkit-scrollbar { width: 4px; }
                .agent-list-container::-webkit-scrollbar-track { background: transparent; }
                .agent-list-container::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
                `
            );

            let uiElement =
                document.getElementById(config.uiId) ||
                Utils.createEl("div", {
                    id: config.uiId,
                    parent: document.body,
                });

            // Prevent DOM thrashing by checking state
            let lastRenderedHTML = "";

            // Hoisted regex and helpers for loop performance
            const alphaRegex = /[a-zA-Z\s]+/;
            const parseSecs = (str) =>
                (str.match(/\d+[hms]/g) || []).reduce(
                    (acc, p) =>
                        acc +
                        parseInt(p) *
                            ({ h: 3600, m: 60, s: 1 }[p.slice(-1)] || 0),
                    0
                );

            const render = () => {
                try {
                    const agents = Array.from(
                        container.querySelectorAll("tbody tr")
                    )
                        .map((tr) => {
                            const cells = tr.querySelectorAll("td");
                            // Guard against out of bounds if DOM layout shifts
                            if (!cells || cells.length < 10) return null;

                            const phoneStat = (
                                cells[5].innerText.match(alphaRegex)?.[0] || ""
                            )
                                .trim()
                                .toLowerCase()
                                .replace(/\s+/g, "-");
                            const videoStat = (
                                cells[8].innerText.match(alphaRegex)?.[0] || ""
                            )
                                .trim()
                                .toLowerCase()
                                .replace(/\s+/g, "-");
                            let displayStatus = cells[3].innerText.trim();
                            let statusKey = displayStatus
                                .toLowerCase()
                                .replace(/\s+/g, "-");

                            if (
                                displayStatus === "Active" &&
                                phoneStat === "busy" &&
                                videoStat === "busy"
                            ) {
                                displayStatus = "Break";
                                statusKey = "break";
                            }

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
                        .filter(Boolean)
                        .sort((a, b) => {
                            const isUserA = a.ldap === currentUserLdap;
                            const isUserB = b.ldap === currentUserLdap;
                            if (isUserA !== isUserB) return isUserB - isUserA;

                            const pA =
                                config.priorities[a.statusKey] ??
                                config.priorities.default;
                            const pB =
                                config.priorities[b.statusKey] ??
                                config.priorities.default;
                            return pA !== pB
                                ? pA - pB
                                : b.durationSeconds - a.durationSeconds;
                        });

                    const activeCount = agents.filter(
                        (a) => a.statusKey === "active"
                    ).length;
                    const phoneCount = agents.filter((a) =>
                        ["phone", "video"].includes(a.statusKey)
                    ).length;
                    const breakCount = agents.filter(
                        (a) =>
                            !["phone", "video", "active"].includes(a.statusKey)
                    ).length;
                    const totalAgents = agents.length;
                    const availabilityRatio =
                        totalAgents > 0 ? activeCount / totalAgents : 0;
                    const isTeamBusy =
                        availabilityRatio < 0.2 && totalAgents > 0;

                    const groupedByState = [];
                    let currentGroup = null;

                    agents.forEach((a) => {
                        let isUser = a.ldap === currentUserLdap;
                        let groupLabel = isUser ? "You" : a.displayStatus;

                        if (
                            !isUser &&
                            (a.statusKey === "phone" || a.statusKey === "video")
                        ) {
                            groupLabel = "On Call";
                        }

                        if (
                            !currentGroup ||
                            currentGroup.label !== groupLabel
                        ) {
                            currentGroup = {
                                label: groupLabel,
                                isUser: isUser,
                                rows: [],
                            };
                            groupedByState.push(currentGroup);
                        }
                        currentGroup.rows.push(a);
                    });

                    let statusBlock = "";
                    groupedByState.forEach((group) => {
                        let internalRows = "";
                        group.rows.forEach((a) => {
                            const icon = config.icons[a.statusKey];
                            const stConf =
                                config.statusConfig[a.statusKey] ||
                                config.statusConfig.default;
                            const maxSecs = stConf.maxSecs || 2700;
                            const progressPercent = Math.min(
                                (a.durationSeconds / maxSecs) * 100,
                                100
                            ).toFixed(1);
                            const isOverTime = a.durationSeconds >= maxSecs;

                            const inlineStyle = `--progress: ${progressPercent}%; --st-color: ${stConf.color}; --st-track: ${stConf.track};`;
                            const finalClass = `agent-row ${a.cssClass} ${
                                isOverTime ? "over-time" : ""
                            }`;

                            internalRows += `
                                <div class="${finalClass}" style="${inlineStyle}">
                                    <div class="agent-left">
                                        <img src="${Utils.escapeHtml(
                                            a.img
                                        )}" alt="${Utils.escapeHtml(
                                a.ldap
                            )}" loading="lazy" />
                                        <span>${Utils.escapeHtml(a.ldap)}</span>
                                    </div>
                                    <div class="agent-right">
                                        <div class="agent-meta">
                                            <span class="time-state">${Utils.escapeHtml(
                                                a.lastChangeRaw
                                            )} (${Utils.escapeHtml(
                                a.timeInState
                            )})</span>
                                            <span class="status-text">${Utils.escapeHtml(
                                                a.displayStatus
                                            )}</span> 
                                        </div>
                                        ${
                                            icon
                                                ? `<img src="${icon.src}" animation="${icon.animation}" alt="${a.statusKey} icon" loading="lazy" />`
                                                : ""
                                        }
                                    </div>
                                </div>`;
                        });

                        statusBlock += `
                            <div class="status-group-block">
                                <div class="status-inline-label ${
                                    group.isUser ? "user-label" : ""
                                }">${Utils.escapeHtml(group.label)}</div>
                                <div class="status-rows-stack">${internalRows}</div>
                            </div>`;
                    });

                    const newHTML = `
                        <div class="bento-wrapper ${
                            isTeamBusy ? "health-warning" : ""
                        }">
                            <button class="close-btn" title="Close"><img src="${
                                config.icons.close
                            }" alt="Close"/></button>
                            <div class="bento-grid">
                                <div class="bento-card">
                                    <div class="agent-list-header">
                                        <h3>
                                            <span>Team Status</span>
                                            ${
                                                isTeamBusy
                                                    ? `<span class="health-text">⚠️ Low Availability</span>`
                                                    : ""
                                            }
                                        </h3>
                                        <div class="header-counters">
                                            <span class="agent-count active-badge" title="Active">Act: ${activeCount}</span> +
                                            <span class="agent-count phone-badge" title="On Phone">Phn: ${phoneCount}</span> +
                                            <span class="agent-count break-badge" title="On Break">Brk: ${breakCount}</span> =
                                            <span class="agent-count total-badge" title="Total">Tot: ${totalAgents}</span>
                                        </div>
                                    </div>
                                    <div class="agent-list-container">${statusBlock}</div>
                                </div>
                            </div>
                        </div>`;

                    if (newHTML !== lastRenderedHTML) {
                        uiElement.innerHTML = newHTML;
                        lastRenderedHTML = newHTML;
                        uiElement.style.display = "flex";
                    }
                } catch (e) {
                    console.error("Casemon render error:", e);
                }
            };

            const observer = new MutationObserver(Utils.debounce(render, 150));
            observer.observe(container, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true,
            });

            uiElement.addEventListener("click", (e) => {
                if (e.target.closest(".close-btn")) {
                    uiElement.remove();
                    window.dashRun = 0;
                    observer.disconnect(); // Memory Leak fix
                }
            });

            render();
        },

        // --- Cases Connect Module ---
        casesConnect: () => {
            if (window.scrRun) return;
            window.scrRun = true;

            Utils.addStyle(
                "cases-styles",
                `
                #panelQM { position: fixed; bottom: 20px; left: 20px; display: flex; gap: 10px; align-items: center; z-index: 9999; font-family: -apple-system, sans-serif; }
                .qm-btn { z-index: 10; color: white; padding: 10px 14px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(26,29,35,0.06); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); font-size: 13px; position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,0,0,0.03); }
                .qm-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(26,29,35,0.12); }
                #flup-days-input { position: absolute; top: 50%; transform: translateY(-50%); right: 6px; width: 28px; height: 24px; padding: 0; border: none; border-radius: 4px; background: rgba(255, 255, 255, 0.95); color: #1A1D23; font-weight: 700; font-size: 13px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.08); transition: all 0.2s ease; -moz-appearance: textfield; }
                #flup-days-input:focus { outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.08), 0 0 0 2px rgba(26, 29, 35, 0.2); }
                .qm-badge { display: none; position: absolute; top: -4px; right: -4px; background: #D94138; border-radius: 50%; padding: 2px 6px; font-size: 10px; font-weight: 700; line-height: 1; border: 1px solid #ffffff; }
                .aw-sig-table { margin: 12px 0; }
                `
            );

            const panel = Utils.createEl("div", {
                id: "panelQM",
                parent: document.body,
            });

            // Auto Clicker
            let timer = null;
            const autoBtn = Utils.createEl("button", {
                textContent: "OFF",
                title: "Auto Click",
                className: "qm-btn",
                style: { backgroundColor: "#D94138" },
                parent: panel,
                onClick: () => {
                    if (timer) {
                        clearInterval(timer);
                        timer = null;
                        autoBtn.textContent = "OFF";
                        autoBtn.style.backgroundColor = "#D94138";
                    } else {
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

            // Active Check Indicator
            const checkBtn = Utils.createEl("button", {
                innerHTML: `<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 16px; height: 16px; filter: invert(1);"><span id="flup-badge" class="qm-badge">+</span>`,
                title: "Click Follow-up Item",
                className: "qm-btn",
                style: { backgroundColor: "#3B72E6" },
                parent: panel,
                onClick: async () => {
                    Utils.$('[debug-id="dock-item-home"]')?.click();
                    try {
                        const el = await Utils.waitForElement(
                            ".li-popup_lstcasefl"
                        );
                        el?.click();
                    } catch (e) {
                        console.warn("Follow-up popup not found");
                    }
                },
            });

            Utils.waitForElement(".li-popup_lstcasefl")
                .then((el) => {
                    const badge = Utils.$("#flup-badge");
                    const updateBadge = () => {
                        if (badge)
                            badge.style.display =
                                el.dataset.attr && el.dataset.attr !== "0"
                                    ? "block"
                                    : "none";
                    };
                    new MutationObserver(updateBadge).observe(el, {
                        attributes: true,
                        attributeFilter: ["data-attr"],
                    });
                    updateBadge();
                })
                .catch(() => {});

            // Follow Up Setter
            const flBtn = Utils.createEl("button", {
                textContent: "FL Up:",
                title: "Set Follow-up",
                className: "qm-btn",
                style: { backgroundColor: "#1A827A", paddingRight: "44px" },
                parent: panel,
                onClick: async (e) => {
                    if (e.target.id === "flup-days-input") return;
                    try {
                        const appt = Utils.$(
                            '[data-infocase="appointment_time"]'
                        );
                        if (appt && !appt.dataset.valchoice) {
                            appt.click();
                            (
                                await Utils.waitForElement(
                                    ".datepicker-grid .today"
                                )
                            )?.click();
                        }

                        const days =
                            parseInt(Utils.$("#flup-days-input").value, 10) ||
                            0;
                        Utils.$('[data-infocase="follow_up_time"]')?.click();

                        if (days > 0) {
                            let d = new Date();
                            for (let i = 0; i < days; ) {
                                d.setDate(d.getDate() + 1);
                                if (d.getDay() % 6 !== 0) i++;
                            }
                            const diff = Math.round(
                                (d - new Date()) / 86400000
                            );
                            const todayEl = await Utils.waitForElement(
                                ".datepicker-grid .today"
                            );
                            let target = todayEl;
                            for (let s = 0; s < diff && target; s++) {
                                target = target.nextElementSibling;
                            }
                            target?.click();
                        } else {
                            (
                                await Utils.waitForElement(
                                    '[data-thischoice="Finish"]'
                                )
                            )?.click();
                        }
                        (
                            await Utils.waitForElement(
                                "[data-type=follow_up_time]"
                            )
                        )?.click();
                    } catch (err) {
                        console.error("Follow up script failed", err);
                    }
                },
            });

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
                        .slice(0, 1)),
            });

            // Signature Logic Managers
            const getSigHtml = (name) => `
                <table class="aw-sig-table" style="width: 348px; padding: 0 30px;" data-sig-injected="true">
                    <tbody>
                        <tr align="left">
                            <td style="width: 52px; vertical-align: top;"><img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="52" height="52" style="display: block; border-radius: 8px;"></td>
                            <td style="width: 12px;"/>
                            <td style="vertical-align: middle;">
                                <p style="font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; line-height: 1.4; color: #1A1D23;">
                                    <strong style="font-size: 105%; color: #111111;">${Utils.escapeHtml(
                                        name
                                    )}</strong><br>
                                    <span style="color: #5F6368;">Technical Solutions Team</span><br>
                                    <span style="color: #5F6368; font-weight: 500;">TDCX, on behalf of Google</span>
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </table>`;

            const injectSig = () => {
                const container = Utils.$("#email-body-content-top-content");
                if (!container) return;

                document
                    .querySelectorAll(".aw-sig-table")
                    .forEach((el) => el.remove());

                const name =
                    localStorage.getItem("__signature_name") ||
                    prompt("Enter your name:") ||
                    "Agent";
                localStorage.setItem("__signature_name", name);

                const wrapper = document.createElement("div");
                wrapper.innerHTML = getSigHtml(name);
                container.appendChild(wrapper.firstElementChild);
            };

            const autoInjectSig = () => {
                const savedName = localStorage.getItem("__signature_name");
                if (!savedName) return;
                const target = Utils.$(
                    "#email-body-content-top-content > table:nth-child(2)"
                );
                if (target && !Utils.$(".aw-sig-table")) {
                    target.insertAdjacentHTML(
                        "afterend",
                        getSigHtml(savedName)
                    );
                }
            };

            Utils.createEl("button", {
                textContent: "Sign",
                title: "Insert Signature at Cursor",
                className: "qm-btn",
                style: { backgroundColor: "#92400E", color: "#FFFFFF" },
                parent: panel,
                onmousedown: (e) => e.preventDefault(),
                onClick: injectSig,
            });

            // Prevent heavy DOM thrashing by debouncing body mutations
            const debouncedAutoInject = Utils.debounce(autoInjectSig, 400);
            new MutationObserver(debouncedAutoInject).observe(document.body, {
                childList: true,
                subtree: true,
            });
        },

        // --- Adwords Module ---
        adwords: () => {
            Utils.addStyle(
                "aw-styles",
                `
                .aw-ga4 { background-color: #FEF3D6; color: #B07505; border: 1px solid rgba(176,117,5,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; }
                .aw-ads { background-color: #E2F5E9; color: #1E7F4E; border: 1px solid rgba(30,127,78,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; }
                .aw-copied { background-color: #3B72E6 !important; color: white !important; border-color: transparent !important; }
                #gpt-aw-overlay { position: fixed; bottom: 20px; left: 20px; z-index: 999; padding: 8px 14px; background: #161920; color: #F1F3F5; border: 1px solid #2D323F; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: monospace; box-shadow: 0 4px 16px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s ease; user-select: none; }
                #gpt-aw-overlay:hover { background: #2D323F; }
                `
            );

            const init = (rawData) => {
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

                document
                    .querySelectorAll(".expand-more")
                    .forEach((btn) => btn.click());

                try {
                    const parsedData = JSON.parse(rawData);
                    if (!parsedData || !parsedData[1]) return;

                    const dataMap = new Map(
                        parsedData[1].map((entry) => [entry[1], entry])
                    );

                    setTimeout(() => {
                        document
                            .querySelectorAll(".conversion-name-cell .internal")
                            .forEach((cell) => {
                                const row = cell.closest(".particle-table-row");
                                // Added optional chaining protections
                                if (
                                    row &&
                                    !row
                                        .querySelector(
                                            '[essfield="aggregated_conversion_source"]'
                                        )
                                        ?.innerText?.toLowerCase()
                                        .includes("web")
                                ) {
                                    return row.remove();
                                }

                                const data = dataMap.get(cell.innerText);
                                if (!data) return;

                                let type = null,
                                    label = null;
                                if (data[11] === 1) {
                                    type = "aw-ads";
                                    label = data[64]?.[2]?.[4]
                                        ?.split("'")?.[7]
                                        ?.split("/")?.[1];
                                } else if (data[11] === 32) {
                                    type = "aw-ga4";
                                    label = data[64]?.[1]?.[4]?.split("'")?.[3];
                                }

                                if (type && label) {
                                    cell.innerHTML = label;
                                    cell.classList.add(type);
                                    Utils.setupCopy(cell, label);
                                }
                            });

                        document
                            .querySelectorAll(
                                "category-conversions-container-view, conversion-goal-card"
                            )
                            .forEach((c) => {
                                if (!c.querySelector(".particle-table-row"))
                                    c.style.display = "none";
                            });
                    }, 1200); // Slight bump to ensure expanded rows render
                } catch (e) {
                    console.error("Adwords Data parsing failed", e);
                }
            };

            const poll = (tries = 0) => {
                const rawData =
                    window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS;
                if (rawData) return init(rawData);
                if (tries < 5) setTimeout(() => poll(tries + 1), 600); // Increased retries slightly
            };

            ["complete", "interactive"].includes(document.readyState)
                ? poll()
                : window.addEventListener("DOMContentLoaded", () => poll());
        },
    };

    // ==========================================
    // 3. ROUTER
    // ==========================================
    const href = window.location.href;
    if (href.includes("casemon2.corp")) Modules.casemon();
    else if (href.includes("cases.connect")) Modules.casesConnect();
    else if (href.includes("adwords.corp")) Modules.adwords();
})();
