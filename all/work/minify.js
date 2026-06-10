(() => {
    let e = {
            debounce(e, t) {
                let a;
                return (...r) => {
                    clearTimeout(a), (a = setTimeout(() => e(...r), t));
                };
            },
            sleep: (e) => new Promise((t) => setTimeout(t, e)),
            addStyle(e, t) {
                if (document.getElementById(e)) return;
                let a = document.createElement("style");
                a.id = e;
                let r = window.trustedTypes?.createPolicy("default", {
                    createHTML: (e) => e,
                }) ?? { createHTML: (e) => e };
                (a.textContent = r.createHTML(t)), document.head.appendChild(a);
            },
            createEl(
                e,
                {
                    parent: t,
                    onClick: a,
                    style: r,
                    className: o,
                    id: n,
                    ...i
                } = {}
            ) {
                let s = Object.assign(document.createElement(e), i);
                return (
                    n && (s.id = n),
                    o && (s.className = o),
                    r && Object.assign(s.style, r),
                    a && s.addEventListener("click", a),
                    t && t.appendChild(s),
                    s
                );
            },
            $: (e, t = document) => t.querySelector(e),
            waitForElement: (t, a = 3e3) =>
                new Promise((r, o) => {
                    let n = e.$(t);
                    if (n) return r(n);
                    let i = new MutationObserver((a, o) => {
                        let n = e.$(t);
                        n && (o.disconnect(), r(n));
                    });
                    i.observe(document.body, { childList: !0, subtree: !0 }),
                        setTimeout(() => {
                            i.disconnect(),
                                o(Error(`Timeout waiting for: ${t}`));
                        }, a);
                }),
            setupCopy(e, t, a = "Copied!") {
                let r;
                e.addEventListener("click", async (o) => {
                    try {
                        await navigator.clipboard.writeText(t),
                            e.dataset.origText ||
                                (e.dataset.origText = e.innerText),
                            (e.innerText = a),
                            e.classList.add("aw-copied"),
                            clearTimeout(r),
                            (r = setTimeout(() => {
                                (e.innerText = e.dataset.origText),
                                    e.classList.remove("aw-copied");
                            }, 1500));
                    } catch (n) {
                        console.error("Copy failed", n);
                    }
                });
            },
            escapeHtml: (e) =>
                String(e || "").replace(
                    /[&<>"']/g,
                    (e) =>
                        ({
                            "&": "&amp;",
                            "<": "&lt;",
                            ">": "&gt;",
                            '"': "&quot;",
                            "'": "&#039;",
                        }[e])
                ),
        },
        t = {
            casemon() {
                if (window.dashRun) return;
                (window.dashRun = 1), e.$('[aria-selected="false"]')?.click();
                let t = "https://cdn-icons-png.flaticon.com/512",
                    a = {
                        uiId: "bento_agent_ui",
                        styleId: "bento-dash-styles",
                        target: ".agent-table-container",
                        statusConfig: {
                            active: {
                                color: "#10B981",
                                track: "#D1FAE5",
                                maxSecs: 3600,
                            },
                            phone: {
                                color: "#EF4444",
                                track: "#FFE4E6",
                                maxSecs: 2700,
                            },
                            video: {
                                color: "#8B5CF6",
                                track: "#F3E8FF",
                                maxSecs: 2700,
                            },
                            email: {
                                color: "#0EA5E9",
                                track: "#E0F2FE",
                                maxSecs: 900,
                            },
                            "coffee-break": {
                                color: "#F59E0B",
                                track: "#FFEDD5",
                                maxSecs: 900,
                            },
                            "lunch-break": {
                                color: "#EAB308",
                                track: "#FEF9C3",
                                maxSecs: 3600,
                            },
                            break: {
                                color: "#6B7280",
                                track: "#F3F4F6",
                                maxSecs: 900,
                            },
                            default: {
                                color: "#9CA3AF",
                                track: "#F3F4F6",
                                maxSecs: 2700,
                            },
                        },
                        icons: {
                            video: {
                                src: `${t}/9571/9571236.png`,
                                animation: "wiggle",
                            },
                            "coffee-break": {
                                src: `${t}/16108/16108931.png`,
                                animation: "wiggle",
                            },
                            "lunch-break": {
                                src: `${t}/1182/1182132.png`,
                                animation: "pulse",
                            },
                            phone: {
                                src: `${t}/13332/13332839.png`,
                                animation: "wiggle",
                            },
                            email: {
                                src: `${t}/7487/7487055.png`,
                                animation: "slide",
                            },
                            break: {
                                src: `${t}/5140/5140652.png`,
                                animation: "wiggle",
                            },
                            close: `${t}/9403/9403346.png`,
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
                    },
                    r = e.$(a.target);
                if (!r) {
                    window.dashRun = 0;
                    return;
                }
                let o =
                    e
                        .$("[alt='profile photo']")
                        ?.src?.match(/photos\/([^/?]+)/)?.[1] ?? "Unknown";
                e.addStyle(
                    a.styleId,
                    `
                #bento_agent_ui { position: fixed; height: 100%; width: 100%; top: 0; right: 0; background-color: rgba(15, 17, 21, 0.12); z-index: 9999; display: flex; justify-content: flex-end; align-items: center; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; pointer-events: none; box-sizing: border-box; }
                .bento-wrapper { position: relative; pointer-events: auto; width: 100%; max-width: 320px; background: #FFFFFF; border-radius: 20px; box-shadow: 0 12px 32px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04); padding: 20px; border: 1px solid #E5E7EB; color: #1F2937; transition: border-color 0.3s ease; }
                .close-btn { position: absolute; top: -10px; right: -10px; background: #FFFFFF; border: 1px solid #E5E7EB; cursor: pointer; z-index: 20; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.1); transition: all 0.2s ease; }
                .close-btn:hover { background: #F3F4F6; transform: scale(1.1); }
                .close-btn img { width: 11px; height: 11px; opacity: 0.7; }
                .bento-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
                .bento-card { background: transparent; display: flex; flex-direction: column; }
                .agent-list-header { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
                .agent-list-header h3 { margin: 0; font-size: 12px; color: #4B5563; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; justify-content: space-between; }
                .header-counters { display: flex; gap: 6px; justify-content: flex-start; width: 100%; }
                .agent-count { font-size: 10px; padding: 3px 8px; border-radius: 6px; font-weight: 700; white-space: nowrap; }
                .active-badge { background: #E6F4EA; color: #137333; border: 1px solid #CEEAD6; }
                .phone-badge { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
                .break-badge { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
                .total-badge { background: #F1F3F4; color: #5F6368; border: 1px solid #E8EAED; }
                .health-warning { animation: pulseHealth 2.5s infinite; border-color: #EF4444; box-shadow: 0 0 15px rgba(239, 68, 68, 0.15); }
                @keyframes pulseHealth { 0%, 100% { border-color: #E5E7EB; } 50% { border-color: #EF4444; } }
                .health-text { font-size: 10px; color: #DC2626; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                .agent-list-container { max-height: 72vh; overflow-y: auto; padding: 2px; display: flex; flex-direction: column; gap: 12px; border-top: 1px solid #F1F5F9; padding-top: 12px; }
                .status-group-block { display: flex; width: 100%; gap: 10px; align-items: flex-start; }
                .status-inline-label { width: 50px; min-width: 35px; text-align: left; font-size: 9px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 4px; border-left: 2px solid #E2E8F0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
                .status-inline-label.user-label { color: #2563EB; border-left-color: #2563EB; background: #EFF6FF; border-radius: 0 4px 4px 0; }
                .status-rows-stack { flex-grow: 1; display: flex; flex-direction: column; gap: 6px; }
                .agent-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 10px; transition: transform 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.02); position: relative; background-clip: padding-box; border: 2px solid transparent; z-index: 1; }
                .agent-row:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
                .agent-row::before { content: ''; position: absolute; inset: 0; border-radius: 10px; padding: 2px; margin: -2px; background: conic-gradient(var(--st-color) var(--progress), var(--st-track) var(--progress)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; z-index: -1; }
                @keyframes pulseWarning { 0%, 100% { filter: drop-shadow(0 0 2px var(--st-color)); } 50% { filter: drop-shadow(0 0 8px var(--st-color)); } }
                .agent-row.over-time::before { animation: pulseWarning 1.5s infinite ease-in-out; }
                .agent-left { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 12px; }
                .agent-left img { width: 26px; height: 26px; border-radius: 6px; object-fit: cover; border: 1px solid rgba(0,0,0,0.04); }
                .agent-right { display: flex; align-items: center; gap: 10px; text-align: right; }
                .agent-meta { display: flex; flex-direction: column; }
                .time-state { font-size: 10px; font-weight: 500; opacity: 0.85; }
                .status-text { font-size: 10px; font-weight: 700; letter-spacing: 0.2px; display: inline-block; margin-top: 1px; }
                .agent-right img { width: 18px; height: 18px; opacity: 0.8; }
        
                /* STATUS GRADIENTS */
                .stt-active { background: linear-gradient(135deg, #D1FAE5 0%, #FCE7F3 100%); color: #064E3B; } .stt-active .status-text { color: #047857; }
                .stt-phone { background: linear-gradient(135deg, #FEE2E2 0%, #CCFBF1 100%); color: #7F1D1D; } .stt-phone .status-text { color: #B91C1C; }
                .stt-video { background: linear-gradient(135deg, #F3E8FF 0%, #FEF9C3 100%); color: #4C1D95; } .stt-video .status-text { color: #6B21A8; }
                .stt-email { background: linear-gradient(135deg, #E0F2FE 0%, #FFEDD5 100%); color: #0C4A6E; } .stt-email .status-text { color: #0284C7; }
                .stt-coffee-break { background: linear-gradient(135deg, #FFEDD5 0%, #EDE9FE 100%); color: #78350F; } .stt-coffee-break .status-text { color: #B45309; }
                .stt-lunch-break { background: linear-gradient(135deg, #FEF9C3 0%, #DBEAFE 100%); color: #713F12; } .stt-lunch-break .status-text { color: #A16207; }
                .stt-break { background: linear-gradient(135deg, #F1F5F9 0%, #E7E5E4 100%); color: #374151; } .stt-break .status-text { color: #4B5563; }
        
                [animation="pulse"] { animation: pulse 2s infinite ease-in-out; }
                @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
                [animation="wiggle"] { animation: wiggle 0.9s infinite; }
                @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 15%, 45%, 75% { transform: rotate(4deg); } 30%, 60% { transform: rotate(-4deg); } }
                [animation="slide"] { animation: slide-lr 1.2s infinite alternate ease-in-out; }
                @keyframes slide-lr { from { transform: translateX(0); } to { transform: translateX(2px); } }
                .agent-list-container::-webkit-scrollbar { width: 4px; }
                .agent-list-container::-webkit-scrollbar-track { background: transparent; }
                .agent-list-container::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
        
                /* --- RESPONSIVE BEHAVIOR --- */
                /* 1. Hide status inline label */
                @media screen and (max-width: 380px) {
                    .status-inline-label { display: none !important; }
                }
                /* 2. Hide header count */
                @media screen and (max-width: 320px) {
                    .header-counters { display: none !important; }
                    .agent-list-header h3 { margin-bottom: 0; }
                }
                /* 3. Hide user image */
                @media screen and (max-width: 280px) {
                    .agent-left img { display: none !important; }
                }
                /* 4. Hide status icon */
                @media screen and (max-width: 240px) {
                    .agent-right img { display: none !important; }
                }
                `
                );
                let n =
                        document.getElementById(a.uiId) ||
                        e.createEl("div", {
                            id: a.uiId,
                            parent: document.body,
                        }),
                    i = "",
                    s = /[a-zA-Z\s]+/,
                    l = /\d+[hms]/g,
                    c = (e) =>
                        (e.match(l) || []).reduce(
                            (e, t) =>
                                e +
                                parseInt(t, 10) *
                                    ({ h: 3600, m: 60, s: 1 }[t.slice(-1)] ||
                                        0),
                            0
                        ),
                    d = () => {
                        try {
                            let t = Array.from(r.querySelectorAll("tbody tr"))
                                    .map((e) => {
                                        let t = e.querySelectorAll("td");
                                        if (!t || t.length < 10) return null;
                                        let a = (
                                                t[5].innerText.match(s)?.[0] ||
                                                ""
                                            )
                                                .trim()
                                                .toLowerCase()
                                                .replace(/\s+/g, "-"),
                                            r = (
                                                t[8].innerText.match(s)?.[0] ||
                                                ""
                                            )
                                                .trim()
                                                .toLowerCase()
                                                .replace(/\s+/g, "-"),
                                            o = t[3].innerText.trim(),
                                            n = o
                                                .toLowerCase()
                                                .replace(/\s+/g, "-");
                                        return (
                                            "Active" === o &&
                                                "busy" === a &&
                                                "busy" === r &&
                                                ((o = "Break"), (n = "break")),
                                            {
                                                img:
                                                    e.querySelector("img")
                                                        ?.src || "",
                                                ldap: t[1].innerText.trim(),
                                                timeInState:
                                                    t[4].innerText.trim(),
                                                lastChangeRaw:
                                                    t[9].innerText.trim(),
                                                displayStatus: o,
                                                statusKey: n,
                                                cssClass: `stt-${n}`,
                                                durationSeconds: c(
                                                    t[9].innerText
                                                ),
                                            }
                                        );
                                    })
                                    .filter(Boolean)
                                    .sort((e, t) => {
                                        let r = e.ldap === o,
                                            n = t.ldap === o;
                                        if (r !== n) return n - r;
                                        let i =
                                                a.priorities[e.statusKey] ??
                                                a.priorities.default,
                                            s =
                                                a.priorities[t.statusKey] ??
                                                a.priorities.default;
                                        return i !== s
                                            ? i - s
                                            : t.durationSeconds -
                                                  e.durationSeconds;
                                    }),
                                l = t.filter(
                                    (e) => "active" === e.statusKey
                                ).length,
                                d = t.filter((e) =>
                                    ["phone", "video"].includes(e.statusKey)
                                ).length,
                                p = t.filter(
                                    (e) =>
                                        !["phone", "video", "active"].includes(
                                            e.statusKey
                                        )
                                ).length,
                                $ = t.length,
                                g = ($ > 0 ? l / $ : 0) < 0.2 && $ > 0,
                                u = [],
                                x = null;
                            t.forEach((e) => {
                                let t = e.ldap === o,
                                    a = t ? "You" : e.displayStatus;
                                !t &&
                                    ("phone" === e.statusKey ||
                                    "video" === e.statusKey
                                        ? (a = "On Call")
                                        : e.statusKey.includes("break") &&
                                          (a = e.statusKey.split("-")[0])),
                                    (x && x.label === a) ||
                                        ((x = {
                                            label: a,
                                            isUser: t,
                                            rows: [],
                                        }),
                                        u.push(x)),
                                    x.rows.push(e);
                            });
                            let b = u
                                    .map((t) => {
                                        let r = t.rows
                                            .map((t) => {
                                                let r = a.icons[t.statusKey],
                                                    o =
                                                        a.statusConfig[
                                                            t.statusKey
                                                        ] ||
                                                        a.statusConfig.default,
                                                    n = o.maxSecs || 2700,
                                                    i = Math.min(
                                                        (t.durationSeconds /
                                                            n) *
                                                            100,
                                                        100
                                                    ).toFixed(1),
                                                    s = t.durationSeconds >= n,
                                                    l = `--progress: ${i}%; --st-color: ${o.color}; --st-track: ${o.track};`,
                                                    c = `agent-row ${
                                                        t.cssClass
                                                    } ${s ? "over-time" : ""}`;
                                                return `
                            <div class="${c}" style="${l}">
                                <div class="agent-left">
                                    <img src="${e.escapeHtml(
                                        t.img
                                    )}" alt="${e.escapeHtml(
                                                    t.ldap
                                                )}" loading="lazy" />
                                    <span>${e.escapeHtml(t.ldap)}</span>
                                </div>
                                <div class="agent-right">
                                    <div class="agent-meta">
                                        <span class="time-state">${e.escapeHtml(
                                            t.lastChangeRaw
                                        )} (${e.escapeHtml(
                                                    t.timeInState
                                                )})</span>
                                        <span class="status-text">${e.escapeHtml(
                                            t.displayStatus
                                        )}</span> 
                                    </div>
                                    ${
                                        r
                                            ? `<img src="${r.src}" animation="${r.animation}" alt="${t.statusKey} icon" loading="lazy" />`
                                            : ""
                                    }
                                </div>
                            </div>`;
                                            })
                                            .join("");
                                        return `
                        <div class="status-group-block">
                            <div class="status-inline-label ${
                                t.isUser ? "user-label" : ""
                            }">${e.escapeHtml(t.label)}</div>
                            <div class="status-rows-stack">${r}</div>
                        </div>`;
                                    })
                                    .join(""),
                                m = `
                        <div class="bento-wrapper ${g ? "health-warning" : ""}">
                            <button class="close-btn" title="Close"><img src="${
                                a.icons.close
                            }" alt="Close"/></button>
                            <div class="bento-grid">
                                <div class="bento-card">
                                    <div class="agent-list-header">
                                        <h3>
                                            <span>Team Status</span>
                                            ${
                                                g
                                                    ? `<span class="health-text">⚠️ Low Availability</span>`
                                                    : ""
                                            }
                                        </h3>
                                        <div class="header-counters">
                                            <span class="agent-count active-badge" title="Active">Act: ${l}</span> +
                                            <span class="agent-count phone-badge" title="On Phone">Phn: ${d}</span> +
                                            <span class="agent-count break-badge" title="On Break">Brk: ${p}</span> =
                                            <span class="agent-count total-badge" title="Total">Tot: ${$}</span>
                                        </div>
                                    </div>
                                    <div class="agent-list-container">${b}</div>
                                </div>
                            </div>
                        </div>`;
                            m !== i &&
                                ((n.innerHTML = m),
                                (i = m),
                                (n.style.display = "flex"));
                        } catch (_) {
                            console.error("Casemon render error:", _);
                        }
                    },
                    p = new MutationObserver(e.debounce(d, 150));
                p.observe(r, {
                    attributes: !0,
                    childList: !0,
                    subtree: !0,
                    characterData: !0,
                }),
                    n.addEventListener("click", (e) => {
                        e.target.closest(".close-btn") &&
                            (n.remove(), (window.dashRun = 0), p.disconnect());
                    }),
                    d();
            },
            casesConnect() {
                if (window.scrRun) return;
                (window.scrRun = !0),
                    e.addStyle(
                        "cases-styles",
                        `
                #panelQM { position: fixed; bottom: 20px; left: 20px; display: flex; gap: 10px; align-items: center; z-index: 9999; font-family: -apple-system, sans-serif; }
                .qm-btn { z-index: 10; color: white; padding: 10px 14px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(26,29,35,0.06); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); font-size: 13px; position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,0,0,0.03); }
                .qm-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(26,29,35,0.12); }
                #flup-days-input { position: absolute; top: 50%; transform: translateY(-50%); right: 6px; width: 28px; height: 24px; padding: 0; border: none; border-radius: 4px; background: rgba(255, 255, 255, 0.95); color: #1A1D23; font-weight: 700; font-size: 13px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.08); transition: all 0.2s ease; -moz-appearance: textfield; }
                #flup-days-input:focus { outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.08), 0 0 0 2px rgba(26, 29, 35, 0.2); }
                .qm-badge { display: none; position: absolute; top: -4px; right: -4px; background: #D94138; border-radius: 50%; padding: 2px 6px; font-size: 10px; font-weight: 700; line-height: 1; border: 1px solid #ffffff; }
                .aw-sig-table { margin: 12px 0; }
                `
                    );
                let t = e.createEl("div", {
                        id: "panelQM",
                        parent: document.body,
                    }),
                    a = null,
                    r = e.createEl("button", {
                        textContent: "OFF",
                        title: "Auto Click",
                        className: "qm-btn",
                        style: { backgroundColor: "#D94138" },
                        parent: t,
                        onClick() {
                            a
                                ? (clearInterval(a),
                                  (a = null),
                                  (r.textContent = "OFF"),
                                  (r.style.backgroundColor = "#D94138"))
                                : ((a = setInterval(() => {
                                      e.$("#cdtx__uioncall--btn")?.click(),
                                          setTimeout(
                                              () =>
                                                  e
                                                      .$(
                                                          ".cdtx__uioncall_control-remove"
                                                      )
                                                      ?.click(),
                                              6e3
                                          );
                                  }, 18e3)),
                                  (r.textContent = "ON"),
                                  (r.style.backgroundColor = "#1E7F4E"));
                        },
                    });
                e.createEl("button", {
                    innerHTML:
                        '<img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 16px; height: 16px; filter: invert(1);"><span id="flup-badge" class="qm-badge">+</span>',
                    title: "Click Follow-up Item",
                    className: "qm-btn",
                    style: { backgroundColor: "#3B72E6" },
                    parent: t,
                    async onClick() {
                        e.$('[debug-id="dock-item-home"]')?.click();
                        try {
                            let t = await e.waitForElement(
                                ".li-popup_lstcasefl"
                            );
                            t?.click();
                        } catch (a) {
                            console.warn("Follow-up popup not found");
                        }
                    },
                }),
                    e
                        .waitForElement(".li-popup_lstcasefl")
                        .then((t) => {
                            let a = e.$("#flup-badge"),
                                r = () => {
                                    a &&
                                        (a.style.display =
                                            t.dataset.attr &&
                                            "0" !== t.dataset.attr
                                                ? "block"
                                                : "none");
                                };
                            new MutationObserver(r).observe(t, {
                                attributes: !0,
                                attributeFilter: ["data-attr"],
                            }),
                                r();
                        })
                        .catch(() => {});
                let o = e.createEl("button", {
                    textContent: "FL Up:",
                    title: "Set Follow-up",
                    className: "qm-btn",
                    style: { backgroundColor: "#1A827A", paddingRight: "44px" },
                    parent: t,
                    async onClick(t) {
                        if ("flup-days-input" !== t.target.id)
                            try {
                                (o.style.opacity = "0.6"),
                                    (o.style.pointerEvents = "none");
                                let a = e.$(
                                    '[data-infocase="appointment_time"]'
                                );
                                if (a && !a.dataset.valchoice) {
                                    a.click(), await e.sleep(150);
                                    let r = await e.waitForElement(
                                        ".datepicker-grid .today"
                                    );
                                    r && r.click(), await e.sleep(200);
                                }
                                let n =
                                        parseInt(
                                            e.$("#flup-days-input").value,
                                            10
                                        ) || 0,
                                    i = e.$('[data-infocase="follow_up_time"]');
                                if (
                                    (i && (i.click(), await e.sleep(150)),
                                    n > 0)
                                ) {
                                    let s = new Date();
                                    for (let l = 0; l < n; )
                                        s.setDate(s.getDate() + 1),
                                            s.getDay() % 6 != 0 && l++;
                                    let c = Math.round(
                                            (s - new Date()) / 864e5
                                        ),
                                        d = await e.waitForElement(
                                            ".datepicker-grid .today"
                                        ),
                                        p = d;
                                    for (let $ = 0; $ < c && p; $++)
                                        p = p.nextElementSibling;
                                    p && (p.click(), await e.sleep(200));
                                } else {
                                    let g = await e.waitForElement(
                                        '[data-thischoice="Finish"]'
                                    );
                                    g && (g.click(), await e.sleep(200));
                                }
                                let u = await e.waitForElement(
                                    "[data-type=follow_up_time]"
                                );
                                u && u.click();
                            } catch (x) {
                                console.error("Follow up script failed", x);
                            } finally {
                                (o.style.opacity = "1"),
                                    (o.style.pointerEvents = "auto");
                            }
                    },
                });
                e.createEl("input", {
                    id: "flup-days-input",
                    type: "text",
                    value: "2",
                    parent: o,
                    onClick: (e) => e.stopPropagation(),
                    onfocus: (e) => e.target.select(),
                    oninput: (e) =>
                        (e.target.value = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 1)),
                });
                let n = (t) => `
                <table class="aw-sig-table" style="width: 348px; padding: 0 30px;" data-sig-injected="true">
                    <tbody>
                        <tr align="left">
                            <td style="width: 52px; vertical-align: top;"><img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="52" height="52" style="display: block; border-radius: 8px;"></td>
                            <td style="width: 12px;"/>
                            <td style="vertical-align: middle;">
                                <p style="font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; line-height: 1.4; color: #1A1D23;">
                                    <strong style="font-size: 105%; color: #111111;">${e.escapeHtml(
                                        t
                                    )}</strong><br>
                                    <span style="color: #5F6368;">Technical Solutions Team</span><br>
                                    <span style="color: #5F6368; font-weight: 500;">TDCX, on behalf of Google</span>
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </table>`,
                    i = () => {
                        let e = window.getSelection();
                        if (!e.rangeCount) {
                            alert(
                                "Please click inside the email body to place your cursor first."
                            );
                            return;
                        }
                        let t = e.getRangeAt(0).startContainer.parentNode;
                        if (!t || !t.closest("[contenteditable]")) {
                            alert(
                                "Please place your cursor inside the text area where you want the signature."
                            );
                            return;
                        }
                        document
                            .querySelectorAll(".aw-sig-table")
                            .forEach((e) => e.remove());
                        let a = localStorage.getItem("__signature_name");
                        a ||
                            ((a = prompt("Enter your name:") || "Agent"),
                            localStorage.setItem("__signature_name", a));
                        let r = n(a);
                        document.execCommand(
                            "insertHTML",
                            !1,
                            ((e) => {
                                if (
                                    window.trustedTypes &&
                                    window.trustedTypes.createPolicy
                                ) {
                                    let t = trustedTypes.createPolicy(
                                        "sig-inject",
                                        { createHTML: (e) => e }
                                    );
                                    return t.createHTML(e);
                                }
                                return e;
                            })(r)
                        );
                    };
                e.createEl("button", {
                    textContent: "Sign",
                    title: "Insert Signature at Cursor",
                    className: "qm-btn",
                    style: { backgroundColor: "#92400E", color: "#FFFFFF" },
                    parent: t,
                    onmousedown: (e) => e.preventDefault(),
                    onClick: i,
                });
            },
            adwords() {
                e.addStyle(
                    "aw-styles",
                    `
                .aw-ga4 { background-color: #FEF3D6; color: #B07505; border: 1px solid rgba(176,117,5,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; }
                .aw-ads { background-color: #E2F5E9; color: #1E7F4E; border: 1px solid rgba(30,127,78,0.15); padding: 2px 6px; border-radius: 6px; font-weight: 600; cursor: pointer; user-select: none; }
                .aw-copied { background-color: #3B72E6 !important; color: white !important; border-color: transparent !important; }
                #gpt-aw-overlay { position: fixed; bottom: 20px; left: 20px; z-index: 999; padding: 8px 14px; background: #161920; color: #F1F3F5; border: 1px solid #2D323F; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: monospace; box-shadow: 0 4px 16px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s ease; user-select: none; }
                #gpt-aw-overlay:hover { background: #2D323F; }
                `
                );
                let t = (t) => {
                        let a = t.match(/AW-(\d*)/)?.[1];
                        if (a) {
                            let r =
                                e.$("#gpt-aw-overlay") ||
                                e.createEl("div", {
                                    id: "gpt-aw-overlay",
                                    parent: document.body,
                                });
                            (r.textContent = `AW-${a}`),
                                e.setupCopy(r, a, "Copied!");
                        }
                        document
                            .querySelectorAll(".expand-more")
                            .forEach((e) => e.click());
                        try {
                            let o = JSON.parse(t);
                            if (!o || !o[1]) return;
                            let n = new Map(o[1].map((e) => [e[1], e]));
                            setTimeout(() => {
                                document
                                    .querySelectorAll(
                                        ".conversion-name-cell .internal"
                                    )
                                    .forEach((t) => {
                                        let a = t.closest(
                                            ".particle-table-row"
                                        );
                                        if (
                                            a &&
                                            !a
                                                .querySelector(
                                                    '[essfield="aggregated_conversion_source"]'
                                                )
                                                ?.innerText?.toLowerCase()
                                                .includes("web")
                                        )
                                            return a.remove();
                                        let r = n.get(t.innerText);
                                        if (!r) return;
                                        let o = null,
                                            i = null;
                                        1 === r[11]
                                            ? ((o = "aw-ads"),
                                              (i = r[64]?.[2]?.[4]
                                                  ?.split("'")?.[7]
                                                  ?.split("/")?.[1]))
                                            : 32 === r[11] &&
                                              ((o = "aw-ga4"),
                                              (i =
                                                  r[64]?.[1]?.[4]?.split(
                                                      "'"
                                                  )?.[3])),
                                            o &&
                                                i &&
                                                ((t.innerHTML = i),
                                                t.classList.add(o),
                                                e.setupCopy(t, i));
                                    }),
                                    document
                                        .querySelectorAll(
                                            "category-conversions-container-view, conversion-goal-card"
                                        )
                                        .forEach((e) => {
                                            e.querySelector(
                                                ".particle-table-row"
                                            ) || (e.style.display = "none");
                                        });
                            }, 1200);
                        } catch (i) {
                            console.error("Adwords Data parsing failed", i);
                        }
                    },
                    a = (e = 0) => {
                        let r =
                            window.conversions_data
                                ?.SHARED_ALL_ENABLED_CONVERSIONS;
                        if (r) return t(r);
                        e < 5 && setTimeout(() => a(e + 1), 600);
                    };
                ["complete", "interactive"].includes(document.readyState)
                    ? a()
                    : window.addEventListener("DOMContentLoaded", () => a());
            },
        },
        a = window.location.href;
    a.includes("casemon2.corp")
        ? t.casemon()
        : a.includes("cases.connect")
        ? t.casesConnect()
        : a.includes("adwords.corp") && t.adwords();
})();
