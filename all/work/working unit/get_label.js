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
	// 6. FEATURE: ADWORDS
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
                .gpt-aw-row { display: flex; gap: 6px; align-items: center; }
                .gpt-aw-badge { padding: 8px 14px; background: #161920; color: #F1F3F5; border: 1px solid #2D323F; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: monospace; box-shadow: 0 4px 16px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s ease; user-select: none; }
                .gpt-aw-badge:hover { background: #2D323F; }
                .gpt-aw-btn { padding: 8px 12px; background: #0071e3; color: #ffffff; border: 1px solid #0071e3; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s ease; user-select: none; }
                .gpt-aw-btn:hover { background: #0077ed; }
            `,
			);

			const isDataReady = await Utils.pollForCondition(
				() => window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS,
				600,
				5,
			);

			if (isDataReady) {
				// Check if the Goals button has been clicked/selected
				const navGoals = Utils.$('[id="navigation.goals"]');
				const isSelected = navGoals?.querySelector(".selected");

				if (navGoals && !isSelected) {
					Utils.$('[id="navigation.goals"] a').click();
				}

				try {
					// Wait for conversion-goal-card element to appear before proceeding
					await Utils.waitForElement('[id*="diagnosticsHome"]');
				} catch (err) {
					console.warn(
						"diagnosticsHome did not appear within timeout:",
						err,
					);
				}

				// Extract conversion ID and label
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

					let url;
					if (selectedIds.length > 0) {
						const idListParam = selectedIds.join(",");
						url = `https://dashboards.corp.google.com/view/_0ded1099_6ef3_4bc9_bba0_2445840d1b69?f=conversion_type_l3j54n:in:${idListParam}`;
					} else if (uniqueIds.length > 0) {
						const trackingIdsParam = uniqueIds.join(",");
						url = `https://dashboards.corp.google.com/view/_0ded1099_6ef3_4bc9_bba0_2445840d1b69?f=conversion_tracking_id_5nuehn:in:${trackingIdsParam}`;
					} else {
						alert(
							"No conversion rows selected and no AW tracking IDs found!",
						);
						return;
					}

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
