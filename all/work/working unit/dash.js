(function () {
	"use strict";

	// ==========================================
	// 1. SHARED UTILITIES
	// ==========================================
	const Utils = {
		sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

		debounce: (func, wait) => {
			let timeout;
			return (...args) => {
				clearTimeout(timeout);
				timeout = setTimeout(() => func(...args), wait);
			};
		},

		pollForCondition: async (
			conditionFn,
			interval = 500,
			maxAttempts = 10,
		) => {
			for (let i = 0; i < maxAttempts; i++) {
				if (conditionFn()) return true;
				await Utils.sleep(interval);
			}
			return false;
		},

		$: (selector, parent = document) => parent.querySelector(selector),

		$$: (selector, parent = document) =>
			Array.from(parent.querySelectorAll(selector)),

		createEl: (
			tag,
			{
				parent,
				onClick,
				className,
				id,
				html,
				text,
				style,
				...props
			} = {},
		) => {
			const el = document.createElement(tag);
			if (id) el.id = id;
			if (className) el.className = className;
			if (text !== undefined) el.textContent = text;
			if (html !== undefined) el.innerHTML = html;
			if (style) {
				if (typeof style === "string") {
					el.style.cssText = style;
				} else {
					Object.assign(el.style, style);
				}
			}
			if (onClick) el.addEventListener("click", onClick);

			for (const [key, value] of Object.entries(props)) {
				if (key.startsWith("on") && typeof value === "function") {
					el[key] = value;
				} else if (key.startsWith("data-")) {
					el.setAttribute(key, value);
				} else {
					el[key] = value;
				}
			}
			if (parent) parent.appendChild(el);
			return el;
		},

		addStyle: (id, cssText) => {
			if (document.getElementById(id)) return;
			const styleEl = document.createElement("style");
			styleEl.id = id;

			const policy = window.trustedTypes?.createPolicy("default", {
				createHTML: (e) => e,
			}) ?? { createHTML: (e) => e };

			styleEl.textContent = policy.createHTML(cssText);
			document.head.appendChild(styleEl);
		},

		waitForElement: (selector, timeout = 5000) => {
			return new Promise((resolve, reject) => {
				const el = Utils.$(selector);
				if (el) return resolve(el);

				const observer = new MutationObserver((_, obs) => {
					const foundEl = Utils.$(selector);
					if (foundEl) {
						obs.disconnect();
						resolve(foundEl);
					}
				});
				observer.observe(document.body, {
					childList: true,
					subtree: true,
				});

				setTimeout(() => {
					observer.disconnect();
					reject(new Error(`Timeout waiting for: ${selector}`));
				}, timeout);
			});
		},

		setupCopy: (element, text, successMsg = "✓ Copied!") => {
			let timeout;
			element.addEventListener("click", async () => {
				try {
					await navigator.clipboard.writeText(text);
					element.dataset.origText =
						element.dataset.origText || element.textContent;
					element.textContent = successMsg;
					element.classList.add("aw-copied");
					clearTimeout(timeout);
					timeout = setTimeout(() => {
						element.textContent = element.dataset.origText;
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

	// ==========================================
	// 4. FEATURE: CASEMON
	// ==========================================
	class CaseMon {
		static isRunning = false;

		static init() {
			if (CaseMon.isRunning) return;
			CaseMon.isRunning = true;
			Utils.$('[aria-selected="false"]')?.click();

			const iconBase = "https://cdn-icons-png.flaticon.com/512";
			const config = {
				uiId: "bento_agent_ui",
				target: ".agent-table-container",
				statusConfig: {
					active: {
						color: "#34C759",
						track: "rgba(52, 199, 89, 0.15)",
						maxSecs: 3600,
					},
					phone: {
						color: "#FF3B30",
						track: "rgba(255, 59, 48, 0.15)",
						maxSecs: 2700,
					},
					video: {
						color: "#AF52DE",
						track: "rgba(175, 82, 222, 0.15)",
						maxSecs: 2700,
					},
					email: {
						color: "#0071E3",
						track: "rgba(0, 113, 227, 0.15)",
						maxSecs: 900,
					},
					"coffee-break": {
						color: "#FF9500",
						track: "rgba(255, 149, 0, 0.15)",
						maxSecs: 900,
					},
					"lunch-break": {
						color: "#FFCC00",
						track: "rgba(255, 204, 0, 0.15)",
						maxSecs: 3600,
					},
					break: {
						color: "#8E8E93",
						track: "rgba(142, 142, 147, 0.15)",
						maxSecs: 900,
					},
					default: {
						color: "#8E8E93",
						track: "rgba(142, 142, 147, 0.15)",
						maxSecs: 2700,
					},
				},
				icons: {
					video: {
						src: `${iconBase}/9571/9571236.png`,
						animation: "breathe",
					},
					"coffee-break": {
						src: `${iconBase}/16108/16108931.png`,
						animation: "rock",
					},
					"lunch-break": {
						src: `${iconBase}/1182/1182132.png`,
						animation: "bounce-y",
					},
					phone: {
						src: `${iconBase}/13332/13332839.png`,
						animation: "ring",
					},
					email: {
						src: `${iconBase}/7487/7487055.png`,
						animation: "fly",
					},
					break: {
						src: `${iconBase}/5140/5140652.png`,
						animation: "fade-pulse",
					},
					close: `${iconBase}/9403/9403346.png`,
					non_phone: `${iconBase}/17720/17720299.png`,
					non_video: `${iconBase}/11305/11305490.png`,
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

			const targetContainer = Utils.$(config.target);
			if (!targetContainer) {
				CaseMon.isRunning = false;
				return;
			}

			const currentUserName =
				Utils.$("[alt='profile photo']")?.src?.match(
					/photos\/([^/?]+)/,
				)?.[1] ?? "Unknown";

			Utils.addStyle(
				"bento-dash-styles",
				`
                #bento_agent_ui { 
                position: fixed; height: 100%; width: 100%; top: 0; right: 0; 
                background-color: rgba(0, 0, 0, 0.45);
                z-index: 9999; display: flex; justify-content: flex-end; align-items: center; padding: 24px; 
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", sans-serif; 
                pointer-events: none; box-sizing: border-box; 
                }
                .bento-wrapper { 
                position: relative; pointer-events: auto; width: 100%; max-width: 320px; 
                background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
                border-radius: 20px; box-shadow: 0 16px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.02); 
                padding: 20px; border: 1px solid rgba(255, 255, 255, 0.8); color: #1D1D1F; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
                }
                .close-btn { 
                position: absolute; top: -10px; right: -10px; background: rgba(255, 255, 255, 0.9); 
                backdrop-filter: blur(10px); border: 1px solid rgba(0,0,0,0.06); cursor: pointer; z-index: 20; 
                border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); 
                }
                .close-btn:hover { background: #FFFFFF; transform: scale(1.08); }
                .close-btn img { width: 11px; height: 11px; opacity: 0.6; }
                .bento-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
                .bento-card { background: transparent; display: flex; flex-direction: column; }
                .agent-list-header { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
                .agent-list-header h3 { margin: 0; font-size: 11px; color: #86868B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; justify-content: space-between; }
                .header-counters { display: flex; gap: 6px; justify-content: flex-start; width: 100%; }
                .agent-count { font-size: 10px; padding: 3px 8px; border-radius: 9999px; font-weight: 600; white-space: nowrap; }
                .active-badge { background: rgba(52, 199, 89, 0.12); color: #248A3D; border: 1px solid rgba(52, 199, 89, 0.2); }
                .phone-badge { background: rgba(255, 59, 48, 0.12); color: #D70015; border: 1px solid rgba(255, 59, 48, 0.2); }
                .break-badge { background: rgba(255, 149, 0, 0.12); color: #C77000; border: 1px solid rgba(255, 149, 0, 0.2); }
                .total-badge { background: rgba(142, 142, 147, 0.12); color: #636366; border: 1px solid rgba(142, 142, 147, 0.2); }
                .health-warning { animation: pulseHealth 2.5s infinite; border-color: rgba(255, 59, 48, 0.6); box-shadow: 0 0 20px rgba(255, 59, 48, 0.2); }
                @keyframes pulseHealth { 0%, 100% { border-color: rgba(255, 255, 255, 0.8); } 50% { border-color: rgba(255, 59, 48, 0.6); } }
                .health-text { font-size: 10px; color: #FF3B30; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                .agent-list-container { max-height: 72vh; overflow-y: auto; padding: 2px; display: flex; flex-direction: column; gap: 10px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 12px; }
                .status-group-block { display: flex; width: 100%; gap: 10px; align-items: flex-start; }
                .status-inline-label { width: 50px; min-width: 35px; text-align: left; font-size: 9px; font-weight: 700; color: #86868B; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 4px; border-left: 2px solid rgba(0,0,0,0.1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
                .status-inline-label.user-label { color: #0071E3; border-left-color: #0071E3; background: rgba(0, 113, 227, 0.08); border-radius: 0 4px 4px 0; }
                .status-rows-stack { flex-grow: 1; display: flex; flex-direction: column; gap: 6px; }
                .agent-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 12px; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 2px 6px rgba(0,0,0,0.02); position: relative; background-clip: padding-box; border: 1px solid rgba(255, 255, 255, 0.6); z-index: 1; }
                .agent-row:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .agent-row::before { content: ''; position: absolute; inset: 0; border-radius: 12px; padding: 1.5px; margin: -1.5px; background: conic-gradient(var(--st-color) var(--progress), var(--st-track) var(--progress)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; z-index: -1; }
                @keyframes pulseWarning { 0%, 100% { filter: drop-shadow(0 0 2px var(--st-color)); } 50% { filter: drop-shadow(0 0 8px var(--st-color)); } }
                .agent-row.over-time::before { animation: pulseWarning 1.5s infinite ease-in-out; }

                @keyframes bgIconFloat { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; } 50% { transform: translateY(-2px) scale(1.1); opacity: 0.3; } }
                .row-bg-icons { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: flex; gap: 8px; pointer-events: none; z-index: 0; }
                .row-bg-icons img { width: 22px; height: 22px; object-fit: contain; opacity: 0.15; animation: bgIconFloat 3s infinite ease-in-out; }
                .row-bg-icons img:nth-child(2) { animation-delay: 1.5s; }

                /* 1. LDAP Display: Clean, high-legibility UI text font */
                .agent-left { position: relative; z-index: 1; display: flex; align-items: center; gap: 8px; }
                .agent-left span { 
                    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    font-size: 12px; 
                    font-weight: 600; 
                    letter-spacing: 0.25px; 
                    color: #1D1D1F; 
                }
                .agent-avatar { width: 26px; height: 26px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(0,0,0,0.05); }
                .agent-right { position: relative; z-index: 1; display: flex; align-items: center; gap: 10px; text-align: right; }
                .agent-meta { display: flex; flex-direction: column; }

                /* 2. Time Display: High-precision tabular monospace font for clear numeric comparison */
                .time-state { 
                    font-family: "SF Mono", "Roboto Mono", "Consolas", "Menlo", "Courier New", monospace; 
                    font-size: 10px; 
                    font-weight: 500; 
                    opacity: 0.85; 
                    font-variant-numeric: tabular-nums; 
                    letter-spacing: -0.2px; 
                }
                .time-in-state { display: inline; }

                /* 3. Status & Pool: Distinct styled UI display font */
                .status-text { 
                    font-family: "SF Pro Display", "Trebuchet MS", "Avenir Next", system-ui, sans-serif; 
                    font-size: 10px; 
                    font-weight: 700; 
                    letter-spacing: 0.35px; 
                    display: inline-block; 
                    margin-top: 1px; 
                }
                .agent-right > img { width: 18px; height: 18px; opacity: 0.85; }

                .stt-active { background: rgba(230, 248, 236, 0.7); color: #064E3B; } .stt-active .status-text { color: #248A3D; }
                .stt-phone { background: rgba(254, 238, 238, 0.7); color: #7F1D1D; } .stt-phone .status-text { color: #D70015; }
                .stt-video { background: rgba(245, 235, 255, 0.7); color: #4C1D95; } .stt-video .status-text { color: #8944AB; }
                .stt-email { background: rgba(230, 242, 255, 0.7); color: #0C4A6E; } .stt-email .status-text { color: #0071E3; }
                .stt-coffee-break { background: rgba(255, 244, 230, 0.7); color: #78350F; } .stt-coffee-break .status-text { color: #C77000; }
                .stt-lunch-break { background: rgba(255, 250, 230, 0.7); color: #713F12; } .stt-lunch-break .status-text { color: #A16207; }
                .stt-break { background: rgba(242, 242, 247, 0.7); color: #374151; } .stt-break .status-text { color: #636366; }

                [animation="breathe"] { animation: breathe 2s infinite ease-in-out; }
                @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.15); opacity: 1; } }
                [animation="rock"] { animation: rock 3s infinite ease-in-out; transform-origin: bottom center; }
                @keyframes rock { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } }
                [animation="bounce-y"] { animation: bounce-y 1.5s infinite ease-in-out; }
                @keyframes bounce-y { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
                [animation="ring"] { animation: ring 2s infinite ease-in-out; }
                @keyframes ring { 0%, 100% { transform: rotate(0); } 10%, 30%, 50% { transform: rotate(12deg); } 20%, 40%, 60% { transform: rotate(-12deg); } 70% { transform: rotate(0); } }
                [animation="fly"] { animation: fly 2.5s infinite ease-in-out; }
                @keyframes fly { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(3px, -3px); } }
                [animation="fade-pulse"] { animation: fade-pulse 3s infinite ease-in-out; }
                @keyframes fade-pulse { 0%, 100% { opacity: 0.4; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } }

                .agent-list-container::-webkit-scrollbar { width: 4px; }
                .agent-list-container::-webkit-scrollbar-track { background: transparent; }
                .agent-list-container::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
                @media screen and (max-width: 380px) { .status-inline-label { display: none !important; } }
                @media screen and (max-width: 320px) { .header-counters { display: none !important; } .agent-list-header h3 { margin-bottom: 0; } }
                @media screen and (max-width: 280px) { .agent-avatar { display: none !important; } }
                @media screen and (max-width: 240px) { .agent-right > img { display: none !important; } }
                @media screen and (max-width: 220px) { .time-in-state { display: none !important; } }
            `,
			);

			const uiContainer =
				document.getElementById(config.uiId) ||
				Utils.createEl("div", {
					id: config.uiId,
					parent: document.body,
				});

			let lastHtml = "";
			const textRegex = /[a-zA-Z\s]+/;
			const timeRegex = /\d+[hms]/g;

			const parseTime = (timeStr) =>
				(timeStr.match(timeRegex) || []).reduce(
					(acc, curr) =>
						acc +
						parseInt(curr, 10) *
							({ h: 3600, m: 60, s: 1 }[curr.slice(-1)] || 0),
					0,
				);

			const updateDashboard = () => {
				try {
					let parsedAgents = Array.from(
						targetContainer.querySelectorAll("tbody tr"),
					)
						.map((row) => {
							let cells = row.querySelectorAll("td");
							if (!cells || cells.length < 10) return null;

							let rawStatus1 = (
								cells[5]?.innerText.match(textRegex)?.[0] || ""
							)
								.trim()
								.toLowerCase()
								.replace(/\s+/g, "-");
							let rawStatus2 = (
								cells[8]?.innerText.match(textRegex)?.[0] || ""
							)
								.trim()
								.toLowerCase()
								.replace(/\s+/g, "-");
							let displayStatus =
								cells[3]?.innerText.trim() || "";
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

							let pool10 = cells[10]?.innerText.trim() || "";
							let pool13 = cells[13]?.innerText.trim() || "";
							let combinedPool = `${pool10},${pool13}`;

							let poolDisplay = "";
							if (combinedPool.includes("3004773")) {
								poolDisplay = "BAU";
							} else if (
								combinedPool.includes("3028872") ||
								combinedPool.includes("3014937")
							) {
								poolDisplay = "LM";
							}

							return {
								img: row.querySelector("img")?.src || "",
								ldap: cells[1]?.innerText.trim() || "",
								timeInState: cells[4]?.innerText.trim() || "",
								lastChangeRaw: cells[9]?.innerText.trim() || "",
								displayStatus,
								statusKey,
								cssClass: `stt-${statusKey}`,
								durationSeconds: parseTime(
									cells[9]?.innerText || "",
								),
								poolDisplay,
								rawStatus1,
								rawStatus2,
							};
						})
						.filter(Boolean)
						.sort((a, b) => {
							// 1. Current user always on top
							let aIsUser = a.ldap === currentUserName;
							let bIsUser = b.ldap === currentUserName;
							if (aIsUser !== bIsUser) return bIsUser - aIsUser;

							// 2. Status Priority
							let aPriority =
								config.priorities[a.statusKey] ??
								config.priorities.default;
							let bPriority =
								config.priorities[b.statusKey] ??
								config.priorities.default;
							if (aPriority !== bPriority)
								return aPriority - bPriority;

							// 3. Pool Sort (LM first, BAU second, others last)
							const getPoolRank = (pool) => {
								if (pool === "LM") return 1;
								if (pool === "BAU") return 2;
								return 3;
							};
							let aPoolRank = getPoolRank(a.poolDisplay);
							let bPoolRank = getPoolRank(b.poolDisplay);
							if (aPoolRank !== bPoolRank)
								return aPoolRank - bPoolRank;

							// 4. Duration Seconds descending
							return b.durationSeconds - a.durationSeconds;
						});

					console.log("Parsed Agents:", parsedAgents);

					let activeCount = parsedAgents.filter(
						(a) => a.statusKey === "active",
					).length;
					let callCount = parsedAgents.filter((a) =>
						["phone", "video"].includes(a.statusKey),
					).length;
					let breakCount = parsedAgents.filter(
						(a) =>
							!["phone", "video", "active"].includes(a.statusKey),
					).length;
					let totalCount = parsedAgents.length;
					let isLowAvailability =
						(totalCount > 0 ? activeCount / totalCount : 0) < 0.2 &&
						totalCount > 0;

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

						if (!currentGroup || currentGroup.label !== label) {
							currentGroup = { label, isUser, rows: [] };
							groups.push(currentGroup);
						}
						currentGroup.rows.push(agent);
					});

					let groupsHtml = groups
						.map((group) => {
							let rowsHtml = group.rows
								.map((agent) => {
									let icon = config.icons[agent.statusKey];
									let stConf =
										config.statusConfig[agent.statusKey] ||
										config.statusConfig.default;
									let maxSecs = stConf.maxSecs || 2700;
									let progressPct = Math.min(
										(agent.durationSeconds / maxSecs) * 100,
										100,
									).toFixed(1);
									let isOverTime =
										agent.durationSeconds >= maxSecs;
									let styleVars = `--progress: ${progressPct}%; --st-color: ${stConf.color}; --st-track: ${stConf.track};`;

									let isActive = agent.statusKey === "active";
									let nonPhoneImg =
										agent.rawStatus1 === "busy" && isActive
											? `<img src="${config.icons.non_phone}" alt="non_phone" loading="lazy" />`
											: "";
									let nonVideoImg =
										agent.rawStatus2 === "busy" && isActive
											? `<img src="${config.icons.non_video}" alt="non_video" loading="lazy" />`
											: "";

									let bgIconsContainer =
										nonPhoneImg || nonVideoImg
											? `<div class="row-bg-icons">${nonPhoneImg}${nonVideoImg}</div>`
											: "";

									let poolText = agent.poolDisplay
										? ` (${Utils.escapeHtml(agent.poolDisplay)})`
										: "";

									return `
                        <div class="agent-row ${agent.cssClass} ${isOverTime ? "over-time" : ""}" style="${styleVars}">
                            ${bgIconsContainer}
                            <div class="agent-left">
                                <img class="agent-avatar" src="${Utils.escapeHtml(agent.img)}" alt="${Utils.escapeHtml(agent.ldap)}" loading="lazy" />
                                <span>${Utils.escapeHtml(agent.ldap)}</span>
                            </div>
                            <div class="agent-right">
                                <div class="agent-meta">
                                    <span class="time-state">${Utils.escapeHtml(agent.lastChangeRaw)} <span class="time-in-state">(${Utils.escapeHtml(agent.timeInState)})</span></span>
                                    <span class="status-text">${Utils.escapeHtml(agent.displayStatus)}${poolText}</span>
                                </div>
                                ${icon ? `<img src="${icon.src}" animation="${icon.animation}" alt="${agent.statusKey} icon" loading="lazy" />` : ""}
                            </div>
                        </div>`;
								})
								.join("");

							return `
                <div class="status-group-block">
                    <div class="status-inline-label ${group.isUser ? "user-label" : ""}">${Utils.escapeHtml(group.label)}</div>
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

			const observer = new MutationObserver(
				Utils.debounce(updateDashboard, 150),
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
					CaseMon.isRunning = false;
					observer.disconnect();
				}
			});

			updateDashboard();
		}
	}

	// ==========================================
	// 7. ROUTER & INITIALIZATION
	// ==========================================
	const AppRouter = {
		routes: [
			{ pattern: "casemon2.corp", run: () => CaseMon.init() },
			{ pattern: "cases.connect", run: () => CasesConnect.init() },
			{ pattern: "adwords.corp", run: () => AdWords.init() },
			{ pattern: "chrome-extension://", run: () => QPlusAutomator.run() },
		],

		init() {
			const currentUrl = window.location.href;
			const matchedRoute = this.routes.find((r) =>
				currentUrl.includes(r.pattern),
			);

			if (matchedRoute) {
				matchedRoute.run();
			} else {
				TagInspector.init();
			}
		},
	};

	if (["complete", "interactive"].includes(document.readyState)) {
		AppRouter.init();
	} else {
		window.addEventListener("DOMContentLoaded", () => AppRouter.init());
	}
})();
