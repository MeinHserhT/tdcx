if (window.location.href.includes("casemon2.corp")) {
    (() => {
        if (window.dashRun) return;
        window.dashRun = 1;

        const ICON_BASE = "https://cdn-icons-png.flaticon.com/512";

        class BentoAgentDashboard {
            #config = {
                selectors: {
                    container: ".agent-table-container",
                    uiId: "bento_agent_ui",
                    styleId: "bento-dash-styles",
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

            #observer = null;
            #debounceTimer = null;
            #currentUserLdap = null;
            #uiElement = null;
            #targetContainer = null;
            #trustedPolicy = null;

            constructor() {
                this.#targetContainer = document.querySelector(
                    this.#config.selectors.container
                );
                if (!this.#targetContainer) return;

                this.#currentUserLdap =
                    document
                        .querySelector("[alt='profile photo']")
                        ?.src?.match(/photos\/([^/?]+)/)?.[1] ?? "Unknown";

                this.#trustedPolicy = window.trustedTypes?.createPolicy(
                    "agent-dash-policy",
                    { createHTML: (s) => s }
                ) ?? { createHTML: (s) => s };

                this.#injectStyles();
                this.#createOverlay();
                this.#initObserver();
            }

            #escapeHtml = (str) => {
                const map = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;",
                };
                return String(str || "").replace(/[&<>"']/g, (m) => map[m]);
            };

            #createOverlay() {
                this.#uiElement =
                    document.getElementById(this.#config.selectors.uiId) ??
                    document.createElement("div");
                this.#uiElement.id = this.#config.selectors.uiId;
                if (!this.#uiElement.parentElement)
                    document.body.appendChild(this.#uiElement);

                this.#uiElement.addEventListener("click", (e) => {
                    if (e.target.closest(".close-btn")) this.#destroy();
                    const quickReply = e.target.closest(".quick-reply-btn");
                    if (quickReply)
                        console.log(
                            "Quick reply triggered:",
                            quickReply.dataset.action
                        );
                });
            }

            #initObserver() {
                this.#observer = new MutationObserver(() => {
                    clearTimeout(this.#debounceTimer);
                    this.#debounceTimer = setTimeout(() => this.#render(), 100);
                });
                this.#observer.observe(this.#targetContainer, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    characterData: true,
                });
                this.#render();
            }

            #destroy() {
                this.#uiElement.remove();
                this.#observer?.disconnect();
                clearTimeout(this.#debounceTimer);
                window.dashRun = 0;
            }

            #parseDurationToSeconds(timeStr) {
                return (timeStr.match(/\d+[hms]/g) || []).reduce(
                    (acc, p) =>
                        acc +
                        parseInt(p) *
                            ({ h: 3600, m: 60, s: 1 }[p.slice(-1)] || 0),
                    0
                );
            }

            #scrapeAndNormalizeData() {
                return Array.from(
                    this.#targetContainer.querySelectorAll("tbody tr")
                )
                    .map((tr) => {
                        const cells = tr.querySelectorAll("td");
                        if (cells.length < 9) return null;

                        const phoneCap = (
                            cells[5].innerText.match(/[a-zA-Z\s]+/)?.[0] || ""
                        )
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, "-");
                        let auxCode = cells[3].innerText.trim();
                        let statusKey = auxCode
                            .toLowerCase()
                            .replace(/\s+/g, "-");
                        let displayStatus = auxCode;

                        if (auxCode === "Active" && phoneCap === "busy") {
                            displayStatus = "Break";
                            statusKey = "break";
                        }

                        return {
                            img: tr.querySelector("img")?.src || "",
                            ldap: cells[1].innerText.trim(),
                            timeInState: cells[4].innerText.trim(),
                            lastChangeRaw: cells[8].innerText.trim(),
                            displayStatus,
                            statusKey,
                            cssClass: `stt-${statusKey}`,
                            durationSeconds: this.#parseDurationToSeconds(
                                cells[8].innerText
                            ),
                        };
                    })
                    .filter(Boolean);
            }

            #render() {
                const agents = this.#scrapeAndNormalizeData().sort((a, b) => {
                    if (
                        (a.ldap === this.#currentUserLdap) !==
                        (b.ldap === this.#currentUserLdap)
                    )
                        return (
                            (b.ldap === this.#currentUserLdap) -
                            (a.ldap === this.#currentUserLdap)
                        );
                    const pA =
                        this.#config.priorities[a.statusKey] ??
                        this.#config.priorities.default;
                    const pB =
                        this.#config.priorities[b.statusKey] ??
                        this.#config.priorities.default;
                    return pA !== pB
                        ? pA - pB
                        : b.durationSeconds - a.durationSeconds;
                });

                const activeCount = agents.filter(
                    (a) => a.statusKey === "active"
                ).length;

                const agentRowsHtml = agents
                    .map((a) => {
                        const icon = this.#config.icons[a.statusKey];
                        const safe = {
                            ldap: this.#escapeHtml(a.ldap),
                            img: this.#escapeHtml(a.img),
                            status: this.#escapeHtml(a.displayStatus),
                            state: this.#escapeHtml(a.timeInState),
                            change: this.#escapeHtml(a.lastChangeRaw),
                        };

                        return `
                        <div class="agent-row ${a.cssClass}">
                            <div class="agent-left">
                                <img src="${safe.img}" alt="${
                            safe.ldap
                        }" onerror="this.style.display='none'" />
                                <span>${safe.ldap}</span>
                            </div>
                            <div class="agent-right">
                                <div class="agent-meta">
                                    <span class="time-state">${safe.change} (${
                            safe.state
                        })</span>
                                    <span class="status-text">${
                                        safe.status
                                    }</span> 
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

                this.#uiElement.innerHTML = this.#trustedPolicy.createHTML(`
                    <div class="bento-wrapper">
                        <button class="close-btn" title="Close"><img src="${
                            this.#config.icons.close
                        }" alt="Close"/></button>
                        <div class="bento-grid">
                            <div class="bento-card card-full card-agents">
                                <div class="agent-list-header">
                                    <h3>Team Status</h3>
                                    <div class="header-counters">
                                        <span class="agent-count active-badge" title="Active Agents">${activeCount} Active</span>
                                        <span class="agent-count total-badge">${
                                            agents.length
                                        } Total</span>
                                    </div>
                                </div>
                                <div class="agent-list-container">${agentRowsHtml}</div>
                            </div>
                        </div>
                    </div>
                `);
                this.#uiElement.style.display = "flex";
            }

            #injectStyles() {
                if (document.getElementById(this.#config.selectors.styleId))
                    return;
                const styleEl = document.createElement("style");
                styleEl.id = this.#config.selectors.styleId;

                // Condensed CSS (formatting retained for rendering readability, line breaks collapsed)
                styleEl.textContent = this.#trustedPolicy.createHTML(`
                    #bento_agent_ui { position: fixed; height: 100%; width: 100%; top: 0; right: 0; background-color: rgba(0,0,0,0.3); z-index: 9999; display: flex; justify-content: flex-end; align-items: center; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; pointer-events: none; box-sizing: border-box; }
                    .bento-wrapper { position: relative; pointer-events: auto; width: 100%; max-width: 320px; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.6); padding: 20px; border: 1px solid rgba(255, 255, 255, 0.4); }
                    .close-btn { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.05); border: none; cursor: pointer; z-index: 10; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
                    .close-btn:hover { background: rgba(0,0,0,0.1); transform: scale(1.1); }
                    .close-btn img { width: 12px; height: 12px; opacity: 0.6; }
                    .bento-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                    .bento-card { background: #ffffff; border-radius: 16px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.04); display: flex; flex-direction: column; }
                    .card-full { grid-column: span 2; }
                    .bento-card h3 { margin: 0 0 12px 0; font-size: 14px; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
                    .header-counters { display: flex; gap: 8px; }
                    .agent-count { font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 600; text-transform: uppercase; }
                    .active-badge { background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
                    .total-badge { background: #F8FAFC; color: #334155; border: 1px solid #E2E8F0; }
                    .card-agents { padding: 0; overflow: hidden; }
                    .agent-list-header { padding: 16px 16px 12px; border-bottom: 1px solid #f1f3f5; display: flex; justify-content: space-between; align-items: center; }
                    .agent-list-header h3 { margin: 0; }
                    .agent-list-container { max-height: 80vh; overflow-y: auto; padding: 12px 6px 12px 12px; }
                    .agent-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; margin-bottom: 8px; border-radius: 14px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
                    .agent-row:last-child { margin-bottom: 0; }
                    .agent-row:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 8px 20px rgba(0,0,0,0.08); cursor: default; }
                    .agent-left { display: flex; align-items: center; gap: 10px; font-weight: 500; font-size: 14px; color: #343a40; }
                    .agent-left img { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; }
                    .agent-right { display: flex; align-items: center; gap: 12px; text-align: right; }
                    .agent-meta { display: flex; flex-direction: column; }
                    .time-state { font-size: 11px; opacity: 0.6; }
                    .status-text { font-size: 12px; font-weight: 600; letter-spacing: 0.3px; padding: 2px 6px; border-radius: 6px; display: inline-block; }
                    .agent-right img { width: 24px; height: 24px; }
                    .stt-active { background: linear-gradient(145deg, #ffffff 0%, #ecfdf5 100%); color: #065F46; border: 1px solid #d1fae5; }
                    .stt-active:hover { background: linear-gradient(145deg, #f0fdf4 0%, #d1fae5 100%); border-color: #a7f3d0; }
                    .stt-phone { background: linear-gradient(145deg, #ffffff 0%, #fef2f2 100%); color: #991B1B; border: 1px solid #fee2e2; }
                    .stt-phone:hover { background: linear-gradient(145deg, #fef2f2 0%, #fecaca 100%); border-color: #fca5a5; }
                    .stt-video { background: linear-gradient(145deg, #ffffff 0%, #eef2ff 100%); color: #3730A3; border: 1px solid #e0e7ff; }
                    .stt-video:hover { background: linear-gradient(145deg, #eef2ff 0%, #c7d2fe 100%); border-color: #a5b4fc; }
                    .stt-email { background: linear-gradient(145deg, #ffffff 0%, #eff6ff 100%); color: #1E40AF; border: 1px solid #dbeafe; }
                    .stt-email:hover { background: linear-gradient(145deg, #eff6ff 0%, #bfdbfe 100%); border-color: #93c5fd; }
                    .stt-coffee-break { background: linear-gradient(145deg, #ffffff 0%, #fff7ed 100%); color: #9A3412; border: 1px solid #ffedd5; }
                    .stt-coffee-break:hover { background: linear-gradient(145deg, #fff7ed 0%, #fed7aa 100%); border-color: #fdba74; }
                    .stt-lunch-break { background: linear-gradient(145deg, #ffffff 0%, #fefce8 100%); color: #854D0E; border: 1px solid #fef08a; }
                    .stt-lunch-break:hover { background: linear-gradient(145deg, #fefce8 0%, #fde047 100%); border-color: #facc15; }
                    .stt-break { background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%); color: #334155; border: 1px solid #f1f5f9; }
                    .stt-break:hover { background: linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%); border-color: #cbd5e1; }
                    [animation="pulse"] { animation: pulse 2s infinite ease-in-out; }
                    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
                    [animation="wiggle"] { animation: wiggle 0.9s infinite; }
                    @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 15%, 45%, 75% { transform: rotate(8deg); } 30%, 60% { transform: rotate(-8deg); } }
                    [animation="slide"] { animation: slide-lr 1.2s infinite alternate ease-in-out; }
                    @keyframes slide-lr { from { transform: translateX(0); } to { transform: translateX(5px); } }
                    .agent-list-container::-webkit-scrollbar { width: 6px; }
                    .agent-list-container::-webkit-scrollbar-track { background: transparent; }
                    .agent-list-container::-webkit-scrollbar-thumb { background-color: #dee2e6; border-radius: 10px; }
                `);
                document.head.appendChild(styleEl);
            }
        }

        new BentoAgentDashboard();
    })();
}
