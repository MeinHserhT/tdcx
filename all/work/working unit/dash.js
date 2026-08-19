(function () {
	"use strict";

	// ==========================================
	// 1. SHARED UTILITIES
	// ==========================================
	let safePolicy;

	const Utils = {
		sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

		debounce: (fn, wait) => {
			let timer;
			return (...args) => {
				clearTimeout(timer);
				timer = setTimeout(() => fn(...args), wait);
			};
		},

		pollForCondition: async (
			predicate,
			interval = 500,
			maxAttempts = 10,
		) => {
			for (let i = 0; i < maxAttempts; i++) {
				if (predicate()) return true;
				await Utils.sleep(interval);
			}
			return false;
		},

		$: (selector, parent = document) => parent.querySelector(selector),
		$$: (selector, parent = document) =>
			Array.from(parent.querySelectorAll(selector)),

		toSafeHTML: (str) => {
			if (!safePolicy) {
				if (window.trustedTypes?.createPolicy) {
					try {
						safePolicy = window.trustedTypes.createPolicy(
							"default",
							{ createHTML: (s) => s },
						);
					} catch {
						safePolicy = window.trustedTypes.defaultPolicy || {
							createHTML: (s) => s,
						};
					}
				} else {
					safePolicy = { createHTML: (s) => s };
				}
			}
			return safePolicy ? safePolicy.createHTML(str) : str;
		},

		createEl: (
			tag,
			{
				parent,
				onClick,
				style,
				text,
				html,
				className,
				id,
				...props
			} = {},
		) => {
			const el = document.createElement(tag);
			if (id) el.id = id;
			if (className) el.className = className;
			if (text !== undefined) el.textContent = text;
			if (html !== undefined) el.innerHTML = Utils.toSafeHTML(html);
			if (style) {
				typeof style === "string"
					? (el.style.cssText = style)
					: Object.assign(el.style, style);
			}
			if (onClick) el.addEventListener("click", onClick);

			Object.entries(props).forEach(([key, value]) => {
				if (key.startsWith("on") && typeof value === "function")
					el[key] = value;
				else if (key.startsWith("data-")) el.setAttribute(key, value);
				else el[key] = value;
			});

			if (parent) parent.appendChild(el);
			return el;
		},

		addStyle: (id, cssText) => {
			if (document.getElementById(id)) return;
			const styleEl = document.createElement("style");
			styleEl.id = id;
			styleEl.textContent = Utils.toSafeHTML(cssText);
			document.head.appendChild(styleEl);
		},

		waitForElement: (selector, timeout = 5000) =>
			new Promise((resolve, reject) => {
				const existing = Utils.$(selector);
				if (existing) return resolve(existing);

				const observer = new MutationObserver((_, obs) => {
					const el = Utils.$(selector);
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
					reject(new Error(`Timeout waiting for: ${selector}`));
				}, timeout);
			}),

		setupCopy: (element, text, successMsg = "✓ Copied!") => {
			let timer;
			element.addEventListener("click", async () => {
				try {
					await navigator.clipboard.writeText(text);
					element.dataset.origText =
						element.dataset.origText || element.textContent;
					element.textContent = successMsg;
					element.classList.add("aw-copied");
					clearTimeout(timer);
					timer = setTimeout(() => {
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
				(ch) =>
					({
						"&": "&amp;",
						"<": "&lt;",
						">": "&gt;",
						'"': "&quot;",
						"'": "&#039;",
					})[ch],
			),
	};

	// ==========================================
	// 4. FEATURE: CASEMON (OPTIMIZED IN-PLACE DOM RECONCILIATION)
	// ==========================================
	class CaseMon {
		static isRunning = false;
		static observer = null;
		static currentLayout = "full";
		static updateFn = null;

		static init() {
			if (CaseMon.isRunning) return;
			CaseMon.isRunning = true;
			Utils.$('[aria-selected="false"]')?.click();

			const iconBase = "https://cdn-icons-png.flaticon.com/512";
			const config = {
				uiId: "cm-root",
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
				poolRanks: { LM: 1, BAU: 2 },
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

			// Permission Check: only vongoc has admin layout toggle privileges
			const isAdmin = currentUserName.toLowerCase() === "vongoc";
			CaseMon.currentLayout = isAdmin ? "simplicity" : "full";

			Utils.addStyle(
				"cm-styles",
				`
	@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap');
	#cm-root, #cm-root * { box-sizing: border-box; font-family: "Lexend", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
	#cm-root { position: fixed; height: 100%; width: 100%; top: 0; right: 0; background-color: rgba(0, 0, 0, 0.45); z-index: 9999; display: flex; justify-content: flex-end; align-items: center; padding: 20px; pointer-events: none; }
	#cm-root .cm-wrap { position: relative; pointer-events: auto; width: 100%; max-width: 320px; background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-radius: 20px; box-shadow: 0 16px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.02); padding: 16px; border: 1px solid rgba(255, 255, 255, 0.8); color: #1D1D1F; transition: max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
	#cm-root .cm-wrap.cm-full { max-width: 400px; }
	#cm-root .cm-close { position: absolute; top: -10px; right: -10px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(0,0,0,0.06); cursor: pointer; z-index: 20; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
	#cm-root .cm-close:hover { background: #FFFFFF; transform: scale(1.08); }
	#cm-root .cm-close img { width: 11px; height: 11px; opacity: 0.6; }
	#cm-root .cm-grid, #cm-root .cm-card { display: flex; flex-direction: column; width: 100%; }
	#cm-root .cm-head { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; width: 100%; }
	#cm-root .cm-head-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; }
	#cm-root .cm-head h3 { margin: 0; font-size: 11px; color: #86868B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; gap: 6px; }
	#cm-root .cm-toggle { padding: 3px 9px; font-size: 10px; font-weight: 600; cursor: pointer; border: 1px solid rgba(0,0,0,0.1); border-radius: 9999px; background: rgba(255, 255, 255, 0.85); color: #1D1D1F; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.04); white-space: nowrap; }
	#cm-root .cm-toggle:hover { background: #FFFFFF; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
	#cm-root .cm-toggle:active { transform: scale(0.96); }
	#cm-root .cm-stats { display: flex; gap: 5px; justify-content: flex-start; align-items: center; width: 100%; }
	#cm-root .cm-pill { font-size: 9.5px; padding: 2px 7px; border-radius: 9999px; font-weight: 600; white-space: nowrap; }
	#cm-root .badge-act { background: rgba(52, 199, 89, 0.12); color: #248A3D; border: 1px solid rgba(52, 199, 89, 0.2); }
	#cm-root .badge-phn { background: rgba(255, 59, 48, 0.12); color: #D70015; border: 1px solid rgba(255, 59, 48, 0.2); }
	#cm-root .badge-brk { background: rgba(255, 149, 0, 0.12); color: #C77000; border: 1px solid rgba(255, 149, 0, 0.2); }
	#cm-root .badge-tot { background: rgba(142, 142, 147, 0.12); color: #636366; border: 1px solid rgba(142, 142, 147, 0.2); }
	#cm-root .cm-warn { animation: pulseHealth 2.5s infinite; border-color: rgba(255, 59, 48, 0.6); box-shadow: 0 0 20px rgba(255, 59, 48, 0.2); }
	@keyframes pulseHealth { 0%, 100% { border-color: rgba(255, 255, 255, 0.8); } 50% { border-color: rgba(255, 59, 48, 0.6); } }
	#cm-root .cm-warn-txt { font-size: 9.5px; color: #FF3B30; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

	#cm-root .cm-cols { display: flex; width: 100%; gap: 8px; align-items: center; padding: 0 2px 4px 2px; box-sizing: border-box; }
	#cm-root .col-spacer { width: 54px; min-width: 54px; flex-shrink: 0; }
	#cm-root .col-grid { flex-grow: 1; display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(56px, auto) minmax(56px, auto) minmax(20px, auto); gap: 6px; padding: 0 10px; font-size: 8.5px; font-weight: 700; color: #86868B; text-transform: uppercase; letter-spacing: 0.4px; }
	#cm-root .col-grid span { text-align: center; display: flex; align-items: center; justify-content: center; }

	#cm-root .cm-list { max-height: 72vh; overflow-y: auto; overflow-x: hidden; padding: 2px; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 10px; width: 100%; }
	#cm-root .cm-group { display: flex; width: 100%; gap: 8px; align-items: flex-start; }
	#cm-root .grp-lbl { flex-shrink: 0; width: 54px; text-align: left; font-size: 8.5px; font-weight: 700; color: #86868B; text-transform: uppercase; letter-spacing: 0.3px; padding: 5px 2px; border-left: 2px solid rgba(0,0,0,0.1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
	#cm-root .grp-lbl.is-me { color: #0071E3; border-left-color: #0071E3; background: rgba(0, 113, 227, 0.08); border-radius: 0 3px 3px 0; }
	#cm-root .grp-stack { flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
	#cm-root .cm-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-radius: 12px; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 2px 6px rgba(0,0,0,0.02); position: relative; background-clip: padding-box; border: 1px solid rgba(255, 255, 255, 0.6); z-index: 1; width: 100%; min-width: 0; }
	#cm-root .cm-row.is-full { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(56px, auto) minmax(56px, auto) minmax(20px, auto); gap: 6px; padding: 6px 10px; }
	#cm-root .cm-row:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
	#cm-root .cm-row::before { content: ''; position: absolute; inset: 0; border-radius: 12px; padding: 1.5px; margin: -1.5px; background: conic-gradient(var(--st-color) var(--progress), var(--st-track) var(--progress)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; z-index: -1; }
	@keyframes pulseWarning { 0%, 100% { filter: drop-shadow(0 0 2px var(--st-color)); } 50% { filter: drop-shadow(0 0 8px var(--st-color)); } }
	#cm-root .cm-row.is-over::before { animation: pulseWarning 1.5s infinite ease-in-out; }
	
	#cm-root .row-left { position: relative; z-index: 1; display: flex; align-items: center; gap: 8px; min-width: 0; flex-shrink: 1; }
	#cm-root .row-left span, #cm-root .row-left .row-name { font-size: 11.5px; font-weight: 600; letter-spacing: 0.2px; color: #1D1D1F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	#cm-root .row-info { display: flex; flex-direction: column; min-width: 0; overflow: hidden; justify-content: center; }
	#cm-root .row-avatar { width: 24px; height: 24px; min-width: 24px; border-radius: 7px; object-fit: cover; border: 1px solid rgba(0,0,0,0.05); flex-shrink: 0; }
	#cm-root .row-right { position: relative; z-index: 1; display: flex; align-items: center; gap: 6px; text-align: right; flex-shrink: 0; }
	#cm-root .row-meta { display: flex; flex-direction: column; text-align: right; }
	#cm-root .row-col { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: center; text-align: center; min-width: 0; }
	
	#cm-root .row-time { font-size: 11px; font-weight: 600; color: #1D1D1F; opacity: 0.95; font-variant-numeric: tabular-nums; letter-spacing: -0.2px; line-height: 1.2; white-space: nowrap; }
	#cm-root .row-subtime { display: inline; }
	
	/* Status text explicitly rendered with Inter */
	#cm-root .row-status,
	#cm-root .row-info .row-status {
		font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.25px;
		display: inline-block;
		margin-top: 1px;
		line-height: 1.2;
	}
	#cm-root .row-info .row-status { font-size: 9px; margin-top: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	
	#cm-root .row-right img, #cm-root .row-ico img { width: 16px; height: 16px; min-width: 16px; max-width: 16px; max-height: 16px; object-fit: contain; opacity: 0.85; display: block; flex-shrink: 0; }
	#cm-root .row-ico { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 4px; min-width: 20px; flex-shrink: 0; }
	#cm-root .st-active { background: rgba(230, 248, 236, 0.7); color: #064E3B; } #cm-root .st-active .row-status { color: #248A3D; }
	#cm-root .st-phone { background: rgba(254, 238, 238, 0.7); color: #7F1D1D; } #cm-root .st-phone .row-status { color: #D70015; }
	#cm-root .st-video { background: rgba(245, 235, 255, 0.7); color: #4C1D95; } #cm-root .st-video .row-status { color: #8944AB; }
	#cm-root .st-email { background: rgba(230, 242, 255, 0.7); color: #0C4A6E; } #cm-root .st-email .row-status { color: #0071E3; }
	#cm-root .st-coffee-break { background: rgba(255, 244, 230, 0.7); color: #78350F; } #cm-root .st-coffee-break .row-status { color: #C77000; }
	#cm-root .st-lunch-break { background: rgba(255, 250, 230, 0.7); color: #713F12; } #cm-root .st-lunch-break .row-status { color: #A16207; }
	#cm-root .st-break { background: rgba(242, 242, 247, 0.7); color: #374151; } #cm-root .st-break .row-status { color: #636366; }
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
	#cm-root .cm-list::-webkit-scrollbar { width: 4px; }
	#cm-root .cm-list::-webkit-scrollbar-track { background: transparent; }
	#cm-root .cm-list::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
	@media screen and (max-width: 380px) { #cm-root .grp-lbl { display: none !important; } }
	@media screen and (max-width: 320px) { #cm-root .cm-stats { display: none !important; } #cm-root .cm-head h3 { margin-bottom: 0; } }
	@media screen and (max-width: 280px) { #cm-root .row-info { display: none !important; } }
	@media screen and (max-width: 240px) { #cm-root .row-right img, #cm-root .row-ico img { display: none !important; } }
	@media screen and (max-width: 220px) { #cm-root .row-subtime { display: none !important; } }
	`,
			);

			const uiContainer =
				Utils.$(`#${config.uiId}`) ||
				Utils.createEl("div", {
					id: config.uiId,
					parent: document.body,
				});

			if (!uiContainer.querySelector(".cm-wrap")) {
				const isFull = CaseMon.currentLayout === "full";
				const toggleBtnHtml = isAdmin
					? `<button class="cm-toggle" id="cm-layout-toggle" title="Switch layout">
                        ${isFull ? "Layout: Full" : "Layout: Simple"}
                    </button>`
					: "";

				const skeletonHtml = `
        <div class="cm-wrap ${isFull ? "cm-full" : ""}" id="cm-wrap-shell">
            <button class="cm-close" title="Close"><img src="${config.icons.close}" alt="Close"/></button>
            <div class="cm-grid">
                <div class="cm-card">
                    <div class="cm-head">
                        <div class="cm-head-top">
                            <h3>
                                <span>Team Status</span>
                                <span class="cm-warn-txt" id="cm-health-warn" style="display:none;">⚠️ Low Availability</span>
                            </h3>
                            ${toggleBtnHtml}
                        </div>
                        <div class="cm-stats">
                            <span class="cm-pill badge-act" id="cnt-act" title="Active">Actv: 0</span> +
                            <span class="cm-pill badge-phn" id="cnt-phn" title="On Phone">Phn: 0</span> +
                            <span class="cm-pill badge-brk" id="cnt-brk" title="On Break">Brk: 0</span> =
                            <span class="cm-pill badge-tot" id="cnt-tot" title="Total">Tot: 0</span>
                        </div>
                    </div>
                    <div class="cm-list" id="cm-list-root"></div>
                </div>
            </div>
        </div>`;
				uiContainer.innerHTML = Utils.toSafeHTML(skeletonHtml);
				uiContainer.style.display = "flex";
			}

			const textRegex = /[a-zA-Z\s]+/;
			const timeRegex = /\d+[hms]/g;
			const timeMultipliers = { h: 3600, m: 60, s: 1 };

			const formatTime = (str) =>
				String(str || "")
					.replace(/(\d+)\s*([hms])/gi, "$1 $2")
					.replace(/\s+/g, " ")
					.trim();

			const parseDuration = (timeStr) =>
				(timeStr.match(timeRegex) || []).reduce(
					(acc, curr) =>
						acc +
						parseInt(curr, 10) *
							(timeMultipliers[curr.slice(-1)] || 0),
					0,
				);

			const extractState = (cell) =>
				(cell?.innerText.match(textRegex)?.[0] || "")
					.trim()
					.toLowerCase()
					.replace(/\s+/g, "-");

			const updateDashboard = () => {
				try {
					const parsedAgents = Array.from(
						targetContainer.querySelectorAll("tbody tr"),
					)
						.map((row) => {
							const cells = row.querySelectorAll("td");
							if (!cells || cells.length < 10) return null;

							const rawStatus1 = extractState(cells[5]);
							const rawStatus2 = extractState(cells[8]);
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

							const combinedPool = `${cells[10]?.innerText.trim() || ""},${cells[13]?.innerText.trim() || ""}`;
							const poolDisplay = combinedPool.includes("3004773")
								? "BAU"
								: combinedPool.includes("3028872") ||
									  combinedPool.includes("3014937")
									? "LM"
									: "";

							return {
								img: row.querySelector("img")?.src || "",
								ldap: cells[1]?.innerText.trim() || "",
								timeInState: formatTime(
									cells[4]?.innerText.trim() || "",
								),
								lastChangeRaw: formatTime(
									cells[9]?.innerText.trim() || "",
								),
								displayStatus,
								statusKey,
								cssClass: `st-${statusKey}`,
								durationSeconds: parseDuration(
									cells[9]?.innerText || "",
								),
								poolDisplay,
								rawStatus1,
								rawStatus2,
							};
						})
						.filter(Boolean)
						.sort((a, b) => {
							const aIsUser = a.ldap === currentUserName;
							const bIsUser = b.ldap === currentUserName;
							if (aIsUser !== bIsUser) return bIsUser - aIsUser;

							const aPrio =
								config.priorities[a.statusKey] ??
								config.priorities.default;
							const bPrio =
								config.priorities[b.statusKey] ??
								config.priorities.default;
							if (aPrio !== bPrio) return aPrio - bPrio;

							const aPool = config.poolRanks[a.poolDisplay] || 3;
							const bPool = config.poolRanks[b.poolDisplay] || 3;
							if (aPool !== bPool) return aPool - bPool;

							return b.durationSeconds - a.durationSeconds;
						});

					const activeCount = parsedAgents.filter(
						(a) => a.statusKey === "active",
					).length;
					const callCount = parsedAgents.filter((a) =>
						["phone", "video"].includes(a.statusKey),
					).length;
					const breakCount = parsedAgents.filter(
						(a) =>
							!["phone", "video", "active"].includes(a.statusKey),
					).length;
					const totalCount = parsedAgents.length;
					const isLowAvailability =
						totalCount > 0 && activeCount / totalCount < 0.2;

					Utils.$("#cnt-act").textContent = `Actv: ${activeCount}`;
					Utils.$("#cnt-phn").textContent = `Phn: ${callCount}`;
					Utils.$("#cnt-brk").textContent = `Brk: ${breakCount}`;
					Utils.$("#cnt-tot").textContent = `Tot: ${totalCount}`;

					const wrapperShell = Utils.$("#cm-wrap-shell");
					const healthWarn = Utils.$("#cm-health-warn");
					if (wrapperShell && healthWarn) {
						wrapperShell.classList.toggle(
							"cm-warn",
							isLowAvailability,
						);
						healthWarn.style.display = isLowAvailability
							? "inline"
							: "none";
					}

					const groups = [];
					let currentGroup = null;

					parsedAgents.forEach((agent) => {
						const isUser = agent.ldap === currentUserName;
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

					const listRoot = Utils.$("#cm-list-root");
					if (!listRoot) return;

					const fragment = document.createDocumentFragment();
					const isFullLayout = CaseMon.currentLayout === "full";

					// Top column title header row in Full Layout
					if (isFullLayout) {
						Utils.createEl("div", {
							className: "cm-cols",
							html: `
                                <div class="col-spacer"></div>
                                <div class="col-grid">
                                    <span>Agent</span>
                                    <span>Last Change</span>
                                    <span>In State</span>
                                    <span></span>
                                </div>
                            `,
							parent: fragment,
						});
					}

					groups.forEach((group) => {
						const groupBlock = Utils.createEl("div", {
							className: "cm-group",
						});
						Utils.createEl("div", {
							className: `grp-lbl ${group.isUser ? "is-me" : ""}`,
							text: group.label,
							parent: groupBlock,
						});

						const stack = Utils.createEl("div", {
							className: "grp-stack",
							parent: groupBlock,
						});

						group.rows.forEach((agent) => {
							const icon = config.icons[agent.statusKey];
							const stConf =
								config.statusConfig[agent.statusKey] ||
								config.statusConfig.default;
							const maxSecs = stConf.maxSecs || 2700;
							const progressPct = Math.min(
								(agent.durationSeconds / maxSecs) * 100,
								100,
							).toFixed(1);
							const isOverTime = agent.durationSeconds >= maxSecs;

							const isActive = agent.statusKey === "active";
							const nonPhoneImg =
								agent.rawStatus1 === "busy" && isActive
									? `<img src="${config.icons.non_phone}" alt="non_phone" loading="lazy" />`
									: "";
							const nonVideoImg =
								agent.rawStatus2 === "busy" && isActive
									? `<img src="${config.icons.non_video}" alt="non_video" loading="lazy" />`
									: "";

							const statusIconHtml = icon
								? `<img src="${icon.src}" animation="${icon.animation}" alt="${agent.statusKey} icon" loading="lazy" />`
								: "";
							const iconsHtml = `${statusIconHtml}${nonPhoneImg}${nonVideoImg}`;

							const poolText = agent.poolDisplay
								? ` (${Utils.escapeHtml(agent.poolDisplay)})`
								: "";

							let rowInnerHtml = "";

							if (isFullLayout) {
								// Layout 2: Full Version
								rowInnerHtml = `
                        <div class="row-left">
                            <img class="row-avatar" src="${Utils.escapeHtml(agent.img)}" alt="${Utils.escapeHtml(agent.ldap)}" loading="lazy" />
                            <div class="row-info">
                                <span class="row-name">${Utils.escapeHtml(agent.ldap)}</span>
                                <span class="row-status">${Utils.escapeHtml(agent.displayStatus)}${poolText}</span>
                            </div>
                        </div>
                        <div class="row-col">
                            <span class="row-time">${Utils.escapeHtml(agent.lastChangeRaw || "-")}</span>
                        </div>
                        <div class="row-col">
                            <span class="row-time">${Utils.escapeHtml(agent.timeInState || "-")}</span>
                        </div>
                        <div class="row-ico">
                            ${iconsHtml}
                        </div>
                        `;
							} else {
								// Layout 1: Simple Version
								rowInnerHtml = `
                        <div class="row-left">
                            <img class="row-avatar" src="${Utils.escapeHtml(agent.img)}" alt="${Utils.escapeHtml(agent.ldap)}" loading="lazy" />
                            <span>${Utils.escapeHtml(agent.ldap)}</span>
                        </div>
                        <div class="row-right">
                            <div class="row-meta">
                                <span class="row-time">${Utils.escapeHtml(agent.lastChangeRaw)} <span class="row-subtime">(${Utils.escapeHtml(agent.timeInState)})</span></span>
                                <span class="row-status">${Utils.escapeHtml(agent.displayStatus)}${poolText}</span>
                            </div>
                            ${iconsHtml}
                        </div>
                        `;
							}

							const rowEl = Utils.createEl("div", {
								className: `cm-row ${agent.cssClass} ${isOverTime ? "is-over" : ""} ${isFullLayout ? "is-full" : ""}`,
								style: `--progress: ${progressPct}%; --st-color: ${stConf.color}; --st-track: ${stConf.track};`,
								html: rowInnerHtml,
								parent: stack,
							});
							rowEl.dataset.ldap = agent.ldap;
						});

						fragment.appendChild(groupBlock);
					});

					listRoot.textContent = "";
					listRoot.appendChild(fragment);
				} catch (err) {
					console.error("Casemon render error:", err);
				}
			};

			CaseMon.updateFn = updateDashboard;

			CaseMon.observer = new MutationObserver(
				Utils.debounce(updateDashboard, 150),
			);
			CaseMon.observer.observe(targetContainer, {
				attributes: true,
				childList: true,
				subtree: true,
				characterData: true,
			});

			uiContainer.addEventListener("click", (e) => {
				if (e.target.closest(".cm-close")) {
					uiContainer.remove();
					CaseMon.isRunning = false;
					CaseMon.observer?.disconnect();
				} else if (isAdmin && e.target.closest("#cm-layout-toggle")) {
					CaseMon.currentLayout =
						CaseMon.currentLayout === "simplicity"
							? "full"
							: "simplicity";
					const isFull = CaseMon.currentLayout === "full";
					const wrapperShell = Utils.$("#cm-wrap-shell");
					const toggleBtn = Utils.$("#cm-layout-toggle");

					if (wrapperShell) {
						wrapperShell.classList.toggle("cm-full", isFull);
					}
					if (toggleBtn) {
						toggleBtn.textContent = isFull
							? "Layout: Full"
							: "Layout: Simple";
					}
					if (CaseMon.updateFn) {
						CaseMon.updateFn();
					}
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
			const matched = this.routes.find((r) =>
				window.location.href.includes(r.pattern),
			);
			matched ? matched.run() : TagInspector.init();
		},
	};

	if (["complete", "interactive"].includes(document.readyState)) {
		AppRouter.init();
	} else {
		window.addEventListener("DOMContentLoaded", () => AppRouter.init());
	}
})();
