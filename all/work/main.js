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
	// 2. FEATURE: GOOGLE TAG INSPECTOR
	// ==========================================
	class TagInspector {
		static TAG_REGEX = /\b(GTM-[A-Z0-9]{4,10}|G-[A-Z0-9]{6,12}|AW-\d+)\b/g;
		static PRIORITIES = { GTM: 1, G: 2, AW: 3 };
		static THEMES = {
			"GTM-": {
				bg: "rgba(224, 242, 254, 0.6)",
				border: "rgba(186, 230, 253, 0.8)",
				color: "#0369a1",
			},
			"G-": {
				bg: "rgba(254, 249, 195, 0.6)",
				border: "rgba(254, 240, 138, 0.8)",
				color: "#854d0e",
			},
			"AW-": {
				bg: "rgba(220, 252, 231, 0.6)",
				border: "rgba(187, 247, 208, 0.8)",
				color: "#166534",
			},
			default: {
				bg: "rgba(243, 244, 246, 0.6)",
				border: "rgba(229, 231, 235, 0.8)",
				color: "#374151",
			},
		};

		static injectStyles() {
			Utils.addStyle(
				"tag-inspector-styles",
				`
				.ti-overlay { 
					position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
					background-color: rgba(0, 0, 0, 0.55); 
					z-index: 999999; display: flex; align-items: center; justify-content: center; 
					font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", sans-serif; 
				}
				.ti-modal { 
					background-color: rgba(255, 255, 255, 0.85); 
					backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
					border-radius: 20px; padding: 24px; width: 90%; max-width: 420px; max-height: 80vh; 
					box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04); 
					border: 1px solid rgba(255, 255, 255, 0.8); display: flex; flex-direction: column; gap: 16px; box-sizing: border-box; 
				}
				.ti-table-container { 
					overflow-y: auto; max-height: 50vh; border-radius: 14px; 
					background-color: rgba(255, 255, 255, 0.5); 
					backdrop-filter: blur(10px);
				}
				.ti-table-container.has-border { border: 1px solid rgba(0, 0, 0, 0.06); }
				.ti-row { border-bottom: 1px solid rgba(0, 0, 0, 0.04); transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
				.ti-row:last-child { border-bottom: none; }
				.ti-row:hover { background-color: rgba(255, 255, 255, 0.8); }
				.ti-tag-btn { 
					font-weight: 600; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; 
					font-size: 12px; border-radius: 9999px; padding: 4px 12px; cursor: pointer; 
					transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); 
				}
				.ti-tag-btn:hover { transform: scale(1.02); }
				.ti-tag-btn:active { transform: scale(0.97); }
				.ti-action-btn { 
					padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; 
					border-radius: 9999px; background-color: #0071E3; color: #ffffff; 
					box-shadow: 0 2px 8px rgba(0, 113, 227, 0.2);
					transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); 
				}
				.ti-action-btn:hover { background-color: #0077ED; box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3); transform: translateY(-1px); }
				.ti-action-btn:active { transform: scale(0.96); }
				.ti-btn-gear { 
					padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; 
					border-radius: 9999px; background-color: rgba(0, 0, 0, 0.05); color: #1D1D1F; 
					transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); 
				}
				.ti-btn-gear:hover { background-color: rgba(0, 0, 0, 0.08); }
				.ti-btn-gear:active { transform: scale(0.96); }
				.ti-btn-close { 
					padding: 8px 20px; font-size: 13px; font-weight: 500; cursor: pointer; 
					border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 9999px; background-color: #FFFFFF; color: #1D1D1F; 
					transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 2px 6px rgba(0,0,0,0.02);
				}
				.ti-btn-close:hover { background-color: #F5F5F7; border-color: rgba(0, 0, 0, 0.15); }
				.ti-btn-close:active { transform: scale(0.96); }
			`,
			);
		}

		static scanTags() {
			const tagSet = new Set();
			Array.from(document.scripts).forEach((script) => {
				const sources = [script.src, script.outerHTML].filter(Boolean);
				sources.forEach((text) => {
					const matches = text.match(TagInspector.TAG_REGEX);
					if (matches) matches.forEach((tag) => tagSet.add(tag));
				});
			});

			return Array.from(tagSet).sort((a, b) => {
				const getPrio = (tag) => {
					const prefix = tag.split("-")[0];
					return TagInspector.PRIORITIES[prefix] || 4;
				};
				return getPrio(a) - getPrio(b) || a.localeCompare(b);
			});
		}

		static getTagTheme(tag) {
			const key = Object.keys(TagInspector.THEMES).find((prefix) =>
				tag.startsWith(prefix),
			);
			return TagInspector.THEMES[key] || TagInspector.THEMES.default;
		}

		static getActionLabel(tag) {
			if (tag.startsWith("G-")) return "GA4 ICS ↗";
			if (tag.startsWith("GTM-")) return "GTM ICS ↗";
			if (tag.startsWith("AW-")) return "ADS ICS ↗";
			return "Open ↗";
		}

		static init() {
			TagInspector.injectStyles();
			const tags = this.scanTags();

			Utils.$("#apple-gtag-overlay")?.remove();

			const overlay = Utils.createEl("div", {
				id: "apple-gtag-overlay",
				className: "ti-overlay",
				parent: document.body,
				onClick: (e) => {
					if (e.target === overlay) overlay.remove();
				},
			});

			const modal = Utils.createEl("div", {
				className: "ti-modal",
				parent: overlay,
			});

			const tableContainer = Utils.createEl("div", {
				className: `ti-table-container ${tags.length > 0 ? "has-border" : ""}`,
				parent: modal,
			});

			if (tags.length === 0) {
				Utils.createEl("div", {
					parent: tableContainer,
					style: "text-align: center; color: #86868B; padding: 32px 16px; font-size: 14px; font-weight: 400;",
					text: "No Google Tags found on this page.",
				});
			} else {
				const table = Utils.createEl("table", {
					parent: tableContainer,
					style: "width: 100%; border-collapse: collapse; text-align: left;",
					html: `
                    <thead>
                        <tr style="background-color: rgba(250, 250, 252, 0.6); border-bottom: 1px solid rgba(0,0,0,0.06);">
                            <th style="padding: 12px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #86868B;">Tag ID</th>
                            <th style="padding: 12px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #86868B; text-align: right;">Action</th>
                        </tr>
                    </thead>`,
				});

				const tbody = Utils.createEl("tbody", { parent: table });

				tags.forEach((tag) => {
					const theme = this.getTagTheme(tag);
					const row = Utils.createEl("tr", {
						className: "ti-row",
						parent: tbody,
					});

					const tdTag = Utils.createEl("td", {
						parent: row,
						style: "padding: 12px 16px;",
					});

					const tagBtn = Utils.createEl("button", {
						parent: tdTag,
						className: "ti-tag-btn",
						text: tag,
						title: "Click to copy",
						style: `color: ${theme.color}; background-color: ${theme.bg}; border: 1px solid ${theme.border};`,
					});
					Utils.setupCopy(tagBtn, tag);

					const tdAction = Utils.createEl("td", {
						parent: row,
						style: "padding: 12px 16px; text-align: right;",
					});

					Utils.createEl("button", {
						parent: tdAction,
						className: "ti-action-btn",
						text: TagInspector.getActionLabel(tag),
						onClick: () => {
							const url = tag.startsWith("AW-")
								? `https://adwords.corp.google.com/aw_internalops/go?conversiontrackingid=${tag.replace("AW-", "")}`
								: `https://tagmanager-ics.corp.google.com/home?q=${tag}`;
							window.open(url, "_blank");
						},
					});
				});
			}

			const footer = Utils.createEl("div", {
				parent: modal,
				style: "display: flex; justify-content: space-between; align-items: center; padding-top: 4px;",
			});

			Utils.createEl("button", {
				parent: footer,
				className: "ti-btn-gear",
				text: "Gearloose ↗",
				onClick: () =>
					window.open(
						`https://gearloose.corp.google.com/#/search?q=${encodeURIComponent(location.host)}&tab=merchants`,
						"_blank",
					),
			});

			Utils.createEl("button", {
				parent: footer,
				className: "ti-btn-close",
				text: "Close",
				onClick: () => overlay.remove(),
			});
		}
	}

	// ==========================================
	// 3. FEATURE: QPLUS AUTOMATOR
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

				const showStatusOptions = () => {
					Utils.$("#step-title", modal).innerText =
						"Step 1: Select Status";
					optionsContainer.innerHTML = "";
					navContainer.innerHTML = "";

					statusOptions.forEach((s) => {
						createBtn(
							s.label,
							optionsContainer,
							"rgba(255, 255, 255, 0.6)",
							"#0071E3",
							"#1D1D1F",
							function () {
								selectedStatus = s;
								showTasks();
							},
						);
					});

					createBtn(
						"Cancel",
						navContainer,
						"transparent",
						"rgba(0,0,0,0.04)",
						"#86868B",
						() => closeDialog(null),
					);
				};

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
							"rgba(255, 255, 255, 0.6)",
							"rgba(0, 113, 227, 0.08)",
							"#1D1D1F",
							() => {
								selectedTask = task;
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
						"rgba(0, 0, 0, 0.04)",
						"rgba(0, 0, 0, 0.08)",
						"#1D1D1F",
						showStatusOptions,
					);
					createBtn(
						"Cancel",
						navContainer,
						"transparent",
						"rgba(0, 0, 0, 0.04)",
						"#86868B",
						() => closeDialog(null),
					);
				};

				const showSubTasks = () => {
					Utils.$("#step-title", modal).innerText =
						"Step 3: Select Validation Task";
					optionsContainer.innerHTML = "";
					navContainer.innerHTML = "";

					validationSubTasks.forEach((subTask) => {
						createBtn(
							subTask.label,
							optionsContainer,
							"rgba(255, 255, 255, 0.6)",
							"rgba(0, 113, 227, 0.08)",
							"#1D1D1F",
							() => {
								closeDialog({
									status: selectedStatus,
									task: selectedTask,
									subTask,
								});
							},
						);
					});

					createBtn(
						"Back",
						navContainer,
						"rgba(0, 0, 0, 0.04)",
						"rgba(0, 0, 0, 0.08)",
						"#1D1D1F",
						showTasks,
					);
					createBtn(
						"Cancel",
						navContainer,
						"transparent",
						"rgba(0, 0, 0, 0.04)",
						"#86868B",
						() => closeDialog(null),
					);
				};

				showStatusOptions();
			});
		}

		static buildConfig(options) {
			let mappedStatus = "";
			let mappedSubStatus = "";
			let fillExtraOptions = false;
			let taskTypeArr = [];
			let ecFeasible = "Not Applicable (N/A)";
			let ecOption = "Not Applicable (N/A)";
			let ga4Features = ["Not Applicable (N/A)"];

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

			if (options.status.id === "SO") {
				mappedStatus = "Implemented";
				mappedSubStatus = "SO - Implementation only";
				fillExtraOptions = true;
				applyTaskLogic(options.task.id);
			} else if (options.status.id === "NI") {
				mappedStatus = "In Progress";
				if (options.task.id === "WAIT_INPUT") {
					mappedSubStatus = "NI - Awaiting Inputs";
				} else if (options.task.id === "WAIT_VALIDATION") {
					mappedSubStatus = "NI - Awaiting Validation";
					fillExtraOptions = true;
					applyTaskLogic(options.subTask.id);
				} else if (options.task.id === "IN_CONSULT") {
					mappedSubStatus = "NI - In Consult";
				}
			} else if (options.status.id === "IN") {
				mappedStatus = "Inactive";
				mappedSubStatus = "Inactive - Unreachable";
			}

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
						) {
							input.click();
						}
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
            
            .agent-left { position: relative; z-index: 1; display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 12px; }
            .agent-avatar { width: 26px; height: 26px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(0,0,0,0.05); }
            .agent-right { position: relative; z-index: 1; display: flex; align-items: center; gap: 10px; text-align: right; }
            .agent-meta { display: flex; flex-direction: column; }
            .time-state { font-size: 10px; font-weight: 500; opacity: 0.8; }
            .status-text { font-size: 10px; font-weight: 600; letter-spacing: 0.2px; display: inline-block; margin-top: 1px; }
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
								rawStatus1,
								rawStatus2,
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

									return `
                        <div class="agent-row ${agent.cssClass} ${isOverTime ? "over-time" : ""}" style="${styleVars}">
                            ${bgIconsContainer}
                            <div class="agent-left">
                                <img class="agent-avatar" src="${Utils.escapeHtml(agent.img)}" alt="${Utils.escapeHtml(agent.ldap)}" loading="lazy" />
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
					CaseMon.isRunning = false;
					observer.disconnect();
				}
			});

			updateDashboard();
		}
	}

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
				"cases-styles",
				`
                #panelQM { 
					position: fixed; bottom: 20px; left: 20px; display: flex; gap: 8px; align-items: center; 
					z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif; 
				}
                .qm-btn { 
					z-index: 10; color: #FFFFFF; padding: 10px 16px; border: none; border-radius: 12px; cursor: pointer; 
					font-weight: 600; font-size: 13px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); 
					backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
					transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); position: relative; display: flex; align-items: center; justify-content: center; 
					border: 1px solid rgba(255, 255, 255, 0.3); 
				}
                .qm-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
				.qm-btn:active { transform: scale(0.96); }
                #flup-days-input { 
					position: absolute; top: 50%; transform: translateY(-50%); right: 6px; width: 28px; height: 24px; 
					padding: 0; border: none; border-radius: 6px; background: rgba(255, 255, 255, 0.9); color: #1D1D1F; 
					font-weight: 700; font-size: 12px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06); 
					transition: all 0.2s ease; -moz-appearance: textfield; 
				}
                #flup-days-input:focus { outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06), 0 0 0 2px #0071E3; }
                .qm-badge { display: none; position: absolute; top: -4px; right: -4px; background: #FF3B30; border-radius: 9999px; padding: 2px 6px; font-size: 10px; font-weight: 700; line-height: 1; border: 1.5px solid #FFFFFF; }
                .aw-sig-table { margin: 12px 0; }
            `,
			);

			const panel = Utils.createEl("div", {
				id: "panelQM",
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
				.catch(() => {});

			const flupBtn = Utils.createEl("button", {
				textContent: "FL Up:",
				title: "Set Follow-up",
				className: "qm-btn",
				style: { backgroundColor: "#30B0C7", paddingRight: "44px" },
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
				style: { backgroundColor: "#8E8E93", color: "#FFFFFF" },
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
						((html) => {
							if (window.trustedTypes?.createPolicy) {
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
	// 6. FEATURE: ADWORDS
	// ==========================================
	class AdWords {
		static async init() {
			Utils.addStyle(
				"aw-styles",
				`
            .aw-ga4 { background-color: rgba(255, 149, 0, 0.12); color: #C77000; border: 1px solid rgba(255, 149, 0, 0.2); padding: 3px 8px; border-radius: 8px; font-weight: 600; cursor: pointer; user-select: none; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
            .aw-ads { background-color: rgba(52, 199, 89, 0.12); color: #248A3D; border: 1px solid rgba(52, 199, 89, 0.2); padding: 3px 8px; border-radius: 8px; font-weight: 600; cursor: pointer; user-select: none; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
            .aw-copied { background-color: #0071E3 !important; color: #FFFFFF !important; border-color: transparent !important; }
            #gpt-aw-container { position: fixed; bottom: 20px; left: 20px; z-index: 999; display: flex; flex-direction: column; gap: 8px; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; }
            .gpt-aw-row { display: flex; gap: 6px; align-items: center; }
            .gpt-aw-badge { 
				padding: 8px 14px; background: rgba(29, 29, 31, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); 
				color: #F5F5F7; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; 
				font-size: 12px; font-weight: 600; font-family: ui-monospace, SFMono-Regular, monospace; 
				box-shadow: 0 4px 16px rgba(0,0,0,0.12); cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); user-select: none; 
			}
            .gpt-aw-badge:hover { background: rgba(29, 29, 31, 0.95); transform: translateY(-1px); }
            .gpt-aw-btn { 
				padding: 8px 14px; background: #0071E3; color: #ffffff; border: none; 
				border-radius: 12px; font-size: 12px; font-weight: 600; 
				box-shadow: 0 4px 16px rgba(0, 113, 227, 0.25); cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); user-select: none; 
			}
            .gpt-aw-btn:hover { background: #0077ED; box-shadow: 0 6px 20px rgba(0, 113, 227, 0.35); transform: translateY(-1px); }
			.gpt-aw-btn:active { transform: scale(0.96); }
        `,
			);

			const isDataReady = await Utils.pollForCondition(
				() => window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS,
				600,
				5,
			);
			if (isDataReady) {
				AdWords.processData(
					window.conversions_data.SHARED_ALL_ENABLED_CONVERSIONS,
				);
			}
		}

		static getSelectedConversionIds() {
			const rows = Utils.$$(".particle-table-row");
			const selectedIds = rows
				.filter((row) => {
					const checkbox = row.querySelector("mat-checkbox");
					return (
						row.classList.contains("particle-row-selected") ||
						checkbox?.getAttribute("aria-checked") === "true" ||
						checkbox?.hasAttribute("checked") ||
						checkbox
							?.querySelector(".mat-checkbox-container")
							?.classList.contains("checked")
					);
				})
				.map((row) => {
					const cell = row.querySelector(
						".conversion-name-cell .internal",
					);
					const link = row.querySelector("a.ess-cell-link");
					const hrefCtId = link?.href?.match(/ctId=(\d+)/)?.[1];
					const rawId =
						cell?.dataset?.originalId ||
						hrefCtId ||
						cell?.innerText?.trim() ||
						"";
					const match = rawId.match(/\d+/);
					return match ? match[0] : null;
				})
				.filter(Boolean);

			return [...new Set(selectedIds)];
		}

		static processData(rawData) {
			const matches = [...rawData.matchAll(/AW-(\d+)/g)];
			const uniqueIds = [...new Set(matches.map((m) => m[1]))];

			const container =
				Utils.$("#gpt-aw-container") ||
				Utils.createEl("div", {
					id: "gpt-aw-container",
					parent: document.body,
				});
			container.innerHTML = "";

			uniqueIds.forEach((idStr) => {
				const row = Utils.createEl("div", {
					className: "gpt-aw-row",
					parent: container,
				});

				const badge = Utils.createEl("div", {
					className: "gpt-aw-badge",
					text: `AW-${idStr}`,
					parent: row,
				});
				Utils.setupCopy(badge, idStr, "Copied!");
			});

			const btnRow = Utils.createEl("div", {
				className: "gpt-aw-row",
				parent: container,
			});

			Utils.createEl("button", {
				className: "gpt-aw-btn",
				text: "EC Dashboard ↗",
				parent: btnRow,
				onClick: () => {
					const selectedIds = AdWords.getSelectedConversionIds();
					if (selectedIds.length === 0) {
						alert(
							"Vui lòng tích chọn ít nhất 1 dòng chuyển đổi trên bảng!",
						);
						return;
					}
					const idListParam = selectedIds.join(",");
					const url = `https://dashboards.corp.google.com/view/_0ded1099_6ef3_4bc9_bba0_2445840d1b69?f=conversion_type_l3j54n:in:${idListParam}`;
					window.open(url, "_blank");
				},
			});

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

							const originalText = cell.innerText?.trim() || "";
							const numericMatch = originalText.match(/\d+/);
							if (numericMatch) {
								cell.dataset.originalId = numericMatch[0];
							}

							const mappedData = dataMap.get(originalText);
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
									mappedData[64]?.[1]?.[4]?.split("'")?.[3];
							}

							if (type && convId) {
								cell.textContent = convId;
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
