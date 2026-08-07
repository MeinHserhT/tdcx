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

		static async promptUser() {
			return new Promise((resolve) => {
				const statusOptions = [
					{ id: "SO", label: "Solution Offered" },
					{ id: "NI", label: "Need Attention" },
					{ id: "IN", label: "Inactive" },
				];

				// The options for Step 3 (Waiting Validation specific tasks)
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
					style: {
						position: "fixed",
						top: "0",
						left: "0",
						width: "100%",
						height: "100%",
						background: "rgba(15, 23, 42, 0.4)",
						backdropFilter: "blur(2px)",
						WebkitBackdropFilter: "blur(2px)",
						zIndex: "99999",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontFamily: "Inter, system-ui, sans-serif",
						opacity: "0",
						transition: "opacity 0.2s ease-out",
					},
					parent: document.body,
				});

				const modal = Utils.createEl("div", {
					style: {
						background: "#ffffff",
						padding: "16px",
						borderRadius: "12px",
						width: "90%",
						maxWidth: "260px",
						boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
						transform: "translateY(8px) scale(0.97)",
						transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
						display: "flex",
						flexDirection: "column",
						gap: "8px",
						boxSizing: "border-box",
					},
					parent: overlay,
				});

				const headerDiv = Utils.createEl("div", {
					style: { marginBottom: "4px" },
					html: `
                        <h3 style="margin: 0; color: #111827; font-size: 15px; font-weight: 600;">Task Profile</h3>
                        <div id="step-title" style="color: #6b7280; font-size: 12px; margin-top: 2px;"></div>
                    `,
					parent: modal,
				});

				const optionsContainer = Utils.createEl("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: "6px",
						maxHeight: "55vh",
						overflowY: "auto",
						paddingRight: "2px",
					},
					parent: modal,
				});

				const navContainer = Utils.createEl("div", {
					style: { display: "flex", gap: "6px", marginTop: "4px" },
					parent: modal,
				});

				requestAnimationFrame(() => {
					overlay.style.opacity = "1";
					modal.style.transform = "translateY(0) scale(1)";
				});

				const closeDialog = (result) => {
					overlay.style.opacity = "0";
					modal.style.transform = "translateY(8px) scale(0.97)";
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
						style: {
							flex: "1",
							padding: "8px 12px",
							cursor: "pointer",
							background: bg,
							border: `1px solid ${bg === "transparent" ? "transparent" : "#e5e7eb"}`,
							borderRadius: "8px",
							color: textColor,
							fontSize: "13px",
							fontWeight: "500",
							textAlign: bg === "transparent" ? "center" : "left",
							transition: "all 0.15s ease",
						},
					});
					btn.onmouseover = () => (btn.style.background = hoverBg);
					btn.onmouseout = () => (btn.style.background = bg);
					return btn;
				};

				// STEP 1
				const showStatusOptions = () => {
					Utils.$("#step-title", modal).innerText =
						"Step 1: Select Status";
					optionsContainer.innerHTML = "";
					navContainer.innerHTML = "";

					statusOptions.forEach((s) => {
						createBtn(
							s.label,
							optionsContainer,
							"#f9fafb",
							"#eff6ff",
							"#374151",
							() => {
								selectedStatus = s;
								showTasks();
							},
						);
					});

					createBtn(
						"Cancel",
						navContainer,
						"transparent",
						"#f3f4f6",
						"#6b7280",
						() => closeDialog(null),
					);
				};

				// STEP 2
				const showTasks = () => {
					Utils.$("#step-title", modal).innerText =
						"Step 2: Select Task";
					optionsContainer.innerHTML = "";
					navContainer.innerHTML = "";

					const activeTasks = tasksByStatus[selectedStatus.id] || [];

					activeTasks.forEach((task) => {
						createBtn(
							task.label,
							optionsContainer,
							"#f9fafb",
							"#eff6ff",
							"#374151",
							() => {
								selectedTask = task;

								// If user picked Need Attention -> Waiting Validation, branch to Step 3
								if (
									selectedStatus.id === "NI" &&
									task.id === "WAIT_VALIDATION"
								) {
									showSubTasks();
								} else {
									closeDialog({
										status: selectedStatus,
										task: selectedTask,
									});
								}
							},
						);
					});

					createBtn(
						"Back",
						navContainer,
						"#f3f4f6",
						"#e5e7eb",
						"#4b5563",
						showStatusOptions,
					);
					createBtn(
						"Cancel",
						navContainer,
						"transparent",
						"#f3f4f6",
						"#6b7280",
						() => closeDialog(null),
					);
				};

				// STEP 3 (Only for Waiting Validation)
				const showSubTasks = () => {
					Utils.$("#step-title", modal).innerText =
						"Step 3: Select Validation Task";
					optionsContainer.innerHTML = "";
					navContainer.innerHTML = "";

					validationSubTasks.forEach((subTask) => {
						createBtn(
							subTask.label,
							optionsContainer,
							"#f9fafb",
							"#eff6ff",
							"#374151",
							() => {
								closeDialog({
									status: selectedStatus,
									task: selectedTask,
									subTask: subTask, // Pass the step 3 result along
								});
							},
						);
					});

					createBtn(
						"Back",
						navContainer,
						"#f3f4f6",
						"#e5e7eb",
						"#4b5563",
						showTasks,
					);
					createBtn(
						"Cancel",
						navContainer,
						"transparent",
						"#f3f4f6",
						"#6b7280",
						() => closeDialog(null),
					);
				};

				// Init Step 1
				showStatusOptions();
			});
		}

		static buildConfig(options) {
			let mappedStatus = "";
			let mappedSubStatus = "";

			// Setup defaults
			let fillExtraOptions = false;
			let taskTypeArr = [];
			let ecFeasible = "Not Applicable (N/A)";
			let ecOption = "Not Applicable (N/A)";
			let ga4Features = ["Not Applicable (N/A)"];

			// Shared switch statement function for Step 2 (SO) and Step 3 (NI -> Waiting Validation)
			const applyTaskLogic = (taskId) => {
				switch (taskId) {
					case "CT":
						taskTypeArr = ["Ads Conversion Tracking"];
						break;
					case "EC":
						taskTypeArr = ["Enhanced Conversions for Web (ECW)"];
						ecFeasible = "No";
						ecOption = "Manual";
						break;
					case "GA4":
						taskTypeArr = ["GA4 Setup (no Analytics in place yet)"];
						ga4Features = ["Tagging"];
						break;
					case "GA4_UPD":
						taskTypeArr = [
							"Enhanced Conversions - GA4 User Provided Data",
						];
						ga4Features = ["Other Conversions"];
						ecFeasible = "No";
						ecOption = "Manual";
						break;
					case "AUD":
						taskTypeArr = [
							"Ads Standard Remarketing",
							"GA4 Standard Remarketing",
						];
						ga4Features = ["Standard Audiences"];
						break;
				}
			};

			// 1. Map Status Group
			if (options.status.id === "SO") {
				mappedStatus = "Implemented";
				mappedSubStatus = "SO - Implementation only";
				fillExtraOptions = true;
				applyTaskLogic(options.task.id); // Apply logic from Step 2 choice
			} else if (options.status.id === "NI") {
				mappedStatus = "In Progress";

				if (options.task.id === "WAIT_INPUT") {
					mappedSubStatus = "NI - Awaiting Inputs";
				} else if (options.task.id === "WAIT_VALIDATION") {
					mappedSubStatus = "NI - Awaiting Validation";
					fillExtraOptions = true;
					applyTaskLogic(options.subTask.id); // Apply logic from Step 3 choice
				} else if (options.task.id === "IN_CONSULT") {
					mappedSubStatus = "NI - In Consult";
				}
			} else if (options.status.id === "IN") {
				mappedStatus = "Inactive";
				mappedSubStatus = "Inactive - Unreachable";
			}

			// Create base config structure
			const config = {
				ldap: "",
				date: "",
				status: mappedStatus,
				subStatus: mappedSubStatus,
				radioQs: [],
				checkboxQs: [],
			};

			// Only inject the extra choices if it was SO, or NI -> Waiting Validation
			if (fillExtraOptions) {
				config.radioQs = [
					{ title: "If task type was EC", choice: ecFeasible },
					{ title: "what option was used", choice: ecOption },
					{ title: "Was it a GTM implementation", choice: "Yes" },
					{
						title: "If COMO task was implemented",
						choice: "Not Applicable (N/A)",
					},
					{ title: "If Customer Match", choice: "None" },
					{ title: "CMS / Platform", choice: "Didn't check" },
				];

				config.checkboxQs = [
					{ title: "Task Type", choices: taskTypeArr },
					{
						title: "For GA4 Cases, what exact features",
						choices: ga4Features,
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

				Utils.$(QPlusAutomator.SELECTORS.takeCase)?.click();
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

				// These will safely skip if they were left empty (for non-applicable cases)
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

	const AppRouter = {
		init() {
			QPlusAutomator.run();
		},
	};

	if (["complete", "interactive"].includes(document.readyState)) {
		AppRouter.init();
	} else {
		window.addEventListener("DOMContentLoaded", () => AppRouter.init());
	}
})();

(function () {
	// 1. Extract your variable from the page (DOM, inline script, text, etc.)

	// 2. Send the extracted variable to the background/extension logic
	chrome.runtime.sendMessage(
		"jkoemmkocjacgolhnfegemilnlkbaolo",
		{ status: "success", payload: "User info" },

		(response) => {
			if (chrome.runtime.lastError) {
				console.error(
					"Failed to send message:",
					chrome.runtime.lastError.message,
				);
			} else {
				console.log("Server response:", response?.status);
			}
		},
	);
})();
