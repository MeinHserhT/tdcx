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
	// 3. FEATURE: QPLUS AUTOMATOR
	// ==========================================
	class QPlusAutomator {
		static SELECTORS = {
			questionContainer: ".question-container",
			questionText: ".question-text",
			label: "label.mdc-label, label, .mat-radio-label, .mat-mdc-radio-button, mat-radio-button, mat-checkbox",
			textarea: 'textarea[formcontrolname="selectedText"]',
			autoSuggestion: "span.auto-suggestion-text",
			radioParent: "mat-radio-button",
			checkboxParent: "mat-checkbox",
			input: "input",
			takeCase: '[aria-label="Take the task"]',
		};

		static TASK_METRICS = {
			CT: { taskType: ["Ads Conversion Tracking"] },
			EC: {
				taskType: ["Enhanced Conversions for Web (ECW)"],
				ecFeasible: "No",
				ecOption: "Manual",
			},
			GA4: {
				taskType: ["GA4 Setup (no Analytics in place yet)"],
				ga4Features: ["Tagging"],
			},
			GA4_UPD: {
				taskType: ["Enhanced Conversions - GA4 User Provided Data"],
				ga4Features: ["Other Conversions"],
				ecFeasible: "No",
				ecOption: "Manual",
			},
			AUD: {
				taskType: [
					"Ads Standard Remarketing",
					"GA4 Standard Remarketing",
				],
				ga4Features: ["Standard Audiences"],
			},
		};

		static async promptUser() {
			return new Promise((resolve) => {
				const statusOptions = [
					{ id: "SO", label: "Solution Offered" },
					{ id: "NI", label: "Need Attention" },
					{ id: "IN", label: "Inactive" },
				];

				const validationSubTasks = [
					{ id: "CT", label: "Conversion Tracking" },
					{ id: "EC", label: "Enhanced Conversion Tracking" },
					{ id: "GA4", label: "GA4 setup" },
					{ id: "GA4_UPD", label: "GA4 UPD" },
					{ id: "AUD", label: "Ads Audiences" },
				];

				const tasksByStatus = {
					SO: validationSubTasks,
					NI: [
						{ id: "WAIT_INPUT", label: "Waiting Input" },
						{ id: "WAIT_VALIDATION", label: "Waiting Validation" },
						{ id: "IN_CONSULT", label: "In Consult" },
					],
					IN: [{ id: "UNREACHABLE", label: "Unreachable" }],
				};

				let selectedStatus = null;
				let selectedTask = null;

				const overlay = Utils.createEl("div", {
					style: "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.55); z-index: 99999; display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif; opacity: 0; transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);",
					parent: document.body,
				});

				const modal = Utils.createEl("div", {
					style: "background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); padding: 20px; border-radius: 20px; width: 90%; max-width: 280px; box-shadow: 0 16px 40px rgba(0,0,0,0.08); border: 1px solid rgba(255, 255, 255, 0.8); transform: translateY(12px) scale(0.96); transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; gap: 10px; box-sizing: border-box;",
					parent: overlay,
				});

				Utils.createEl("div", {
					style: "margin-bottom: 2px;",
					html: `
                    <h3 style="margin: 0; color: #1D1D1F; font-size: 16px; font-weight: 600; letter-spacing: -0.2px;">Task Profile</h3>
                    <div id="step-title" style="color: #86868B; font-size: 12px; font-weight: 500; margin-top: 2px;"></div>
                `,
					parent: modal,
				});

				const optionsContainer = Utils.createEl("div", {
					style: "display: flex; flex-direction: column; gap: 6px; max-height: 55vh; overflow-y: auto; padding-right: 2px;",
					parent: modal,
				});

				const navContainer = Utils.createEl("div", {
					style: "display: flex; gap: 6px; margin-top: 6px;",
					parent: modal,
				});

				requestAnimationFrame(() => {
					overlay.style.opacity = "1";
					modal.style.transform = "translateY(0) scale(1)";
				});

				const closeDialog = (result) => {
					overlay.style.opacity = "0";
					modal.style.transform = "translateY(12px) scale(0.96)";
					setTimeout(() => {
						overlay.remove();
						resolve(result);
					}, 200);
				};

				const createBtn = (
					text,
					parent,
					bg,
					hoverBg,
					textColor,
					onClick,
				) => {
					const btn = Utils.createEl("button", {
						text,
						parent,
						onClick,
						style: `flex: 1; padding: 10px 14px; cursor: pointer; background: ${bg}; border: 1px solid ${bg === "transparent" ? "transparent" : "rgba(0,0,0,0.05)"}; border-radius: 12px; color: ${textColor}; font-size: 13px; font-weight: 500; text-align: ${bg === "transparent" ? "center" : "left"}; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);`,
					});
					btn.onmouseover = () => (btn.style.background = hoverBg);
					btn.onmouseout = () => (btn.style.background = bg);
					return btn;
				};

				const renderStep = (title, items, onSelect, onBack) => {
					Utils.$("#step-title", modal).innerText = title;
					optionsContainer.textContent = "";
					navContainer.textContent = "";

					items.forEach((item) => {
						createBtn(
							item.label,
							optionsContainer,
							"rgba(255, 255, 255, 0.6)",
							"rgba(0, 113, 227, 0.08)",
							"#1D1D1F",
							() => onSelect(item),
						);
					});

					if (onBack) {
						createBtn(
							"Back",
							navContainer,
							"rgba(0, 0, 0, 0.04)",
							"rgba(0, 0, 0, 0.08)",
							"#1D1D1F",
							onBack,
						);
					}
					createBtn(
						"Cancel",
						navContainer,
						"transparent",
						"rgba(0, 0, 0, 0.04)",
						"#86868B",
						() => closeDialog(null),
					);
				};

				const showStatusStep = () =>
					renderStep(
						"Step 1: Select Status",
						statusOptions,
						(status) => {
							selectedStatus = status;
							showTaskStep();
						},
					);

				const showTaskStep = () =>
					renderStep(
						"Step 2: Select Task",
						tasksByStatus[selectedStatus.id] || [],
						(task) => {
							selectedTask = task;
							if (
								selectedStatus.id === "NI" &&
								task.id === "WAIT_VALIDATION"
							) {
								showSubTaskStep();
							} else {
								closeDialog({
									status: selectedStatus,
									task: selectedTask,
								});
							}
						},
						showStatusStep,
					);

				const showSubTaskStep = () =>
					renderStep(
						"Step 3: Select Validation Task",
						validationSubTasks,
						(subTask) =>
							closeDialog({
								status: selectedStatus,
								task: selectedTask,
								subTask,
							}),
						showTaskStep,
					);

				showStatusStep();
			});
		}

		static buildConfig(options) {
			const { status, task, subTask } = options;
			let mappedStatus = "";
			let mappedSubStatus = "";
			let fillExtraOptions = false;
			let targetTaskId = null;

			if (status.id === "SO") {
				mappedStatus = "Implemented";
				mappedSubStatus = "SO - Implementation only";
				fillExtraOptions = true;
				targetTaskId = task.id;
			} else if (status.id === "NI") {
				mappedStatus = "In Progress";
				const subStatusMap = {
					WAIT_INPUT: "NI - Awaiting Inputs",
					WAIT_VALIDATION: "NI - Awaiting Validation",
					IN_CONSULT: "NI - In Consult",
				};
				mappedSubStatus = subStatusMap[task.id] || "";
				if (task.id === "WAIT_VALIDATION") {
					fillExtraOptions = true;
					targetTaskId = subTask?.id;
				}
			} else if (status.id === "IN") {
				mappedStatus = "Inactive";
				mappedSubStatus = "Inactive - Unreachable";
			}

			const taskMeta =
				(targetTaskId && QPlusAutomator.TASK_METRICS[targetTaskId]) ||
				{};
			const config = {
				ldap: "",
				date: "",
				status: mappedStatus,
				subStatus: mappedSubStatus,
				radioQs: [],
				checkboxQs: [],
			};

			if (fillExtraOptions) {
				config.radioQs = [
					{
						title: "If task type was EC",
						choice: taskMeta.ecFeasible || "Not Applicable (N/A)",
					},
					{
						title: "what option was used",
						choice: taskMeta.ecOption || "Not Applicable (N/A)",
					},
					{ title: "Was it a GTM implementation", choice: "Yes" },
					{
						title: "If COMO task was implemented",
						choice: "Not Applicable (N/A)",
					},
					{ title: "If Customer Match", choice: "None" },
					{ title: "CMS / Platform", choice: "Didn't check" },
				];

				config.checkboxQs = [
					{ title: "Task Type", choices: taskMeta.taskType || [] },
					{
						title: "For GA4 Cases, what exact features",
						choices: taskMeta.ga4Features || [
							"Not Applicable (N/A)",
						],
					},
				];
			}

			return config;
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
				if (!context) {
					console.warn(
						`Question container matching "${options.title}" not found.`,
					);
					return false;
				}
			}

			const targetChoices = Array.isArray(choices) ? choices : [choices];
			const isCheckbox = Boolean(options.isCheckbox);
			let found = false;

			Utils.$$(QPlusAutomator.SELECTORS.label, context).forEach((el) => {
				const text = el.textContent.trim().replace(/\s+/g, " ");
				const isMatch = targetChoices.some(
					(target) => text === target || text.startsWith(target),
				);

				if (isMatch) {
					const parent =
						el.closest(
							isCheckbox
								? QPlusAutomator.SELECTORS.checkboxParent
								: QPlusAutomator.SELECTORS.radioParent,
						) || el;

					const input =
						parent.querySelector(QPlusAutomator.SELECTORS.input) ||
						(el.getAttribute?.("for")
							? document.getElementById(el.getAttribute("for"))
							: null);

					if (!isCheckbox || (input && !input.checked)) {
						// Click visual components first, then input
						if (parent && parent !== el) parent.click();
						el.click();
						if (input) {
							input.click();
							input.dispatchEvent(
								new Event("change", { bubbles: true }),
							);
							input.dispatchEvent(
								new Event("input", { bubbles: true }),
							);
						}
						found = true;
					}
				}
			});

			return found;
		}

		static async run() {
			const options = await QPlusAutomator.promptUser();
			if (!options)
				return console.log("🛑 Form automation cancelled by user.");

			const config = QPlusAutomator.buildConfig(options);
			try {
				console.log("Starting automation sequence...");
				Utils.$(QPlusAutomator.SELECTORS.takeCase)?.click();
				await Utils.sleep(300);

				Utils.$(
					`.footer ${QPlusAutomator.SELECTORS.takeCase}`,
				)?.click();
				await Utils.waitForElement(
					QPlusAutomator.SELECTORS.questionContainer,
				);

				// 1. Select Status
				QPlusAutomator.selectOptions(config.status);
				await Utils.sleep(400);

				// 2. Wait for dynamic sub-status questions to render in DOM
				if (config.subStatus) {
					await Utils.pollForCondition(
						() => {
							return Utils.$$(
								QPlusAutomator.SELECTORS.label,
							).some((l) =>
								l.textContent.includes(
									config.subStatus.split(" - ")[0],
								),
							);
						},
						150,
						15,
					);

					QPlusAutomator.selectOptions(config.subStatus);
					await Utils.sleep(300);
				}

				// 3. Fill text fields
				const textareas = Utils.$$(QPlusAutomator.SELECTORS.textarea);
				[config.ldap, config.date].forEach((val, idx) => {
					if (textareas[idx]) {
						textareas[idx].focus();
						textareas[idx].click();
						textareas[idx].value = val;
						QPlusAutomator.dispatchAngularEvents(textareas[idx]);
					}
				});

				// 4. Populate dynamic radios & checkboxes
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
