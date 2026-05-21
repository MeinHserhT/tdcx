if (window.location.href.includes("casemon2.corp")) {
    (() => {
        if (window.dashRun) return;
        window.dashRun = 1;

        class BentoAgentDashboard {
            #config = {
                selectors: {
                    container: ".agent-table-container",
                    uiId: "bento_agent_ui",
                    styleId: "bento-dash-styles",
                },
                assets: {
                    iconBaseUrl: "https://cdn-icons-png.flaticon.com/512",
                    icons: {
                        video: {
                            src: "/9571/9571236.png",
                            animation: "wiggle",
                        },
                        "coffee-break": {
                            src: "/16108/16108931.png",
                            animation: "wiggle",
                        },
                        "lunch-break": {
                            src: "/1182/1182132.png",
                            animation: "pulse",
                        },
                        phone: {
                            src: "/13332/13332839.png",
                            animation: "wiggle",
                        },
                        email: { src: "/7487/7487055.png", animation: "slide" },
                        break: {
                            src: "/5140/5140652.png",
                            animation: "wiggle",
                        },
                        close: "/9403/9403346.png",
                    },
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
            #currentUserLdap = null;
            #uiElement = null;
            #targetContainer = null;
            #trustedPolicy = null;

            constructor() {
                this.#targetContainer = document.querySelector(
                    this.#config.selectors.container
                );
                if (!this.#targetContainer) return;

                this.#currentUserLdap = this.#getCurrentUserLdap();
                this.#initTrustedTypes();
                this.#normalizeIconUrls();
                this.#injectStyles();
                this.#createOverlay();
                this.#initObserver();
            }

            #initTrustedTypes() {
                this.#trustedPolicy = window.trustedTypes?.createPolicy(
                    "agent-dash-policy",
                    {
                        createHTML: (string) => string,
                    }
                ) ?? { createHTML: (s) => s };
            }

            #normalizeIconUrls() {
                const { icons, iconBaseUrl } = this.#config.assets;
                Object.entries(icons).forEach(([key, value]) => {
                    if (typeof value === "string") {
                        icons[key] = `${iconBaseUrl}${value}`;
                    } else {
                        value.src = `${iconBaseUrl}${value.src}`;
                    }
                });
            }

            #getCurrentUserLdap() {
                return document
                    .querySelector("[alt='profile photo']")
                    ?.src?.match(/photos\/([^/?]+)/)?.[1];
            }

            #createOverlay() {
                this.#uiElement =
                    document.getElementById(this.#config.selectors.uiId) ??
                    document.createElement("div");
                this.#uiElement.id = this.#config.selectors.uiId;

                if (!this.#uiElement.parentElement) {
                    document.body.appendChild(this.#uiElement);
                }

                this.#uiElement.addEventListener("click", (e) => {
                    if (e.target.closest(".close-btn")) this.#destroy();
                    if (e.target.closest(".quick-reply-btn")) {
                        console.log(
                            "Quick reply triggered:",
                            e.target.closest(".quick-reply-btn").dataset.action
                        );
                    }
                });
            }

            #initObserver() {
                this.#observer = new MutationObserver(() => this.#render());
                this.#observer.observe(this.#targetContainer, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    characterData: true,
                });
                this.#render();
            }

            #destroy() {
                this.#uiElement.style.display = "none";
                this.#observer?.disconnect();
                window.dashRun = 0;
            }

            #parseDurationToSeconds(timeStr) {
                const multipliers = { h: 3600, m: 60, s: 1 };
                return (timeStr.match(/(\d+)(h|m|s)/g) ?? []).reduce(
                    (total, part) => {
                        const value = parseInt(part, 10);
                        const unit = part.slice(-1);
                        return total + value * (multipliers[unit] ?? 0);
                    },
                    0
                );
            }

            #scrapeTableData() {
                const rows = this.#targetContainer.querySelectorAll("tbody tr");
                return Array.from(rows, (tr) => {
                    const cells = tr.querySelectorAll("td");
                    if (cells.length < 9) return null;

                    const phoneCap = (
                        cells[5].innerText.match(/[a-zA-Z\s]+/)?.[0] ?? ""
                    )
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "-");

                    return {
                        img: tr.querySelector("img")?.src,
                        ldap: cells[1].innerText.trim(),
                        auxCode: cells[3].innerText.trim(),
                        timeInState: cells[4].innerText.trim(),
                        phoneCap,
                        lastChangeRaw: cells[8].innerText.trim(),
                        durationSeconds: this.#parseDurationToSeconds(
                            cells[8].innerText
                        ),
                    };
                }).filter(Boolean);
            }

            #normalizeAgentStatus(agent) {
                let { auxCode, phoneCap } = agent;
                let displayStatus = auxCode;
                let statusKey = auxCode.toLowerCase().replace(/\s+/g, "-");

                if (auxCode === "Active" && phoneCap === "busy") {
                    displayStatus = "Break";
                    statusKey = "break";
                }

                return {
                    ...agent,
                    displayStatus,
                    statusKey,
                    cssClass: `stt-${statusKey}`,
                };
            }

            #sortAgents(agents) {
                const { priorities } = this.#config;
                return agents.sort((a, b) => {
                    const isUserA = a.ldap === this.#currentUserLdap;
                    const isUserB = b.ldap === this.#currentUserLdap;
                    if (isUserA !== isUserB) return isUserB - isUserA;

                    const priorityA =
                        priorities[a.statusKey] ?? priorities.default;
                    const priorityB =
                        priorities[b.statusKey] ?? priorities.default;
                    if (priorityA !== priorityB) return priorityA - priorityB;

                    return b.durationSeconds - a.durationSeconds;
                });
            }

            #render() {
                const agents = this.#scrapeTableData().map((agent) =>
                    this.#normalizeAgentStatus(agent)
                );
                const sortedAgents = this.#sortAgents(agents);

                const agentRowsHtml = sortedAgents
                    .map((agent) => {
                        const iconConfig =
                            this.#config.assets.icons[agent.statusKey];
                        const iconHtml = iconConfig
                            ? `<img src="${iconConfig.src}" animation="${iconConfig.animation}" alt="${agent.statusKey} icon"/>`
                            : "";

                        return `
              <div class="agent-row ${agent.cssClass}">
                  <div class="agent-left">
                      <img src="${agent.img}" alt="Avatar for ${agent.ldap}" />
                      <span>${agent.ldap}</span>
                  </div>
                  <div class="agent-right">
                      <div class="agent-meta">
                          <span class="time-state">${agent.lastChangeRaw} (${agent.timeInState})</span>
                          <span class="status-text">${agent.displayStatus}</span> 
                      </div>
                      ${iconHtml}
                  </div>
              </div>`;
                    })
                    .join("");

                const uiHtml = `
          <div class="bento-wrapper">
              <button class="close-btn" title="Close">
                  <img src="${this.#config.assets.icons.close}" alt="Close"/>
              </button>
              
              <div class="bento-grid">
                <div class="bento-card card-full card-agents">
                    <div class="agent-list-header">
                        <h3>Team Status</h3>
                        <span class="agent-count">${
                            sortedAgents.length
                        } Online</span>
                    </div>
                    <div class="agent-list-container">
                        ${agentRowsHtml}
                    </div>
                </div>
              </div>
          </div>`;

                this.#uiElement.innerHTML =
                    this.#trustedPolicy.createHTML(uiHtml);
                this.#uiElement.style.display = "flex";
            }

            #injectStyles() {
                if (document.getElementById(this.#config.selectors.styleId))
                    return;

                const css = `
          #${this.#config.selectors.uiId} { 
              position: fixed; 
              height: 100%; 
              width: 100%; 
              top: 0; 
              right: 0; 
              background-color: rgba(0,0,0,0.3); 
              z-index: 9999; 
              display: flex; 
              justify-content: flex-end; 
              align-items: center; /* Changed from flex-start to center */
              padding: 24px; 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
              pointer-events: none; 
              box-sizing: border-box;
          }
                  
          .bento-wrapper { 
              position: relative; pointer-events: auto; 
              width: 100%; max-width: 300px; 
              background: rgba(255, 255, 255, 0.85);
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
              border-radius: 24px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.6);
              padding: 20px;
              border: 1px solid rgba(255, 255, 255, 0.4);
          }
          
          .close-btn { 
              position: absolute; top: 12px; right: 12px;
              background: rgba(0,0,0,0.05); border: none; cursor: pointer;
              z-index: 10; border-radius: 50%; width: 28px; height: 28px;
              display: flex; align-items: center; justify-content: center;
              transition: all 0.2s ease;
          }
          .close-btn:hover { background: rgba(0,0,0,0.1); transform: scale(1.1); }
          .close-btn img { width: 12px; height: 12px; opacity: 0.6; }

          .bento-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
          }
          
          .bento-card {
              background: #ffffff;
              border-radius: 16px;
              padding: 16px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.03);
              border: 1px solid rgba(0,0,0,0.04);
              display: flex;
              flex-direction: column;
          }
          .card-full { grid-column: span 2; }
          
          .bento-card h3 { 
              margin: 0 0 12px 0; font-size: 14px; 
              color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
          }

          .metric { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
          .metric-value { font-size: 28px; font-weight: 700; color: #212529; }
          .metric-trend { font-size: 12px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
          .metric-trend.up { background: #fee2e2; color: #dc2626; }
          .metric-trend.down { background: #dcfce7; color: #16a34a; }
          .subtitle { margin: 0; font-size: 12px; color: #adb5bd; }

          .action-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
          }
          .quick-reply-btn {
              background: #f8f9fa; border: 1px solid #e9ecef;
              padding: 10px; border-radius: 10px; color: #495057;
              font-weight: 500; font-size: 13px; cursor: pointer;
              transition: all 0.2s ease;
          }
          .quick-reply-btn:hover { background: #e9ecef; transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

          .card-agents { padding: 0; overflow: hidden; }
          .agent-list-header { 
              padding: 16px 16px 12px; border-bottom: 1px solid #f1f3f5;
              display: flex; justify-content: space-between; align-items: center;
          }
          .agent-list-header h3 { margin: 0; }
          .agent-count { font-size: 12px; background: #e9ecef; padding: 2px 8px; border-radius: 12px; color: #495057; font-weight: 600; }
          
          .agent-list-container {
              max-height: 80vh;
              overflow-y: auto;
          }
          
          .agent-row {
              display: flex; justify-content: space-between; align-items: center;
              padding: 10px 16px; border-bottom: 1px solid #f8f9fa;
              transition: background-color 0.2s ease;
          }
          .agent-row:last-child { border-bottom: none; }
          .agent-row:hover { filter: brightness(0.97); }
          
          .agent-left { display: flex; align-items: center; gap: 10px; font-weight: 500; font-size: 14px; color: #343a40; }
          .agent-left img { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; }
          
          .agent-right { display: flex; align-items: center; gap: 12px; text-align: right; }
          .agent-meta { display: flex; flex-direction: column; }
          .time-state { font-size: 11px; opacity: 0.6; }
          .status-text { font-size: 13px; font-weight: 500; }
          
          .agent-right img { width: 24px; height: 24px; }

          .stt-active { background-color: #f0fdf4; color: #16a34a; }
          .stt-phone { background-color: #fef2f2; color: #dc2626; }
          .stt-email { background-color: #f0f9ff; color: #0284c7; }
          .stt-coffee-break { background-color: #fff7ed; color: #c2410c; }
          .stt-lunch-break { background-color: #fefce8; color: #ca8a04; }
          .stt-break { background-color: #f8f9fa; color: #495057; }

          [animation="pulse"] { animation: pulse 2s infinite ease-in-out; }
          @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
          [animation="wiggle"] { animation: wiggle 0.9s infinite; }
          @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 15%, 45%, 75% { transform: rotate(8deg); } 30%, 60% { transform: rotate(-8deg); } }
          [animation="slide"] { animation: slide-lr 1.2s infinite alternate ease-in-out; }
          @keyframes slide-lr { from { transform: translateX(0); } to { transform: translateX(5px); } }
          
          .agent-list-container::-webkit-scrollbar { width: 6px; }
          .agent-list-container::-webkit-scrollbar-track { background: transparent; }
          .agent-list-container::-webkit-scrollbar-thumb { background-color: #dee2e6; border-radius: 10px; }
          `;

                const styleEl = document.createElement("style");
                styleEl.id = this.#config.selectors.styleId;
                styleEl.textContent = this.#trustedPolicy.createHTML(css);
                document.head.appendChild(styleEl);
            }
        }

        new BentoAgentDashboard();
    })();
}
