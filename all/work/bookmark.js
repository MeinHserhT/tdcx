(() => {
    "use strict";

    /* ============================================================
     * SHARED CORE
     * ============================================================ */
    const G = (window.__OMNITOOL__ ||= {});
    try {
        G.teardown?.();
    } catch (e) {
        console.warn("Omnitool: cleanup failed", e);
    }

    const $ = (s, p = document) => p.querySelector(s);
    const $$ = (s, p = document) => [...p.querySelectorAll(s)];
    const esc = (s) =>
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
        );
    const mountPoint = () => document.head || document.documentElement;

    // One Trusted Types policy for BOTH innerHTML (Dash) and script src (Loader)
    const TT = (() => {
        if (G.tt?.createHTML && G.tt?.createScriptURL) return G.tt;
        const pass = { createHTML: (s) => s, createScriptURL: (s) => s };
        let policy = null;
        if (window.trustedTypes?.createPolicy) {
            for (const name of [
                "omnitool",
                `omnitool-${Date.now()}`,
                "default",
            ]) {
                try {
                    policy = window.trustedTypes.createPolicy(name, pass);
                    break;
                } catch {}
            }
        }
        return (G.tt = policy || pass);
    })();
    const toSafeHTML = (html) => TT.createHTML(html);
    const toSafeURL = (url) => TT.createScriptURL(url);

    // Every module registers its own cleanup; G.teardown runs all of them
    const cleanups = [];
    G.teardown = () => {
        while (cleanups.length) {
            try {
                cleanups.pop()();
            } catch (e) {
                console.warn("Omnitool: module cleanup failed", e);
            }
        }
    };

    /* ============================================================
     * MODULE 1: DASH (LM / BAU team status panel)
     * ============================================================ */
    const STATUS = {
        active: {
            prio: 1,
            max: 3600,
            color: "#34C759",
            track: "rgba(52, 199, 89, 0.15)",
        },
        video: {
            prio: 2,
            max: 2700,
            color: "#AF52DE",
            track: "rgba(175, 82, 222, 0.15)",
            ico: "9571/9571236",
            anim: "breathe",
        },
        phone: {
            prio: 2.5,
            max: 2700,
            color: "#FF3B30",
            track: "rgba(255, 59, 48, 0.15)",
            ico: "13332/13332839",
            anim: "ring",
        },
        "lunch-break": {
            prio: 3,
            max: 3600,
            color: "#FFCC00",
            track: "rgba(255, 204, 0, 0.15)",
            ico: "1182/1182132",
            anim: "bounce-y",
        },
        email: {
            prio: 4,
            max: 900,
            color: "#0071E3",
            track: "rgba(0, 113, 227, 0.15)",
            ico: "7487/7487055",
            anim: "fly",
        },
        "coffee-break": {
            prio: 5,
            max: 900,
            color: "#FF9500",
            track: "rgba(255, 149, 0, 0.15)",
            ico: "16108/16108931",
            anim: "rock",
        },
        break: {
            prio: 6,
            max: 900,
            color: "#8E8E93",
            track: "rgba(142, 142, 147, 0.15)",
            ico: "5140/5140652",
            anim: "fade-pulse",
        },
        default: {
            prio: 99,
            max: 2700,
            color: "#8E8E93",
            track: "rgba(142, 142, 147, 0.15)",
        },
    };

    const CDN = "https://cdn-icons-png.flaticon.com/512/";
    const fmtTime = (s) =>
        String(s || "")
            .replace(/(\d+)\s*([hms])/gi, "$1 $2")
            .replace(/\s+/g, " ")
            .trim();
    const parseSecs = (s) =>
        (String(s || "").match(/\d+[hms]/g) || []).reduce(
            (a, c) =>
                a +
                parseInt(c, 10) * ({ h: 3600, m: 60, s: 1 }[c.slice(-1)] || 0),
            0,
        );
    const stateOf = (cell) =>
        (cell?.innerText.match(/[a-zA-Z\s]+/)?.[0] || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-");
    const txt = (cell) => cell?.innerText.trim() || "";

    const cardHtml = (key, title, extra = "") => {
        const pill = (cls, id, tip, lbl) =>
            `<span class="cm-pill ${cls}" id="cnt-${id}-${key}" title="${tip}">${lbl}: 0</span>`;
        return `<div class="cm-card" id="cm-card-${key}"><div class="cm-head"><div class="cm-head-top"><h3><span>${title}</span><span class="cm-warn-txt" id="cm-health-warn-${key}" style="display:none;">⚠️ Low Availability</span></h3>${extra}</div><div class="cm-stats">${pill("badge-act", "act", "Active", "Actv")} + ${pill("badge-phn", "phn", "On Phone", "Phn")} + ${pill("badge-brk", "brk", "On Break", "Brk")} = ${pill("badge-tot", "tot", "Total", "Tot")}</div></div><div class="cm-list" id="cm-list-${key}"></div></div>`;
    };

    const DASH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Alegreya:wght@700&family=Cookie&family=Lexend:wght@700&family=Fraunces&display=swap');
#cm-root, #cm-root * { box-sizing: border-box; font-family: "Lexend", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-weight: 700 !important; }
#cm-root { position: fixed; height: 100%; width: 100%; top: 0; right: 0; background-color: rgba(0, 0, 0, 0.45); z-index: 9999; display: flex; justify-content: flex-end; align-items: center; padding: 20px; pointer-events: none; }
#cm-root .cm-wrap { position: relative; pointer-events: auto; width: 100%; max-width: 320px; height: auto; max-height: 95vh; background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-radius: 20px; box-shadow: 0 16px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.02); padding: 16px; border: 1px solid rgba(255, 255, 255, 0.8); color: #1D1D1F; transition: max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), all 0.3s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; gap: 12px; overflow: hidden; }
#cm-root .cm-wrap.cm-full { max-width: 400px; }
#cm-root .cm-close { position: absolute; top: 10px; right: 10px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(0,0,0,0.06); cursor: pointer; z-index: 20; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
#cm-root .cm-close:hover { background: #FFFFFF; transform: scale(1.08); }
#cm-root .cm-close img { width: 11px; height: 11px; opacity: 0.6; }
#cm-root .cm-card { display: flex; flex-direction: column; width: 100%; background: rgba(255, 255, 255, 0.5); border-radius: 14px; padding: 10px; border: 1px solid rgba(0,0,0,0.05); min-height: 0; height: auto; flex: 0 1 auto; }
#cm-root #cm-card-bau { max-height: 100%; }
#cm-root #cm-card-lm { max-height: 70%; }
#cm-root .cm-head { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; width: 100%; flex-shrink: 0; }
#cm-root .cm-head-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; }
#cm-root .cm-head h3 { margin: 0; font-size: 11px; color: #86868B; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; gap: 6px; }
#cm-root .cm-toggle { padding: 3px 9px; font-size: 10px; cursor: pointer; border: 1px solid rgba(0,0,0,0.1); border-radius: 9999px; background: rgba(255, 255, 255, 0.85); color: #1D1D1F; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.04); white-space: nowrap; }
#cm-root .cm-toggle:hover { background: #FFFFFF; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
#cm-root .cm-toggle:active { transform: scale(0.96); }
#cm-root .cm-stats { display: flex; gap: 5px; justify-content: flex-start; align-items: center; width: 100%; }
#cm-root .cm-pill { font-size: 9.5px; padding: 2px 7px; border-radius: 9999px; white-space: nowrap; }
#cm-root .badge-act { background: rgba(52, 199, 89, 0.12); color: #248A3D; border: 1px solid rgba(52, 199, 89, 0.2); }
#cm-root .badge-phn { background: rgba(255, 59, 48, 0.12); color: #D70015; border: 1px solid rgba(255, 59, 48, 0.2); }
#cm-root .badge-brk { background: rgba(255, 149, 0, 0.12); color: #C77000; border: 1px solid rgba(255, 149, 0, 0.2); }
#cm-root .badge-tot { background: rgba(142, 142, 147, 0.12); color: #636366; border: 1px solid rgba(142, 142, 147, 0.2); }
#cm-root .cm-card.cm-warn { animation: pulseHealth 2.5s infinite; border-color: rgba(255, 59, 48, 0.6); box-shadow: 0 0 20px rgba(255, 59, 48, 0.2); }
@keyframes pulseHealth { 0%, 100% { border-color: rgba(0, 0, 0, 0.05); } 50% { border-color: rgba(255, 59, 48, 0.6); } }
#cm-root .cm-warn-txt { font-size: 9.5px; color: #FF3B30; text-transform: uppercase; letter-spacing: 0.5px; }
#cm-root .cm-cols { display: flex; width: 100%; gap: 8px; align-items: center; padding: 0 2px 4px 2px; box-sizing: border-box; flex-shrink: 0; }
#cm-root .col-spacer { width: 54px; min-width: 54px; flex-shrink: 0; }
#cm-root .col-grid { flex-grow: 1; display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(56px, auto) minmax(56px, auto) minmax(20px, auto); gap: 6px; padding: 0 10px; font-size: 8.5px; color: #86868B; text-transform: uppercase; letter-spacing: 0.4px; }
#cm-root .col-grid span { text-align: center; display: flex; align-items: center; justify-content: center; }
#cm-root .cm-list { flex-grow: 1; overflow-y: auto; overflow-x: hidden; padding: 2px; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 10px; width: 100%; min-height: 0; }
#cm-root .cm-group { display: flex; width: 100%; gap: 8px; align-items: flex-start; }
#cm-root .grp-lbl { flex-shrink: 0; width: 54px; text-align: left; font-size: 15px !important; font-family: "Cookie", cursive !important; color: #86868B; letter-spacing: 0.3px; padding: 5px 2px; border-left: 2px solid rgba(0,0,0,0.1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; text-transform: none; }
#cm-root .grp-lbl.is-me { color: #0071E3; border-left-color: #0071E3; background: rgba(0, 113, 227, 0.08); border-radius: 0 3px 3px 0; }
#cm-root .grp-stack { flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
#cm-root .cm-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-radius: 12px; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 2px 6px rgba(0,0,0,0.02); position: relative; background-clip: padding-box; border: 1px solid rgba(255, 255, 255, 0.6); z-index: 1; width: 100%; min-width: 0; }
#cm-root .cm-row.is-full { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(56px, auto) minmax(56px, auto) minmax(20px, auto); gap: 6px; padding: 6px 10px; }
#cm-root .cm-row:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
#cm-root .cm-row::before { content: ''; position: absolute; inset: 0; border-radius: 12px; padding: 1.5px; margin: -1.5px; background: conic-gradient(var(--st-color) var(--progress), var(--st-track) var(--progress)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; z-index: -1; }
@keyframes pulseWarning { 0%, 100% { filter: drop-shadow(0 0 2px var(--st-color)); } 50% { filter: drop-shadow(0 0 8px var(--st-color)); } }
#cm-root .cm-row.is-over::before { animation: pulseWarning 1.5s infinite ease-in-out; }
#cm-root .row-left { position: relative; z-index: 1; display: flex; align-items: center; gap: 8px; min-width: 0; flex-shrink: 1; }
#cm-root .row-left span, #cm-root .row-left .row-name { font-size: 11.5px; letter-spacing: 0.2px; color: #1D1D1F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#cm-root .row-name { font-family: "Alegreya", serif !important; font-size: 12px !important; }
#cm-root .row-info { display: flex; flex-direction: column; min-width: 0; overflow: hidden; justify-content: center; }
#cm-root .row-avatar { width: 24px; height: 24px; min-width: 24px; border-radius: 7px; object-fit: cover; border: 1px solid rgba(0,0,0,0.05); flex-shrink: 0; }
#cm-root .row-right { position: relative; z-index: 1; display: flex; align-items: center; gap: 6px; text-align: right; flex-shrink: 0; }
#cm-root .row-meta { display: flex; flex-direction: column; text-align: right; }
#cm-root .row-col { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: center; text-align: center; min-width: 0; }
#cm-root .row-time, #cm-root .row-subtime { font-family: "Fraunces", sans-serif !important; font-size: 11.5px !important; color: #1D1D1F; opacity: 0.95; font-variant-numeric: tabular-nums; letter-spacing: -0.2px; line-height: 1.2; white-space: nowrap; }
#cm-root .row-subtime { display: inline; }
#cm-root .row-status, #cm-root .row-info .row-status { font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; font-size: 9.5px; letter-spacing: 0.25px; display: inline-block; margin-top: 1px; line-height: 1.2; }
#cm-root .row-info .row-status { font-size: 9px; margin-top: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#cm-root .row-right img, #cm-root .row-ico img { width: 16px; height: 16px; min-width: 16px; max-width: 16px; max-height: 16px; object-fit: contain; opacity: 0.85; display: block; flex-shrink: 0; }
#cm-root .row-ico { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 4px; min-width: 20px; flex-shrink: 0; }
#cm-root .st-active { background: rgba(230, 248, 236, 0.7); color: #064E3B; } #cm-root .st-active .row-status { color: #248A3D; }
#cm-root .st-phone { background: rgba(254, 238, 238, 0.7); color: #7F1D1D; } #cm-root .st-phone .row-status { color: #D70015; }
#cm-root .st-video { background: rgba(245, 235, 255, 0.7); color: #4C1D95; } #cm-root .st-video .row-status { color: #8944AB; }
#cm-root .st-email { background: rgba(230, 242, 255, 0.7); color: #0C4A6E; } #cm-root .st-email .row-status { color: #0071E3; }
#cm-root .st-coffee-break { background: rgba(255, 244, 230, 0.7); color: #78350F; } #cm-root .st-coffee-break .row-status { color: #C77000; }
#cm-root .st-lunch-break { background: rgba(255, 250, 230, 0.7); color: #713F12; } #cm-root .st-lunch-break .row-status { color: #A16207; }
#cm-root .st-break { background: rgba(242, 242, 247, 0.7); color: #374151; } #cm-root .st-break .row-status { color: #636366; }
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
#cm-root .cm-list::-webkit-scrollbar { width: 4px; }
#cm-root .cm-list::-webkit-scrollbar-track { background: transparent; }
#cm-root .cm-list::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
@media screen and (max-width: 380px) { #cm-root .grp-lbl { display: none !important; } }
@media screen and (max-width: 320px) { #cm-root .cm-stats { display: none !important; } #cm-root .cm-head h3 { margin-bottom: 0; } }
@media screen and (max-width: 280px) { #cm-root .row-info { display: none !important; } }
@media screen and (max-width: 240px) { #cm-root .row-right img, #cm-root .row-ico img { display: none !important; } }
@media screen and (max-width: 220px) { #cm-root .row-subtime { display: none !important; } }
`;

    const initDash = () => {
        $('[aria-selected="false"]')?.click();
        const target = $(".agent-table-container");
        if (!target)
            return console.warn(
                "Dash: .agent-table-container not found on this page.",
            );

        const me =
            $("[alt='profile photo']")?.src?.match(/photos\/([^/?]+)/)?.[1] ??
            "Unknown";
        const isAdmin = me.toLowerCase() === "vongoc";
        let full = !isAdmin;
        const layoutLabel = () => (full ? "Layout: Full" : "Layout: Simple");

        $("#cm-styles")?.remove();
        const styleEl = document.createElement("style");
        styleEl.id = "cm-styles";
        styleEl.textContent = DASH_CSS;
        mountPoint().appendChild(styleEl);

        $("#cm-root")?.remove();
        const root = document.createElement("div");
        root.id = "cm-root";
        const toggleBtn = isAdmin
            ? `<button class="cm-toggle" id="cm-layout-toggle" title="Switch layout">${layoutLabel()}</button>`
            : "";
        root.innerHTML = toSafeHTML(
            `<div class="cm-wrap ${full ? "cm-full" : ""}" id="cm-wrap-shell"><button class="cm-close" title="Close"><img src="${CDN}9403/9403346.png" alt="Close"/></button>${cardHtml("lm", "LM Team Status", toggleBtn)}${cardHtml("bau", "BAU Team Status")}</div>`,
        );
        document.body.appendChild(root);

        const q = (s) => $(s, root);
        const img = (id, alt, extra = "") =>
            `<img src="${CDN}${id}.png" alt="${esc(alt)}" loading="lazy"${extra} />`;

        const renderSection = (agents, suffix) => {
            const act = agents.filter((a) => a.statusKey === "active").length;
            const phn = agents.filter(
                (a) => a.statusKey === "phone" || a.statusKey === "video",
            ).length;
            const tot = agents.length;
            const low = tot > 0 && act / tot < 0.2;

            q(`#cnt-act-${suffix}`).textContent = `Actv: ${act}`;
            q(`#cnt-phn-${suffix}`).textContent = `Phn: ${phn}`;
            q(`#cnt-brk-${suffix}`).textContent = `Brk: ${tot - act - phn}`;
            q(`#cnt-tot-${suffix}`).textContent = `Tot: ${tot}`;

            const card = q(`#cm-card-${suffix}`);
            card.classList.toggle("cm-warn", low);
            card.style.display = tot ? "flex" : "none";
            q(`#cm-health-warn-${suffix}`).style.display = low
                ? "inline"
                : "none";

            const groups = [];
            for (const a of agents) {
                const isUser = a.ldap === me;
                const label = isUser
                    ? "You"
                    : a.statusKey === "phone" || a.statusKey === "video"
                      ? "On Call"
                      : a.statusKey.includes("break")
                        ? a.statusKey.split("-")[0]
                        : a.displayStatus;
                if (groups.at(-1)?.label !== label)
                    groups.push({ label, isUser, rows: [] });
                groups.at(-1).rows.push(a);
            }

            let html = full
                ? '<div class="cm-cols"><div class="col-spacer"></div><div class="col-grid"><span>Agent</span><span>Last Change</span><span>In State</span><span></span></div></div>'
                : "";

            for (const g of groups) {
                const rowsHtml = g.rows
                    .map((a) => {
                        const st = STATUS[a.statusKey] || STATUS.default;
                        const pct = Math.min(
                            (a.secs / st.max) * 100,
                            100,
                        ).toFixed(1);
                        const isAct = a.statusKey === "active";
                        const icons =
                            (st.ico
                                ? img(
                                      st.ico,
                                      `${a.statusKey} icon`,
                                      ` animation="${st.anim}"`,
                                  )
                                : "") +
                            (isAct && a.s1 === "busy"
                                ? img("17720/17720299", "non_phone")
                                : "") +
                            (isAct && a.s2 === "busy"
                                ? img("11305/11305490", "non_video")
                                : "");
                        const av = `<img class="row-avatar" src="${esc(a.img)}" alt="${esc(a.ldap)}" loading="lazy" />`;
                        const nm = `<span class="row-name">${esc(a.ldap)}</span>`;
                        const ds = `<span class="row-status">${esc(a.displayStatus)}</span>`;
                        const inner = full
                            ? `<div class="row-left">${av}<div class="row-info">${nm}${ds}</div></div><div class="row-col"><span class="row-time">${esc(a.lastChange || "-")}</span></div><div class="row-col"><span class="row-time">${esc(a.inState || "-")}</span></div><div class="row-ico">${icons}</div>`
                            : `<div class="row-left">${av}${nm}</div><div class="row-right"><div class="row-meta"><span class="row-time">${esc(a.lastChange)} <span class="row-subtime">(${esc(a.inState)})</span></span>${ds}</div>${icons}</div>`;
                        return `<div class="cm-row st-${a.statusKey}${a.secs >= st.max ? " is-over" : ""}${full ? " is-full" : ""}" style="--progress: ${pct}%; --st-color: ${st.color}; --st-track: ${st.track};" data-ldap="${esc(a.ldap)}">${inner}</div>`;
                    })
                    .join("");
                html += `<div class="cm-group"><div class="grp-lbl ${g.isUser ? "is-me" : ""}">${esc(g.label)}</div><div class="grp-stack">${rowsHtml}</div></div>`;
            }

            q(`#cm-list-${suffix}`).innerHTML = toSafeHTML(html);
        };

        const prio = (a) => (STATUS[a.statusKey] || STATUS.default).prio;

        const update = () => {
            if (!root.isConnected) return;
            try {
                const agents = $$("tbody tr", target)
                    .map((row) => {
                        const c = row.querySelectorAll("td");
                        if (c.length < 10) return null;
                        const s1 = stateOf(c[5]);
                        const s2 = stateOf(c[8]);
                        let displayStatus = txt(c[3]);
                        if (
                            displayStatus === "Active" &&
                            s1 === "busy" &&
                            s2 === "busy"
                        )
                            displayStatus = "Break";
                        const statusKey = displayStatus
                            .toLowerCase()
                            .replace(/\s+/g, "-");
                        const p = `${txt(c[10])},${txt(c[13])}`;
                        const pool =
                            p.includes("3028872") || p.includes("3014937")
                                ? "LM"
                                : p.includes("3004773")
                                  ? "BAU"
                                  : "";
                        return {
                            img: $("img", row)?.src || "",
                            ldap: txt(c[1]),
                            inState: fmtTime(txt(c[4])),
                            lastChange: fmtTime(txt(c[9])),
                            displayStatus,
                            statusKey,
                            secs: parseSecs(c[9]?.innerText),
                            pool,
                            s1,
                            s2,
                        };
                    })
                    .filter(Boolean)
                    .sort(
                        (a, b) =>
                            (b.ldap === me) - (a.ldap === me) ||
                            prio(a) - prio(b) ||
                            b.secs - a.secs,
                    );

                renderSection(
                    agents.filter((a) => a.pool === "BAU"),
                    "bau",
                );
                renderSection(
                    agents.filter((a) => a.pool === "LM"),
                    "lm",
                );
            } catch (e) {
                console.error("Dash render error:", e);
            }
        };

        let timer;
        const observer = new MutationObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(update, 150);
        });
        observer.observe(target, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true,
        });

        const stopDash = () => {
            observer.disconnect();
            clearTimeout(timer);
            root.remove();
            styleEl.remove();
        };
        cleanups.push(stopDash);

        root.addEventListener("click", (e) => {
            if (e.target.closest(".cm-close")) return stopDash();
            if (isAdmin && e.target.closest("#cm-layout-toggle")) {
                full = !full;
                q("#cm-wrap-shell").classList.toggle("cm-full", full);
                q("#cm-layout-toggle").textContent = layoutLabel();
                update();
            }
        });

        update();
    };

    /* ============================================================
     * MODULE 2: TDCX LOADER (Apps Script hub)
     * ============================================================ */
    const initLoader = () => {
        const APP_ID =
            "AKfycbyFPujohZlySaAQsBsNlp9PNj18Ur2olr9O_0J5J2ssCqB24BdgPcLx5PZBla6GmyyOGA";
        const APP_URL =
            `https://script.google.com/a/macros/google.com/s/${APP_ID}/exec`;
        const hostQ = `host=${encodeURIComponent(location.host)}`;
        const rawUrl = `${APP_URL}?page=loader&${hostQ}&t=${Date.now()}`;

        const getLdap = () => {
            try {
                let p =
                    localStorage.getItem("toolytics_profile") ||
                    localStorage.getItem("TOOLYTICS_PROFILE");
                if (!p) {
                    const k = Object.keys(localStorage).find(
                        (key) => key.toLowerCase() === "toolytics_profile",
                    );
                    if (k) p = localStorage.getItem(k);
                }
                if (p?.trim()) return p.replace(/['"]+/g, "").trim();
            } catch {}
            return "Unknown";
        };

        const launchFallback = () => {
            console.warn("TDCX: CSP detected. Opening standalone window.");
            window.open(
                `${APP_URL}?page=standalone&${hostQ}&user=${encodeURIComponent(getLdap())}&from=${encodeURIComponent(location.href)}`,
                "TDCXHub",
                "width=450,height=850,scrollbars=yes,resizable=yes",
            );
        };

        try {
            $("#omnitool-tdcx-loader")?.remove(); // avoid stacking script tags on re-run
            const s = document.createElement("script");
            s.id = "omnitool-tdcx-loader";
            s.src = toSafeURL(rawUrl);
            s.onerror = launchFallback;
            s.onload = () =>
                console.log(`TDCX: loaded ${window.__TDCX_FEATURE__ || ""}`);
            mountPoint().appendChild(s);
            cleanups.push(() => s.remove());
        } catch (err) {
            launchFallback();
        }
    };

    /* ============================================================
     * BOOT: route by hostname
     * ============================================================ */
    const safeRun = (name, fn) => {
        try {
            fn();
        } catch (e) {
            console.error(`Omnitool: ${name} failed`, e);
        }
    };

    const DASH_HOSTS = new Set(["casemon2.corp.google.com"]);
    const isDashHost = DASH_HOSTS.has(location.hostname.toLowerCase());

    if (isDashHost) {
        // Dash needs document.body, so wait for the DOM if it's still loading
        document.readyState === "loading"
            ? document.addEventListener(
                  "DOMContentLoaded",
                  () => safeRun("dash", initDash),
                  { once: true },
              )
            : safeRun("dash", initDash);
    } else {
        safeRun("loader", initLoader);
    }
})();
