(() => {
    "use strict";
    // ============================================================================
    // SECTION 1: GLOBAL LIFECYCLE & TEARDOWN REGISTRY
    // ============================================================================
    const G = (window.__OMNITOOL__ ||= {});
    try {
        G.teardown?.();
    } catch (e) {
        console.warn("Omnitool: previous cleanup failed", e);
    }
    const cleanups = [];
    const onTeardown = (fn) => cleanups.push(fn);
    G.teardown = () => {
        for (; cleanups.length; )
            try {
                cleanups.pop()();
            } catch (e) {
                console.warn("Omnitool: cleanup error", e);
            }
    };
    // ============================================================================
    // SECTION 2: TRUSTED TYPES SECURITY LAYER
    // ============================================================================
    const toSafeHTML = (html) => {
        if (!G.tt) {
            const pass = { createHTML: (s) => s };
            for (const name of ["omnitool", "default"])
                try {
                    G.tt ||= window.trustedTypes?.createPolicy?.(name, pass);
                } catch {}
            G.tt ||= window.trustedTypes?.defaultPolicy || pass;
        }
        return G.tt.createHTML(html);
    };
    // ============================================================================
    // SECTION 3: SHARED DOM & ASYNC UTILITY LIBRARY
    // ============================================================================
    const Utils = {
        sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
        $: (sel, p = document) => p.querySelector(sel),
        $$: (sel, p = document) => [...p.querySelectorAll(sel)],
        toSafeHTML,
        isoDate: (d = new Date()) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        createEl(tag, { parent, onClick, style, text, html, ...props } = {}) {
            const el = document.createElement(tag);
            if (text !== undefined) el.textContent = text;
            if (html !== undefined) el.innerHTML = toSafeHTML(html);
            if (style)
                typeof style === "string"
                    ? (el.style.cssText = style)
                    : Object.assign(el.style, style);
            if (onClick) el.addEventListener("click", onClick);
            for (const [k, v] of Object.entries(props))
                k.startsWith("data-") ? el.setAttribute(k, v) : (el[k] = v);
            parent?.appendChild(el);
            return el;
        },
        getLdap: () =>
                $("[alt='profile photo']")
                    ?.src?.match(/photos\/([^/?]+)/)?.[1]
                    ?.toLowerCase() ?? "",
        addStyle(id, cssText) {
            document.getElementById(id)?.remove();
            Utils.createEl("style", {
                id,
                text: cssText,
                parent: document.head || document.documentElement,
            });
        },
        waitForElement: (sel, timeout = 5e3) =>
            new Promise((resolve, reject) => {
                const existing = document.querySelector(sel);
                if (existing) return resolve(existing);
                const obs = new MutationObserver(() => {
                    const found = document.querySelector(sel);
                    if (found) {
                        obs.disconnect();
                        clearTimeout(timer);
                        resolve(found);
                    }
                });
                obs.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                });
                const timer = setTimeout(() => {
                    obs.disconnect();
                    reject(new Error(`Timeout waiting for: ${sel}`));
                }, timeout);
            }),
        setupCopy(el, text, msg = "✓ Copied!") {
            let timer;
            el.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(text);
                } catch (e) {
                    return console.error("Copy failed", e);
                }
                el.dataset.origText ||= el.textContent;
                el.textContent = msg;
                el.classList.add("is-copied");
                clearTimeout(timer);
                timer = setTimeout(() => {
                    el.textContent = el.dataset.origText;
                    el.classList.remove("is-copied");
                }, 1500);
            });
        },
        escapeHtml: (s) =>
            String(s ?? "").replace(
                /[&<>"']/g,
                (c) =>
                    ({
                        "&": "&amp;",
                        "<": "&lt;",
                        ">": "&gt;",
                        '"': "&quot;",
                        "'": "&#039;",
                    })[c],
            ),
        escapeRegExp: (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    };
    const { $, $$ } = Utils;
    // ============================================================================
    // SECTION 4: TAG INSPECTOR MODULE (TagInspector)
    // ============================================================================
    const TagInspector = {
        CONFIG: {
            GTM: {
                prio: 1,
                label: "GTM ICS ↗",
                bg: "rgba(224, 242, 254, 0.6)",
                border: "rgba(186, 230, 253, 0.8)",
                color: "#0369a1",
            },
            G: {
                prio: 2,
                label: "GA4 ICS ↗",
                bg: "rgba(254, 249, 195, 0.6)",
                border: "rgba(254, 240, 138, 0.8)",
                color: "#854d0e",
            },
            AW: {
                prio: 3,
                label: "ADS ICS ↗",
                bg: "rgba(220, 252, 231, 0.6)",
                border: "rgba(187, 247, 208, 0.8)",
                color: "#166534",
            },
            DEF: {
                prio: 4,
                label: "Open ↗",
                bg: "rgba(243, 244, 246, 0.6)",
                border: "rgba(229, 231, 235, 0.8)",
                color: "#374151",
            },
        },
        scanTags() {
            const set = new Set();
            const scan = (s) =>
                s
                    ?.match(/\b(GTM-[A-Z0-9]{4,10}|G-[A-Z0-9]{6,12}|AW-\d+)\b/g)
                    ?.forEach((t) => set.add(t));
            for (const s of document.scripts) scan(s.outerHTML);
            performance
                ?.getEntriesByType?.("resource")
                .forEach((r) => scan(r.name));
            const prio = (t) => TagInspector.CONFIG[t.split("-")[0]]?.prio ?? 4;
            return [...set].sort(
                (a, b) => prio(a) - prio(b) || a.localeCompare(b),
            );
        },
        init() {
            Utils.addStyle(
                "ti-styles",
                '@import url(\'https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap\'); .ti-mask, .ti-mask * { font-family: "Exo 2", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important; } .ti-mask { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background-color: rgba(0, 0, 0, 0.55) !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important; } .ti-modal { background-color: rgba(255, 255, 255, 0.85) !important; backdrop-filter: blur(25px) !important; -webkit-backdrop-filter: blur(25px) !important; border-radius: 20px !important; padding: 24px !important; width: 90% !important; max-width: 420px !important; max-height: 80vh !important; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04) !important; border: none !important; display: flex !important; flex-direction: column !important; gap: 16px !important; box-sizing: border-box !important; } .ti-body { overflow-y: auto !important; max-height: 50vh !important; border-radius: 14px !important; background-color: rgba(255, 255, 255, 0.5) !important; backdrop-filter: blur(10px) !important; border: none !important; box-shadow: none !important; } .ti-modal table, .ti-modal thead, .ti-modal tbody, .ti-modal tr, .ti-modal th, .ti-modal td { border: none !important; outline: none !important; box-shadow: none !important; background-image: none !important; } .ti-modal table { width: 100% !important; border-collapse: collapse !important; border-spacing: 0 !important; margin: 0 !important; padding: 0 !important; } .ti-row { transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; } .ti-row:hover { background-color: rgba(255, 255, 255, 0.8) !important; } .ti-tag { font-weight: 600 !important; font-size: 12px !important; border-radius: 9999px !important; padding: 4px 12px !important; cursor: pointer !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; white-space: nowrap !important; display: inline-block !important; line-height: 1.4 !important; box-sizing: border-box !important; letter-spacing: 0.3px !important; } .ti-tag:hover { transform: scale(1.02) !important; } .ti-tag:active { transform: scale(0.97) !important; } .ti-btn { display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 92px !important; min-width: 92px !important; max-width: 92px !important; height: 28px !important; min-height: 28px !important; max-height: 28px !important; padding: 0 !important; margin: 0 !important; font-size: 11.5px !important; font-weight: 600 !important; line-height: 1 !important; white-space: nowrap !important; cursor: pointer !important; border: none !important; border-radius: 9999px !important; background-color: #0071E3 !important; color: #ffffff !important; box-shadow: 0 2px 8px rgba(0, 113, 227, 0.2) !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; box-sizing: border-box !important; text-transform: none !important; letter-spacing: 0.2px !important; } .ti-btn:hover { background-color: #0077ED !important; box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3) !important; transform: translateY(-1px) !important; } .ti-btn:active { transform: scale(0.96) !important; } .ti-gear { padding: 8px 16px !important; font-size: 13px !important; font-weight: 500 !important; cursor: pointer !important; border: none !important; border-radius: 9999px !important; background-color: rgba(0, 0, 0, 0.05) !important; color: #1D1D1F !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; box-sizing: border-box !important; white-space: nowrap !important; } .ti-gear:hover { background-color: rgba(0, 0, 0, 0.08) !important; } .ti-gear:active { transform: scale(0.96) !important; } .ti-close { padding: 8px 20px !important; font-size: 13px !important; font-weight: 500 !important; cursor: pointer !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; border-radius: 9999px !important; background-color: #FFFFFF !important; color: #1D1D1F !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; box-shadow: 0 2px 6px rgba(0,0,0,0.02) !important; box-sizing: border-box !important; white-space: nowrap !important; } .ti-close:hover { background-color: #F5F5F7 !important; border-color: rgba(0, 0, 0, 0.15) !important; } .ti-close:active { transform: scale(0.96) !important; }',
            );
            const tags = TagInspector.scanTags();
            $("#apple-gtag-overlay")?.remove();
            const overlay = Utils.createEl("div", {
                id: "apple-gtag-overlay",
                className: "ti-mask",
                parent: document.body,
                onClick: (e) => e.target === overlay && overlay.remove(),
            });
            onTeardown(() => overlay.remove());
            const modal = Utils.createEl("div", {
                className: "ti-modal",
                parent: overlay,
            });
            const container = Utils.createEl("div", {
                className: "ti-body",
                parent: modal,
            });
            if (!tags.length)
                Utils.createEl("div", {
                    parent: container,
                    style: "text-align: center; color: #86868B; padding: 32px 16px; font-size: 14px; font-weight: 500;",
                    text: "No Google Tags found on this page.",
                });
            else {
                const th =
                    "padding: 12px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #86868B;";
                const table = Utils.createEl("table", {
                    parent: container,
                    style: "width: 100%; border-collapse: collapse; text-align: left;",
                    html: `<thead><tr style="background-color: rgba(250, 250, 250, 0.6);"><th style="${th}">Tag ID</th><th style="${th} text-align: right;">Action</th></tr></thead>`,
                });
                const tbody = Utils.createEl("tbody", { parent: table });
                tags.forEach((tag) => {
                    const prefix = tag.split("-")[0];
                    const meta =
                        TagInspector.CONFIG[prefix] || TagInspector.CONFIG.DEF;
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
                        className: "ti-tag",
                        text: tag,
                        title: "Click to copy",
                        style: `color: ${meta.color}; background-color: ${meta.bg}; border: 1px solid ${meta.border} !important;`,
                    });
                    Utils.setupCopy(tagBtn, tag);
                    const tdAction = Utils.createEl("td", {
                        parent: row,
                        style: "padding: 12px 16px; text-align: right;",
                    });
                    Utils.createEl("button", {
                        parent: tdAction,
                        className: "ti-btn",
                        text: meta.label,
                        onClick: () =>
                            window.open(
                                prefix === "AW"
                                    ? `https://adwords.corp.google.com/aw_internalops/go?conversiontrackingid=${tag.slice(3)}`
                                    : `https://tagmanager-ics.corp.google.com/home?q=${encodeURIComponent(tag)}`,
                                "_blank",
                            ),
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
    // ============================================================================
    // SECTION 6: REAL-TIME TEAM STATUS DASHBOARD (Dash)
    // ============================================================================
    const Dash = {
        STATUS_MAP: {
            active: {
                prio: 1,
                maxSecs: 3600,
                color: "#34C759",
                track: "rgba(52, 199, 89, 0.15)",
            },
            video: {
                prio: 2,
                maxSecs: 2700,
                color: "#AF52DE",
                track: "rgba(175, 82, 222, 0.15)",
                ico: "9571/9571236",
                anim: "breathe",
            },
            phone: {
                prio: 2.5,
                maxSecs: 2700,
                color: "#FF3B30",
                track: "rgba(255, 59, 48, 0.15)",
                ico: "13332/13332839",
                anim: "ring",
            },
            "lunch-break": {
                prio: 3,
                maxSecs: 3600,
                color: "#FFCC00",
                track: "rgba(255, 204, 0, 0.15)",
                ico: "1182/1182132",
                anim: "bounce-y",
            },
            email: {
                prio: 4,
                maxSecs: 900,
                color: "#0071E3",
                track: "rgba(0, 113, 227, 0.15)",
                ico: "7487/7487055",
                anim: "fly",
            },
            "coffee-break": {
                prio: 5,
                maxSecs: 900,
                color: "#FF9500",
                track: "rgba(255, 149, 0, 0.15)",
                ico: "16108/16108931",
                anim: "rock",
            },
            break: {
                prio: 6,
                maxSecs: 900,
                color: "#8E8E93",
                track: "rgba(142, 142, 147, 0.15)",
                ico: "5140/5140652",
                anim: "fade-pulse",
            },
            default: {
                prio: 99,
                maxSecs: 2700,
                color: "#8E8E93",
                track: "rgba(142, 142, 147, 0.15)",
            },
        },
        ICONS: {
            close: "https://cdn-icons-png.flaticon.com/512/9403/9403346.png",
            non_phone:
                "https://cdn-icons-png.flaticon.com/512/17720/17720299.png",
            non_video:
                "https://cdn-icons-png.flaticon.com/512/11305/11305490.png",
        },
        POOL_RANKS: { LM: 1, BAU: 2 },
        formatTime: (s) =>
            String(s || "")
                .replace(/(\d+)\s*([hms])/gi, "$1 $2")
                .replace(/\s+/g, " ")
                .trim(),
        parseDuration: (s) =>
            (String(s || "").match(/\d+[hms]/g) || []).reduce(
                (acc, c) =>
                    acc +
                    parseInt(c, 10) *
                        ({ h: 3600, m: 60, s: 1 }[c.slice(-1)] || 0),
                0,
            ),
        extractState: (cell) =>
            (cell?.innerText.match(/[a-zA-Z\s]+/)?.[0] || "")
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "-"),
        cardHtml(key, title, extraHead = "") {
            const pill = (cls, id, tip, lbl) =>
                `<span class="cm-pill ${cls}" id="cnt-${id}-${key}" title="${tip}">${lbl}: 0</span>`;
            return `<div class="cm-card" id="cm-card-${key}"><div class="cm-head"><div class="cm-head-top"><h3><span>${title}</span><span class="cm-warn-txt" id="cm-health-warn-${key}" style="display:none;">⚠️ Low Availability</span></h3>${extraHead}</div><div class="cm-stats">${pill("badge-act", "act", "Active", "Actv")} + ${pill("badge-phn", "phn", "On Phone", "Phn")} + ${pill("badge-brk", "brk", "On Break", "Brk")} = ${pill("badge-tot", "tot", "Total", "Tot")}</div></div><div class="cm-list" id="cm-list-${key}"></div></div>`;
        },
        init() {
            $('[aria-selected="false"]')?.click();
            const targetContainer = $(".agent-table-container");
            if (!targetContainer)
                return console.warn(
                    "Dash: .agent-table-container not found on this page.",
                );
            const isAdmin = Utils.getLdap() === "vongoc";
            let layout = isAdmin ? "simplicity" : "full";
            const layoutLabel = () =>
                layout === "full" ? "Layout: Full" : "Layout: Simple";
            Utils.addStyle(
                "cm-styles",
                '@import url(\'https://fonts.googleapis.com/css2?family=Alegreya:wght@700&family=Cookie&family=Lexend:wght@700&family=Fraunces&display=swap\'); #cm-root, #cm-root * { box-sizing: border-box; font-family: "Lexend", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-weight: 700 !important; } #cm-root { position: fixed; height: 100%; width: 100%; top: 0; right: 0; background-color: rgba(0, 0, 0, 0.45); z-index: 9999; display: flex; justify-content: flex-end; align-items: center; padding: 20px; pointer-events: none; } #cm-root .cm-wrap { position: relative; pointer-events: auto; width: 100%; max-width: 320px; height: auto; max-height: 95vh; background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-radius: 20px; box-shadow: 0 16px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.02); padding: 16px; border: 1px solid rgba(255, 255, 255, 0.8); color: #1D1D1F; transition: max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), all 0.3s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; gap: 12px; overflow: hidden; } #cm-root .cm-wrap.cm-full { max-width: 400px; } #cm-root .cm-close { position: absolute; top: 10px; right: 10px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(0,0,0,0.06); cursor: pointer; z-index: 20; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); } #cm-root .cm-close:hover { background: #FFFFFF; transform: scale(1.08); } #cm-root .cm-close img { width: 11px; height: 11px; opacity: 0.6; } #cm-root .cm-card { display: flex; flex-direction: column; width: 100%; background: rgba(255, 255, 255, 0.5); border-radius: 14px; padding: 10px; border: 1px solid rgba(0,0,0,0.05); min-height: 0; height: auto; flex: 0 1 auto; } #cm-root #cm-card-bau { max-height: 100%; } #cm-root #cm-card-lm { max-height: 70%; } #cm-root .cm-head { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; width: 100%; flex-shrink: 0; } #cm-root .cm-head-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; } #cm-root .cm-head h3 { margin: 0; font-size: 11px; color: #86868B; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; gap: 6px; } #cm-root .cm-toggle { padding: 3px 9px; font-size: 10px; cursor: pointer; border: 1px solid rgba(0,0,0,0.1); border-radius: 9999px; background: rgba(255, 255, 255, 0.85); color: #1D1D1F; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.04); white-space: nowrap; } #cm-root .cm-toggle:hover { background: #FFFFFF; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.08); } #cm-root .cm-toggle:active { transform: scale(0.96); } #cm-root .cm-stats { display: flex; gap: 5px; justify-content: flex-start; align-items: center; width: 100%; } #cm-root .cm-pill { font-size: 9.5px; padding: 2px 7px; border-radius: 9999px; white-space: nowrap; } #cm-root .badge-act { background: rgba(52, 199, 89, 0.12); color: #248A3D; border: 1px solid rgba(52, 199, 89, 0.2); } #cm-root .badge-phn { background: rgba(255, 59, 48, 0.12); color: #D70015; border: 1px solid rgba(255, 59, 48, 0.2); } #cm-root .badge-brk { background: rgba(255, 149, 0, 0.12); color: #C77000; border: 1px solid rgba(255, 149, 0, 0.2); } #cm-root .badge-tot { background: rgba(142, 142, 147, 0.12); color: #636366; border: 1px solid rgba(142, 142, 147, 0.2); } #cm-root .cm-card.cm-warn { animation: pulseHealth 2.5s infinite; border-color: rgba(255, 59, 48, 0.6); box-shadow: 0 0 20px rgba(255, 59, 48, 0.2); } @keyframes pulseHealth { 0%, 100% { border-color: rgba(0, 0, 0, 0.05); } 50% { border-color: rgba(255, 59, 48, 0.6); } } #cm-root .cm-warn-txt { font-size: 9.5px; color: #FF3B30; text-transform: uppercase; letter-spacing: 0.5px; } #cm-root .cm-cols { display: flex; width: 100%; gap: 8px; align-items: center; padding: 0 2px 4px 2px; box-sizing: border-box; flex-shrink: 0; } #cm-root .col-spacer { width: 54px; min-width: 54px; flex-shrink: 0; } #cm-root .col-grid { flex-grow: 1; display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(56px, auto) minmax(56px, auto) minmax(20px, auto); gap: 6px; padding: 0 10px; font-size: 8.5px; color: #86868B; text-transform: uppercase; letter-spacing: 0.4px; } #cm-root .col-grid span { text-align: center; display: flex; align-items: center; justify-content: center; } #cm-root .cm-list { flex-grow: 1; overflow-y: auto; overflow-x: hidden; padding: 2px; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 10px; width: 100%; min-height: 0; } #cm-root .cm-group { display: flex; width: 100%; gap: 8px; align-items: flex-start; } #cm-root .grp-lbl { flex-shrink: 0; width: 54px; text-align: left; font-size: 15px !important; font-family: "Cookie", cursive !important; color: #86868B; letter-spacing: 0.3px; padding: 5px 2px; border-left: 2px solid rgba(0,0,0,0.1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; text-transform: none; } #cm-root .grp-lbl.is-me { color: #0071E3; border-left-color: #0071E3; background: rgba(0, 113, 227, 0.08); border-radius: 0 3px 3px 0; } #cm-root .grp-stack { flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; } #cm-root .cm-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-radius: 12px; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 2px 6px rgba(0,0,0,0.02); position: relative; background-clip: padding-box; border: 1px solid rgba(255, 255, 255, 0.6); z-index: 1; width: 100%; min-width: 0; } #cm-root .cm-row.is-full { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(56px, auto) minmax(56px, auto) minmax(20px, auto); gap: 6px; padding: 6px 10px; } #cm-root .cm-row:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); } #cm-root .cm-row::before { content: \'\'; position: absolute; inset: 0; border-radius: 12px; padding: 1.5px; margin: -1.5px; background: conic-gradient(var(--st-color) var(--progress), var(--st-track) var(--progress)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; z-index: -1; } @keyframes pulseWarning { 0%, 100% { filter: drop-shadow(0 0 2px var(--st-color)); } 50% { filter: drop-shadow(0 0 8px var(--st-color)); } } #cm-root .cm-row.is-over::before { animation: pulseWarning 1.5s infinite ease-in-out; } #cm-root .row-left { position: relative; z-index: 1; display: flex; align-items: center; gap: 8px; min-width: 0; flex-shrink: 1; } #cm-root .row-left span, #cm-root .row-left .row-name { font-size: 11.5px; letter-spacing: 0.2px; color: #1D1D1F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } #cm-root .row-name { font-family: "Alegreya", serif !important; font-size: 12px !important; } #cm-root .row-info { display: flex; flex-direction: column; min-width: 0; overflow: hidden; justify-content: center; } #cm-root .row-avatar { width: 24px; height: 24px; min-width: 24px; border-radius: 7px; object-fit: cover; border: 1px solid rgba(0,0,0,0.05); flex-shrink: 0; } #cm-root .row-right { position: relative; z-index: 1; display: flex; align-items: center; gap: 6px; text-align: right; flex-shrink: 0; } #cm-root .row-meta { display: flex; flex-direction: column; text-align: right; } #cm-root .row-col { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: center; text-align: center; min-width: 0; } #cm-root .row-time, #cm-root .row-subtime { font-family: "Fraunces", sans-serif !important; font-size: 11.5px !important; color: #1D1D1F; opacity: 0.95; font-variant-numeric: tabular-nums; letter-spacing: -0.2px; line-height: 1.2; white-space: nowrap; } #cm-root .row-subtime { display: inline; } #cm-root .row-status, #cm-root .row-info .row-status { font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; font-size: 9.5px; letter-spacing: 0.25px; display: inline-block; margin-top: 1px; line-height: 1.2; } #cm-root .row-info .row-status { font-size: 9px; margin-top: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } #cm-root .row-right img, #cm-root .row-ico img { width: 16px; height: 16px; min-width: 16px; max-width: 16px; max-height: 16px; object-fit: contain; opacity: 0.85; display: block; flex-shrink: 0; } #cm-root .row-ico { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 4px; min-width: 20px; flex-shrink: 0; } #cm-root .st-active { background: rgba(230, 248, 236, 0.7); color: #064E3B; } #cm-root .st-active .row-status { color: #248A3D; } #cm-root .st-phone { background: rgba(254, 238, 238, 0.7); color: #7F1D1D; } #cm-root .st-phone .row-status { color: #D70015; } #cm-root .st-video { background: rgba(245, 235, 255, 0.7); color: #4C1D95; } #cm-root .st-video .row-status { color: #8944AB; } #cm-root .st-email { background: rgba(230, 242, 255, 0.7); color: #0C4A6E; } #cm-root .st-email .row-status { color: #0071E3; } #cm-root .st-coffee-break { background: rgba(255, 244, 230, 0.7); color: #78350F; } #cm-root .st-coffee-break .row-status { color: #C77000; } #cm-root .st-lunch-break { background: rgba(255, 250, 230, 0.7); color: #713F12; } #cm-root .st-lunch-break .row-status { color: #A16207; } #cm-root .st-break { background: rgba(242, 242, 247, 0.7); color: #374151; } #cm-root .st-break .row-status { color: #636366; } [animation="breathe"] { animation: breathe 2s infinite ease-in-out; } @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.15); opacity: 1; } } [animation="rock"] { animation: rock 3s infinite ease-in-out; transform-origin: bottom center; } @keyframes rock { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } } [animation="bounce-y"] { animation: bounce-y 1.5s infinite ease-in-out; } @keyframes bounce-y { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } } [animation="ring"] { animation: ring 2s infinite ease-in-out; } @keyframes ring { 0%, 100% { transform: rotate(0); } 10%, 30%, 50% { transform: rotate(12deg); } 20%, 40%, 60% { transform: rotate(-12deg); } 70% { transform: rotate(0); } } [animation="fly"] { animation: fly 2.5s infinite ease-in-out; } @keyframes fly { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(3px, -3px); } } [animation="fade-pulse"] { animation: fade-pulse 3s infinite ease-in-out; } @keyframes fade-pulse { 0%, 100% { opacity: 0.4; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } } #cm-root .cm-list::-webkit-scrollbar { width: 4px; } #cm-root .cm-list::-webkit-scrollbar-track { background: transparent; } #cm-root .cm-list::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; } @media screen and (max-width: 380px) { #cm-root .grp-lbl { display: none !important; } } @media screen and (max-width: 320px) { #cm-root .cm-stats { display: none !important; } #cm-root .cm-head h3 { margin-bottom: 0; } } @media screen and (max-width: 280px) { #cm-root .row-info { display: none !important; } } @media screen and (max-width: 240px) { #cm-root .row-right img, #cm-root .row-ico img { display: none !important; } } @media screen and (max-width: 220px) { #cm-root .row-subtime { display: none !important; } }',
            );
            $("#cm-root")?.remove();
            const toggleBtnHtml = isAdmin
                ? `<button class="cm-toggle" id="cm-layout-toggle" title="Switch layout">${layoutLabel()}</button>`
                : "";
            const root = Utils.createEl("div", {
                id: "cm-root",
                parent: document.body,
                html: `<div class="cm-wrap ${layout === "full" ? "cm-full" : ""}" id="cm-wrap-shell"><button class="cm-close" title="Close"><img src="${Dash.ICONS.close}" alt="Close"/></button>${Dash.cardHtml("lm", "LM Team Status", toggleBtnHtml)}${Dash.cardHtml("bau", "BAU Team Status")}</div>`,
            });
            const q = (sel) => root.querySelector(sel);
            const renderSection = (agents, suffix) => {
                const activeCount = agents.filter(
                    (a) => a.statusKey === "active",
                ).length;
                const callCount = agents.filter(
                    (a) => a.statusKey === "phone" || a.statusKey === "video",
                ).length;
                const totalCount = agents.length;
                const breakCount = totalCount - activeCount - callCount;
                const isLow = totalCount > 0 && activeCount / totalCount < 0.2;
                q(`#cnt-act-${suffix}`).textContent = `Actv: ${activeCount}`;
                q(`#cnt-phn-${suffix}`).textContent = `Phn: ${callCount}`;
                q(`#cnt-brk-${suffix}`).textContent = `Brk: ${breakCount}`;
                q(`#cnt-tot-${suffix}`).textContent = `Tot: ${totalCount}`;
                const cardEl = q(`#cm-card-${suffix}`);
                cardEl.classList.toggle("cm-warn", isLow);
                cardEl.style.display = totalCount === 0 ? "none" : "flex";
                q(`#cm-health-warn-${suffix}`).style.display = isLow
                    ? "inline"
                    : "none";
                const groups = [];
                let currentGroup = null;
                agents.forEach((agent) => {
                    const isUser = agent.ldap === currentUserName;
                    let label = isUser ? "You" : agent.displayStatus;
                    if (!isUser)
                        if (
                            agent.statusKey === "phone" ||
                            agent.statusKey === "video"
                        )
                            label = "On Call";
                        else if (agent.statusKey.includes("break"))
                            label = agent.statusKey.split("-")[0];
                    if (currentGroup?.label !== label) {
                        currentGroup = { label, isUser, rows: [] };
                        groups.push(currentGroup);
                    }
                    currentGroup.rows.push(agent);
                });
                const esc = Utils.escapeHtml;
                const isFull = layout === "full";
                const fragment = document.createDocumentFragment();
                if (isFull)
                    Utils.createEl("div", {
                        className: "cm-cols",
                        html: '<div class="col-spacer"></div><div class="col-grid"><span>Agent</span><span>Last Change</span><span>In State</span><span></span></div>',
                        parent: fragment,
                    });
                groups.forEach((group) => {
                    const groupBlock = Utils.createEl("div", {
                        className: "cm-group",
                        parent: fragment,
                    });
                    Utils.createEl("div", {
                        className: "grp-lbl " + (group.isUser ? "is-me" : ""),
                        text: group.label,
                        parent: groupBlock,
                    });
                    const stack = Utils.createEl("div", {
                        className: "grp-stack",
                        parent: groupBlock,
                    });
                    group.rows.forEach((agent) => {
                        const st =
                            Dash.STATUS_MAP[agent.statusKey] ||
                            Dash.STATUS_MAP.default;
                        const progressPct = Math.min(
                            (agent.durationSeconds / st.maxSecs) * 100,
                            100,
                        ).toFixed(1);
                        const isOverTime = agent.durationSeconds >= st.maxSecs;
                        const isActive = agent.statusKey === "active";
                        const img = (src, alt, extra = "") =>
                            `<img src="${src}" alt="${esc(alt)}" loading="lazy"${extra} />`;
                        const iconsHtml =
                            (st.ico
                                ? img(
                                      `https://cdn-icons-png.flaticon.com/512/${st.ico}.png`,
                                      `${agent.statusKey} icon`,
                                      ` animation="${st.anim}"`,
                                  )
                                : "") +
                            (isActive && agent.rawStatus1 === "busy"
                                ? img(Dash.ICONS.non_phone, "non_phone")
                                : "") +
                            (isActive && agent.rawStatus2 === "busy"
                                ? img(Dash.ICONS.non_video, "non_video")
                                : "");
                        const avatar = `<img class="row-avatar" src="${esc(agent.img)}" alt="${esc(agent.ldap)}" loading="lazy" />`;
                        const name = `<span class="row-name">${esc(agent.ldap)}</span>`;
                        const status = `<span class="row-status">${esc(agent.displayStatus)}</span>`;
                        const rowInnerHtml = isFull
                            ? `<div class="row-left">${avatar}<div class="row-info">${name}${status}</div></div><div class="row-col"><span class="row-time">${esc(agent.lastChangeRaw || "-")}</span></div><div class="row-col"><span class="row-time">${esc(agent.timeInState || "-")}</span></div><div class="row-ico">${iconsHtml}</div>`
                            : `<div class="row-left">${avatar}${name}</div><div class="row-right"><div class="row-meta"><span class="row-time">${esc(agent.lastChangeRaw)} <span class="row-subtime">(${esc(agent.timeInState)})</span></span>${status}</div>${iconsHtml}</div>`;
                        Utils.createEl("div", {
                            className: `cm-row ${agent.cssClass}${isOverTime ? " is-over" : ""}${isFull ? " is-full" : ""}`,
                            style: `--progress: ${progressPct}%; --st-color: ${st.color}; --st-track: ${st.track};`,
                            html: rowInnerHtml,
                            "data-ldap": agent.ldap,
                            parent: stack,
                        });
                    });
                });
                const listRoot = q(`#cm-list-${suffix}`);
                listRoot.textContent = "";
                listRoot.appendChild(fragment);
            };
            const statusPrio = (a) =>
                (Dash.STATUS_MAP[a.statusKey] || Dash.STATUS_MAP.default).prio;
            const poolRank = (a) => Dash.POOL_RANKS[a.poolDisplay] || 3;
            const txt = (cell) => cell?.innerText.trim() || "";
            const updateDashboard = () => {
                if (!root.isConnected) return;
                try {
                    const agents = $$("tbody tr", targetContainer)
                        .map((row) => {
                            const cells = row.querySelectorAll("td");
                            if (cells.length < 10) return null;
                            const rawStatus1 = Dash.extractState(cells[5]);
                            const rawStatus2 = Dash.extractState(cells[8]);
                            let displayStatus = txt(cells[3]);
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
                            const pool = `${txt(cells[10])},${txt(cells[13])}`;
                            const poolDisplay =
                                pool.includes("3028872") ||
                                pool.includes("3014937")
                                    ? "LM"
                                    : pool.includes("3004773")
                                      ? "BAU"
                                      : "";
                            return {
                                img: row.querySelector("img")?.src || "",
                                ldap: txt(cells[1]),
                                timeInState: Dash.formatTime(txt(cells[4])),
                                lastChangeRaw: Dash.formatTime(txt(cells[9])),
                                displayStatus,
                                statusKey,
                                cssClass: `st-${statusKey}`,
                                durationSeconds: Dash.parseDuration(
                                    cells[9]?.innerText,
                                ),
                                poolDisplay,
                                rawStatus1,
                                rawStatus2,
                            };
                        })
                        .filter(Boolean)
                        .sort((a, b) => {
                            const aU = a.ldap === currentUserName;
                            const bU = b.ldap === currentUserName;
                            return (
                                bU - aU ||
                                statusPrio(a) - statusPrio(b) ||
                                poolRank(a) - poolRank(b) ||
                                b.durationSeconds - a.durationSeconds
                            );
                        });
                    renderSection(
                        agents.filter((a) => a.poolDisplay === "BAU"),
                        "bau",
                    );
                    renderSection(
                        agents.filter((a) => a.poolDisplay === "LM"),
                        "lm",
                    );
                } catch (err) {
                    console.error("Dash render error:", err);
                }
            };
            let timer;
            const observer = new MutationObserver(() => {
                clearTimeout(timer);
                timer = setTimeout(updateDashboard, 150);
            });
            observer.observe(targetContainer, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true,
            });
            const stop = () => {
                observer.disconnect();
                clearTimeout(timer);
                root.remove();
            };
            onTeardown(stop);
            root.addEventListener("click", (e) => {
                if (e.target.closest(".cm-close")) return stop();
                if (isAdmin && e.target.closest("#cm-layout-toggle")) {
                    layout = layout === "simplicity" ? "full" : "simplicity";
                    q("#cm-wrap-shell").classList.toggle(
                        "cm-full",
                        layout === "full",
                    );
                    q("#cm-layout-toggle").textContent = layoutLabel();
                    updateDashboard();
                }
            });
            updateDashboard();
        },
    };
    // ============================================================================
    // SECTION 7&8: CASES CONNECT WORKFLOW & FOLLOW-UP AUTOMATION (CasesConnect)
    // ============================================================================
    const BASE_COMMENTS = [
        "Setup Conversion Linker",
        "Guided the advertiser how to see the report",
        "Survey pitched",
    ];
    const GA4_COMMENTS = [
        ...BASE_COMMENTS,
        "Linked GA4 and Google Ads",
        "Turned on Google signals data collection",
        "Turned on User Data Collection Acknowledgement",
        "Tested with Tag Assistant and Real time in GA4",
    ];
    const TASK_TYPES = [
        "Ads - Conversion Tracking",
        "Ads - Customer Match",
        "Ads - Dynamic Remarketing",
        "Ads - Enhanced Conversions for Leads (ECL)",
        "Ads - Enhanced Conversions for Web (ECW)",
        "Ads - NCA implementations",
        "Ads - Offline Conversion Tracking",
        "Ads - Standard Remarketing",
        "Consent Mode (CoMo)",
        "Cross Domain Tracking",
        "GA4 - Campaign Data Import",
        "GA4 - Ecommerce Tracking",
        "GA4 - Events tracking",
        "GA4 - Setup (no Analytics in place yet)",
        "GA4 - Standard Remarketing",
        "GA4 - User Provided Data Event Tracking",
        "Google Tag Gateway",
        "Google Tag/Google Tag Manager",
        "Shopping Feed Optimization",
        "Shopping Onboarding",
    ];
    const matchTaskType = (raw) => {
        const norm = (s) =>
            String(s ?? "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, " ")
                .trim();
        const r = norm(raw);
        if (!r) return "";
        if (r === "ads enhanced conversions")
            return "Ads - Enhanced Conversions for Web (ECW)";
        return (
            TASK_TYPES.find((t) => {
                const nt = norm(t.replace(/\(.*?\)/g, ""));
                return (
                    norm(t) === r ||
                    nt === r ||
                    nt.includes(r) ||
                    r.includes(nt)
                );
            }) || String(raw ?? "").trim()
        );
    };
    const isEcTask = (s) =>
        Boolean(
            s && s !== "NA" && /enhanced conversion|\becw\b|\becl\b/i.test(s),
        );
    const CONV_BASE = (subStatus) => ({
        subStatus,
        subStatusReason: "Implement Ads Conversion Tracking",
        taskTypes: "Ads - Conversion Tracking",
        tagsImplemented: "Ads Conversion Tracking",
        comments: [
            "Implemented Google Ads conversions for { Hotline / Zalo / Purchase / Form } via GTM / Gtag",
            "Tested with Tag Assistant",
            "No recent conversions",
            ...BASE_COMMENTS,
        ],
    });
    const STEP_OPTIONS = {
        0: [
            [
                "SO - Solution Offered",
                [
                    ["SO - Implementation Only", "IMPLEMENTATION_ONLY"],
                    ["SO - Education Only", "EDUCATION_ONLY"],
                    ["SO - Troubleshooting Only", "TROUBLESHOOTING_ONLY"],
                    ["SO - Verified", "VERIFIED"],
                ],
            ],
            [
                "IN - Inactive",
                [
                    ["IN - Instruction Share", "INSTRUCTION_SHARE"],
                    ["IN - Out of Scope", "OUT_OF_SCOPE"],
                    ["IN - Not Reachable", "NOT_REACHABLE"],
                    ["IN - Infeasible", "INFEASIBLE"],
                    ["IN - Not Interested", "NOT_INTERESTED"],
                ],
            ],
        ],
        1: [
            ["AS - Reschedule 1", "RESCHEDULE_1"],
            ["NI - Attempted Contact", "ATTEMPT_CONTACT"],
        ],
        2: [
            ["NI - Awaiting Inputs", "WAITING_INPUT"],
            [
                "NI - Awaiting Validation",
                [
                    ["GA4 Event", "GA4"],
                    ["GA4 UPD", "GA4_UPD"],
                    ["Remarketing", "REMARKETING"],
                ],
            ],
            ["NI - In Consult", "IN_CONSULT"],
        ],
        5: [["NI - Awaiting Validation (Enhanced Conversion)", "EC"]],
    };
    STEP_OPTIONS[3] = STEP_OPTIONS[2];
    const PALETTE = [
        ["#A5D8FF", "#183B56"],
        ["#B2F2BB", "#1E5E2A"],
        ["#D0BFFF", "#3A2A59"],
        ["#FFEC99", "#5C3A00"],
        ["#FCC2D7", "#610B2A"],
        ["#D8F5A2", "#2B5200"],
        ["#FFD8A8", "#66181D"],
        ["#EAEAEA", "#333333"],
        ["#C5F6FA", "#0B7285"],
    ];
    const CasesConnect = {
        NOTE_TEMPLATES: {
            EC: {
                subStatus: "NI - Awaiting Validation",
                subStatusReason: "Implemented Ads Enhanced Conversion",
                taskTypes: "Ads - Enhanced Conversions for Web (ECW)",
                tagsImplemented: "Ads Enhanced Conversions",
                comments: [
                    "Implemented Google Ads enhanced conversions for { Purchase, Form Submit } via GTM / Gtag",
                    "Tested with Tag Assistant",
                    "Turn on Enhanced Conversion in conversion action",
                    "No recent conversions",
                    "Awaiting enhanced conversion to record data",
                    ...BASE_COMMENTS,
                ],
            },
            GA4_LINK: {
                subStatus: "SO - Implementation Only",
                subStatusReason: "Implement GA4",
                taskTypes: "GA4 - Setup (no Analytics in place yet)",
                comments: ["Implemented GA4 tag via GTM", ...GA4_COMMENTS],
            },
            WAITING_INPUT: {
                subStatus: "NI - Awaiting Inputs",
                subStatusReason: "waiting for Adv to setup GTM",
                comments: ["Waiting for advertiser to setup GTM"],
            },
            RESCHEDULE_1: { subStatus: "AS - Reschedule 1" },
            IN_CONSULT: {
                subStatus: "NI - In Consult",
                subStatusReason: "Waiting for SME to confirm",
            },
            INSTRUCTION_SHARE: { subStatus: "IN - Instruction Share" },
            CONVERSION_TRACKING: CONV_BASE(
                "SO - { Implementation / Education / Troubleshooting } Only",
            ),
            IMPLEMENTATION_ONLY: CONV_BASE("SO - Implementation Only"),
            EDUCATION_ONLY: CONV_BASE("SO - Education Only"),
            TROUBLESHOOTING_ONLY: CONV_BASE("SO - Troubleshooting Only"),
            VERIFIED: CONV_BASE("SO - Verified"),
            OUT_OF_SCOPE: { subStatus: "IN - Out of Scope" },
            NOT_REACHABLE: { subStatus: "IN - Not Reachable" },
            INFEASIBLE: { subStatus: "IN - Infeasible" },
            NOT_INTERESTED: { subStatus: "IN - Not Interested" },
            GA4: {
                subStatus: "NI - Awaiting Validation",
                subStatusReason: "Implement GA4 Event",
                taskTypes: "GA4 - Events tracking",
                tagsImplemented: "Analytics Event Tracking",
                comments: [
                    "Implemented GA4 event { Hotline / Zalo / Purchase / Form } via GTM / Gtag code",
                    "Recording data",
                    "Awaiting events to be processed in GA4 Event Report",
                    "Guide advertiser import GA4 event to Google Ads",
                    ...GA4_COMMENTS,
                ],
            },
            GA4_UPD: {
                subStatus: "NI - Awaiting Validation",
                subStatusReason: "Implement User-Provided Data",
                taskTypes: "GA4 - User Provided Data Event Tracking",
                tagsImplemented: "GA4 User-Provided Data Event Tracking",
                comments: [
                    "Turn on GA4 User-Provided Data collection",
                    "Implemented GA4 UPD for { Purchase, Form Submit } via GTM / Gtag",
                    "Tested with Tag Assistant and Real time in GA4",
                    ...GA4_COMMENTS,
                ],
            },
            REMARKETING: {
                subStatus: "NI - Awaiting Validation",
                subStatusReason: "Implement Ads Audiences",
                taskTypes: "Ads - Standard Remarketing",
                tagsImplemented: "Ads Remarketing",
                comments: [
                    "Implemented GA4 Audiences for Pageview < {10} s via GTM",
                    ...GA4_COMMENTS,
                ],
            },
            ATTEMPT_CONTACT: {
                subStatus: "NI - Attempted Contact",
                subStatusReason: "Adv not answer the phone",
                comments: [
                    "Attempted to contact advertiser, call was not answered",
                ],
            },
        },
        parseDate(val) {
            if (!val) return null;
            const ts = Number(val);
            if (!isNaN(ts) && ts > 1e11) return new Date(ts);
            const p = String(val).match(/\d+/g);
            return p?.length >= 3
                ? p[0].length === 4
                    ? new Date(+p[0], +p[1] - 1, +p[2])
                    : new Date(+p[2], +p[1] - 1, +p[0])
                : null;
        },
        currentFollowUp: () => {
            const val = $('[data-infocase="follow_up_time"]')?.dataset
                ?.valchoice;
            if (!val) return "NA";
            const ts = Number(val);
            return !isNaN(ts) && ts > 1e11 ? Utils.isoDate(new Date(ts)) : val;
        },
        isAppt5DaysBefore() {
            const apptEl = $('[data-infocase="appointment_time"]');
            const apptDate = CasesConnect.parseDate(
                apptEl?.dataset?.valchoice || apptEl?.innerText,
            );
            const flupVal = CasesConnect.currentFollowUp();
            const flupDate =
                (flupVal !== "NA" && CasesConnect.parseDate(flupVal)) ||
                new Date();
            return Boolean(
                apptDate &&
                !isNaN(apptDate) &&
                Math.round(
                    (new Date(flupDate).setHours(0, 0, 0, 0) -
                        new Date(apptDate).setHours(0, 0, 0, 0)) /
                        864e5,
                ) >= 5,
            );
        },
        scrapeSpeakeasyIds: () =>
            [
                ...new Set(
                    [
                        ...document.body.innerText.matchAll(
                            /Speakeasy session ID:\s*(P\d+)/gi,
                        ),
                    ].map((m) => m[1]),
                ),
            ].join(", ") || "NA",
        scrapeDomTasks: () => {
            const apptTasks = $$(`.form-label`)
                .find((el) => el.textContent.trim() === "Appointment tasks")
                ?.parentElement?.querySelectorAll("sanitized-content");
            return apptTasks?.length
                ? [
                      ...new Set(
                          [...apptTasks]
                              .map((el) => matchTaskType(el.textContent))
                              .filter(Boolean),
                      ),
                  ].join(", ")
                : "";
        },
        ecRowsHTML(is5Days = CasesConnect.isAppt5DaysBefore()) {
            const td =
                "border:1pt solid #000;vertical-align:top;padding:5pt;overflow:hidden;word-break:break-word;box-sizing:border-box;";
            const font =
                "font-size:11pt;font-family:'Google Sans',sans-serif;color:#000;white-space:pre-wrap;";
            const g = (s) => `<span style="color:#188038;">${s}</span>`;
            const ecRow = (lbl, desc, kind = "1") =>
                `<tr data-ec-row="${kind}" style="height:21pt"><td style="${td}width:30%;"><span style="${font}font-weight:700;">${lbl}</span><div style="font-size:9.5pt;font-family:'Google Sans',sans-serif;color:#5f6368;margin-top:2px;line-height:1.25;">${desc}</div></td><td style="${td}width:70%;"><span style="${font}">NA</span></td></tr>`;
            return (
                ecRow(
                    "Google Ads EC Settings: (Only for ECW)",
                    `[Attach screenshot showing ${g("Turn on enhanced conversions")} enabled and method selected (${g("Google tag")} or ${g("GTM")}); or ${g("NA")}]`,
                ) +
                ecRow(
                    "Customer Data Terms Accepted: (Only for ECW)",
                    `[Attach screenshot showing Customer Data Terms accepted in Google Ads; or ${g("NA")}]`,
                ) +
                ecRow(
                    `Error-Free ${g("em")} Parameter OR ${g("ecsid")} PII Stitching: (Only for ECW)`,
                    `[Attach Tag Assistant / Network payload screenshot showing ${g("em")} parameter with a valid SHA-256 hash (${g("em=tv.1~em.&lt;sha256&gt;")}, must NOT be ${g("em.e0")}); OR if PII is stitched across pages, attach 2 screenshots showing matching ${g("ecsid")} between upstream PII event and downstream conversion event; or ${g("NA")}]`,
                ) +
                (is5Days
                    ? ecRow(
                          "Tag Diagnostics / EC Qualdash: (only for ECW)",
                          `[Attach Day 7 Google Ads Tag Diagnostics screenshot showing ${g('"Recording enhanced conversions"')} (Excellent status, no major alerts) and/or ${g("EC Qualdash WAI")}; or ${g("NA")}]`,
                          "diag",
                      )
                    : "")
            );
        },
        syncEcRows(tbl, taskText) {
            const tbody = tbl?.tBodies?.[0] || tbl;
            if (!tbody) return;
            $$("tr", tbody).forEach((tr) => {
                if (
                    tr.dataset.ecRow ||
                    /\(only for ecw\)/i.test(tr.cells?.[0]?.textContent || "")
                )
                    tr.remove();
            });
            if (isEcTask(taskText)) {
                const lastRow = tbody.lastElementChild;
                const html = toSafeHTML(
                    CasesConnect.ecRowsHTML(CasesConnect.isAppt5DaysBefore()),
                );
                if (lastRow) lastRow.insertAdjacentHTML("beforebegin", html);
                else tbody.insertAdjacentHTML("beforeend", html);
            }
        },
        promptCaseType: (daysOffset) =>
            new Promise((resolve) => {
                $("#qm-modal-overlay")?.remove();
                const rootOpts = STEP_OPTIONS[daysOffset];
                if (!rootOpts) return resolve(null);
                const overlay = Utils.createEl("div", {
                    id: "qm-modal-overlay",
                    parent: document.body,
                    style: "position:fixed;inset:0;background:rgba(0,0,0,0.15);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:2147483647;",
                });
                const modal = Utils.createEl("div", {
                    parent: overlay,
                    style: "background:#FFF;border-radius:16px;padding:22px;width:320px;box-shadow:0 16px 36px rgba(0,0,0,0.12);text-align:center;border:1px solid rgba(0,0,0,0.05);max-height:85vh;overflow-y:auto;",
                });
                const close = (val) => {
                    overlay.remove();
                    resolve(val);
                };
                onTeardown(() => close(null));
                const render = (title, items, backFn) => {
                    modal.textContent = "";
                    Utils.createEl("div", {
                        text: title,
                        parent: modal,
                        style: "font-size:18px;font-weight:700;color:#1D1D1F;margin-bottom:4px;",
                    });
                    Utils.createEl("div", {
                        text: "Choose sub-status:",
                        parent: modal,
                        style: "font-size:14px;color:#86868B;margin-bottom:18px;",
                    });
                    const actions = Utils.createEl("div", {
                        parent: modal,
                        style: "display:flex;flex-direction:column;gap:8px;",
                    });
                    [
                        ...items.map(([label, val], i) => [
                            label,
                            ...PALETTE[i % PALETTE.length],
                            () =>
                                Array.isArray(val)
                                    ? render(label, val, () =>
                                          render(
                                              `Options for ${daysOffset} Day(s)`,
                                              rootOpts,
                                          ),
                                      )
                                    : close(val),
                        ]),
                        backFn
                            ? ["← Back", "#F1F3F5", "#495057", backFn]
                            : [
                                  "Skip / Keep Default",
                                  "#F1F3F5",
                                  "#495057",
                                  () => close(null),
                              ],
                    ].forEach(([label, bg, color, onClick]) =>
                        Utils.createEl("button", {
                            text: label,
                            parent: actions,
                            style: `padding:10px 14px;border-radius:10px;border:none;font-size:16px;font-weight:600;cursor:pointer;background:${bg};color:${color};`,
                            onClick,
                        }),
                    );
                };
                render(`Options for ${daysOffset} Day(s)`, rootOpts);
            }),
        buildNoteTemplateHTML(
            templateKey,
            followUpVal,
            speakeasyId = CasesConnect.scrapeSpeakeasyIds(),
            verifiedTags = "",
            isAppt5DaysBefore = CasesConnect.isAppt5DaysBefore(),
            domTasks = CasesConnect.scrapeDomTasks(),
        ) {
            let cfg = CasesConnect.NOTE_TEMPLATES[templateKey];
            if (
                cfg &&
                isAppt5DaysBefore &&
                isEcTask(domTasks) &&
                [
                    "IMPLEMENTATION_ONLY",
                    "TROUBLESHOOTING_ONLY",
                    "EDUCATION_ONLY",
                ].includes(templateKey)
            ) {
                cfg = {
                    ...cfg,
                    taskTypes: domTasks,
                    tagsImplemented: "Ads Enhanced Conversions",
                    comments: [
                        "Verified Google Ads enhanced conversions for { Purchase, Form Submit } via GTM / Gtag",
                        ...BASE_COMMENTS,
                    ],
                };
            }
            const esc = Utils.escapeHtml;
            const hl = (s) =>
                esc(s).replace(
                    /\{[^}]+\}/g,
                    '<span style="background:#ffe066;color:#c92a2a;font-weight:700;padding:1px 4px;border-radius:4px;">$&</span>',
                );
            const td =
                "border:1pt solid #000;vertical-align:top;padding:5pt;overflow:hidden;word-break:break-word;box-sizing:border-box;";
            const font =
                "font-size:11pt;font-family:'Google Sans',sans-serif;color:#000;white-space:pre-wrap;";
            const cid = esc(
                $(".above-section div:nth-child(5) .capitalized")
                    ?.innerText?.trim()
                    ?.replace(/\D/g, "")
                    ?.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3") || "NA",
            );
            const taskVal = domTasks || cfg?.taskTypes || "NA";
            const hasEC = isEcTask(taskVal);
            const g = (s) => `<span style="color:#188038;">${s}</span>`;
            const head = (title) =>
                `<tr style="height:21pt"><td colspan="2" style="${td}background:#fff2cc;text-align:center;"><span style="${font}font-weight:700;">${title}</span> <span style="${font}font-style:italic;">(Mandatory)</span></td></tr>`;
            const row = (lbl, desc, val, bg = "transparent") =>
                `<tr style="height:21pt"><td style="${td}width:30%;"><span style="${font}background:${bg};font-weight:700;">${lbl}</span>${desc ? `<div style="font-size:9.5pt;font-family:'Google Sans',sans-serif;color:#5f6368;margin-top:2px;line-height:1.25;">${desc}</div>` : ""}</td><td style="${td}width:70%;"><span style="${font}background:${bg};">${val}</span></td></tr>`;
            const comments = cfg?.comments?.length
                ? `<ul dir="auto" style="margin:0;padding-left:18px;">${cfg.comments.map((c) => `<li>${hl(c)}</li>`).join("")}</ul>`
                : "NA";
            const consent =
                cfg?.subStatus &&
                !/Attempted Contact|Not Reachable|Unreachable/i.test(
                    cfg.subStatus,
                )
                    ? "Yes"
                    : "NA";
            return `<div id="noteCaseUI" class="cdtx__uioncall"><div class="cdtx__uioncall_control"><span class="cdtx__uioncall_control-load" data-text="Split &amp; Transfer" data-btnclk="oncall_templ_lt_template">&nbsp;</span><span class="cdtx__uioncall_control-load" data-text="List" data-btnclk="oncall_templ_act_load">&nbsp;</span><span class="cdtx__uioncall_control-save" data-text="Save" data-btnclk="oncall_templ_act_save" data-btntooltip="Save template Reuse">&nbsp;</span><span class="cdtx__uioncall_control-remove" data-text="Remove" data-btnclk="oncall_templ_act_remove">&nbsp;</span></div><article class="cdtx__uioncall_outer"><table style="width:100% !important;table-layout:fixed !important;border-collapse:collapse !important;margin:8px 0 !important;box-sizing:border-box !important;"><tbody>${
                head("General Details") +
                row(
                    "Date:",
                    "[YYYY-MM-DD — Date when the SpeakEasy call, Attempted Contact dial, or follow-up action occurred]",
                    Utils.isoDate(),
                    "#c9daf8",
                ) +
                row(
                    "Speakeasy ID:",
                    `[Exact SpeakEasy session ID copied from the SpeakEasy dashboard (e.g., ${g("P100000000381267617")}). List all IDs separated by comma if multiple dials were made; write ${g("NA")} for offline/email-only updates]`,
                    esc(speakeasyId || "NA"),
                ) +
                row(
                    "Sub-status:",
                    '[Exact Connect Cases Sub-Status selected in Q+ per <a href="http://goto.google.com/tsStatuses" target="_blank" style="color:#1155cc;">go/tsStatuses</a>]',
                    `<span class="_sub_i" data-btnclk="choice_status_list" data-infocase="status_case">${hl(cfg?.subStatus || "NA")}</span>`,
                ) +
                row(
                    "Next Follow-Up Date",
                    `[YYYY-MM-DD — Date when the next follow-up is due; or ${g("NA")}]`,
                    `<span data-btnclk="oncall_templ_act_flchoice" data-dateformat="Y-m-d" data-text="oncall_templ_act_flchoice-text">${esc(followUpVal || "NA")}</span>`,
                ) +
                row(
                    "Task types:",
                    `[Primary Task Type(s) worked on the call separated by comma (e.g., ${g("Ads - Conversion Tracking, Ads - Enhanced Conversions for Web (ECW)")}); write ${g("NA")} only if no tasks were involved in emails or call]`,
                    `<span class="qm-task-pick" data-task-pick="1" style="background:#ffe066;color:#c92a2a;font-weight:700;padding:1px 6px;border-radius:4px;cursor:pointer;display:inline-block;" title="Click to search/select Task Types">${esc(taskVal)}</span>`,
                ) +
                row(
                    "Implemented tags:",
                    `[Exact name(s) of conversion actions created, verified, or troubleshot in Google Ads separated by comma (e.g., ${g("Phone_call, lead_form, Purchase_Shopify, Add_to_Cart")}); write ${g("NA")} if not applicable]`,
                    `<span>${esc(verifiedTags || cfg?.tagsImplemented || "NA")}</span>`,
                ) +
                row(
                    "CID:",
                    `[10-digit external Google Ads Customer ID (${g("XXX-XXX-XXXX")}) confirmed with the advertiser on the call and worked upon. If multiple CIDs or a different CID than the CUF intake form was worked upon, list all CIDs separated by comma; write ${g("NA")} if not applicable]`,
                    cid,
                ) +
                row(
                    "Checked and obtained recording consent from the customer before proceeding with the call",
                    `[${g("Yes")} / ${g("No")} — Whether mandatory call recording consent was obtained at the beginning of the call per country SOP; write ${g("NA")} for ${g("NI - Attempted Contact")} / ${g("IN - Not Reachable")}]`,
                    consent,
                ) +
                row(
                    "Call Summary:",
                    "Concise sentence summary of what transpired on the call/email",
                    cfg?.comments?.length ? hl(cfg.comments[0]) : "NA",
                ) +
                row(
                    "Sub-status Reason :",
                    "exact justification for the selected sub-status",
                    `<span class="cdtx__uioncall-oct_test">${esc(cfg?.subStatusReason || "NA")}</span>`,
                ) +
                row(
                    "Additional information:&nbsp;",
                    "Additional information related to case and call can be put here",
                    comments,
                ) +
                head("Screenshots") +
                row(
                    "Website URL worked upon:",
                    `[Attach Tag Assistant screenshot showing the website URL connected in Google Tag Assistant (e.g., ${g("https://www.exampleclient.com")}); write ${g("NA")} only if no tasks were involved]`,
                    "NA",
                ) +
                row(
                    "Q+ entry:",
                    "[Attach screenshot URL of the completed Q+ tool submission when closing or transferring the case]",
                    "NA",
                ) +
                row(
                    "GVC Chat:",
                    `[Attach screenshot(s) of Google Meet chat if links or instructions were shared on the call; otherwise write ${g("NA")}]`,
                    "NA",
                ) +
                row(
                    "GAM:",
                    `[Attach screenshot URL of the Google Chat ping sent to the Seller / GAM immediately after the call with call outcome, current status, and next steps (+ Seller chat confirmation if additional participants were added, or OOS redirection). Write ${g("NA - DFA Case")} for DFA cases]`,
                    "NA",
                ) +
                row(
                    "Additional Screenshots",
                    `[Attach any additional screenshots of ${g("implementation, troubleshooting, validation, discrepancies etc.")} that are required based on the troubleshooting scenario encountered.] ✨`,
                    "NA",
                ) +
                head("Implementation Screenshots") +
                row(
                    "Google Ads Conversion Status:",
                    `[Attach Google Ads ${g("Goals &gt; Conversions &gt; Summary")} table screenshot (after implementation or 2–3 day validation window) showing ${g("Tracking status")} transitioned to ${g("No recent conversions")}, ${g("Recording conversions")}, or ${g("Active")} with matching CID &amp; Conversion Action Name; or ${g("NA")}]`,
                    "NA",
                ) +
                row(
                    "Google Ads Conversion Settings:",
                    `[Attach screenshot showing ${g("Goal category")} (Purchase, Submit lead form, Phone call lead), ${g("Action optimization")} (${g("Primary")} vs ${g("Secondary")}), ${g("Count")} (${g("Every")} / ${g("One")}), ${g("Value")}, ${g("Attribution model")} (${g("Data-driven")}), and Tag Setup card with ${g("Conversion ID")} (${g("AW-XXXXXXXXX")}) &amp; ${g("Conversion Label")}]`,
                    "NA",
                ) +
                row(
                    "GTM / Website Backend:",
                    `[Attach screenshot showing Google Ads Conversion Tag + Conversion Linker + Trigger in GTM, or manual ${g("gtag.js")} in ${g("`&lt;head&gt;`")} + event snippet; or ${g("NA")}]`,
                    "NA",
                ) +
                row(
                    "Tag Assistant Tag Fired:",
                    `[Attach screenshot confirming Conversion Tag &amp; Conversion Linker under ${g('"Tags Fired"')} with matching ${g("Conversion ID")}, ${g("Conversion Label")}, and dynamic ${g("Value")}/${g("Currency")}; or ${g("NA")}]`,
                    "NA",
                ) +
                row(
                    `<i>“Hit Sent”</i> in Tag Assistant OR Network Header ${g("200 OK")}:`,
                    `[Attach Chrome DevTools Network tab screenshot showing conversion hit to ${g("googleadservices.com/pagead/conversion/")} with matching Conversion Label and green ${g("200 OK")} status; or ${g("NA")}]`,
                    "NA",
                ) +
                (hasEC ? CasesConnect.ecRowsHTML(isAppt5DaysBefore) : "") +
                row(
                    "Additional Screenshots:",
                    `[Attach any additional screenshots of ${g("reports, discrepancies etc.")} that are required based on the troubleshooting scenario encountered.] ✨`,
                    "NA",
                )
            }</tbody></table></article></div>`;
        },
        insertNote(templateHTML, replaceExisting) {
            const caseNote =
                $$('[aria-label="Case Note"]')
                    .filter((el) => el.offsetParent !== null)
                    .sort(
                        (a, b) =>
                            a.getBoundingClientRect().top -
                            b.getBoundingClientRect().top,
                    )[0] || $('[aria-label="Case Note"]');
            const existing =
                replaceExisting && caseNote && $("#noteCaseUI", caseNote);
            if (existing) existing.outerHTML = toSafeHTML(templateHTML);
            else if (caseNote)
                caseNote.insertAdjacentHTML(
                    "beforeend",
                    toSafeHTML(templateHTML),
                );
            caseNote?.dispatchEvent(new Event("input", { bubbles: true }));
            return Boolean(existing || caseNote);
        },
        async executeFollowUp(flupBtn) {
            if (flupBtn.dataset.busy) return;
            flupBtn.dataset.busy = "1";
            flupBtn.style.opacity = "0.6";
            flupBtn.style.pointerEvents = "none";
            try {
                if (!$("._connectcase_info--outer"))
                    $('[data-btnclk="_connectcase_info-act_recrawl"]')?.click();
                $('[aria-label="Overview"]')?.click();
                await Utils.sleep(300);
                const overviewTasks = CasesConnect.scrapeDomTasks();
                const daysOffset = parseInt($("#qm-flup-in")?.value, 10) || 0;
                const apptEl = $('[data-infocase="appointment_time"]');
                if (apptEl && !apptEl.dataset.valchoice) {
                    apptEl.click();
                    await Utils.sleep(150);
                    (
                        await Utils.waitForElement(".datepicker-grid .today")
                    ).click();
                    await Utils.sleep(200);
                }
                const templateKey =
                    await CasesConnect.promptCaseType(daysOffset);
                $('[data-infocase="follow_up_time"]')?.click();
                await Utils.sleep(150);
                if (daysOffset > 0) {
                    const start = new Date(),
                        target = new Date(start);
                    for (let c = 0; c < daysOffset; ) {
                        target.setDate(target.getDate() + 1);
                        if (target.getDay() % 6 !== 0) c++;
                    }
                    let dayEl = await Utils.waitForElement(
                        ".datepicker-grid .today",
                    );
                    for (
                        let i = 0, diff = Math.round((target - start) / 864e5);
                        i < diff && dayEl;
                        i++
                    )
                        dayEl = dayEl.nextElementSibling;
                    if (dayEl) {
                        dayEl.click();
                        await Utils.sleep(200);
                    }
                } else {
                    (
                        await Utils.waitForElement('[data-thischoice="Finish"]')
                    ).click();
                    await Utils.sleep(200);
                }
                (
                    await Utils.waitForElement("[data-type=follow_up_time]")
                ).click();
                await Utils.sleep(200);
                $('[aria-label="Case log"]')?.click();
                await Utils.sleep(200);
                $('[aria-haspopup="dialog"]')?.click();
                await Utils.sleep(200);
                const checkAllBtn = $('[debug-id="check-all-box"]');
                if (checkAllBtn?.getAttribute("aria-checked") === "false") {
                    checkAllBtn.click();
                    await Utils.sleep(150);
                }
                $('[debug-id="apply-filter"]')?.click();
                await Utils.sleep(300);
                const calls = $$(
                    '.outbound-call:not([aria-expanded="true"]), .video-call:not([aria-expanded="true"])',
                );
                if (calls.length) {
                    calls.forEach((el) => el.click());
                    await Utils.sleep(300);
                }
                for (const h of $$(
                    '.message-header.note[aria-expanded="false"]',
                )) {
                    if (
                        /successfully verified for the below listed conversion actions/i.test(
                            h.innerText,
                        )
                    )
                        h.click();
                }
                await Utils.sleep(300);
                const verifiedTags = [
                    ...new Set(
                        $$(".message-body.note").flatMap((el) =>
                            /successfully verified for the below listed conversion actions/i.test(
                                el.innerText,
                            )
                                ? [
                                      ...el.innerText.matchAll(
                                          /^[ \t]*(?:-\s*)?([^\n,|]+?)\s*(?:,|\|)\s*[A-Za-z0-9_-]{10,}\s*(?:,|\|)/gm,
                                      ),
                                  ].map((m) => m[1].trim())
                                : [],
                        ),
                    ),
                ].join(", ");
                CasesConnect.insertNote(
                    CasesConnect.buildNoteTemplateHTML(
                        templateKey,
                        CasesConnect.currentFollowUp(),
                        CasesConnect.scrapeSpeakeasyIds(),
                        verifiedTags,
                        CasesConnect.isAppt5DaysBefore(),
                        overviewTasks || CasesConnect.scrapeDomTasks(),
                    ),
                    true,
                );
            } catch (err) {
                console.error("Follow up script failed", err);
            } finally {
                delete flupBtn.dataset.busy;
                flupBtn.style.opacity = "1";
                flupBtn.style.pointerEvents = "auto";
            }
        },
        insertSignature() {
            const sel = window.getSelection();
            if (!sel?.rangeCount)
                return alert(
                    "Please click inside the email body to place your cursor first.",
                );
            const start = sel.getRangeAt(0).startContainer;
            const node =
                start.nodeType === Node.ELEMENT_NODE
                    ? start
                    : start.parentElement;
            if (!node?.isContentEditable)
                return alert(
                    "Please place your cursor inside the text area where you want the signature.",
                );
            $$(".qm-sig").forEach((el) => el.remove());
            let sigName = localStorage.getItem("__signature_name");
            if (!sigName)
                localStorage.setItem(
                    "__signature_name",
                    (sigName = prompt("Enter your name:") || "Agent"),
                );
            const html = `<table class="qm-sig" style="width:348px;padding:0 30px;" data-sig-injected="true"><tbody><tr align="left"><td style="width:52px;vertical-align:top;"><img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="52" height="52" style="display:block;border-radius:10px;"></td><td style="width:12px;"></td><td style="vertical-align:middle;"><p style="font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;margin:0;line-height:1.4;color:#1D1D1F;"><strong style="font-size:105%;color:#1D1D1F;">${Utils.escapeHtml(sigName)}</strong><br><span style="color:#86868B;">Technical Solutions Team</span><br><span style="color:#86868B;font-weight:500;">TDCX, on behalf of Google</span></p></td></tr></tbody></table>`;
            document.execCommand("insertHTML", false, toSafeHTML(html));
        },
        init() {
            const C = CasesConnect;
            $("#qm-panel")?.remove();
            Utils.addStyle(
                "qm-styles",
                '@import url(\'https://fonts.googleapis.com/css2?family=Eczar:wght@400;600;700&display=swap\'); #qm-panel, #qm-panel *, #qm-modal-overlay, #qm-modal-overlay * { font-family: "Eczar", serif !important; } #qm-panel { position: fixed; bottom: 20px; left: 20px; display: flex; gap: 8px; align-items: center; z-index: 99999; font-size: 14px; } .qm-btn { z-index: 10; color: #1D1D1F; padding: 10px 16px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); backdrop-filter: blur(6px); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.6); user-select: none; } .qm-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); filter: brightness(0.97); } .qm-btn:active { transform: scale(0.96); } #qm-flup-in { position: absolute; top: 50%; transform: translateY(-50%); right: 6px; width: 28px; height: 24px; padding: 0; border: none; border-radius: 6px; background: rgba(255, 255, 255, 0.95); color: #1D1D1F; font-weight: 700; font-size: 14px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06); transition: all 0.2s ease; -moz-appearance: textfield; z-index: 20; cursor: text; user-select: text; } #qm-flup-in:focus { outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06), 0 0 0 2px #74B9FF; } .qm-badge { display: none; position: absolute; top: -4px; right: -4px; background: #FF8787; border-radius: 9999px; padding: 2px 6px; font-size: 10px; font-weight: 700; line-height: 1; border: 1.5px solid #FFFFFF; color: #FFFFFF; } .qm-sig { margin: 12px 0; } .dock-container { max-height: 400px !important; overflow-y: auto !important; } .qm-task-pick { cursor: pointer !important; user-select: none; } .qm-task-pick::after { content: " ▾"; font-size: 10px; }',
            );
            const panel = Utils.createEl("div", {
                id: "qm-panel",
                parent: document.body,
            });
            let clickerInterval = null,
                removeTimer = null,
                badgeObserver = null;
            const setAuto = (btn, on) => {
                clearInterval(clickerInterval);
                clickerInterval = on
                    ? setInterval(() => {
                          if (flupBtn.dataset.busy || $("#noteCaseUI")) return;
                          if (
                              C.insertNote(
                                  C.buildNoteTemplateHTML(
                                      null,
                                      C.currentFollowUp(),
                                  ),
                                  false,
                              )
                          ) {
                              clearTimeout(removeTimer);
                              removeTimer = setTimeout(
                                  () =>
                                      $(
                                          ".cdtx__uioncall_control-remove",
                                      )?.click(),
                                  6000,
                              );
                          }
                      }, 16000)
                    : null;
                btn.textContent = on ? "on" : "off";
                btn.style.backgroundColor = on ? "#B2F2BB" : "#FFA8A8";
                btn.style.color = on ? "#1E5E2A" : "#6A1A1A";
            };
            const autoBtn = Utils.createEl("button", {
                title: "Auto Click",
                className: "qm-btn",
                parent: panel,
                onClick: () => setAuto(autoBtn, !clickerInterval),
            });
            const flupItemBtn = Utils.createEl("button", {
                html: '<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width:20px;height:20px;filter:brightness(0.2);"><span id="flup-badge" class="qm-badge">+</span>',
                title: "Click Follow-up Item",
                className: "qm-btn",
                style: "background-color:#A5D8FF;",
                parent: panel,
                onClick: async () => {
                    $('[debug-id="dock-item-home"]')?.click();
                    try {
                        (
                            await Utils.waitForElement(".li-popup_lstcasefl")
                        ).click();
                    } catch {}
                },
            });
            Utils.waitForElement(".li-popup_lstcasefl")
                .then((el) => {
                    if (!panel.isConnected) return;
                    const badge = $("#flup-badge", panel);
                    const update = () =>
                        (badge.style.display =
                            el.dataset.attr && el.dataset.attr !== "0"
                                ? "block"
                                : "none");
                    badgeObserver = new MutationObserver(update);
                    badgeObserver.observe(el, {
                        attributes: true,
                        attributeFilter: ["data-attr"],
                    });
                    update();
                })
                .catch(() => {});
            const flupBtn = Utils.createEl("div", {
                text: "fl up:",
                title: "Set Follow-up",
                className: "qm-btn",
                style: "background-color:#99E9F2;color:#0C5460;padding-right:44px;user-select:none;cursor:pointer;",
                parent: panel,
                onClick: (e) =>
                    e.target.id !== "qm-flup-in" && C.executeFollowUp(flupBtn),
            });
            Utils.createEl("input", {
                id: "qm-flup-in",
                type: "text",
                value: "2",
                parent: flupBtn,
                onmousedown: (e) => e.stopPropagation(),
                onClick: (e) => {
                    e.stopPropagation();
                    e.target.select();
                },
                onfocus: (e) => e.target.select(),
                onkeydown: (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        C.executeFollowUp(flupBtn);
                    } else if (/^[0-9]$/.test(e.key)) {
                        e.preventDefault();
                        e.target.value = e.key;
                    }
                },
                oninput: (e) => {
                    const d = e.target.value.replace(/\D/g, "");
                    e.target.value = d ? d.slice(-1) : "";
                },
            });
            const signBtn = Utils.createEl("button", {
                text: "sign",
                title: "Insert Signature at Cursor",
                className: "qm-btn",
                style: "background-color:#CED4DA;color:#343A40;",
                parent: panel,
                onmousedown: (e) => e.preventDefault(),
                onClick: () => C.insertSignature(),
            });
            const syncLdapUI = () => {
                const isAdmin = Utils.getLdap() === "vongoc";
                const disp = isAdmin ? "" : "none";
                autoBtn.style.display = disp;
                flupItemBtn.style.display = disp;
                signBtn.style.display = disp;
                setAuto(autoBtn, isAdmin);
            };
            syncLdapUI();
            if (!$("[alt='profile photo']"))
                Utils.waitForElement("[alt='profile photo']")
                    .then(() => panel.isConnected && syncLdapUI())
                    .catch(() => {});
            let closeTaskPop = null;
            const findTaskPickTarget = (node) => {
                const el = node?.nodeType === 1 ? node : node?.parentElement;
                if (!el || el.closest("#qm-task-pop")) return null;
                const direct = el.closest(".qm-task-pick, [data-task-pick]");
                if (direct) return direct;
                const td = el.closest("td");
                const tr = td?.parentElement;
                if (
                    tr &&
                    td === tr.cells?.[1] &&
                    /^\s*Task types:/i.test(tr.cells[0]?.textContent || "")
                )
                    return (
                        td.querySelector("span span") ||
                        td.firstElementChild ||
                        td
                    );
                return null;
            };
            const onDocClick = (e) => {
                let target = findTaskPickTarget(e.target);
                if (!target) return;
                e.preventDefault();
                e.stopPropagation();
                closeTaskPop?.();
                const current = new Set(
                    target.textContent
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s && s !== "NA")
                        .map(matchTaskType)
                        .filter(Boolean),
                );
                const rect = target.getBoundingClientRect();
                const pop = Utils.createEl("div", {
                    id: "qm-task-pop",
                    parent: document.body,
                    style: `position:fixed;top:${Math.max(8, Math.min(rect.bottom + 4, innerHeight - 280))}px;left:${Math.max(8, Math.min(rect.left, innerWidth - 340))}px;width:320px;max-height:260px;background:#fff;border:1px solid #ccc;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.18);z-index:2147483647;display:flex;flex-direction:column;padding:8px;gap:6px;font-family:sans-serif;font-size:12px;box-sizing:border-box;`,
                });
                const search = Utils.createEl("input", {
                    type: "search",
                    placeholder: "Search task types...",
                    parent: pop,
                    style: "padding:6px 8px;border:1px solid #ddd;border-radius:6px;outline:none;flex-shrink:0;font-size:12px;",
                    oninput: () => {
                        const q = search.value.toLowerCase();
                        $$("label", list).forEach((l) => {
                            l.style.display = l.textContent
                                .toLowerCase()
                                .includes(q)
                                ? "flex"
                                : "none";
                        });
                    },
                });
                const list = Utils.createEl("div", {
                    parent: pop,
                    style: "flex:1 1 auto;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:4px;",
                });
                TASK_TYPES.forEach((t) => {
                    const setStyle = (el, on) =>
                        Object.assign(el.style, {
                            background: on ? "#ffe066" : "transparent",
                            color: on ? "#c92a2a" : "#1D1D1F",
                            fontWeight: on ? "700" : "400",
                        });
                    const lbl = Utils.createEl("label", {
                        parent: list,
                        style: "flex-shrink:0;display:flex;align-items:center;gap:6px;cursor:pointer;padding:4px 6px;border-radius:4px;margin:0;line-height:1.3;",
                    });
                    setStyle(lbl, current.has(t));
                    Utils.createEl("input", {
                        type: "checkbox",
                        checked: current.has(t),
                        parent: lbl,
                        style: "appearance:auto;-webkit-appearance:checkbox;opacity:1;position:static;width:14px;height:14px;margin:0;flex-shrink:0;cursor:pointer;",
                        onchange: (ev) => {
                            ev.target.checked
                                ? current.add(t)
                                : current.delete(t);
                            setStyle(lbl, ev.target.checked);
                            const nextText = [...current].join(", ") || "NA";
                            if (!target.isConnected) {
                                const re = $$("tr").find((r) =>
                                    /^\s*Task types:/i.test(
                                        r.cells?.[0]?.textContent || "",
                                    ),
                                );
                                target =
                                    findTaskPickTarget(re?.cells?.[1]) ||
                                    target;
                            }
                            target.textContent = nextText;
                            C.syncEcRows(target.closest("table"), nextText);
                            target
                                .closest('[aria-label="Case Note"]')
                                ?.dispatchEvent(
                                    new Event("input", { bubbles: true }),
                                );
                        },
                    });
                    lbl.append(t);
                });
                search.focus();
                const onOutside = (ev) => {
                    if (!pop.contains(ev.target) && !target.contains(ev.target))
                        closeTaskPop?.();
                };
                closeTaskPop = () => {
                    pop.remove();
                    document.removeEventListener("mousedown", onOutside, true);
                    closeTaskPop = null;
                };
                document.addEventListener("mousedown", onOutside, true);
            };
            document.addEventListener("click", onDocClick, true);
            onTeardown(() => {
                clearInterval(clickerInterval);
                clearTimeout(removeTimer);
                badgeObserver?.disconnect();
                document.removeEventListener("click", onDocClick, true);
                closeTaskPop?.();
                panel.remove();
            });
        },
    };
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
    const pickFeature = () =>
        location.host.includes("casemon2.corp")
            ? Dash
            : location.host.includes("cases.connect")
              ? CasesConnect
              : location.host.includes("adwords.corp")
                ? AdWords
                : TagInspector;
    const start = () =>
        Promise.resolve()
            .then(() => pickFeature().init())
            .catch((err) => console.error("Omnitool error:", err));
    document.readyState === "loading"
        ? document.addEventListener("DOMContentLoaded", start, { once: true })
        : start();
})();
