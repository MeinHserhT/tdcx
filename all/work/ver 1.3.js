
(function () {
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
				style,
				className,
				id,
				html,
				text,
				...props
			} = {},
		) => {
			const el = document.createElement(tag);
			if (id) el.id = id;
			if (className) el.className = className;
			if (text) el.innerText = text;
			if (html) el.innerHTML = html;
			if (style) Object.assign(el.style, style);
			if (onClick) el.addEventListener("click", onClick);

			// Assign remaining dynamic properties (e.g. type, value, oninput, onmousedown)
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

		setupCopy: (element, text, successMsg = "Copied!") => {
			let timeout;
			element.addEventListener("click", async () => {
				try {
					await navigator.clipboard.writeText(text);
					element.dataset.origText =
						element.dataset.origText || element.innerText;
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

	// ==========================================
	// 2. FEATURE: QPLUS AUTOMATOR
	// ==========================================
	class QPlusAutomator {
		static SELECTORS = {
			questionContainer: ".question-container",
			questionText: ".question-text",
			label: "label.mdc-label",
			textarea: 'textarea[formcontrolname="selectedText"]',
			autoSuggestion: "span.auto-suggestion-text",
			radioParent: "mat-radio-button",
			checkboxParent: "mat-checkbox",
			input: "input",
			takeCase: '[aria-label="Take the task"]',
		};

		static TASK_PROFILES = [
			{ id: "so-ct", label: "SO - Ads CT", config: {} },
			{
				id: "so-ecw",
				label: "SO - Ads EC",
				config: {
					taskTypes: ["Enhanced Conversions for Web (ECW)"],
					ecFeasible: "No",
					ecOption: "Manual",
				},
			},
			{
				id: "so-ga4",
				label: "SO - GA4 Setup",
				config: {
					taskTypes: ["GA4 Setup (no Analytics in place yet)"],
					ga4Features: ["Tagging", "Other Conversions"],
				},
			},
			{
				id: "ni-gtm",
				label: "NdInfo - GTM",
				config: {
					status: "In Progress",
					subStatus: "NI - Awaiting Inputs",
				},
			},
			{
				id: "ni-ec",
				label: "NdInfo - Ads EC",
				config: {
					status: "In Progress",
					subStatus: "NI - Awaiting Validation",
					taskTypes: ["Enhanced Conversions for Web (ECW)"],
					ecFeasible: "No",
					ecOption: "Manual",
				},
			},
		];

		static async promptUser() {
			return new Promise((resolve) => {
				const overlay = Utils.createEl("div", {
					style: {
						position: "fixed",
						top: "0",
						left: "0",
						width: "100vw",
						height: "100vh",
						background: "rgba(0,0,0,0.5)",
						zIndex: "99999",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontFamily: "Roboto, Arial, sans-serif",
					},
					parent: document.body,
				});

				const modal = Utils.createEl("div", {
					style: {
						background: "#fff",
						padding: "24px",
						borderRadius: "8px",
						width: "320px",
						boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
					},
					html: `<h3 style="margin-top:0; color:#1a73e8; font-size: 18px;">Choose Task Profile</h3>`,
					parent: overlay,
				});

				QPlusAutomator.TASK_PROFILES.forEach((profile) => {
					const btn = Utils.createEl("button", {
						text: profile.label,
						style: {
							display: "block",
							width: "100%",
							margin: "8px 0",
							padding: "12px",
							cursor: "pointer",
							background: "#f1f3f4",
							border: "1px solid #dadce0",
							borderRadius: "4px",
							fontWeight: "500",
							textAlign: "left",
							transition: "background 0.2s",
						},
						parent: modal,
						onClick: () => {
							overlay.remove();
							resolve(profile.config);
						},
					});
					btn.onmouseover = () => (btn.style.background = "#e8f0fe");
					btn.onmouseout = () => (btn.style.background = "#f1f3f4");
				});

				Utils.createEl("button", {
					text: "Cancel",
					style: {
						marginTop: "12px",
						background: "transparent",
						border: "none",
						color: "#5f6368",
						cursor: "pointer",
						width: "100%",
						fontWeight: "500",
						padding: "8px",
					},
					parent: modal,
					onClick: () => {
						overlay.remove();
						resolve(null);
					},
				});
			});
		}

		static buildConfig(options) {
			return {
				ldap: options.ldap || "",
				date: options.date || "",
				status: options.status || "Implemented",
				subStatus: options.subStatus || "SO - Implementation only",
				radioQs: [
					{
						title: "If task type was EC",
						choice: options.ecFeasible || "Not Applicable (N/A)",
					},
					{
						title: "what option was used",
						choice: options.ecOption || "Not Applicable (N/A)",
					},
					{
						title: "Was it a GTM implementation",
						choice: options.isGtm || "Yes",
					},
					{
						title: "If COMO task was implemented",
						choice: options.comoSetup || "Not Applicable (N/A)",
					},
					{
						title: "If Customer Match",
						choice: options.cmPmaxSetting || "None",
					},
					{
						title: "CMS / Platform",
						choice: options.cmsPlatform || "Didn't check",
					},
				],
				checkboxQs: [
					{
						title: "Task Type",
						choices: options.taskTypes || [
							"Ads Conversion Tracking",
						],
					},
					{
						title: "For GA4 Cases, what exact features",
						choices: options.ga4Features || [
							"Not Applicable (N/A)",
						],
					},
				],
			};
		}

		static dispatchAngularEvents(element) {
			["input", "change"].forEach((ev) =>
				element.dispatchEvent(new Event(ev, { bubbles: true })),
			);
			element.blur();
		}

		static selectOptions(choices, options = {}) {
			let context = document;
			if (options.title) {
				context = Utils.$$(
					QPlusAutomator.SELECTORS.questionContainer,
				).find((c) => {
					const textEl = c.querySelector(
						QPlusAutomator.SELECTORS.questionText,
					);
					return textEl?.textContent
						.toLowerCase()
						.includes(options.title.toLowerCase());
				});
				if (!context)
					return console.warn(
						`Question container matching "${options.title}" not found.`,
					);
			}

			const targetChoices = Array.isArray(choices) ? choices : [choices];
			const inputType = options.isCheckbox ? "checkbox" : "radio";

			Utils.$$(QPlusAutomator.SELECTORS.label, context).forEach(
				(label) => {
					if (targetChoices.includes(label.textContent.trim())) {
						let input = document.getElementById(
							label.getAttribute("for"),
						);
						if (!input) {
							const parent = label.closest(
								inputType === "checkbox"
									? QPlusAutomator.SELECTORS.checkboxParent
									: QPlusAutomator.SELECTORS.radioParent,
							);
							input = parent?.querySelector(
								QPlusAutomator.SELECTORS.input,
							);
						}
						if (
							input &&
							(inputType !== "checkbox" || !input.checked)
						)
							input.click();
					}
				},
			);
		}

		static async run() {
			const options = await QPlusAutomator.promptUser();
			if (!options)
				return console.log("🛑 Form automation cancelled by user.");

			const config = QPlusAutomator.buildConfig(options);
			try {
				console.log("Starting automation sequence...");

				Utils.$(QPlusAutomator.SELECTORS.takeCase).click();
				await Utils.sleep(300);

				Utils.$(
					".footer " + QPlusAutomator.SELECTORS.takeCase,
				)?.click();

				await Utils.waitForElement(
					QPlusAutomator.SELECTORS.questionContainer,
				);

				QPlusAutomator.selectOptions(config.status);
				await Utils.sleep(200);

				QPlusAutomator.selectOptions(config.subStatus);
				await Utils.sleep(200);

				const textareas = Utils.$$(QPlusAutomator.SELECTORS.textarea);
				if (textareas[0]) {
					textareas[0].focus();
					textareas[0].click();
					textareas[0].value = config.ldap;
					QPlusAutomator.dispatchAngularEvents(textareas[0]);
				}
				if (textareas[1]) {
					textareas[1].focus();
					textareas[1].click();
					textareas[1].value = config.date;
					QPlusAutomator.dispatchAngularEvents(textareas[1]);
				}

				config.radioQs.forEach((q) =>
					QPlusAutomator.selectOptions(q.choice, { title: q.title }),
				);
				config.checkboxQs.forEach((q) =>
					QPlusAutomator.selectOptions(q.choices, {
						title: q.title,
						isCheckbox: true,
					}),
				);

				await Utils.sleep(200);
				Utils.$(QPlusAutomator.SELECTORS.autoSuggestion)?.click();
				console.log("✅ Form successfully populated.");
			} catch (error) {
				console.error("❌ Error during form automation:", error);
			}
		}
	}

	// ==========================================
	// 3. FEATURE: CASEMON
	// ==========================================
	class CaseMon {
		static init() {
			if (window.dashRun) return;
			window.dashRun = true;
			Utils.$('[aria-selected="false"]')?.click();

			const iconBase = "https://cdn-icons-png.flaticon.com/512";
			const config = {
				uiId: "bento_agent_ui",
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

			const targetContainer = Utils.$(config.target);
			if (!targetContainer) return (window.dashRun = false);

			const currentUserName =
				Utils.$("[alt='profile photo']")?.src?.match(
					/photos\/([^/?]+)/,
				)?.[1] ?? "Unknown";

			Utils.addStyle(
				"bento-dash-styles",
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
                @media screen and (max-width: 380px) { .status-inline-label { display: none !important; } }
                @media screen and (max-width: 320px) { .header-counters { display: none !important; } .agent-list-header h3 { margin-bottom: 0; } }
                @media screen and (max-width: 280px) { .agent-left img { display: none !important; } }
                @media screen and (max-width: 240px) { .agent-right img { display: none !important; } }
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
								cells[5].innerText.match(textRegex)?.[0] || ""
							)
								.trim()
								.toLowerCase()
								.replace(/\s+/g, "-");
							let rawStatus2 = (
								cells[8].innerText.match(textRegex)?.[0] || ""
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
								durationSeconds: parseTime(cells[9].innerText),
							};
						})
						.filter(Boolean)
						.sort((a, b) => {
							let aIsUser = a.ldap === currentUserName;
							let bIsUser = b.ldap === currentUserName;
							if (aIsUser !== bIsUser) return bIsUser - aIsUser;

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

									return `
                            <div class="agent-row ${agent.cssClass} ${isOverTime ? "over-time" : ""}" style="${styleVars}">
                                <div class="agent-left">
                                    <img src="${Utils.escapeHtml(agent.img)}" alt="${Utils.escapeHtml(agent.ldap)}" loading="lazy" />
                                    <span>${Utils.escapeHtml(agent.ldap)}</span>
                                </div>
                                <div class="agent-right">
                                    <div class="agent-meta">
                                        <span class="time-state">${Utils.escapeHtml(agent.lastChangeRaw)} (${Utils.escapeHtml(agent.timeInState)})</span>
                                        <span class="status-text">${Utils.escapeHtml(agent.displayStatus)}</span> 
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
					window.dashRun = 0;
					observer.disconnect();
				}
			});

			updateDashboard();
		}
	}

	// ==========================================
	// 4. FEATURE: CASES CONNECT
	// ==========================================
	class CasesConnect {
		static init() {
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
            `,
			);

			const panel = Utils.createEl("div", {
				id: "panelQM",
				parent: document.body,
			});

			let clickerInterval = setInterval(
				CasesConnect.autoClickTask,
				16000,
			);

			const toggleBtn = Utils.createEl("button", {
				textContent: "OFF",
				title: "Auto Click",
				className: "qm-btn",
				style: { backgroundColor: "#D94138" },
				parent: panel,
				onClick: () => {
					if (clickerInterval) {
						clearInterval(clickerInterval);
						clickerInterval = null;
						toggleBtn.textContent = "ON";
						toggleBtn.style.backgroundColor = "#1E7F4E";
					} else {
						clickerInterval = setInterval(
							CasesConnect.autoClickTask,
							16000,
						);
						toggleBtn.textContent = "OFF";
						toggleBtn.style.backgroundColor = "#D94138";
					}
				},
			});

			CasesConnect.initFollowUpUI(panel);
			CasesConnect.initSignatureUI(panel);
		}

		static autoClickTask() {
			Utils.$("#cdtx__uioncall--btn")?.click();
			setTimeout(
				() => Utils.$(".cdtx__uioncall_control-remove")?.click(),
				6000,
			);
		}

		static initFollowUpUI(panel) {
			// Popup Clicker Button
			Utils.createEl("button", {
				html: '<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 16px; height: 16px; filter: invert(1);"><span id="flup-badge" class="qm-badge">+</span>',
				title: "Click Follow-up Item",
				className: "qm-btn",
				style: { backgroundColor: "#3B72E6" },
				parent: panel,
				onClick: async () => {
					Utils.$('[debug-id="dock-item-home"]')?.click();
					try {
						const popup = await Utils.waitForElement(
							".li-popup_lstcasefl",
						);
						popup?.click();
					} catch (err) {
						console.warn("Follow-up popup not found");
					}
				},
			});

			// Badge visibility tracking
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

			// FL Up Button
			const flupBtn = Utils.createEl("button", {
				textContent: "FL Up:",
				title: "Set Follow-up",
				className: "qm-btn",
				style: { backgroundColor: "#1A827A", paddingRight: "44px" },
				parent: panel,
				onClick: async (e) => {
					if (e.target.id === "flup-days-input") return;
					try {
						flupBtn.style.opacity = "0.6";
						flupBtn.style.pointerEvents = "none";
						const daysOffset =
							parseInt(Utils.$("#flup-days-input").value, 10) ||
							0;

						const apptEl = Utils.$(
							'[data-infocase="appointment_time"]',
						);
						if (apptEl && !apptEl.dataset.valchoice) {
							apptEl.click();
							await Utils.sleep(150);
							const todayEl = await Utils.waitForElement(
								".datepicker-grid .today",
							);
							if (todayEl) todayEl.click();
							await Utils.sleep(200);
						}

						const flupTimeEl = Utils.$(
							'[data-infocase="follow_up_time"]',
						);
						if (flupTimeEl) {
							flupTimeEl.click();
							await Utils.sleep(150);
						}

						if (daysOffset > 0) {
							let targetDate = new Date();
							for (let counter = 0; counter < daysOffset; ) {
								targetDate.setDate(targetDate.getDate() + 1);
								if (targetDate.getDay() % 6 !== 0) counter++;
							}
							const diffDays = Math.round(
								(targetDate - new Date()) / 86400000,
							);
							let currentDayEl = await Utils.waitForElement(
								".datepicker-grid .today",
							);

							for (let i = 0; i < diffDays && currentDayEl; i++) {
								currentDayEl = currentDayEl.nextElementSibling;
							}
							if (currentDayEl) {
								currentDayEl.click();
								await Utils.sleep(200);
							}
						} else {
							const finishEl = await Utils.waitForElement(
								'[data-thischoice="Finish"]',
							);
							if (finishEl) {
								finishEl.click();
								await Utils.sleep(200);
							}
						}

						const typeEl = await Utils.waitForElement(
							"[data-type=follow_up_time]",
						);
						if (typeEl) typeEl.click();
					} catch (err) {
						console.error("Follow up script failed", err);
					} finally {
						flupBtn.style.opacity = "1";
						flupBtn.style.pointerEvents = "auto";
					}
				},
			});

			// Days Input for FL UP
			Utils.createEl("input", {
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
		}

		static initSignatureUI(panel) {
			Utils.createEl("button", {
				textContent: "Sign",
				title: "Insert Signature at Cursor",
				className: "qm-btn",
				style: { backgroundColor: "#92400E", color: "#FFFFFF" },
				parent: panel,
				onmousedown: (e) => e.preventDefault(),
				onClick: () => {
					const sel = window.getSelection();
					if (!sel.rangeCount)
						return alert(
							"Please click inside the email body to place your cursor first.",
						);

					const node = sel.getRangeAt(0).startContainer.parentNode;
					if (!node || !node.closest("[contenteditable]"))
						return alert(
							"Please place your cursor inside the text area where you want the signature.",
						);

					Utils.$$(".aw-sig-table").forEach((el) => el.remove());

					let sigName = localStorage.getItem("__signature_name");
					if (!sigName) {
						sigName = prompt("Enter your name:") || "Agent";
						localStorage.setItem("__signature_name", sigName);
					}

					const htmlString = `
                    <table class="aw-sig-table" style="width: 348px; padding: 0 30px;" data-sig-injected="true">
                        <tbody>
                            <tr align="left">
                                <td style="width: 52px; vertical-align: top;"><img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="52" height="52" style="display: block; border-radius: 8px;"></td>
                                <td style="width: 12px;"/>
                                <td style="vertical-align: middle;">
                                    <p style="font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; line-height: 1.4; color: #1A1D23;">
                                        <strong style="font-size: 105%; color: #111111;">${Utils.escapeHtml(sigName)}</strong><br>
                                        <span style="color: #5F6368;">Technical Solutions Team</span><br>
                                        <span style="color: #5F6368; font-weight: 500;">TDCX, on behalf of Google</span>
                                    </p>
                                </td>
                            </tr>
                        </tbody>
                    </table>`;

					document.execCommand(
						"insertHTML",
						false,
						((html) => {
							if (
								window.trustedTypes &&
								window.trustedTypes.createPolicy
							) {
								const policy = trustedTypes.createPolicy(
									"sig-inject",
									{ createHTML: (str) => str },
								);
								return policy.createHTML(html);
							}
							return html;
						})(htmlString),
					);
				},
			});
		}
	}

	// ==========================================
	// 5. FEATURE: ADWORDS
	// ==========================================
	class AdWords {
		static async init() {
			Utils.addStyle(
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

			const isDataReady = await Utils.pollForCondition(
				() => window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS,
				600,
				5,
			);
			if (isDataReady)
				AdWords.processData(
					window.conversions_data.SHARED_ALL_ENABLED_CONVERSIONS,
				);
		}

		static processData(rawData) {
			const matches = [...rawData.matchAll(/AW-(\d+)/g)];
			const uniqueIds = [...new Set(matches.map((m) => m[1]))];

			if (uniqueIds.length > 0) {
				const container =
					Utils.$("#gpt-aw-container") ||
					Utils.createEl("div", {
						id: "gpt-aw-container",
						parent: document.body,
					});
				container.innerHTML = "";

				uniqueIds.forEach((idStr) => {
					const badge = Utils.createEl("div", {
						className: "gpt-aw-badge",
						text: `AW-${idStr}`,
						parent: container,
					});
					Utils.setupCopy(badge, idStr, "Copied!");
				});
			}

			Utils.$$(".expand-more").forEach((el) => el.click());

			try {
				const parsed = JSON.parse(rawData);
				if (!parsed || !parsed[1]) return;

				const dataMap = new Map(
					parsed[1].map((item) => [item[1], item]),
				);

				setTimeout(() => {
					Utils.$$(".conversion-name-cell .internal").forEach(
						(cell) => {
							const row = cell.closest(".particle-table-row");
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

							const mappedData = dataMap.get(cell.innerText);
							if (!mappedData) return;

							let type = null,
								convId = null;
							if (mappedData[11] === 1) {
								type = "aw-ads";
								convId = mappedData[64]?.[2]?.[4]
									?.split("'")?.[7]
									?.split("/")?.[1];
							} else if (mappedData[11] === 32) {
								type = "aw-ga4";
								convId =
									mappedData[64]?.[1]?.[4]?.split("'")?.[3];
							}

							if (type && convId) {
								cell.innerHTML = convId;
								cell.classList.add(type);
								Utils.setupCopy(cell, convId);
							}
						},
					);

					Utils.$$(
						"category-conversions-container-view, conversion-goal-card",
					).forEach((card) => {
						if (!card.querySelector(".particle-table-row"))
							card.style.display = "none";
					});
				}, 1200);
			} catch (err) {
				console.error("Adwords Data parsing failed", err);
			}
		}
	}

	// ==========================================
	// 6. ROUTER & INITIALIZATION
	// ==========================================
	const AppRouter = {
		init() {
			const url = window.location.href;

			if (url.includes("casemon2.corp")) CaseMon.init();
			else if (url.includes("cases.connect")) CasesConnect.init();
			else if (url.includes("adwords.corp")) AdWords.init();
			else if (url.includes("chrome-extension://")) QPlusAutomator.run();
		},
	};

	if (["complete", "interactive"].includes(document.readyState)) {
		AppRouter.init();
	} else {
		window.addEventListener("DOMContentLoaded", () => AppRouter.init());
	}
})();
