(() => {
    "use strict";
    const G = (window.__OMNITOOL__ ||= {});
    try {
        G.teardown?.();
    } catch (e) {
        console.warn("Omnitool: cleanup failed", e);
    }

    const $ = (s, p = document) => p.querySelector(s);
    const $$ = (s, p = document) => [...p.querySelectorAll(s)];
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const el = (tag, { parent, onClick, text, ...props } = {}) => {
        const node = Object.assign(document.createElement(tag), props);
        if (text !== undefined) node.textContent = text;
        if (onClick) node.addEventListener("click", onClick);
        parent?.appendChild(node);
        return node;
    };

    const setupCopy = (node, text, msg = "✓ Copied!") => {
        let timer;
        node.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(text);
            } catch (e) {
                return console.error("Copy failed", e);
            }
            node.dataset.origText ||= node.textContent;
            node.textContent = msg;
            node.classList.add("is-copied");
            clearTimeout(timer);
            timer = setTimeout(() => {
                node.textContent = node.dataset.origText;
                node.classList.remove("is-copied");
            }, 1500);
        });
    };

    const getSelectedIds = () => [
        ...new Set(
            $$(".particle-table-row:not(.aw-hide)")
                .filter((r) => {
                    const cb = $("mat-checkbox", r);
                    return (
                        r.classList.contains("particle-row-selected") ||
                        cb?.getAttribute("aria-checked") === "true" ||
                        cb?.hasAttribute("checked") ||
                        $(".mat-checkbox-container.checked", cb)
                    );
                })
                .map(
                    (r) =>
                        (
                            $(".conversion-name-cell .internal", r)?.dataset
                                .originalId ||
                            $("a.ess-cell-link", r)?.href?.match(
                                /ctId=(\d+)/,
                            )?.[1] ||
                            $(".conversion-name-cell .internal", r)?.innerText
                        )?.match(/\d+/)?.[0],
                )
                .filter(Boolean),
        ),
    ];

    const init = async () => {
        $("#aw-styles")?.remove();
        el("style", {
            id: "aw-styles",
            parent: document.head || document.documentElement,
            text: ".aw-ga4 { background-color: #FEF3D6; color: #B07505; border: 1px solid rgba(176,117,5,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; } .aw-ads { background-color: #E2F5E9; color: #1E7F4E; border: 1px solid rgba(30,127,78,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; } .aw-ec-badge { background-color: #1E8E3E; color: #FFFFFF; padding: 2px 6px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-left: 6px; display: inline-block; vertical-align: middle; user-select: none; box-shadow: 0 1px 3px rgba(0,0,0,0.1); } .aw-hide { display: none !important; } .is-copied.aw-ga4, .is-copied.aw-ads { background-color: #3B72E6 !important; color: white !important; border-color: transparent !important; } #gpt-aw-container { position: fixed; bottom: 20px; left: 20px; z-index: 999; display: flex; flex-direction: column; gap: 8px; } .gpt-aw-row { display: flex; gap: 6px; align-items: center; } .gpt-aw-badge { padding: 8px 14px; background: #161920; color: #F1F3F5; border: 1px solid #2D323F; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: monospace; box-shadow: 0 4px 16px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s ease; user-select: none; } .gpt-aw-badge:hover { background: #2D323F; } .gpt-aw-btn { padding: 8px 12px; background: #0071e3; color: #ffffff; border: 1px solid #0071e3; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s ease; user-select: none; } .gpt-aw-btn:hover { background: #0077ed; }",
        });

        let data;
        for (
            let i = 0;
            i < 5 &&
            !(data = window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS);
            i++
        ) {
            await sleep(600);
        }
        if (!data)
            return console.warn(
                "AdWords: conversions_data not available on this page.",
            );

        const navGoals = $('[id="navigation.goals"]');
        if (navGoals && !$(".selected", navGoals)) $("a", navGoals)?.click();

        for (let i = 0; i < 25 && !$('[id*="diagnosticsHome"]'); i++)
            await sleep(200);

        const rawData = typeof data === "string" ? data : JSON.stringify(data);
        const uniqueIds = [
            ...new Set([...rawData.matchAll(/AW-(\d+)/g)].map((m) => m[1])),
        ];

        $("#gpt-aw-container")?.remove();
        const container = el("div", {
            id: "gpt-aw-container",
            parent: document.body,
        });
        let decorateTimer;
        G.teardown = () => {
            clearTimeout(decorateTimer);
            container.remove();
        };

        for (const id of uniqueIds) {
            const row = el("div", {
                className: "gpt-aw-row",
                parent: container,
            });
            setupCopy(
                el("div", {
                    className: "gpt-aw-badge",
                    text: `AW-${id}`,
                    parent: row,
                }),
                id,
                "Copied!",
            );
        }

        el("button", {
            className: "gpt-aw-btn",
            text: "EC Dashboard ↗",
            parent: el("div", { className: "gpt-aw-row", parent: container }),
            onClick: () => {
                const base =
                    "https://dashboards.corp.google.com/view/_0ded1099_6ef3_4bc9_bba0_2445840d1b69?f=";
                const sel = getSelectedIds();
                if (sel.length)
                    return window.open(
                        `${base}conversion_type_l3j54n:in:${sel.join(",")}`,
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

        $$(".expand-more").forEach((b) => b.click());

        let parsed;
        try {
            parsed = typeof data === "string" ? JSON.parse(data) : data;
        } catch (e) {
            return console.error("Adwords Data parsing failed", e);
        }
        if (!Array.isArray(parsed?.[1])) return;

        const dataMap = new Map(parsed[1].map((item) => [item[1], item]));
        const rawDiag = window.conversions_data?.CONVERSION_DIAGNOSTICS;
        const diagData = typeof rawDiag === "string" ? rawDiag : "";
        const inDiag = (id) =>
            Boolean(
                id &&
                diagData &&
                new RegExp(
                    `\\b${String(id).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
                ).test(diagData),
            );

        decorateTimer = setTimeout(() => {
            try {
                for (const cell of $$(".conversion-name-cell .internal")) {
                    const row = cell.closest(".particle-table-row");
                    if (
                        row &&
                        !$('[essfield="aggregated_conversion_source"]', row)
                            ?.innerText?.toLowerCase()
                            .includes("web")
                    ) {
                        row.classList.add("aw-hide");
                        continue;
                    }
                    const originalText = cell.innerText?.trim() || "";
                    const num = originalText.match(/\d+/)?.[0];
                    if (num) cell.dataset.originalId = num;
                    const convActionId =
                        num ||
                        $("a.ess-cell-link", row)?.href?.match(
                            /ctId=(\d+)/,
                        )?.[1] ||
                        "";

                    const mapped = dataMap.get(originalText);
                    if (!mapped) continue;

                    const [type, convId] =
                        mapped[11] === 1
                            ? [
                                  "aw-ads",
                                  mapped[64]?.[2]?.[4]
                                      ?.split("'")?.[7]
                                      ?.split("/")?.[1],
                              ]
                            : mapped[11] === 32
                              ? [
                                    "aw-ga4",
                                    mapped[64]?.[1]?.[4]?.split("'")?.[3],
                                ]
                              : [];

                    if (type && convId) {
                        cell.textContent = convId;
                        cell.classList.add(type);
                        setupCopy(cell, convId);
                    }
                    const host = cell.parentNode || cell;
                    if (
                        (inDiag(convActionId) || inDiag(convId)) &&
                        !$(".aw-ec-badge", host)
                    ) {
                        el("span", {
                            className: "aw-ec-badge",
                            text: "EC",
                            title: "Enhanced Conversions Enabled",
                            parent: host,
                        });
                    }
                }
                for (const card of $$(
                    "category-conversions-container-view, conversion-goal-card",
                )) {
                    if (!$(".particle-table-row:not(.aw-hide)", card))
                        card.style.display = "none";
                }
            } catch (e) {
                console.error("Adwords decorate failed", e);
            }
        }, 1200);
    };

    const start = () =>
        init().catch((e) => console.error("Omnitool error:", e));
    document.readyState === "loading"
        ? document.addEventListener("DOMContentLoaded", start, { once: true })
        : start();
})();
