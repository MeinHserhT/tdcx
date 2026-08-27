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
	// 5. FEATURE: CASES CONNECT
	// ==========================================
	class CasesConnect {
		static isRunning = false;
		static clickerInterval = null;

		static init() {
			if (CasesConnect.isRunning) return;
			CasesConnect.isRunning = true;

			Utils.addStyle(
				"qm-styles",
				`
                #qm-panel { position: fixed; bottom: 20px; left: 20px; display: flex; gap: 8px; align-items: center; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif; }
                .qm-btn { z-index: 10; color: #FFFFFF; padding: 10px 16px; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 13px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.3); }
                .qm-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
				.qm-btn:active { transform: scale(0.96); }
                #qm-flup-in { position: absolute; top: 50%; transform: translateY(-50%); right: 6px; width: 28px; height: 24px; padding: 0; border: none; border-radius: 6px; background: rgba(255, 255, 255, 0.9); color: #1D1D1F; font-weight: 700; font-size: 12px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06); transition: all 0.2s ease; -moz-appearance: textfield; }
                #qm-flup-in:focus { outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06), 0 0 0 2px #0071E3; }
                .qm-badge { display: none; position: absolute; top: -4px; right: -4px; background: #FF3B30; border-radius: 9999px; padding: 2px 6px; font-size: 10px; font-weight: 700; line-height: 1; border: 1.5px solid #FFFFFF; }
                .qm-sig { margin: 12px 0; }
            `,
			);

			const panel = Utils.createEl("div", {
				id: "qm-panel",
				parent: document.body,
			});
			CasesConnect.clickerInterval = setInterval(
				CasesConnect.autoClickTask,
				16000,
			);

			Utils.createEl("button", {
				textContent: "OFF",
				title: "Auto Click",
				className: "qm-btn",
				style: { backgroundColor: "#FF3B30" },
				parent: panel,
				onClick: (e) => {
					const btn = e.currentTarget;
					if (CasesConnect.clickerInterval) {
						clearInterval(CasesConnect.clickerInterval);
						CasesConnect.clickerInterval = null;
						btn.textContent = "ON";
						btn.style.backgroundColor = "#34C759";
					} else {
						CasesConnect.clickerInterval = setInterval(
							CasesConnect.autoClickTask,
							16000,
						);
						btn.textContent = "OFF";
						btn.style.backgroundColor = "#FF3B30";
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
			Utils.createEl("button", {
				html: '<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 16px; height: 16px; filter: invert(1);"><span id="flup-badge" class="qm-badge">+</span>',
				title: "Click Follow-up Item",
				className: "qm-btn",
				style: { backgroundColor: "#0071E3" },
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
				.catch(() => { });

			const flupBtn = Utils.createEl("button", {
				textContent: "FL Up:",
				title: "Set Follow-up",
				className: "qm-btn",
				style: { backgroundColor: "#30B0C7", paddingRight: "44px" },
				parent: panel,
				onClick: async (e) => {
					if (e.target.id === "qm-flup-in") return;
					try {
						flupBtn.style.opacity = "0.6";
						flupBtn.style.pointerEvents = "none";

						const daysOffset =
							parseInt(Utils.$("#qm-flup-in").value, 10) || 0;

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
							const targetDate = new Date();
							for (let counter = 0; counter < daysOffset;) {
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
						if (typeEl) {
							typeEl.click();
							await Utils.sleep(200);
						}

						// --- INJECT / REPLACE NOTE CASE AFTER TIME IS CONFIGURED ---
						const noteID = "noteCaseUI";
						const followUpVal =
							Utils.$('[data-infocase="follow_up_time"]')
								?.dataset?.valchoice || "NA";
						const caseNoteTarget = Utils.$(
							'[aria-label="Case Note"]',
						);
						const existingTemplate = Utils.$("#" + noteID);

						const templateHTML = `
                            <div id="${noteID}" class="cdtx__uioncall">
                                <div class="cdtx__uioncall_control">
                                    <span class="cdtx__uioncall_control-load" data-text="Split &amp; Transfer" data-btnclk="oncall_templ_lt_template">&nbsp;</span>
                                    <span class="cdtx__uioncall_control-load" data-text="List" data-btnclk="oncall_templ_act_load">&nbsp;</span>
                                    <span class="cdtx__uioncall_control-save" data-text="Save" data-btnclk="oncall_templ_act_save" data-btntooltip="Save template Reuse">&nbsp;</span>
                                    <span class="cdtx__uioncall_control-remove" data-text="Remove" data-btnclk="oncall_templ_act_remove">&nbsp;</span>
                                </div>
                                <article class="cdtx__uioncall_outer">
                                    <p dir="auto"><b>Sub-status:&nbsp;&nbsp;<span class="_sub_i" data-btnclk="choice_status_list" data-infocase="status_case">Click Choice</span></b> </p>
                                    <p dir="auto"><b>Verify GA4/GTM:</b>&nbsp;&nbsp; </p>
                                    <p dir="auto"><b>Sub-status Reason:</b><span class="cdtx__uioncall-oct_test"></span>&nbsp;&nbsp; </p>
                                    <p dir="auto"><b data-btnclk="oncall_templ_act_flchoice" data-dateformat="d/m/Y">FL:&nbsp;&nbsp;</b><span data-text="oncall_templ_act_flchoice-text">${Utils.escapeHtml(followUpVal)}</span></p>
                                    <p dir="auto"><b>On Call Comments:&nbsp;&nbsp; </b></p>
                                    <p dir="auto"><p dir="auto"><ul dir="auto"><li><b></b></li></ul></p></p>
                                    <p dir="auto"><b>Next Course of Action:&nbsp;&nbsp; </b></p>
                                    <p dir="auto"><b data-btnclk="oncall_templ_act_taskchoice">Tags Implemented:&nbsp;&nbsp;</b><span data-text="oncall_templ_act_taskchoice-text"></span></p>
                                    <p dir="auto"><b><span>Screenshots: Attach</span></b></p>
                                    <p dir="auto"><p dir="auto"><ul dir="auto"><li><b></b></li></ul></p></p>
                                    <p dir="auto"><b>Multiple CIDs:&nbsp;&nbsp;</b>NA</p>
                                    <p dir="auto"><b><span>On Call Screenshot: Attach</span></b></p>
                                </article>
                            </div>`.trim();

						if (existingTemplate) {
							existingTemplate.outerHTML = templateHTML;
							caseNoteTarget?.dispatchEvent(
								new Event("input", { bubbles: true }),
							);
						} else if (caseNoteTarget) {
							caseNoteTarget.insertAdjacentHTML(
								"beforeend",
								templateHTML,
							);
							caseNoteTarget.dispatchEvent(
								new Event("input", { bubbles: true }),
							);
						}
					} catch (err) {
						console.error("Follow up script failed", err);
					} finally {
						flupBtn.style.opacity = "1";
						flupBtn.style.pointerEvents = "auto";
					}
				},
			});

			Utils.createEl("input", {
				id: "qm-flup-in",
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
				style: { backgroundColor: "#8E8E93", color: "#FFFFFF" },
				parent: panel,
				onmousedown: (e) => e.preventDefault(),
				onClick: () => {
					const sel = window.getSelection();
					if (!sel?.rangeCount) {
						return alert(
							"Please click inside the email body to place your cursor first.",
						);
					}

					const node = sel.getRangeAt(0).startContainer.parentNode;
					if (!node?.closest("[contenteditable]")) {
						return alert(
							"Please place your cursor inside the text area where you want the signature.",
						);
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

					document.execCommand(
						"insertHTML",
						false,
						Utils.toSafeHTML(htmlString),
					);
				},
			});
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
