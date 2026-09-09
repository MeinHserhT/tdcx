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
	// 2. FEATURE: GOOGLE TAG INSPECTOR
	// ==========================================
	const TagInspector = {
		CONFIG: {
			GTM: { prio: 1, label: "GTM ICS ↗", bg: "rgba(224, 242, 254, 0.6)", border: "rgba(186, 230, 253, 0.8)", color: "#0369a1" },
			G:   { prio: 2, label: "GA4 ICS ↗", bg: "rgba(254, 249, 195, 0.6)", border: "rgba(254, 240, 138, 0.8)", color: "#854d0e" },
			AW:  { prio: 3, label: "ADS ICS ↗", bg: "rgba(220, 252, 231, 0.6)", border: "rgba(187, 247, 208, 0.8)", color: "#166534" },
			DEF: { prio: 4, label: "Open ↗",    bg: "rgba(243, 244, 246, 0.6)", border: "rgba(229, 231, 235, 0.8)", color: "#374151" },
		},

		injectStyles() {
			Utils.addStyle(
				"ti-styles",
				`
				@import url('https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
				.ti-mask, .ti-mask * { font-family: "Exo 2", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important; }
				.ti-mask { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background-color: rgba(0, 0, 0, 0.55) !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important; }
				.ti-modal { background-color: rgba(255, 255, 255, 0.85) !important; backdrop-filter: blur(25px) !important; -webkit-backdrop-filter: blur(25px) !important; border-radius: 20px !important; padding: 24px !important; width: 90% !important; max-width: 420px !important; max-height: 80vh !important; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04) !important; border: none !important; display: flex !important; flex-direction: column !important; gap: 16px !important; box-sizing: border-box !important; }
				.ti-body { overflow-y: auto !important; max-height: 50vh !important; border-radius: 14px !important; background-color: rgba(255, 255, 255, 0.5) !important; backdrop-filter: blur(10px) !important; border: none !important; box-shadow: none !important; }
				.ti-modal table, .ti-modal thead, .ti-modal tbody, .ti-modal tr, .ti-modal th, .ti-modal td { border: none !important; outline: none !important; box-shadow: none !important; background-image: none !important; }
				.ti-modal table { width: 100% !important; border-collapse: collapse !important; border-spacing: 0 !important; margin: 0 !important; padding: 0 !important; }
				.ti-row { transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; }
				.ti-row:hover { background-color: rgba(255, 255, 255, 0.8) !important; }
				.ti-tag { font-weight: 600 !important; font-size: 12px !important; border-radius: 9999px !important; padding: 4px 12px !important; cursor: pointer !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; white-space: nowrap !important; display: inline-block !important; line-height: 1.4 !important; box-sizing: border-box !important; letter-spacing: 0.3px !important; }
				.ti-tag:hover { transform: scale(1.02) !important; }
				.ti-tag:active { transform: scale(0.97) !important; }
				.ti-btn { display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 92px !important; min-width: 92px !important; max-width: 92px !important; height: 28px !important; min-height: 28px !important; max-height: 28px !important; padding: 0 !important; margin: 0 !important; font-size: 11.5px !important; font-weight: 600 !important; line-height: 1 !important; white-space: nowrap !important; cursor: pointer !important; border: none !important; border-radius: 9999px !important; background-color: #0071E3 !important; color: #ffffff !important; box-shadow: 0 2px 8px rgba(0, 113, 227, 0.2) !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; box-sizing: border-box !important; text-transform: none !important; letter-spacing: 0.2px !important; }
				.ti-btn:hover { background-color: #0077ED !important; box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3) !important; transform: translateY(-1px) !important; }
				.ti-btn:active { transform: scale(0.96) !important; }
				.ti-gear { padding: 8px 16px !important; font-size: 13px !important; font-weight: 500 !important; cursor: pointer !important; border: none !important; border-radius: 9999px !important; background-color: rgba(0, 0, 0, 0.05) !important; color: #1D1D1F !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; box-sizing: border-box !important; white-space: nowrap !important; }
				.ti-gear:hover { background-color: rgba(0, 0, 0, 0.08) !important; }
				.ti-gear:active { transform: scale(0.96) !important; }
				.ti-close { padding: 8px 20px !important; font-size: 13px !important; font-weight: 500 !important; cursor: pointer !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; border-radius: 9999px !important; background-color: #FFFFFF !important; color: #1D1D1F !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; box-shadow: 0 2px 6px rgba(0,0,0,0.02) !important; box-sizing: border-box !important; white-space: nowrap !important; }
				.ti-close:hover { background-color: #F5F5F7 !important; border-color: rgba(0, 0, 0, 0.15) !important; }
				.ti-close:active { transform: scale(0.96) !important; }
			`,
			);
		},

		scanTags() {
			const tagSet = new Set();
			const scan = (text) => text?.match(/\b(GTM-[A-Z0-9]{4,10}|G-[A-Z0-9]{6,12}|AW-\d+)\b/g)?.forEach((t) => tagSet.add(t));

			for (const s of document.scripts) {
				scan(s.src);
				scan(s.outerHTML);
			}
			window.performance?.getEntriesByType?.("resource").forEach((r) => scan(r.name));

			return Array.from(tagSet).sort((a, b) => {
				const prioA = TagInspector.CONFIG[a.split("-")[0]]?.prio ?? 4;
				const prioB = TagInspector.CONFIG[b.split("-")[0]]?.prio ?? 4;
				return prioA - prioB || a.localeCompare(b);
			});
		},

		init() {
			TagInspector.injectStyles();
			const tags = TagInspector.scanTags();

			Utils.$("#apple-gtag-overlay")?.remove();

			const overlay = Utils.createEl("div", {
				id: "apple-gtag-overlay",
				className: "ti-mask",
				parent: document.body,
				onClick: (e) => e.target === overlay && overlay.remove(),
			});

			const modal = Utils.createEl("div", { className: "ti-modal", parent: overlay });
			const container = Utils.createEl("div", { className: "ti-body", parent: modal });

			if (!tags.length) {
				Utils.createEl("div", {
					parent: container,
					style: "text-align: center; color: #86868B; padding: 32px 16px; font-size: 14px; font-weight: 500;",
					text: "No Google Tags found on this page.",
				});
			} else {
				const table = Utils.createEl("table", {
					parent: container,
					style: "width: 100%; border-collapse: collapse; text-align: left;",
					html: `
					<thead>
						<tr style="background-color: rgba(250, 250, 250, 0.6);">
							<th style="padding: 12px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #86868B;">Tag ID</th>
							<th style="padding: 12px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #86868B; text-align: right;">Action</th>
						</tr>
					</thead>`,
				});

				const tbody = Utils.createEl("tbody", { parent: table });

				tags.forEach((tag) => {
					const prefix = tag.split("-")[0];
					const meta = TagInspector.CONFIG[prefix] || TagInspector.CONFIG.DEF;
					const row = Utils.createEl("tr", { className: "ti-row", parent: tbody });

					const tdTag = Utils.createEl("td", { parent: row, style: "padding: 12px 16px;" });
					const tagBtn = Utils.createEl("button", {
						parent: tdTag,
						className: "ti-tag",
						text: tag,
						title: "Click to copy",
						style: `color: ${meta.color}; background-color: ${meta.bg}; border: 1px solid ${meta.border} !important;`,
					});
					Utils.setupCopy(tagBtn, tag);

					const tdAction = Utils.createEl("td", { parent: row, style: "padding: 12px 16px; text-align: right;" });
					Utils.createEl("button", {
						parent: tdAction,
						className: "ti-btn",
						text: meta.label,
						onClick: () => {
							const url = prefix === "AW"
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
				className: "ti-gear",
				text: "Gearloose ↗",
				onClick: () =>
					window.open(
						`https://gearloose.corp.google.com/#/search?q=${encodeURIComponent(location.host)}&tab=merchants`,
						"_blank",
					),
			});

			Utils.createEl("button", {
				parent: footer,
				className: "ti-close",
				text: "Close",
				onClick: () => overlay.remove(),
			});
		},
	};

	// ==========================================
	// 7. ROUTER & INITIALIZATION
	// ==========================================
	const AppRouter = {
		routes: [
			{ pattern: "casemon2.corp", run: () => Dash.init() },
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