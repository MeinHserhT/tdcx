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
					position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; 
					background-color: rgba(0, 0, 0, 0.55) !important; 
					z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important; 
					font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", sans-serif !important; 
				}
				.ti-modal { 
					background-color: rgba(255, 255, 255, 0.85) !important; 
					backdrop-filter: blur(25px) !important; -webkit-backdrop-filter: blur(25px) !important;
					border-radius: 20px !important; padding: 24px !important; width: 90% !important; max-width: 420px !important; max-height: 80vh !important; 
					box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04) !important; 
					border: none !important; display: flex !important; flex-direction: column !important; gap: 16px !important; box-sizing: border-box !important; 
				}
				.ti-table-container { 
					overflow-y: auto !important; max-height: 50vh !important; border-radius: 14px !important; 
					background-color: rgba(255, 255, 255, 0.5) !important; 
					backdrop-filter: blur(10px) !important;
					border: none !important; box-shadow: none !important;
				}
				.ti-modal table, 
				.ti-modal thead, 
				.ti-modal tbody, 
				.ti-modal tr, 
				.ti-modal th, 
				.ti-modal td {
					border: none !important;
					outline: none !important;
					box-shadow: none !important;
					background-image: none !important;
				}
				.ti-modal table {
					width: 100% !important;
					border-collapse: collapse !important;
					border-spacing: 0 !important;
					margin: 0 !important;
					padding: 0 !important;
				}
				.ti-row { transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; }
				.ti-row:hover { background-color: rgba(255, 255, 255, 0.8) !important; }
				.ti-tag-btn { 
					font-weight: 600 !important; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important; 
					font-size: 12px !important; border-radius: 9999px !important; padding: 4px 12px !important; cursor: pointer !important; 
					transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; 
					white-space: nowrap !important; display: inline-block !important; line-height: 1.4 !important; box-sizing: border-box !important;
				}
				.ti-tag-btn:hover { transform: scale(1.02) !important; }
				.ti-tag-btn:active { transform: scale(0.97) !important; }
				.ti-action-btn { 
					display: inline-flex !important;
					align-items: center !important;
					justify-content: center !important;
					width: 92px !important;
					min-width: 92px !important;
					max-width: 92px !important;
					height: 28px !important;
					min-height: 28px !important;
					max-height: 28px !important;
					padding: 0 !important;
					margin: 0 !important;
					font-size: 11px !important; 
					font-weight: 600 !important; 
					line-height: 1 !important;
					white-space: nowrap !important;
					cursor: pointer !important; 
					border: none !important; 
					border-radius: 9999px !important; 
					background-color: #0071E3 !important; 
					color: #ffffff !important; 
					box-shadow: 0 2px 8px rgba(0, 113, 227, 0.2) !important;
					transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; 
					box-sizing: border-box !important;
					text-transform: none !important;
					letter-spacing: normal !important;
				}
				.ti-action-btn:hover { background-color: #0077ED !important; box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3) !important; transform: translateY(-1px) !important; }
				.ti-action-btn:active { transform: scale(0.96) !important; }
				.ti-btn-gear { 
					padding: 8px 16px !important; font-size: 13px !important; font-weight: 500 !important; cursor: pointer !important; border: none !important; 
					border-radius: 9999px !important; background-color: rgba(0, 0, 0, 0.05) !important; color: #1D1D1F !important; 
					transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; box-sizing: border-box !important; white-space: nowrap !important;
				}
				.ti-btn-gear:hover { background-color: rgba(0, 0, 0, 0.08) !important; }
				.ti-btn-gear:active { transform: scale(0.96) !important; }
				.ti-btn-close { 
					padding: 8px 20px !important; font-size: 13px !important; font-weight: 500 !important; cursor: pointer !important; 
					border: 1px solid rgba(0, 0, 0, 0.1) !important; border-radius: 9999px !important; background-color: #FFFFFF !important; color: #1D1D1F !important; 
					transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; box-shadow: 0 2px 6px rgba(0,0,0,0.02) !important;
					box-sizing: border-box !important; white-space: nowrap !important;
				}
				.ti-btn-close:hover { background-color: #F5F5F7 !important; border-color: rgba(0, 0, 0, 0.15) !important; }
				.ti-btn-close:active { transform: scale(0.96) !important; }
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

			if (
				window.performance &&
				typeof performance.getEntriesByType === "function"
			) {
				performance.getEntriesByType("resource").forEach((resource) => {
					const matches = resource.name.match(TagInspector.TAG_REGEX);
					if (matches) matches.forEach((tag) => tagSet.add(tag));
				});
			}

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
				className: "ti-table-container",
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
                        <tr style="background-color: rgba(250, 250, 252, 0.6);">
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
						style: `color: ${theme.color}; background-color: ${theme.bg}; border: 1px solid ${theme.border} !important;`,
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
