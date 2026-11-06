(() => {
	"use strict";
	// ============================================================================
	// SECTION 1: GLOBAL LIFECYCLE & TEARDOWN REGISTRY
	// ============================================================================
	const G = window.__OMNITOOL__ ||= {};
	try {
		G.teardown?.();
	} catch (e) {
		console.warn("Omnitool: previous cleanup failed", e);
	}
	const cleanups = [];
	const onTeardown = fn => cleanups.push(fn);
	G.teardown = () => {
		for (; cleanups.length;) try {
			cleanups.pop()();
		} catch (e) {
			console.warn("Omnitool: cleanup error", e);
		}
	};
	// ============================================================================
	// SECTION 2: TRUSTED TYPES SECURITY LAYER
	// ============================================================================
	const toSafeHTML = html => {
		if (!G.tt) {
			const pass = {
				createHTML: s => s
			};
			for (const name of ["omnitool", "default"]) try {
				G.tt ||= window.trustedTypes?.createPolicy?.(name, pass);
			} catch { }
			G.tt ||= window.trustedTypes?.defaultPolicy || pass;
		}
		return G.tt.createHTML(html);
	};
	// ============================================================================
	// SECTION 3: SHARED DOM & ASYNC UTILITY LIBRARY
	// ============================================================================
	const Utils = {
		sleep: ms => new Promise((resolve => setTimeout(resolve, ms))),
		$: (selector, parent = document) => parent.querySelector(selector),
		$$: (selector, parent = document) => [...parent.querySelectorAll(selector)],
		toSafeHTML,
		createEl(tag, { parent, onClick, style, text, html, ...props } = {}) {
			const el = document.createElement(tag);
			if (void 0 !== text) el.textContent = text;
			if (void 0 !== html) el.innerHTML = toSafeHTML(html);
			if (style) if ("string" === typeof style) el.style.cssText = style; else Object.assign(el.style, style);
			if (onClick) el.addEventListener("click", onClick);
			for (const [key, value] of Object.entries(props)) if (key.startsWith("data-")) el.setAttribute(key, value); else el[key] = value;
			if (parent) parent.appendChild(el);
			return el;
		},
		addStyle(id, cssText) {
			document.getElementById(id)?.remove();
			const styleEl = document.createElement("style");
			styleEl.id = id;
			styleEl.textContent = cssText;
			(document.head || document.documentElement).appendChild(styleEl);
		},
		waitForElement: (selector, timeout = 5e3) => new Promise(((resolve, reject) => {
			const existing = document.querySelector(selector);
			if (existing) return resolve(existing);
			const observer = new MutationObserver((() => {
				const found = document.querySelector(selector);
				if (found) {
					observer.disconnect();
					clearTimeout(timer);
					resolve(found);
				}
			}));
			observer.observe(document.documentElement, {
				childList: true,
				subtree: true
			});
			const timer = setTimeout((() => {
				observer.disconnect();
				reject(new Error(`Timeout waiting for: ${selector}`));
			}), timeout);
		})),
		setupCopy(element, text, successMsg = "✓ Copied!") {
			let timer;
			element.addEventListener("click", (async () => {
				try {
					await navigator.clipboard.writeText(text);
				} catch (err) {
					return console.error("Copy failed", err);
				}
				element.dataset.origText ||= element.textContent;
				element.textContent = successMsg;
				element.classList.add("is-copied");
				clearTimeout(timer);
				timer = setTimeout((() => {
					element.textContent = element.dataset.origText;
					element.classList.remove("is-copied");
				}), 1500);
			}));
		},
		escapeHtml: str => String(str ?? "").replace(/[&<>"']/g, (ch => ({
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#039;"
		}[ch]))),
		escapeRegExp: str => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	};
	const { $, $$ } = Utils;
	// ============================================================================
	// SECTION 9: GOOGLE ADS CONVERSION DIAGNOSTICS (AdWords)
	// ============================================================================
    const AdWords = {
        async init() {
            Utils.addStyle(
                "aw-styles",
                ".aw-ga4 { background-color: #FEF3D6; color: #B07505; border: 1px solid rgba(176,117,5,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; } .aw-ads { background-color: #E2F5E9; color: #1E7F4E; border: 1px solid rgba(30,127,78,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; } .aw-ec-badge { background-color: #1E8E3E; color: #FFFFFF; padding: 2px 6px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-left: 6px; display: inline-block; vertical-align: middle; user-select: none; box-shadow: 0 1px 3px rgba(0,0,0,0.1); } .aw-hide { display: none !important; } .is-copied.aw-ga4, .is-copied.aw-ads { background-color: #3B72E6 !important; color: white !important; border-color: transparent !important; } #gpt-aw-container { position: fixed; bottom: 20px; left: 20px; z-index: 999; display: flex; flex-direction: column; gap: 8px; } .gpt-aw-row { display: flex; gap: 6px; align-items: center; } .gpt-aw-badge { padding: 8px 14px; background: #161920; color: #F1F3F5; border: 1px solid #2D323F; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: monospace; box-shadow: 0 4px 16px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s ease; user-select: none; } .gpt-aw-badge:hover { background: #2D323F; } .gpt-aw-btn { padding: 8px 12px; background: #0071e3; color: #ffffff; border: 1px solid #0071e3; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s ease; user-select: none; } .gpt-aw-btn:hover { background: #0077ed; }",
            );
            let data;
            for (let i = 0; i < 5 && !data; i++) {
                data = window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS;
                if (!data) await Utils.sleep(600);
            }
            if (!data)
                return console.warn(
                    "AdWords: conversions_data not available on this page.",
                );
            const navGoals = $('[id="navigation.goals"]');
            if (navGoals && !navGoals.querySelector(".selected"))
                $("a", navGoals)?.click();
            try {
                await Utils.waitForElement('[id*="diagnosticsHome"]');
            } catch (err) {
                console.warn(
                    "diagnosticsHome did not appear within timeout:",
                    err,
                );
            }
            AdWords.processData(data);
        },
        getSelectedConversionIds() {
            const ids = $$(".particle-table-row:not(.aw-hide)")
                .filter((row) => {
                    const cb = row.querySelector("mat-checkbox");
                    return (
                        row.classList.contains("particle-row-selected") ||
                        cb?.getAttribute("aria-checked") === "true" ||
                        cb?.hasAttribute("checked") ||
                        cb
                            ?.querySelector(".mat-checkbox-container")
                            ?.classList.contains("checked")
                    );
                })
                .map((row) => {
                    const cell = row.querySelector(
                        ".conversion-name-cell .internal",
                    );
                    const hrefCtId = row
                        .querySelector("a.ess-cell-link")
                        ?.href?.match(/ctId=(\d+)/)?.[1];
                    const rawId =
                        cell?.dataset?.originalId ||
                        hrefCtId ||
                        cell?.innerText?.trim() ||
                        "";
                    return rawId.match(/\d+/)?.[0];
                })
                .filter(Boolean);
            return [...new Set(ids)];
        },
        processData(data) {
            const rawData =
                typeof data === "string" ? data : JSON.stringify(data);
            const uniqueIds = [
                ...new Set([...rawData.matchAll(/AW-(\d+)/g)].map((m) => m[1])),
            ];
            $("#gpt-aw-container")?.remove();
            const container = Utils.createEl("div", {
                id: "gpt-aw-container",
                parent: document.body,
            });
            let decorateTimer;
            onTeardown(() => {
                clearTimeout(decorateTimer);
                container.remove();
            });
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
                    const base =
                        "https://dashboards.corp.google.com/view/_0ded1099_6ef3_4bc9_bba0_2445840d1b69?f=";
                    const selectedIds = AdWords.getSelectedConversionIds();
                    if (selectedIds.length)
                        return window.open(
                            `${base}conversion_type_l3j54n:in:${selectedIds.join(",")}`,
                            "_blank",
                        );
                    if (uniqueIds.length)
                        return window.open(
                            `${base}conversion_tracking_id_5nuehn:in:${uniqueIds.join(",")}`,
                            "_blank",
                        );
                    alert(
                        "No conversion rows selected and no AW tracking IDs found!",
                    );
                },
            });
            $$(".expand-more").forEach((el) => el.click());
            let parsed;
            try {
                parsed = typeof data === "string" ? JSON.parse(data) : data;
            } catch (err) {
                return console.error("Adwords Data parsing failed", err);
            }
            if (!Array.isArray(parsed?.[1])) return;
            const dataMap = new Map(parsed[1].map((item) => [item[1], item]));
            const rawDiag = window.conversions_data?.CONVERSION_DIAGNOSTICS;
            const diagData = typeof rawDiag === "string" ? rawDiag : "";
            const inDiag = (id) =>
                Boolean(
                    id &&
                    diagData &&
                    new RegExp(`\\b${Utils.escapeRegExp(id)}\\b`).test(
                        diagData,
                    ),
                );
            decorateTimer = setTimeout(() => {
                try {
                    $$(".conversion-name-cell .internal").forEach((cell) => {
                        const row = cell.closest(".particle-table-row");
                        const sourceText = row
                            ?.querySelector(
                                '[essfield="aggregated_conversion_source"]',
                            )
                            ?.innerText?.toLowerCase();
                        if (row && !sourceText?.includes("web"))
                            return row.classList.add("aw-hide");
                        const hrefCtId = row
                            ?.querySelector("a.ess-cell-link")
                            ?.href?.match(/ctId=(\d+)/)?.[1];
                        const originalText = cell.innerText?.trim() || "";
                        const numericMatch = originalText.match(/\d+/);
                        if (numericMatch)
                            cell.dataset.originalId = numericMatch[0];
                        const convActionId =
                            cell.dataset.originalId || hrefCtId || "";
                        const mappedData = dataMap.get(originalText);
                        if (!mappedData) return;
                        const [type, convId] =
                            mappedData[11] === 1
                                ? [
                                      "aw-ads",
                                      mappedData[64]?.[2]?.[4]
                                          ?.split("'")?.[7]
                                          ?.split("/")?.[1],
                                  ]
                                : mappedData[11] === 32
                                  ? [
                                        "aw-ga4",
                                        mappedData[64]?.[1]?.[4]?.split(
                                            "'",
                                        )?.[3],
                                    ]
                                  : [];
                        if (type && convId) {
                            cell.textContent = convId;
                            cell.classList.add(type);
                            Utils.setupCopy(cell, convId);
                        }
                        const host = cell.parentNode || cell;
                        if (
                            (inDiag(convActionId) || inDiag(convId)) &&
                            !host.querySelector(".aw-ec-badge")
                        )
                            Utils.createEl("span", {
                                className: "aw-ec-badge",
                                text: "EC",
                                title: "Enhanced Conversions Enabled",
                                parent: host,
                            });
                    });
                    $$(
                        "category-conversions-container-view, conversion-goal-card",
                    ).forEach((card) => {
                        if (
                            !card.querySelector(
                                ".particle-table-row:not(.aw-hide)",
                            )
                        )
                            card.style.display = "none";
                    });
                } catch (err) {
                    console.error("Adwords decorate failed", err);
                }
            }, 1200);
        },
    };
	// ============================================================================
	// SECTION 10: CONTEXT-AWARE ROUTER & BOOTSTRAP DISPATCHER
	// ============================================================================
	const pickFeature = () => "chrome-extension:" === location.protocol ? QPlusAutomator : location.host.includes("casemon2.corp") ? Dash : location.host.includes("cases.connect") ? CasesConnect : location.host.includes("adwords.corp") ? AdWords : TagInspector;
	const start = () => Promise.resolve().then((() => pickFeature().init())).catch((err => console.error("Omnitool error:", err)));
	"loading" === document.readyState ? document.addEventListener("DOMContentLoaded", start, {
		once: true
	}) : start();
})();
