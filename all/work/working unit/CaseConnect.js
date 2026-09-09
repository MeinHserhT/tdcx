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

		pollForCondition: async (predicate, interval = 500, maxAttempts = 10) => {
			for (let i = 0; i < maxAttempts; i++) {
				if (predicate()) return true;
				await Utils.sleep(interval);
			}
			return false;
		},

		$: (selector, parent = document) => parent.querySelector(selector),
		$$: (selector, parent = document) => Array.from(parent.querySelectorAll(selector)),

		toSafeHTML: (str) => {
			if (!safePolicy) {
				const tt = window.trustedTypes;
				safePolicy = tt?.createPolicy
					? (() => {
						try { return tt.createPolicy("default", { createHTML: (s) => s }); }
						catch { return tt.defaultPolicy || { createHTML: (s) => s }; }
					})()
					: { createHTML: (s) => s };
			}
			return safePolicy.createHTML(str);
		},

		createEl: (tag, { parent, onClick, style, text, html, className, id, ...props } = {}) => {
			const el = document.createElement(tag);
			if (id) el.id = id;
			if (className) el.className = className;
			if (text !== undefined) el.textContent = text;
			if (html !== undefined) el.innerHTML = Utils.toSafeHTML(html);

			if (style) {
				typeof style === "string" ? (el.style.cssText = style) : Object.assign(el.style, style);
			}
			if (onClick) el.addEventListener("click", onClick);

			Object.entries(props).forEach(([key, value]) => {
				if (key.startsWith("on") && typeof value === "function") el[key] = value;
				else if (key.startsWith("data-")) el.setAttribute(key, value);
				else el[key] = value;
			});

			if (parent) parent.appendChild(el);
			return el;
		},

		addStyle: (id, cssText) => {
			document.getElementById(id)?.remove();
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

				observer.observe(document.body, { childList: true, subtree: true });
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
					element.dataset.origText = element.dataset.origText || element.textContent;
					element.textContent = successMsg;
					element.classList.add("is-copied");
					clearTimeout(timer);
					timer = setTimeout(() => {
						element.textContent = element.dataset.origText;
						element.classList.remove("is-copied");
					}, 1500);
				} catch (err) {
					console.error("Copy failed", err);
				}
			});
		},

		escapeHtml: (str) =>
			String(str ?? "").replace(
				/[&<>"']/g,
				(ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[ch],
			),
	};

	// ==========================================
	// 5. FEATURE: CASES CONNECT
	// ==========================================
	const CasesConnect = {
		clickerInterval: null,

		BASE_COMMENTS: [
			"Setup Conversion Linker",
			"Guided the advertiser how to see the report",
			"Survey pitched",
		],

		get GA4_COMMENTS() {
			return [
				...CasesConnect.BASE_COMMENTS,
				"Linked GA4 and Google Ads",
				"Turned on Google signals data collection",
				"Turned on User Data Collection Acknowledgement",
				"Tested with Tag Assistant and Real time in GA4",
			];
		},

		get NOTE_TEMPLATES() {
			return {
				EC: {
					subStatus: "NI - Awaiting Validation",
					subStatusReason: "Implemented Ads Enhanced Conversion",
					tagsImplemented: "Ads Enhanced Conversions",
					comments: [
						"Implemented Google Ads enhanced conversions for Purchase via GTM / Gtag",
						"Tested with Tag Assistant",
						"Turn on Enhanced Conversion in conversion action",
						"No recent conversions",
						"Awaiting enhanced conversion to record data",
						...CasesConnect.BASE_COMMENTS,
					],
				},
				CONVERSION_TRACKING: {
					subStatus: "Completed",
					subStatusReason: "Implement Ads Conversion Tracking",
					tagsImplemented: "Ads Conversion Tracking",
					comments: [
						"Implemented Google Ads conversions for Hotline/Zalo via GTM / Gtag",
						"Tested with Tag Assistant",
						"No recent conversions",
						...CasesConnect.BASE_COMMENTS,
					],
				},
				WAITING_INPUT: {
					subStatus: "Waiting Input",
					subStatusReason: "waiting for Adv to setup GTM",
					tagsImplemented: "",
					comments: [],
				},
				GA4: {
					subStatus: "Waiting Validation",
					subStatusReason: "Implement GA4 Event",
					tagsImplemented: "Analytics Event Tracking",
					comments: [
						"Implemented GA4 event (Hotline / Zalo) via GTM / Gtag code",
						"Recording data",
						"Awaiting events to be processed in GA4 Event Report",
						"Guide advertiser import GA4 event to Google Ads",
						...CasesConnect.GA4_COMMENTS,
					],
				},
				REMARKETING: {
					subStatus: "Waiting Validation",
					subStatusReason: "Implement Ads Audiences",
					tagsImplemented: "Ads Remarketing",
					comments: [
						"Implemented GA4 Audiences for Pageview < 10s via GTM",
						...CasesConnect.GA4_COMMENTS,
					],
				},
			};
		},

		isDateToday(val) {
			if (!val) return false;
			const now = new Date();
			const timestamp = Number(val);
			if (!isNaN(timestamp) && timestamp > 1e11) {
				return new Date(timestamp).toDateString() === now.toDateString();
			}

			const pad = (n) => String(n).padStart(2, "0");
			const [d, m, y] = [now.getDate(), now.getMonth() + 1, now.getFullYear()];
			const [dd, mm] = [pad(d), pad(m)];
			const str = String(val).trim().toLowerCase();

			return (
				str.includes("today") ||
				str.includes(`${dd}/${mm}/${y}`) ||
				str.includes(`${d}/${m}/${y}`) ||
				str.includes(`${y}-${mm}-${dd}`) ||
				str.includes(`${mm}/${dd}/${y}`)
			);
		},

		promptCaseType(daysOffset) {
			return new Promise((resolve) => {
				Utils.$("#qm-modal-overlay")?.remove();

				const overlay = Utils.createEl("div", {
					id: "qm-modal-overlay",
					parent: document.body,
					style: {
						position: "fixed",
						top: "0",
						left: "0",
						width: "100vw",
						height: "100vh",
						backgroundColor: "rgba(0, 0, 0, 0.15)",
						backdropFilter: "blur(2px)",
						webkitBackdropFilter: "blur(2px)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: "2147483647",
					},
				});

				const modal = Utils.createEl("div", {
					parent: overlay,
					style: {
						backgroundColor: "#FFFFFF",
						borderRadius: "16px",
						padding: "22px",
						width: "320px",
						boxShadow: "0 16px 36px rgba(0,0,0,0.12)",
						textAlign: "center",
						fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
						border: "1px solid rgba(0,0,0,0.05)",
					},
				});

				const close = (value) => {
					overlay.remove();
					resolve(value);
				};

				const renderStep = (title, subtitle, buttons) => {
					modal.textContent = "";

					Utils.createEl("div", {
						text: title,
						parent: modal,
						style: "font-size: 16px; font-weight: 700; color: #1D1D1F; margin-bottom: 4px;",
					});

					Utils.createEl("div", {
						text: subtitle,
						parent: modal,
						style: "font-size: 12px; color: #86868B; margin-bottom: 18px;",
					});

					const actions = Utils.createEl("div", {
						parent: modal,
						style: "display: flex; flex-direction: column; gap: 8px;",
					});

					buttons.forEach(([label, bg, color, onClick]) => {
						Utils.createEl("button", {
							text: label,
							parent: actions,
							style: {
								padding: "10px 14px",
								borderRadius: "10px",
								border: "none",
								fontSize: "13px",
								fontWeight: "600",
								cursor: "pointer",
								backgroundColor: bg,
								color: color,
								transition: "all 0.15s ease",
							},
							onmouseenter: (e) => (e.currentTarget.style.filter = "brightness(0.96)"),
							onmouseleave: (e) => (e.currentTarget.style.filter = "none"),
							onClick,
						});
					});
				};

				const showValidationStep = () => {
					renderStep("Validation Scope", "Select the task validated on call:", [
						["GA4 Event", "#B2F2BB", "#1E5E2A", () => close("GA4")],
						["Ads Remarketing", "#D0BFFF", "#3A2A59", () => close("REMARKETING")],
						["← Back", "#F1F3F5", "#495057", () => showInitialStep()],
					]);
				};

				const showInitialStep = () => {
					renderStep("Select Follow-Up Note", `Follow-up set to ${daysOffset} days. Choose status:`, [
						["Waiting Input", "#A5D8FF", "#183B56", () => close("WAITING_INPUT")],
						["Waiting Validation", "#B2F2BB", "#1E5E2A", () => showValidationStep()],
						["Skip / Keep Default", "#F1F3F5", "#495057", () => close(null)],
					]);
				};

				showInitialStep();
			});
		},

		autoClickTask() {
			Utils.$("#cdtx__uioncall--btn")?.click();
			setTimeout(() => Utils.$(".cdtx__uioncall_control-remove")?.click(), 6000);
		},

		buildNoteTemplateHTML(templateKey, followUpVal) {
			const config = CasesConnect.NOTE_TEMPLATES[templateKey];
			const subStatusHtml = config?.subStatus || "Click Choice";
			const subStatusReasonHtml = config?.subStatusReason ? `&nbsp;&nbsp;${config.subStatusReason}` : "";
			const tagsImplementedHtml = config?.tagsImplemented || "";
			const commentsListHtml = config?.comments?.length
				? config.comments.map((item) => `<li>${Utils.escapeHtml(item)}</li>`).join("")
				: "<li><b></b></li>";

			return `
			<div id="noteCaseUI" class="cdtx__uioncall">
				<div class="cdtx__uioncall_control">
					<span class="cdtx__uioncall_control-load" data-text="Split &amp; Transfer" data-btnclk="oncall_templ_lt_template">&nbsp;</span>
					<span class="cdtx__uioncall_control-load" data-text="List" data-btnclk="oncall_templ_act_load">&nbsp;</span>
					<span class="cdtx__uioncall_control-save" data-text="Save" data-btnclk="oncall_templ_act_save" data-btntooltip="Save template Reuse">&nbsp;</span>
					<span class="cdtx__uioncall_control-remove" data-text="Remove" data-btnclk="oncall_templ_act_remove">&nbsp;</span>
				</div>
				<article class="cdtx__uioncall_outer">
					<p dir="auto"><b>Sub-status:&nbsp;&nbsp;<span class="_sub_i" data-btnclk="choice_status_list" data-infocase="status_case">${subStatusHtml}</span></b> </p>
					<p dir="auto"><b>Verify GA4/GTM:</b>&nbsp;&nbsp; </p>
					<p dir="auto"><b>Sub-status Reason:</b><span class="cdtx__uioncall-oct_test">${subStatusReasonHtml}</span>&nbsp;&nbsp; </p>
					<p dir="auto"><b data-btnclk="oncall_templ_act_flchoice" data-dateformat="d/m/Y">FL:&nbsp;&nbsp;</b><span data-text="oncall_templ_act_flchoice-text">${Utils.escapeHtml(followUpVal)}</span></p>
					<p dir="auto"><b>On Call Comments:&nbsp;&nbsp; </b></p>
					<p dir="auto"><ul dir="auto">${commentsListHtml}</ul></p>
					<p dir="auto"><b>Next Course of Action:&nbsp;&nbsp; </b></p>
					<p dir="auto"><b data-btnclk="oncall_templ_act_taskchoice">Tags Implemented:&nbsp;&nbsp;</b><span data-text="oncall_templ_act_taskchoice-text">${tagsImplementedHtml}</span></p>
					<p dir="auto"><b><span>Screenshots: Attach</span></b></p>
					<p dir="auto"><p dir="auto"><ul dir="auto"><li><b></b></li></ul></p></p>
					<p dir="auto"><b>Multiple CIDs:&nbsp;&nbsp;</b>NA</p>
					<p dir="auto"><b><span>On Call Screenshot: Attach</span></b></p>
				</article>
			</div>`.trim();
		},

		async executeFollowUp(flupBtn) {
			try {
				Utils.$('[aria-label="Overview"]')?.click();
				await Utils.sleep(300);

				flupBtn.style.opacity = "0.6";
				flupBtn.style.pointerEvents = "none";

				const daysOffset = parseInt(Utils.$("#qm-flup-in")?.value, 10) || 0;
				const apptEl = Utils.$('[data-infocase="appointment_time"]');
				let isApptToday = false;

				if (apptEl) {
					if (!apptEl.dataset.valchoice) {
						apptEl.click();
						await Utils.sleep(150);
						const todayEl = await Utils.waitForElement(".datepicker-grid .today");
						todayEl?.click();
						await Utils.sleep(200);
						isApptToday = true;
					} else {
						isApptToday = CasesConnect.isDateToday(apptEl.dataset.valchoice) || CasesConnect.isDateToday(apptEl.innerText);
					}
				}

				let selectedTemplateKey = null;
				if (daysOffset === 5) {
					selectedTemplateKey = "EC";
				} else if (daysOffset === 0 && isApptToday) {
					selectedTemplateKey = "CONVERSION_TRACKING";
				} else if (daysOffset === 2 || daysOffset === 3) {
					selectedTemplateKey = await CasesConnect.promptCaseType(daysOffset);
				}

				Utils.$('[data-infocase="follow_up_time"]')?.click();
				await Utils.sleep(150);

				if (daysOffset > 0) {
					const targetDate = new Date();
					for (let count = 0; count < daysOffset;) {
						targetDate.setDate(targetDate.getDate() + 1);
						if (targetDate.getDay() % 6 !== 0) count++;
					}
					const diffDays = Math.round((targetDate - new Date()) / 86400000);
					let currentDayEl = await Utils.waitForElement(".datepicker-grid .today");

					for (let i = 0; i < diffDays && currentDayEl; i++) {
						currentDayEl = currentDayEl.nextElementSibling;
					}
					if (currentDayEl) {
						currentDayEl.click();
						await Utils.sleep(200);
					}
				} else {
					const finishEl = await Utils.waitForElement('[data-thischoice="Finish"]');
					if (finishEl) {
						finishEl.click();
						await Utils.sleep(200);
					}
				}

				const typeEl = await Utils.waitForElement("[data-type=follow_up_time]");
				if (typeEl) {
					typeEl.click();
					await Utils.sleep(200);
				}

				const followUpVal = Utils.$('[data-infocase="follow_up_time"]')?.dataset?.valchoice || "NA";
				const templateHTML = CasesConnect.buildNoteTemplateHTML(selectedTemplateKey, followUpVal);

				const caseNoteTarget = Utils.$('[aria-label="Case Note"]');
				const existingTemplate = Utils.$("#noteCaseUI");

				if (existingTemplate) {
					existingTemplate.outerHTML = templateHTML;
				} else if (caseNoteTarget) {
					caseNoteTarget.insertAdjacentHTML("beforeend", templateHTML);
				}
				caseNoteTarget?.dispatchEvent(new Event("input", { bubbles: true }));
			} catch (err) {
				console.error("Follow up script failed", err);
			} finally {
				flupBtn.style.opacity = "1";
				flupBtn.style.pointerEvents = "auto";
			}
		},

		init() {
			Utils.$("#qm-panel")?.remove();
			if (CasesConnect.clickerInterval) {
				clearInterval(CasesConnect.clickerInterval);
				CasesConnect.clickerInterval = null;
			}

			Utils.addStyle(
				"qm-styles",
				`
				#qm-panel { position: fixed; bottom: 20px; left: 20px; display: flex; gap: 8px; align-items: center; z-index: 99999; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif; }
				.qm-btn { z-index: 10; color: #1D1D1F; padding: 10px 16px; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.6); }
				.qm-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); filter: brightness(0.97); }
				.qm-btn:active { transform: scale(0.96); }
				#qm-flup-in { position: absolute; top: 50%; transform: translateY(-50%); right: 6px; width: 28px; height: 24px; padding: 0; border: none; border-radius: 6px; background: rgba(255, 255, 255, 0.95); color: #1D1D1F; font-weight: 700; font-size: 12px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06); transition: all 0.2s ease; -moz-appearance: textfield; }
				#qm-flup-in:focus { outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06), 0 0 0 2px #74B9FF; }
				.qm-badge { display: none; position: absolute; top: -4px; right: -4px; background: #FF8787; border-radius: 9999px; padding: 2px 6px; font-size: 10px; font-weight: 700; line-height: 1; border: 1.5px solid #FFFFFF; color: #FFFFFF; }
				.qm-sig { margin: 12px 0; }
				.dock-container { max-height: 400px !important; overflow-y: auto !important; }
				`,
			);

			const panel = Utils.createEl("div", { id: "qm-panel", parent: document.body });
			CasesConnect.clickerInterval = setInterval(CasesConnect.autoClickTask, 16000);

			Utils.createEl("button", {
				textContent: "OFF",
				title: "Auto Click",
				className: "qm-btn",
				style: { backgroundColor: "#FFA8A8", color: "#6A1A1A" },
				parent: panel,
				onClick: (e) => {
					const btn = e.currentTarget;
					if (CasesConnect.clickerInterval) {
						clearInterval(CasesConnect.clickerInterval);
						CasesConnect.clickerInterval = null;
						btn.textContent = "ON";
						btn.style.backgroundColor = "#B2F2BB";
						btn.style.color = "#1E5E2A";
					} else {
						CasesConnect.clickerInterval = setInterval(CasesConnect.autoClickTask, 16000);
						btn.textContent = "OFF";
						btn.style.backgroundColor = "#FFA8A8";
						btn.style.color = "#6A1A1A";
					}
				},
			});

			Utils.createEl("button", {
				html: '<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 16px; height: 16px; filter: brightness(0.2);"><span id="flup-badge" class="qm-badge">+</span>',
				title: "Click Follow-up Item",
				className: "qm-btn",
				style: { backgroundColor: "#A5D8FF" },
				parent: panel,
				onClick: async () => {
					Utils.$('[debug-id="dock-item-home"]')?.click();
					try {
						const popup = await Utils.waitForElement(".li-popup_lstcasefl");
						popup?.click();
					} catch {
						console.warn("Follow-up popup not found");
					}
				},
			});

			Utils.waitForElement(".li-popup_lstcasefl")
				.then((el) => {
					const badge = Utils.$("#flup-badge");
					const updateBadge = () => {
						if (badge) badge.style.display = el.dataset.attr && el.dataset.attr !== "0" ? "block" : "none";
					};
					new MutationObserver(updateBadge).observe(el, { attributes: true, attributeFilter: ["data-attr"] });
					updateBadge();
				})
				.catch(() => {});

			const flupBtn = Utils.createEl("button", {
				textContent: "FL Up:",
				title: "Set Follow-up",
				className: "qm-btn",
				style: { backgroundColor: "#99E9F2", color: "#0C5460", paddingRight: "44px" },
				parent: panel,
				onClick: (e) => {
					if (e.target.id === "qm-flup-in") return;
					CasesConnect.executeFollowUp(flupBtn);
				},
			});

			Utils.createEl("input", {
				id: "qm-flup-in",
				type: "text",
				value: "2",
				parent: flupBtn,
				onClick: (e) => e.stopPropagation(),
				onfocus: (e) => e.target.select(),
				oninput: (e) => (e.target.value = e.target.value.replace(/\D/g, "").slice(0, 1)),
				onkeydown: (e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						CasesConnect.executeFollowUp(flupBtn);
					}
				},
			});

			Utils.createEl("button", {
				textContent: "Sign",
				title: "Insert Signature at Cursor",
				className: "qm-btn",
				style: { backgroundColor: "#CED4DA", color: "#343A40" },
				parent: panel,
				onmousedown: (e) => e.preventDefault(),
				onClick: () => {
					const sel = window.getSelection();
					if (!sel?.rangeCount) {
						return alert("Please click inside the email body to place your cursor first.");
					}

					const node = sel.getRangeAt(0).startContainer.parentNode;
					if (!node?.closest("[contenteditable]")) {
						return alert("Please place your cursor inside the text area where you want the signature.");
					}

					Utils.$$(".qm-sig").forEach((el) => el.remove());

					let sigName = localStorage.getItem("__signature_name");
					if (!sigName) {
						sigName = prompt("Enter your name:") || "Agent";
						localStorage.setItem("__signature_name", sigName);
					}

					const htmlString = `
					<table class="qm-sig" style="width: 348px; padding: 0 30px;" data-sig-injected="true">
						<tbody>
							<tr align="left">
								<td style="width: 52px; vertical-align: top;"><img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="52" height="52" style="display: block; border-radius: 10px;"></td>
								<td style="width: 12px;"/>
								<td style="vertical-align: middle;">
									<p style="font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; margin: 0; line-height: 1.4; color: #1D1D1F;">
										<strong style="font-size: 105%; color: #1D1D1F;">${Utils.escapeHtml(sigName)}</strong><br>
										<span style="color: #86868B;">Technical Solutions Team</span><br>
										<span style="color: #86868B; font-weight: 500;">TDCX, on behalf of Google</span>
									</p>
								</td>
							</tr>
						</tbody>
					</table>`;

					document.execCommand("insertHTML", false, Utils.toSafeHTML(htmlString));
				},
			});
		},
	};

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
			const target = this.routes.find((r) => window.location.href.includes(r.pattern));
			target ? target.run() : TagInspector.init();
		},
	};

	if (["complete", "interactive"].includes(document.readyState)) {
		AppRouter.init();
	} else {
		window.addEventListener("DOMContentLoaded", () => AppRouter.init());
	}
})();