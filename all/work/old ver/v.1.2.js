(function () {
	(() => {
		// Shared Utilities
		let utils = {
			debounce(func, wait) {
				let timeout;
				return (...args) => {
					clearTimeout(timeout);
					timeout = setTimeout(() => func(...args), wait);
				};
			},
			sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
			addStyle(id, cssText) {
				if (document.getElementById(id)) return;
				let styleEl = document.createElement("style");
				styleEl.id = id;
				let policy = window.trustedTypes?.createPolicy("default", {
					createHTML: (e) => e,
				}) ?? { createHTML: (e) => e };
				styleEl.textContent = policy.createHTML(cssText);
				document.head.appendChild(styleEl);
			},
			createEl(
				tag,
				{ parent, onClick, style, className, id, ...props } = {},
			) {
				let el = Object.assign(document.createElement(tag), props);
				if (id) el.id = id;
				if (className) el.className = className;
				if (style) Object.assign(el.style, style);
				if (onClick) el.addEventListener("click", onClick);
				if (parent) parent.appendChild(el);
				return el;
			},
			$: (selector, parent = document) => parent.querySelector(selector),
			waitForElement: (selector, timeout = 3000) =>
				new Promise((resolve, reject) => {
					let el = utils.$(selector);
					if (el) return resolve(el);
					let observer = new MutationObserver((mutations, obs) => {
						let el = utils.$(selector);
						if (el) {
							obs.disconnect();
							resolve(el);
						}
					});
					observer.observe(document.body, {
						childList: true,
						subtree: true,
					});
					setTimeout(() => {
						observer.disconnect();
						reject(Error(`Timeout waiting for: ${selector}`));
					}, timeout);
				}),
			setupCopy(element, text, successMsg = "Copied!") {
				let timeout;
				element.addEventListener("click", async (e) => {
					try {
						await navigator.clipboard.writeText(text);
						element.dataset.origText ||
							(element.dataset.origText = element.innerText);
						element.innerText = successMsg;
						element.classList.add("aw-copied");
						clearTimeout(timeout);
						timeout = setTimeout(() => {
							element.innerText = element.dataset.origText;
							element.classList.remove("aw-copied");
						}, 1500);
					} catch (err) {
						console.error("Copy failed", err);
					}
				});
			},
			escapeHtml: (str) =>
				String(str || "").replace(
					/[&<>"']/g,
					(match) =>
						({
							"&": "&amp;",
							"<": "&lt;",
							">": "&gt;",
							'"': "&quot;",
							"'": "&#039;",
						})[match],
				),
		};

		// Feature Modules
		let features = {
			casemon() {
				if (window.dashRun) return;
				window.dashRun = 1;
				utils.$('[aria-selected="false"]')?.click();

				let iconBase = "https://cdn-icons-png.flaticon.com/512";
				let config = {
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
						email: {
							color: "#0EA5E9",
							track: "#E0F2FE",
							maxSecs: 900,
						},
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
						break: {
							color: "#6B7280",
							track: "#F3F4F6",
							maxSecs: 900,
						},
						default: {
							color: "#9CA3AF",
							track: "#F3F4F6",
							maxSecs: 2700,
						},
					},
					icons: {
						video: {
							src: `${iconBase}/9571/9571236.png`,
							animation: "wiggle",
						},
						"coffee-break": {
							src: `${iconBase}/16108/16108931.png`,
							animation: "wiggle",
						},
						"lunch-break": {
							src: `${iconBase}/1182/1182132.png`,
							animation: "pulse",
						},
						phone: {
							src: `${iconBase}/13332/13332839.png`,
							animation: "wiggle",
						},
						email: {
							src: `${iconBase}/7487/7487055.png`,
							animation: "slide",
						},
						break: {
							src: `${iconBase}/5140/5140652.png`,
							animation: "wiggle",
						},
						close: `${iconBase}/9403/9403346.png`,
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

				let targetContainer = utils.$(config.target);
				if (!targetContainer) {
					window.dashRun = 0;
					return;
				}

				let currentUserName =
					utils
						.$("[alt='profile photo']")
						?.src?.match(/photos\/([^/?]+)/)?.[1] ?? "Unknown";

				utils.addStyle(
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
        
                /* STATUS GRADIENTS */
                .stt-active { background: linear-gradient(135deg, #D1FAE5 0%, #FCE7F3 100%); color: #064E3B; } .stt-active .status-text { color: #047857; }
                .stt-phone { background: linear-gradient(135deg, #FEE2E2 0%, #CCFBF1 100%); color: #7F1D1D; } .stt-phone .status-text { color: #B91C1C; }
                .stt-video { background: linear-gradient(135deg, #F3E8FF 0%, #FEF9C3 100%); color: #4C1D95; } .stt-video .status-text { color: #6B21A8; }
                .stt-email { background: linear-gradient(135deg, #E0F2FE 0%, #FFEDD5 100%); color: #0C4A6E; } .stt-email .status-text { color: #0284C7; }
                .stt-coffee-break { background: linear-gradient(135deg, #FFEDD5 0%, #EDE9FE 100%); color: #78350F; } .stt-coffee-break .status-text { color: #B45309; }
                .stt-lunch-break { background: linear-gradient(135deg, #FEF9C3 0%, #DBEAFE 100%); color: #713F12; } .stt-lunch-break .status-text { color: #A16207; }
                .stt-break { background: linear-gradient(135deg, #F1F5F9 0%, #E7E5E4 100%); color: #374151; } .stt-break .status-text { color: #4B5563; }
        
                [animation="pulse"] { animation: pulse 2s infinite ease-in-out; }
                @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
                [animation="wiggle"] { animation: wiggle 0.9s infinite; }
                @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 15%, 45%, 75% { transform: rotate(4deg); } 30%, 60% { transform: rotate(-4deg); } }
                [animation="slide"] { animation: slide-lr 1.2s infinite alternate ease-in-out; }
                @keyframes slide-lr { from { transform: translateX(0); } to { transform: translateX(2px); } }
                .agent-list-container::-webkit-scrollbar { width: 4px; }
                .agent-list-container::-webkit-scrollbar-track { background: transparent; }
                .agent-list-container::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
        
                /* --- RESPONSIVE BEHAVIOR --- */
                @media screen and (max-width: 380px) {
                    .status-inline-label { display: none !important; }
                }
                @media screen and (max-width: 320px) {
                    .header-counters { display: none !important; }
                    .agent-list-header h3 { margin-bottom: 0; }
                }
                @media screen and (max-width: 280px) {
                    .agent-left img { display: none !important; }
                }
                @media screen and (max-width: 240px) {
                    .agent-right img { display: none !important; }
                }
              `,
				);

				let uiContainer =
					document.getElementById(config.uiId) ||
					utils.createEl("div", {
						id: config.uiId,
						parent: document.body,
					});
				let lastHtml = "";
				let textRegex = /[a-zA-Z\s]+/;
				let timeRegex = /\d+[hms]/g;

				let parseTime = (timeStr) =>
					(timeStr.match(timeRegex) || []).reduce(
						(acc, curr) =>
							acc +
							parseInt(curr, 10) *
								({ h: 3600, m: 60, s: 1 }[curr.slice(-1)] || 0),
						0,
					);

				let updateDashboard = () => {
					try {
						let parsedAgents = Array.from(
							targetContainer.querySelectorAll("tbody tr"),
						)
							.map((row) => {
								let cells = row.querySelectorAll("td");
								if (!cells || cells.length < 10) return null;

								let rawStatus1 = (
									cells[5].innerText.match(textRegex)?.[0] ||
									""
								)
									.trim()
									.toLowerCase()
									.replace(/\s+/g, "-");
								let rawStatus2 = (
									cells[8].innerText.match(textRegex)?.[0] ||
									""
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
									rawStatus1 === "busy" &&
									rawStatus2 === "busy"
								) {
									displayStatus = "Break";
									statusKey = "break";
								}

								return {
									img: row.querySelector("img")?.src || "",
									ldap: cells[1].innerText.trim(),
									timeInState: cells[4].innerText.trim(),
									lastChangeRaw: cells[9].innerText.trim(),
									displayStatus,
									statusKey,
									cssClass: `stt-${statusKey}`,
									durationSeconds: parseTime(
										cells[9].innerText,
									),
								};
							})
							.filter(Boolean)
							.sort((a, b) => {
								let aIsUser = a.ldap === currentUserName;
								let bIsUser = b.ldap === currentUserName;
								if (aIsUser !== bIsUser)
									return bIsUser - aIsUser;

								let aPriority =
									config.priorities[a.statusKey] ??
									config.priorities.default;
								let bPriority =
									config.priorities[b.statusKey] ??
									config.priorities.default;

								return aPriority !== bPriority
									? aPriority - bPriority
									: b.durationSeconds - a.durationSeconds;
							});

						let activeCount = parsedAgents.filter(
							(agent) => agent.statusKey === "active",
						).length;
						let callCount = parsedAgents.filter((agent) =>
							["phone", "video"].includes(agent.statusKey),
						).length;
						let breakCount = parsedAgents.filter(
							(agent) =>
								!["phone", "video", "active"].includes(
									agent.statusKey,
								),
						).length;
						let totalCount = parsedAgents.length;

						let isLowAvailability =
							(totalCount > 0 ? activeCount / totalCount : 0) <
								0.2 && totalCount > 0;
						let groups = [];
						let currentGroup = null;

						parsedAgents.forEach((agent) => {
							let isUser = agent.ldap === currentUserName;
							let label = isUser ? "You" : agent.displayStatus;

							if (!isUser) {
								if (
									agent.statusKey === "phone" ||
									agent.statusKey === "video"
								)
									label = "On Call";
								else if (agent.statusKey.includes("break"))
									label = agent.statusKey.split("-")[0];
							}

							if (currentGroup && currentGroup.label === label) {
								// Group matches, do nothing here
							} else {
								currentGroup = { label, isUser, rows: [] };
								groups.push(currentGroup);
							}
							currentGroup.rows.push(agent);
						});

						let groupsHtml = groups
							.map((group) => {
								let rowsHtml = group.rows
									.map((agent) => {
										let icon =
											config.icons[agent.statusKey];
										let stConf =
											config.statusConfig[
												agent.statusKey
											] || config.statusConfig.default;
										let maxSecs = stConf.maxSecs || 2700;
										let progressPct = Math.min(
											(agent.durationSeconds / maxSecs) *
												100,
											100,
										).toFixed(1);
										let isOverTime =
											agent.durationSeconds >= maxSecs;
										let styleVars = `--progress: ${progressPct}%; --st-color: ${stConf.color}; --st-track: ${stConf.track};`;
										let classes = `agent-row ${agent.cssClass} ${isOverTime ? "over-time" : ""}`;

										return `
                            <div class="${classes}" style="${styleVars}">
                                <div class="agent-left">
                                    <img src="${utils.escapeHtml(agent.img)}" alt="${utils.escapeHtml(agent.ldap)}" loading="lazy" />
                                    <span>${utils.escapeHtml(agent.ldap)}</span>
                                </div>
                                <div class="agent-right">
                                    <div class="agent-meta">
                                        <span class="time-state">${utils.escapeHtml(agent.lastChangeRaw)} (${utils.escapeHtml(agent.timeInState)})</span>
                                        <span class="status-text">${utils.escapeHtml(agent.displayStatus)}</span> 
                                    </div>
                                    ${icon ? `<img src="${icon.src}" animation="${icon.animation}" alt="${agent.statusKey} icon" loading="lazy" />` : ""}
                                </div>
                            </div>`;
									})
									.join("");

								return `
                        <div class="status-group-block">
                            <div class="status-inline-label ${group.isUser ? "user-label" : ""}">${utils.escapeHtml(group.label)}</div>
                            <div class="status-rows-stack">${rowsHtml}</div>
                        </div>`;
							})
							.join("");

						let dashboardHtml = `
                        <div class="bento-wrapper ${isLowAvailability ? "health-warning" : ""}">
                            <button class="close-btn" title="Close"><img src="${config.icons.close}" alt="Close"/></button>
                            <div class="bento-grid">
                                <div class="bento-card">
                                    <div class="agent-list-header">
                                        <h3>
                                            <span>Team Status</span>
                                            ${isLowAvailability ? `<span class="health-text">⚠️ Low Availability</span>` : ""}
                                        </h3>
                                        <div class="header-counters">
                                            <span class="agent-count active-badge" title="Active">Act: ${activeCount}</span> +
                                            <span class="agent-count phone-badge" title="On Phone">Phn: ${callCount}</span> +
                                            <span class="agent-count break-badge" title="On Break">Brk: ${breakCount}</span> =
                                            <span class="agent-count total-badge" title="Total">Tot: ${totalCount}</span>
                                        </div>
                                    </div>
                                    <div class="agent-list-container">${groupsHtml}</div>
                                </div>
                            </div>
                        </div>`;

						if (dashboardHtml !== lastHtml) {
							uiContainer.innerHTML = dashboardHtml;
							lastHtml = dashboardHtml;
							uiContainer.style.display = "flex";
						}
					} catch (err) {
						console.error("Casemon render error:", err);
					}
				};

				let observer = new MutationObserver(
					utils.debounce(updateDashboard, 150),
				);
				observer.observe(targetContainer, {
					attributes: true,
					childList: true,
					subtree: true,
					characterData: true,
				});

				uiContainer.addEventListener("click", (e) => {
					if (e.target.closest(".close-btn")) {
						uiContainer.remove();
						window.dashRun = 0;
						observer.disconnect();
					}
				});

				updateDashboard();
			},

			casesConnect() {
				if (window.scrRun) return;
				window.scrRun = true;
				utils.addStyle(
					"cases-styles",
					`
                #panelQM { position: fixed; bottom: 20px; left: 20px; display: flex; gap: 10px; align-items: center; z-index: 9999; font-family: -apple-system, sans-serif; }
                .qm-btn { z-index: 10; color: white; padding: 10px 14px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(26,29,35,0.06); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); font-size: 13px; position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,0,0,0.03); }
                .qm-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(26,29,35,0.12); }
                #flup-days-input { position: absolute; top: 50%; transform: translateY(-50%); right: 6px; width: 28px; height: 24px; padding: 0; border: none; border-radius: 4px; background: rgba(255, 255, 255, 0.95); color: #1A1D23; font-weight: 700; font-size: 13px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.08); transition: all 0.2s ease; -moz-appearance: textfield; }
                #flup-days-input:focus { outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.08), 0 0 0 2px rgba(26, 29, 35, 0.2); }
                .qm-badge { display: none; position: absolute; top: -4px; right: -4px; background: #D94138; border-radius: 50%; padding: 2px 6px; font-size: 10px; font-weight: 700; line-height: 1; border: 1px solid #ffffff; }
                .aw-sig-table { margin: 12px 0; }
              `,
				);

				let panel = utils.createEl("div", {
					id: "panelQM",
					parent: document.body,
				});

				const autoClickTask = () => {
					utils.$("#cdtx__uioncall--btn")?.click();
					setTimeout(
						() =>
							utils.$(".cdtx__uioncall_control-remove")?.click(),
						6000,
					);
				};

				const saveQplusData = () => {
					try {
						let apptEl = utils.$(
							'[data-infocase="appointment_time"]',
						);
						let flupEl = utils.$(
							'[data-infocase="follow_up_time"]',
						);
						let ldapAM = utils.$('[data-infocase="am_email"]');

						let apptVal = apptEl?.dataset?.valchoice;
						let flupVal = flupEl?.dataset?.valchoice;
						let ldapVal = ldapAM?.dataset?.infocase_value;

						if (apptVal && flupVal) {
							const data = {
								installDate: apptVal,
								followUpDate: flupVal,
								ldap: ldapVal,
							};

							localStorage.setItem(
								"__qplus",
								JSON.stringify(data),
							);
							return data;
						} else {
							console.warn(
								"Follow-up dates not found on page load. Waiting for user action.",
							);
						}
					} catch (err) {
						console.error("Auto-save follow-up failed:", err);
					}
				};

				let clickerInterval = setInterval(autoClickTask, 16000);

				let toggleBtn = utils.createEl("button", {
					textContent: "OFF",
					title: "Auto Click",
					className: "qm-btn",
					style: { backgroundColor: "#D94138" },
					parent: panel,
					onClick() {
						if (clickerInterval) {
							clearInterval(clickerInterval);
							clickerInterval = null;
							toggleBtn.textContent = "ON";
							toggleBtn.style.backgroundColor = "#1E7F4E";
						} else {
							clickerInterval = setInterval(autoClickTask, 16000);
							toggleBtn.textContent = "OFF";
							toggleBtn.style.backgroundColor = "#D94138";
						}
					},
				});

				utils.createEl("button", {
					innerHTML:
						'<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 16px; height: 16px; filter: invert(1);"><span id="flup-badge" class="qm-badge">+</span>',
					title: "Click Follow-up Item",
					className: "qm-btn",
					style: { backgroundColor: "#3B72E6" },
					parent: panel,
					async onClick() {
						utils.$('[debug-id="dock-item-home"]')?.click();
						try {
							let popup = await utils.waitForElement(
								".li-popup_lstcasefl",
							);
							popup?.click();
						} catch (err) {
							console.warn("Follow-up popup not found");
						}
					},
				});

				utils
					.waitForElement(".li-popup_lstcasefl")
					.then((el) => {
						let badge = utils.$("#flup-badge");
						let updateBadge = () => {
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

				let flupBtn = utils.createEl("button", {
					textContent: "FL Up:",
					title: "Set Follow-up",
					className: "qm-btn",
					style: { backgroundColor: "#1A827A", paddingRight: "44px" },
					parent: panel,
					async onClick(e) {
						if (e.target.id !== "flup-days-input") {
							try {
								flupBtn.style.opacity = "0.6";
								flupBtn.style.pointerEvents = "none";

								let daysOffset =
									parseInt(
										utils.$("#flup-days-input").value,
										10,
									) || 0;

								let apptEl = utils.$(
									'[data-infocase="appointment_time"]',
								);
								if (apptEl && !apptEl.dataset.valchoice) {
									apptEl.click();
									await utils.sleep(150);
									let todayEl = await utils.waitForElement(
										".datepicker-grid .today",
									);
									if (todayEl) todayEl.click();
									await utils.sleep(200);
								}

								let flupTimeEl = utils.$(
									'[data-infocase="follow_up_time"]',
								);

								if (flupTimeEl) {
									flupTimeEl.click();
									await utils.sleep(150);
								}

								if (daysOffset > 0) {
									let targetDate = new Date();
									for (
										let counter = 0;
										counter < daysOffset;
									) {
										targetDate.setDate(
											targetDate.getDate() + 1,
										);
										if (targetDate.getDay() % 6 !== 0)
											counter++;
									}
									let diffDays = Math.round(
										(targetDate - new Date()) / 86400000,
									);
									let currentDayEl =
										await utils.waitForElement(
											".datepicker-grid .today",
										);

									for (
										let i = 0;
										i < diffDays && currentDayEl;
										i++
									) {
										currentDayEl =
											currentDayEl.nextElementSibling;
									}
									if (currentDayEl) {
										currentDayEl.click();
										await utils.sleep(200);
									}
								} else {
									let finishEl = await utils.waitForElement(
										'[data-thischoice="Finish"]',
									);
									if (finishEl) {
										finishEl.click();
										await utils.sleep(200);
									}
								}

								let typeEl = await utils.waitForElement(
									"[data-type=follow_up_time]",
								);
								if (typeEl) typeEl.click();

								// Save dates to localStorage on click
								saveQplusData();
							} catch (err) {
								console.error("Follow up script failed", err);
							} finally {
								flupBtn.style.opacity = "1";
								flupBtn.style.pointerEvents = "auto";
							}
						}
					},
				});

				utils.createEl("input", {
					id: "flup-days-input",
					type: "text",
					value: "2",
					parent: flupBtn,
					onClick: (e) => e.stopPropagation(),
					onfocus: (e) => e.target.select(),
					oninput: (e) =>
						(e.target.value = e.target.value
							.replace(/\D/g, "")
							.slice(0, 1)),
				});

				let generateSigHtml = (name) => `
                <table class="aw-sig-table" style="width: 348px; padding: 0 30px;" data-sig-injected="true">
                    <tbody>
                        <tr align="left">
                            <td style="width: 52px; vertical-align: top;"><img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="52" height="52" style="display: block; border-radius: 8px;"></td>
                            <td style="width: 12px;"/>
                            <td style="vertical-align: middle;">
                                <p style="font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; line-height: 1.4; color: #1A1D23;">
                                    <strong style="font-size: 105%; color: #111111;">${utils.escapeHtml(name)}</strong><br>
                                    <span style="color: #5F6368;">Technical Solutions Team</span><br>
                                    <span style="color: #5F6368; font-weight: 500;">TDCX, on behalf of Google</span>
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </table>`;

				let insertSignature = () => {
					let sel = window.getSelection();
					if (!sel.rangeCount) {
						alert(
							"Please click inside the email body to place your cursor first.",
						);
						return;
					}
					let node = sel.getRangeAt(0).startContainer.parentNode;
					if (!node || !node.closest("[contenteditable]")) {
						alert(
							"Please place your cursor inside the text area where you want the signature.",
						);
						return;
					}

					document
						.querySelectorAll(".aw-sig-table")
						.forEach((el) => el.remove());

					let sigName = localStorage.getItem("__signature_name");
					if (!sigName) {
						sigName = prompt("Enter your name:") || "Agent";
						localStorage.setItem("__signature_name", sigName);
					}

					let htmlString = generateSigHtml(sigName);
					document.execCommand(
						"insertHTML",
						false,
						((html) => {
							if (
								window.trustedTypes &&
								window.trustedTypes.createPolicy
							) {
								let policy = trustedTypes.createPolicy(
									"sig-inject",
									{ createHTML: (str) => str },
								);
								return policy.createHTML(html);
							}
							return html;
						})(htmlString),
					);
				};

				utils.createEl("button", {
					textContent: "Sign",
					title: "Insert Signature at Cursor",
					className: "qm-btn",
					style: { backgroundColor: "#92400E", color: "#FFFFFF" },
					parent: panel,
					onmousedown: (e) => e.preventDefault(),
					onClick: insertSignature,
				});

				utils
					.waitForElement('[data-infocase="appointment_time"]', 5000)
					.then(() => saveQplusData())
					.catch(() =>
						console.warn(
							"Could not auto-save on load: Date elements not found.",
						),
					);
			},

			adwords() {
				utils.addStyle(
					"aw-styles",
					`
                .aw-ga4 { background-color: #FEF3D6; color: #B07505; border: 1px solid rgba(176,117,5,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; }
                .aw-ads { background-color: #E2F5E9; color: #1E7F4E; border: 1px solid rgba(30,127,78,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; }
                .aw-copied { background-color: #3B72E6 !important; color: white !important; border-color: transparent !important; }
                #gpt-aw-container { position: fixed; bottom: 20px; left: 20px; z-index: 999; display: flex; flex-direction: column; gap: 8px; }
                .gpt-aw-badge { padding: 8px 14px; background: #161920; color: #F1F3F5; border: 1px solid #2D323F; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: monospace; box-shadow: 0 4px 16px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s ease; user-select: none; }
                .gpt-aw-badge:hover { background: #2D323F; }
              `,
				);

				let processAdwordsData = (rawData) => {
					let matches = [...rawData.matchAll(/AW-(\d+)/g)];
					let uniqueIds = [...new Set(matches.map((m) => m[1]))];

					if (uniqueIds.length > 0) {
						let container =
							utils.$("#gpt-aw-container") ||
							utils.createEl("div", {
								id: "gpt-aw-container",
								parent: document.body,
							});
						container.innerHTML = "";

						uniqueIds.forEach((idStr) => {
							let badge = utils.createEl("div", {
								className: "gpt-aw-badge",
								parent: container,
							});
							badge.textContent = `AW-${idStr}`;
							utils.setupCopy(badge, idStr, "Copied!");
						});
					}

					document
						.querySelectorAll(".expand-more")
						.forEach((el) => el.click());

					try {
						let parsed = JSON.parse(rawData);
						if (!parsed || !parsed[1]) return;

						let dataMap = new Map(
							parsed[1].map((item) => [item[1], item]),
						);

						setTimeout(() => {
							document
								.querySelectorAll(
									".conversion-name-cell .internal",
								)
								.forEach((cell) => {
									let row = cell.closest(
										".particle-table-row",
									);
									if (
										row &&
										!row
											.querySelector(
												'[essfield="aggregated_conversion_source"]',
											)
											?.innerText?.toLowerCase()
											.includes("web")
									) {
										return row.remove();
									}

									let mappedData = dataMap.get(
										cell.innerText,
									);
									if (!mappedData) return;

									let type = null;
									let convId = null;

									if (mappedData[11] === 1) {
										type = "aw-ads";
										convId = mappedData[64]?.[2]?.[4]
											?.split("'")?.[7]
											?.split("/")?.[1];
									} else if (mappedData[11] === 32) {
										type = "aw-ga4";
										convId =
											mappedData[64]?.[1]?.[4]?.split(
												"'",
											)?.[3];
									}

									if (type && convId) {
										cell.innerHTML = convId;
										cell.classList.add(type);
										utils.setupCopy(cell, convId);
									}
								});

							document
								.querySelectorAll(
									"category-conversions-container-view, conversion-goal-card",
								)
								.forEach((card) => {
									if (
										!card.querySelector(
											".particle-table-row",
										)
									) {
										card.style.display = "none";
									}
								});
						}, 1200);
					} catch (err) {
						console.error("Adwords Data parsing failed", err);
					}
				};

				let initAdwords = (attempts = 0) => {
					let data =
						window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS;
					if (data) return processAdwordsData(data);
					if (attempts < 5)
						setTimeout(() => initAdwords(attempts + 1), 600);
				};

				if (["complete", "interactive"].includes(document.readyState)) {
					initAdwords();
				} else {
					window.addEventListener("DOMContentLoaded", () =>
						initAdwords(),
					);
				}
			},
		};

		// Main Router
		let currentUrl = window.location.href;
		if (currentUrl.includes("casemon2.corp")) features.casemon();
		else if (currentUrl.includes("cases.connect")) features.casesConnect();
		else if (currentUrl.includes("adwords.corp")) features.adwords();
	})();
})();
