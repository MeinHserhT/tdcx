(() => {
    let e = {
            debounce(e, t) {
                let a;
                return (...o) => {
                    clearTimeout(a), (a = setTimeout(() => e(...o), t));
                };
            },
            addStyle(e, t) {
                if (document.getElementById(e)) return;
                let a = document.createElement("style");
                a.id = e;
                let o = window.trustedTypes?.createPolicy("default", {
                    createHTML: (e) => e,
                }) ?? { createHTML: (e) => e };
                (a.textContent = o.createHTML(t)), document.head.appendChild(a);
            },
            createEl(
                e,
                {
                    parent: t,
                    onClick: a,
                    style: o,
                    className: r,
                    id: n,
                    ...i
                } = {}
            ) {
                let s = Object.assign(document.createElement(e), i);
                return (
                    n && (s.id = n),
                    r && (s.className = r),
                    o && Object.assign(s.style, o),
                    a && s.addEventListener("click", a),
                    t && t.appendChild(s),
                    s
                );
            },
            $: (e, t = document) => t.querySelector(e),
            waitForElement: (t, a = 3e3) =>
                new Promise((o, r) => {
                    let n = Date.now(),
                        i = setInterval(() => {
                            let s = e.$(t);
                            s?.offsetParent
                                ? (clearInterval(i), o(s))
                                : Date.now() - n > a &&
                                  (clearInterval(i),
                                  r(Error(`Timeout waiting for: ${t}`)));
                        }, 250);
                }),
            setupCopy(e, t, a = "Copied!") {
                let o;
                e.addEventListener("click", async (r) => {
                    r.stopPropagation();
                    try {
                        await navigator.clipboard.writeText(t),
                            e.dataset.origText ||
                                (e.dataset.origText = e.innerText),
                            (e.innerText = a),
                            e.classList.add("aw-copied"),
                            clearTimeout(o),
                            (o = setTimeout(() => {
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
                    o = e.$(a.target);
                if (!o) {
                    window.dashRun = 0;
                    return;
                }
                let r =
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
                .stt-active { background: linear-gradient(135deg, #D1FAE5 0%, #DBEAFE 100%); color: #064E3B; } .stt-active .status-text { color: #047857; }
                .stt-phone { background: linear-gradient(135deg, #FFE4E6 0%, #FEF3C7 100%); color: #7F1D1D; } .stt-phone .status-text { color: #B91C1C; }
                .stt-video { background: linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 100%); color: #4C1D95; } .stt-video .status-text { color: #6B21A8; }
                .stt-email { background: linear-gradient(135deg, #E0F2FE 0%, #FFE4E6 100%); color: #0C4A6E; } .stt-email .status-text { color: #0284C7; }
                .stt-coffee-break { background: linear-gradient(135deg, #FFEDD5 0%, #E0F2FE 100%); color: #78350F; } .stt-coffee-break .status-text { color: #B45309; }
                .stt-lunch-break { background: linear-gradient(135deg, #FEF9C3 0%, #F3E8FF 100%); color: #713F12; } .stt-lunch-break .status-text { color: #A16207; }
                .stt-break { background: linear-gradient(135deg, #F3F4F6 0%, #E2E8F0 100%); color: #374151; } .stt-break .status-text { color: #4B5563; }
                [animation="pulse"] { animation: pulse 2s infinite ease-in-out; }
                @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
                [animation="wiggle"] { animation: wiggle 0.9s infinite; }
                @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 15%, 45%, 75% { transform: rotate(4deg); } 30%, 60% { transform: rotate(-4deg); } }
                [animation="slide"] { animation: slide-lr 1.2s infinite alternate ease-in-out; }
                @keyframes slide-lr { from { transform: translateX(0); } to { transform: translateX(2px); } }
                .agent-list-container::-webkit-scrollbar { width: 4px; }
                .agent-list-container::-webkit-scrollbar-track { background: transparent; }
                .agent-list-container::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
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
                    l = (e) =>
                        (e.match(/\d+[hms]/g) || []).reduce(
                            (e, t) =>
                                e +
                                parseInt(t) *
                                    ({ h: 3600, m: 60, s: 1 }[t.slice(-1)] ||
                                        0),
                            0
                        ),
                    c = () => {
                        try {
                            let t = Array.from(o.querySelectorAll("tbody tr"))
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
                                            o = (
                                                t[8].innerText.match(s)?.[0] ||
                                                ""
                                            )
                                                .trim()
                                                .toLowerCase()
                                                .replace(/\s+/g, "-"),
                                            r = t[3].innerText.trim(),
                                            n = r
                                                .toLowerCase()
                                                .replace(/\s+/g, "-");
                                        return (
                                            "Active" === r &&
                                                "busy" === a &&
                                                "busy" === o &&
                                                ((r = "Break"), (n = "break")),
                                            {
                                                img:
                                                    e.querySelector("img")
                                                        ?.src || "",
                                                ldap: t[1].innerText.trim(),
                                                timeInState:
                                                    t[4].innerText.trim(),
                                                lastChangeRaw:
                                                    t[9].innerText.trim(),
                                                displayStatus: r,
                                                statusKey: n,
                                                cssClass: `stt-${n}`,
                                                durationSeconds: l(
                                                    t[9].innerText
                                                ),
                                            }
                                        );
                                    })
                                    .filter(Boolean)
                                    .sort((e, t) => {
                                        let o = e.ldap === r,
                                            n = t.ldap === r;
                                        if (o !== n) return n - o;
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
                                c = t.filter(
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
                                g = ($ > 0 ? c / $ : 0) < 0.2 && $ > 0,
                                u = [],
                                x = null;
                            t.forEach((e) => {
                                let t = e.ldap === r,
                                    a = t ? "You" : e.displayStatus;
                                t ||
                                    ("phone" !== e.statusKey &&
                                        "video" !== e.statusKey) ||
                                    (a = "On Call"),
                                    (x && x.label === a) ||
                                        ((x = {
                                            label: a,
                                            isUser: t,
                                            rows: [],
                                        }),
                                        u.push(x)),
                                    x.rows.push(e);
                            });
                            let b = "";
                            u.forEach((t) => {
                                let o = "";
                                t.rows.forEach((t) => {
                                    let r = a.icons[t.statusKey],
                                        n =
                                            a.statusConfig[t.statusKey] ||
                                            a.statusConfig.default,
                                        i = n.maxSecs || 2700,
                                        s = Math.min(
                                            (t.durationSeconds / i) * 100,
                                            100
                                        ).toFixed(1),
                                        l = t.durationSeconds >= i,
                                        c = `--progress: ${s}%; --st-color: ${n.color}; --st-track: ${n.track};`,
                                        d = `agent-row ${t.cssClass} ${
                                            l ? "over-time" : ""
                                        }`;
                                    o += `
                                <div class="${d}" style="${c}">
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
                                }),
                                    (b += `
                            <div class="status-group-block">
                                <div class="status-inline-label ${
                                    t.isUser ? "user-label" : ""
                                }">${e.escapeHtml(t.label)}</div>
                                <div class="status-rows-stack">${o}</div>
                            </div>`);
                            });
                            let f = `
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
                                            <span class="agent-count active-badge" title="Active">Act: ${c}</span> +
                                            <span class="agent-count phone-badge" title="On Phone">Phn: ${d}</span> +
                                            <span class="agent-count break-badge" title="On Break">Brk: ${p}</span> =
                                            <span class="agent-count total-badge" title="Total">Tot: ${$}</span>
                                        </div>
                                    </div>
                                    <div class="agent-list-container">${b}</div>
                                </div>
                            </div>
                        </div>`;
                            f !== i &&
                                ((n.innerHTML = f),
                                (i = f),
                                (n.style.display = "flex"));
                        } catch (m) {
                            console.error("Casemon render error:", m);
                        }
                    },
                    d = new MutationObserver(e.debounce(c, 150));
                d.observe(o, {
                    attributes: !0,
                    childList: !0,
                    subtree: !0,
                    characterData: !0,
                }),
                    n.addEventListener("click", (e) => {
                        e.target.closest(".close-btn") &&
                            (n.remove(), (window.dashRun = 0), d.disconnect());
                    }),
                    c();
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
                    o = e.createEl("button", {
                        textContent: "OFF",
                        title: "Auto Click",
                        className: "qm-btn",
                        style: { backgroundColor: "#D94138" },
                        parent: t,
                        onClick() {
                            a
                                ? (clearInterval(a),
                                  (a = null),
                                  (o.textContent = "OFF"),
                                  (o.style.backgroundColor = "#D94138"))
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
                                  (o.textContent = "ON"),
                                  (o.style.backgroundColor = "#1E7F4E"));
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
                                o = () => {
                                    a &&
                                        (a.style.display =
                                            t.dataset.attr &&
                                            "0" !== t.dataset.attr
                                                ? "block"
                                                : "none");
                                };
                            new MutationObserver(o).observe(t, {
                                attributes: !0,
                                attributeFilter: ["data-attr"],
                            }),
                                o();
                        })
                        .catch(() => {});
                let r = e.createEl("button", {
                    textContent: "FL Up:",
                    title: "Set Follow-up",
                    className: "qm-btn",
                    style: { backgroundColor: "#1A827A", paddingRight: "44px" },
                    parent: t,
                    async onClick(t) {
                        if ("flup-days-input" !== t.target.id)
                            try {
                                let a = e.$(
                                    '[data-infocase="appointment_time"]'
                                );
                                a &&
                                    !a.dataset.valchoice &&
                                    (a.click(),
                                    (
                                        await e.waitForElement(
                                            ".datepicker-grid .today"
                                        )
                                    )?.click());
                                let o =
                                    parseInt(
                                        e.$("#flup-days-input").value,
                                        10
                                    ) || 0;
                                if (
                                    (e
                                        .$('[data-infocase="follow_up_time"]')
                                        ?.click(),
                                    o > 0)
                                ) {
                                    let r = new Date();
                                    for (let n = 0; n < o; )
                                        r.setDate(r.getDate() + 1),
                                            r.getDay() % 6 != 0 && n++;
                                    let i = Math.round(
                                            (r - new Date()) / 864e5
                                        ),
                                        s = await e.waitForElement(
                                            ".datepicker-grid .today"
                                        ),
                                        l = s;
                                    for (let c = 0; c < i && l; c++)
                                        l = l.nextElementSibling;
                                    l?.click();
                                } else
                                    (
                                        await e.waitForElement(
                                            '[data-thischoice="Finish"]'
                                        )
                                    )?.click();
                                (
                                    await e.waitForElement(
                                        "[data-type=follow_up_time]"
                                    )
                                )?.click();
                            } catch (d) {
                                console.error("Follow up script failed", d);
                            }
                    },
                });
                e.createEl("input", {
                    id: "flup-days-input",
                    type: "text",
                    value: "2",
                    parent: r,
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
                        let t = e.$("#email-body-content-top-content");
                        if (!t) return;
                        document
                            .querySelectorAll(".aw-sig-table")
                            .forEach((e) => e.remove());
                        let a =
                            localStorage.getItem("__signature_name") ||
                            prompt("Enter your name:") ||
                            "Agent";
                        localStorage.setItem("__signature_name", a);
                        let o = document.createElement("div");
                        (o.innerHTML = n(a)),
                            t.appendChild(o.firstElementChild);
                    },
                    s = () => {
                        let t = localStorage.getItem("__signature_name");
                        if (!t) return;
                        let a = e.$(
                            "#email-body-content-top-content > table:nth-child(2)"
                        );
                        a &&
                            !e.$(".aw-sig-table") &&
                            a.insertAdjacentHTML("afterend", n(t));
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
                let l = e.debounce(s, 400);
                new MutationObserver(l).observe(document.body, {
                    childList: !0,
                    subtree: !0,
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
                            let o =
                                e.$("#gpt-aw-overlay") ||
                                e.createEl("div", {
                                    id: "gpt-aw-overlay",
                                    parent: document.body,
                                });
                            (o.textContent = `AW-${a}`),
                                e.setupCopy(o, a, "Copied!");
                        }
                        document
                            .querySelectorAll(".expand-more")
                            .forEach((e) => e.click());
                        try {
                            let r = JSON.parse(t);
                            if (!r || !r[1]) return;
                            let n = new Map(r[1].map((e) => [e[1], e]));
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
                                        let o = n.get(t.innerText);
                                        if (!o) return;
                                        let r = null,
                                            i = null;
                                        1 === o[11]
                                            ? ((r = "aw-ads"),
                                              (i = o[64]?.[2]?.[4]
                                                  ?.split("'")?.[7]
                                                  ?.split("/")?.[1]))
                                            : 32 === o[11] &&
                                              ((r = "aw-ga4"),
                                              (i =
                                                  o[64]?.[1]?.[4]?.split(
                                                      "'"
                                                  )?.[3])),
                                            r &&
                                                i &&
                                                ((t.innerHTML = i),
                                                t.classList.add(r),
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
                        let o =
                            window.conversions_data
                                ?.SHARED_ALL_ENABLED_CONVERSIONS;
                        if (o) return t(o);
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
