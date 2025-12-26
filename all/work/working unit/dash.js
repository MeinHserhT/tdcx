if (window.location.href.includes("casemon2.corp")) {
	(() => {
		// Prevent multiple instances from running
		if (window.dashRun) return;
		window.dashRun = 1;

		class AgentDashboard {
			// Configuration & State
			#config = {
				selectors: {
					container: ".agent-table-container",
					uiId: "agent_ui",
					styleId: "agent-dash-styles",
				},
				assets: {
					iconBaseUrl: "https://cdn-icons-png.flaticon.com/512",
					icons: {
						"coffee-break": {
							src: "/2935/2935413.png",
							animation: "wiggle"
						},
						"lunch-break": {
							src: "/4252/4252424.png",
							animation: "pulse"
						},
						"phone": {
							src: "/1959/1959283.png",
							animation: "wiggle"
						},
						"email": {
							src: "/15781/15781499.png",
							animation: "slide"
						},
						"break": {
							src: "/2115/2115487.png",
							animation: "wiggle"
						},
						"close": "/9403/9403346.png",
					},
				},
				// Lower number = Higher priority in the list
				priorities: {
					active: 1,
					phone: 2,
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
				this.#currentUserLdap = this.#getCurrentUserLdap();
				this.#targetContainer = document.querySelector(this.#config.selectors.container);
				if (!this.#targetContainer) {
					console.error("Agent Dashboard: Target table container not found.");
					return;
				}
				this.#initTrustedTypes();
				this.#normalizeIconUrls();
				this.#injectStyles();
				this.#createOverlay();
				this.#initObserver();
			}

			#initTrustedTypes = () => {
				if (window.trustedTypes && window.trustedTypes.createPolicy) {
					this.#trustedPolicy = window.trustedTypes.createPolicy("agent-dash-policy", {
						createHTML: (string) => string,
					});
				} else {
					this.#trustedPolicy = {
						createHTML: (s) => s
					};
				}
			}

			#normalizeIconUrls = () => {
				const {
					icons,
					iconBaseUrl
				} = this.#config.assets;
				for (let [key, value] of Object.entries(icons)) {
					if (typeof value === "string") {
						icons[key] = iconBaseUrl + value;
					} else {
						value.src = iconBaseUrl + value.src;
					}
				}
			}

			#getCurrentUserLdap = () => {
				const profileImg = document.querySelector("[alt='profile photo']");
				return profileImg?.src?.match(/\/([^\/]+)\?/)?.[1];
			}

			#createOverlay = () => {
				let ui = document.getElementById(this.#config.selectors.uiId);
				if (!ui) {
					ui = document.createElement("div");
					ui.id = this.#config.selectors.uiId;
					document.body.appendChild(ui);
				}
				this.#uiElement = ui;
				this.#uiElement.addEventListener("click", (e) => {
					if (e.target.closest(".close-btn")) {
						this.#destroy();
					}
				});
			}

			#initObserver = () => {
				this.#observer = new MutationObserver(this.#render);
				this.#observer.observe(this.#targetContainer, {
					attributes: true,
					childList: true,
					subtree: true,
					characterData: true,
				});
				this.#render();
			}

			#destroy = () => {
				if (this.#uiElement) this.#uiElement.style.display = "none";
				if (this.#observer) this.#observer.disconnect();
				window.dashRun = 0;
			}

			#render = () => {
				const rawData = this.#scrapeTableData();
				const processedData = rawData.map(this.#normalizeAgentStatus);
				const sortedData = this.#sortAgents(processedData);

				const rowsHtml = sortedData.map(this.#generateRowHtml).join("");
				const uiHtml = `
                    <div class="ui-content-wrapper">
                        ${this.#generateCloseBtnHtml()}
                        <div class="ui-table">${rowsHtml}</div>
                    </div>`;

				this.#uiElement.innerHTML = this.#trustedPolicy.createHTML(uiHtml);
				this.#uiElement.style.display = "flex";
			}

			#scrapeTableData = () => {
				const rows = this.#targetContainer.querySelectorAll("tbody tr");

				return Array.from(rows, (tr) => {
					const cells = tr.querySelectorAll("td");
					if (cells.length < 9) return null;

					const phoneCap = (cells[5].innerText.match(/[a-zA-Z\s]+/)?.[0] ?? "")
						.trim()
						.toLowerCase()
						.replace(/\s+/g, "-");

					return {
						img: tr.querySelector("img").src,
						ldap: cells[1].innerText,
						auxCode: cells[3].innerText,
						timeInState: cells[4].innerText,
						phoneCap: phoneCap,
						lastChangeRaw: cells[8].innerText.trim(),
						durationSeconds: this.#parseDurationToSeconds(cells[8].innerText),
					};
				}).filter(Boolean);
			}

			#normalizeAgentStatus = (agent) => {
				let displayStatus = agent.auxCode;
				let statusKey = agent.auxCode.toLowerCase().replace(/\s+/g, "-");

				if (agent.auxCode === "Active" && agent.phoneCap === "busy") {
					displayStatus = "Break";
					statusKey = "break";
				}

				return {
					...agent,
					displayStatus: displayStatus,
					statusKey: statusKey,
					cssClass: `stt-${statusKey}`,
				};
			}

			#sortAgents = (agents) => {
				const priorities = this.#config.priorities;

				return agents.sort((a, b) => {
					const priorityA = priorities[a.statusKey] ?? priorities.default;
					const priorityB = priorities[b.statusKey] ?? priorities.default;

					const isUserA = a.ldap === this.#currentUserLdap;
					const isUserB = b.ldap === this.#currentUserLdap;

					return (
						(isUserB - isUserA) || // Current user floats to top
						(priorityA - priorityB) || // Status priority
						(b.durationSeconds - a.durationSeconds) // Duration descending
					);
				});
			}

			#generateRowHtml = (agent) => {
				const iconHtml = this.#generateIconHtml(agent.statusKey);
				const altText = `Avatar for ${agent.ldap}`;

				return `<div class="tr ${agent.cssClass}">
                            <div class="td left">
                            <img src="${agent.img}" alt="${altText}" />
                            <p>${agent.ldap}</p>
                            </div>
                            <div class="td right">
                            <div>
                                <p>${agent.lastChangeRaw} <span>(${agent.timeInState})</span></p>
                                <p>${agent.displayStatus}</p> 
                            </div>
                            ${iconHtml}
                            </div>
                        </div>`;
			};

			#generateIconHtml = (statusKey) => {
				const iconConfig = this.#config.assets.icons[statusKey];
				if (!iconConfig) return "";
				return `<img src="${iconConfig.src}" animation="${iconConfig.animation}" alt="${statusKey} icon"/>`;
			}

			#generateCloseBtnHtml = () => {
				return `<button class="close-btn" title="Close">
                        <img src="${this.#config.assets.icons.close}" alt="Close"/>
                    </button>`;
			}

			#parseDurationToSeconds = (timeStr) => {
				const matches = timeStr.match(/(\d+)(h|m|s)/g) ?? [];
				const multipliers = {
					h: 3600,
					m: 60,
					s: 1
				};

				return matches.reduce((total, part) => {
					const value = parseInt(part, 10);
					const unit = part.slice(-1);
					return total + value * (multipliers[unit] ?? 0);
				}, 0);
			}

			#injectStyles = () => {
				if (document.getElementById(this.#config.selectors.styleId)) return;

				const css = `
                    #${this.#config.selectors.uiId} { 
                        position: fixed; height: 100%; width: 100%; top: 0; right: 0; 
                        background-color: rgba(0,0,0,0.1); z-index: 999; 
                        display: flex; justify-content: flex-end; align-items: center; 
                        padding: 20px; font-family: system-ui, sans-serif; 
                        pointer-events: none; box-sizing: border-box;
                    }
                    .ui-content-wrapper { position: relative; pointer-events: auto; width: 100%; max-width: 380px; }
                    .close-btn { 
                        position: absolute; top: 0; right: 0;
                        transform: translate(40%, -40%); border: none; cursor: pointer;
                        z-index: 10; background: rgba(0, 0, 0, 0); transition: transform 0.2s ease; 
                    }
                    .close-btn:hover { transform: translate(40%, -40%) scale(1.4); }
                    .ui-table { 
                        display: grid; grid-template-columns: repeat(2, 1fr); 
                        width: 100%; border-radius: 12px; 
                        overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); 
                    }
                    .ui-table .tr { display: contents; }
                    .ui-table .td { 
                        padding: 8px 12px; display: flex; align-items: center; 
                        transition: background-color 0.4s ease, transform 0.2s ease; 
                    }
                    .ui-table .left { justify-content: flex-start; font-weight: 500; font-size: clamp(12px, 4vw, 16px); }
                    .ui-table .right { justify-content: flex-end; text-align: right; font-size: clamp(10px, 3.5vw, 14px); }
                    .ui-table .td { background-color: #F8F9FA; color: #495057; }
                    
                    .ui-table .tr.stt-active .td { background-color: #E6F4EA; color: #1E8449; }
                    .ui-table .tr.stt-phone .td { background-color: #FEC7C0; color: #C0392B; }
                    .ui-table .tr.stt-email .td { background-color: #ace0fe; color: #1d8fdcff; }
                    .ui-table .tr.stt-coffee-break .td { background-color: #D2A993; color: #685347; }
                    .ui-table .tr.stt-lunch-break .td { background-color: #FFEA99; color: #E58732; }
                    .ui-table .tr.stt-break .td { background-color: #e9ecef; color: #495057; }
                    
                    .ui-table .tr:hover .td { transform: scale(1.05); z-index: 5; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .ui-table .td p { padding: 0 6px; margin: 1px 0; }
                    .ui-table .td span { opacity: 0.6; font-size: 0.9em; }
                    
                    img { border-radius: 12px; width: 36px; height: 36px; padding: 4px; object-fit: cover; }
                    .close-btn img { width: 20px; height: 20px; }
                    
                    [animation="pulse"] { animation: pulse 2s infinite ease-in-out; }
                    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
                    
                    [animation="wiggle"] { animation: wiggle 0.9s infinite; }
                    @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 15%, 45%, 75% { transform: rotate(8deg); } 30%, 60% { transform: rotate(-8deg); } }
                    
                    [animation="slide"] { animation: slide-lr 1.2s infinite alternate ease-in-out; }
                    @keyframes slide-lr { from { transform: translateX(0); } to { transform: translateX(8px); } }
                    
                    @media (max-width: 350px) { .ui-table .right img[alt*="icon"] { display: none; } }
                    @media (max-width: 280px) { .ui-table .left img[alt*="Avatar"] { display: none; } }
                    @media (max-width: 240px) { .ui-table .right span { display: none; } }
                `;

				const styleEl = document.createElement("style");
				styleEl.id = this.#config.selectors.styleId;
				styleEl.innerHTML = this.#trustedPolicy.createHTML(css);
				document.head.appendChild(styleEl);
			}
		}

		new AgentDashboard();
	})();
}