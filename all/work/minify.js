(() => {
    let e = {
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
                    className: n,
                    id: o,
                    ...i
                } = {}
            ) {
                let s = Object.assign(document.createElement(e), i);
                return (
                    o && (s.id = o),
                    n && (s.className = n),
                    r && Object.assign(s.style, r),
                    a && s.addEventListener("click", a),
                    t && t.appendChild(s),
                    s
                );
            },
            $: (e, t = document) => t.querySelector(e),
            waitForElement: (t, a = 3e3) =>
                new Promise((r, n) => {
                    let o = Date.now(),
                        i = setInterval(() => {
                            let s = e.$(t);
                            s?.offsetParent
                                ? (clearInterval(i), r(s))
                                : Date.now() - o > a &&
                                  (clearInterval(i), n(Error(`Timeout: ${t}`)));
                        }, 500);
                }),
            setupCopy(e, t, a = "Copied!") {
                e.addEventListener("click", async () => {
                    try {
                        await navigator.clipboard.writeText(t);
                        let r = e.innerText;
                        (e.innerText = a),
                            e.classList.add("aw-copied"),
                            setTimeout(() => {
                                (e.innerText = r),
                                    e.classList.remove("aw-copied");
                            }, 1500);
                    } catch (n) {
                        console.error("Copy failed", n);
                    }
                });
            },
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
                        maxStatusSeconds: 2700,
                        statusConfig: {
                            active: { color: "#10B981", track: "#D1FAE5" },
                            phone: { color: "#EF4444", track: "#FFE4E6" },
                            video: { color: "#8B5CF6", track: "#F3E8FF" },
                            email: { color: "#0EA5E9", track: "#E0F2FE" },
                            "coffee-break": {
                                color: "#F59E0B",
                                track: "#FFEDD5",
                            },
                            "lunch-break": {
                                color: "#EAB308",
                                track: "#FEF9C3",
                            },
                            break: { color: "#6B7280", track: "#F3F4F6" },
                            default: { color: "#9CA3AF", track: "#F3F4F6" },
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
                if (!r) return;
                let n =
                    e
                        .$("[alt='profile photo']")
                        ?.src?.match(/photos\/([^/?]+)/)?.[1] ?? "Unknown";
                e.addStyle(
                    a.styleId,
                    `
                #bento_agent_ui { position: fixed; height: 100%; width: 100%; top: 0; right: 0; background-color: rgba(15, 17, 21, 0.12); z-index: 9999; display: flex; justify-content: flex-end; align-items: center; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; pointer-events: none; box-sizing: border-box; }
                .bento-wrapper { position: relative; pointer-events: auto; width: 100%; max-width: 320px; background: #FFFFFF; border-radius: 20px; box-shadow: 0 12px 32px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04); padding: 20px; border: 1px solid #E5E7EB; color: #1F2937; }
                .close-btn { position: absolute; top: 14px; right: 14px; background: #F3F4F6; border: none; cursor: pointer; z-index: 10; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
                .close-btn:hover { background: #E5E7EB; transform: scale(1.05); }
                .close-btn img { width: 10px; height: 10px; opacity: 0.6; }
                .bento-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
                .bento-card { background: transparent; display: flex; flex-direction: column; }
                .bento-card h3 { margin: 0 0 12px 0; font-size: 12px; color: #4B5563; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; }
                .header-counters { display: flex; gap: 6px; }
                .agent-count { font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
                .active-badge { background: #E6F4EA; color: #137333; border: 1px solid #CEEAD6; }
                .total-badge { background: #F1F3F4; color: #5F6368; border: 1px solid #E8EAED; }
                .agent-list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                
                .agent-list-container { max-height: 80vh; overflow-y: auto; padding: 12px; background: #F8FAFC; border-radius: 14px; border: 1px solid #E2E8F0; }
                
                .agent-row { 
                    display: flex; justify-content: space-between; align-items: center; 
                    padding: 10px 14px; margin-bottom: 8px; border-radius: 12px; 
                    transition: transform 0.2s ease, box-shadow 0.2s ease; 
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                    position: relative;
                    background-clip: padding-box;
                    border: 2px solid transparent; /* Replaces static borders to reserve space for gradient mask */
                    z-index: 1;
                }
                .agent-row:last-child { margin-bottom: 0; }
                .agent-row:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
                
                .agent-row::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 12px;
                    padding: 2px; /* Ring thickness */
                    margin: -2px; /* Aligns correctly over the transparent border */
                    background: conic-gradient(var(--st-color) var(--progress), var(--st-track) var(--progress));
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    pointer-events: none;
                    z-index: -1;
                }

                @keyframes pulseWarning {
                    0%, 100% { filter: drop-shadow(0 0 2px var(--st-color)); }
                    50% { filter: drop-shadow(0 0 8px var(--st-color)); }
                }

                .agent-row.over-time::before {
                    animation: pulseWarning 1.5s infinite ease-in-out;
                }
                /* ======================================= */

                .agent-left { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 13px; }
                .agent-left img { width: 28px; height: 28px; border-radius: 6px; object-fit: cover; border: 1px solid rgba(0,0,0,0.04); }
                .agent-right { display: flex; align-items: center; gap: 12px; text-align: right; }
                .agent-meta { display: flex; flex-direction: column; }
                .time-state { font-size: 11px; font-weight: 500; opacity: 0.85; }
                .status-text { font-size: 11px; font-weight: 700; letter-spacing: 0.2px; display: inline-block; margin-top: 1px; }
                .agent-right img { width: 20px; height: 20px; opacity: 0.8; }
                
                /* Static borders removed - Handled by the progress pseudo element */
                .stt-active { background: linear-gradient(135deg, #D1FAE5 0%, #DBEAFE 100%); color: #064E3B; }
                .stt-active .status-text { color: #047857; }
                
                .stt-phone { background: linear-gradient(135deg, #FFE4E6 0%, #FEF3C7 100%); color: #7F1D1D; }
                .stt-phone .status-text { color: #B91C1C; }
                
                .stt-video { background: linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 100%); color: #4C1D95; }
                .stt-video .status-text { color: #6B21A8; }
                
                .stt-email { background: linear-gradient(135deg, #E0F2FE 0%, #FFE4E6 100%); color: #0C4A6E; }
                .stt-email .status-text { color: #0284C7; }
                
                .stt-coffee-break { background: linear-gradient(135deg, #FFEDD5 0%, #E0F2FE 100%); color: #78350F; }
                .stt-coffee-break .status-text { color: #B45309; }
                
                .stt-lunch-break { background: linear-gradient(135deg, #FEF9C3 0%, #F3E8FF 100%); color: #713F12; }
                .stt-lunch-break .status-text { color: #A16207; }
                
                .stt-break { background: linear-gradient(135deg, #F3F4F6 0%, #E2E8F0 100%); color: #374151; }
                .stt-break .status-text { color: #4B5563; }
                
                [animation="pulse"] { animation: pulse 2s infinite ease-in-out; }
                @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
                [animation="wiggle"] { animation: wiggle 0.9s infinite; }
                @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 15%, 45%, 75% { transform: rotate(4deg); } 30%, 60% { transform: rotate(-4deg); } }
                [animation="slide"] { animation: slide-lr 1.2s infinite alternate ease-in-out; }
                @keyframes slide-lr { from { transform: translateX(0); } to { transform: translateX(2px); } }
                .agent-list-container::-webkit-scrollbar { width: 5px; }
                .agent-list-container::-webkit-scrollbar-track { background: transparent; }
                .agent-list-container::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
            `
                );
                let o =
                    document.getElementById(a.uiId) ||
                    e.createEl("div", { id: a.uiId, parent: document.body });
                o.addEventListener("click", (e) => {
                    e.target.closest(".close-btn") &&
                        (o.remove(), (window.dashRun = 0));
                });
                let i = (e) =>
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
                    s = (e) =>
                        (e.match(/\d+[hms]/g) || []).reduce(
                            (e, t) =>
                                e +
                                parseInt(t) *
                                    ({ h: 3600, m: 60, s: 1 }[t.slice(-1)] ||
                                        0),
                            0
                        ),
                    l = () => {
                        let e = Array.from(r.querySelectorAll("tbody tr"))
                                .map((e) => {
                                    let t = e.querySelectorAll("td");
                                    if (t.length < 9) return null;
                                    let a = (
                                            t[5].innerText.match(
                                                /[a-zA-Z\s]+/
                                            )?.[0] || ""
                                        )
                                            .trim()
                                            .toLowerCase()
                                            .replace(/\s+/g, "-"),
                                        r = (
                                            t[8].innerText.match(
                                                /[a-zA-Z\s]+/
                                            )?.[0] || ""
                                        )
                                            .trim()
                                            .toLowerCase()
                                            .replace(/\s+/g, "-"),
                                        n = t[3].innerText.trim(),
                                        o = n
                                            .toLowerCase()
                                            .replace(/\s+/g, "-");
                                    return (
                                        "Active" === n &&
                                            "busy" === a &&
                                            "busy" === r &&
                                            ((n = "Break"), (o = "break")),
                                        {
                                            img:
                                                e.querySelector("img")?.src ||
                                                "",
                                            ldap: t[1].innerText.trim(),
                                            timeInState: t[4].innerText.trim(),
                                            lastChangeRaw:
                                                t[9].innerText.trim(),
                                            displayStatus: n,
                                            statusKey: o,
                                            cssClass: `stt-${o}`,
                                            durationSeconds: s(t[9].innerText),
                                        }
                                    );
                                })
                                .filter(Boolean)
                                .sort((e, t) => {
                                    if ((e.ldap === n) != (t.ldap === n))
                                        return (t.ldap === n) - (e.ldap === n);
                                    let r =
                                            a.priorities[e.statusKey] ??
                                            a.priorities.default,
                                        o =
                                            a.priorities[t.statusKey] ??
                                            a.priorities.default;
                                    return r !== o
                                        ? r - o
                                        : t.durationSeconds - e.durationSeconds;
                                }),
                            t = e.filter(
                                (e) => "active" === e.statusKey
                            ).length,
                            l = a.maxStatusSeconds,
                            c = e
                                .map((e) => {
                                    let t = a.icons[e.statusKey],
                                        r = Math.min(
                                            (e.durationSeconds / l) * 100,
                                            100
                                        ).toFixed(1),
                                        n =
                                            a.statusConfig[e.statusKey] ||
                                            a.statusConfig.default,
                                        o = e.durationSeconds >= l,
                                        s = `--progress: ${r}%; --st-color: ${n.color}; --st-track: ${n.track};`,
                                        c = `agent-row ${e.cssClass} ${
                                            o ? "over-time" : ""
                                        }`;
                                    return `
                    <div class="${c}" style="${s}">
                        <div class="agent-left">
                            <img src="${i(e.img)}" alt="${i(
                                        e.ldap
                                    )}" onerror="this.style.display='none'" />
                            <span>${i(e.ldap)}</span>
                        </div>
                        <div class="agent-right">
                            <div class="agent-meta">
                                <span class="time-state">${i(
                                    e.lastChangeRaw
                                )} (${i(e.timeInState)})</span>
                                <span class="status-text">${i(
                                    e.displayStatus
                                )}</span> 
                            </div>
                            ${
                                t
                                    ? `<img src="${t.src}" animation="${t.animation}" alt="${e.statusKey} icon"/>`
                                    : ""
                            }
                        </div>
                    </div>`;
                                })
                                .join("");
                        (o.innerHTML = `
                    <div class="bento-wrapper">
                        <button class="close-btn" title="Close"><img src="${a.icons.close}" alt="Close"/></button>
                        <div class="bento-grid">
                            <div class="bento-card">
                                <div class="agent-list-header">
                                    <h3>Team Status</h3>
                                    <div class="header-counters">
                                        <span class="agent-count active-badge">${t} Active</span>
                                        <span class="agent-count total-badge">${e.length} Total</span>
                                    </div>
                                </div>
                                <div class="agent-list-container">${c}</div>
                            </div>
                        </div>
                    </div>`),
                            (o.style.display = "flex");
                    },
                    c;
                new MutationObserver(() => {
                    clearTimeout(c), (c = setTimeout(l, 100));
                }).observe(r, {
                    attributes: !0,
                    childList: !0,
                    subtree: !0,
                    characterData: !0,
                }),
                    l();
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
                        e.$('[debug-id="dock-item-home"]')?.click(),
                            (
                                await e.waitForElement(".li-popup_lstcasefl")
                            )?.click();
                    },
                }),
                    e
                        .waitForElement(".li-popup_lstcasefl")
                        .then((t) => {
                            let a = e.$("#flup-badge"),
                                r = () =>
                                    a &&
                                    (a.style.display =
                                        t.dataset.attr && "0" !== t.dataset.attr
                                            ? "block"
                                            : "none");
                            new MutationObserver(r).observe(t, {
                                attributes: !0,
                                attributeFilter: ["data-attr"],
                            }),
                                r();
                        })
                        .catch(() => {});
                let n = e.createEl("button", {
                    textContent: "FL Up:",
                    title: "Set Follow-up",
                    className: "qm-btn",
                    style: { backgroundColor: "#1A827A", paddingRight: "44px" },
                    parent: t,
                    async onClick(t) {
                        if ("flup-days-input" === t.target.id) return;
                        let a = e.$('[data-infocase="appointment_time"]');
                        a &&
                            !a.dataset.valchoice &&
                            (a.click(),
                            (
                                await e.waitForElement(
                                    ".datepicker-grid .today"
                                )
                            )?.click());
                        let r =
                            parseInt(e.$("#flup-days-input").value, 10) || 0;
                        if (
                            (e.$('[data-infocase="follow_up_time"]')?.click(),
                            r)
                        ) {
                            let n = new Date();
                            for (let o = 0; o < r; )
                                n.setDate(n.getDate() + 1),
                                    n.getDay() % 6 != 0 && o++;
                            let i = Math.round((n - new Date()) / 864e5),
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
                            await e.waitForElement("[data-type=follow_up_time]")
                        )?.click();
                    },
                });
                e.createEl("input", {
                    id: "flup-days-input",
                    type: "text",
                    value: "2",
                    parent: n,
                    onClick: (e) => e.stopPropagation(),
                    onfocus: (e) => e.target.select(),
                    oninput: (e) =>
                        (e.target.value = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 1)),
                });
                let o = (e) => `
                <table class="aw-sig-table" style="width: 348px; padding: 0 30px;" data-sig-injected="true">
                    <tbody>
                        <tr align="left">
                            <td style="width: 52px; vertical-align: top;"><img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="52" height="52" style="display: block; border-radius: 8px;"></td>
                            <td style="width: 12px;"/>
                            <td style="vertical-align: middle;">
                                <p style="font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; line-height: 1.4; color: #1A1D23;">
                                    <strong style="font-size: 105%; color: #111111;">${e}</strong><br>
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
                        let r = o(a),
                            n = document.createElement("div");
                        n.innerHTML = r;
                        let i = n.firstElementChild;
                        t.appendChild(i),
                            console.log("Signature injected successfully.");
                    },
                    s = () => {
                        let t = localStorage.getItem("__signature_name");
                        if (!t) return;
                        let a = e.$(
                            "#email-body-content-top-content > table:nth-child(2)"
                        );
                        a &&
                            !e.$(".aw-sig-table") &&
                            a.insertAdjacentHTML("afterend", o(t));
                    };
                e.createEl("button", {
                    textContent: "Sign",
                    title: "Insert Signature at Cursor",
                    className: "qm-btn",
                    style: { backgroundColor: "#92400E", color: "#FFFFFF" },
                    parent: t,
                    onmousedown: (e) => e.preventDefault(),
                    onClick: () => i(!0),
                }),
                    new MutationObserver(() => s()).observe(document.body, {
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
                            let n = new Map(
                                JSON.parse(t)[1].map((e) => [e[1], e])
                            );
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
                                                ?.innerText.toLowerCase()
                                                .includes("web")
                                        )
                                            return a.remove();
                                        let r = n.get(t.innerText);
                                        if (!r) return;
                                        let [o, i] =
                                            1 === r[11]
                                                ? [
                                                      "aw-ads",
                                                      r[64]?.[2]?.[4]
                                                          ?.split("'")?.[7]
                                                          ?.split("/")?.[1],
                                                  ]
                                                : 32 === r[11]
                                                ? [
                                                      "aw-ga4",
                                                      r[64]?.[1]?.[4]?.split(
                                                          "'"
                                                      )?.[3],
                                                  ]
                                                : [null, null];
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
                            }, 1e3);
                        } catch (o) {
                            console.error("Data parsing failed", o);
                        }
                    },
                    a = (e = 0) => {
                        let r =
                            window.conversions_data
                                ?.SHARED_ALL_ENABLED_CONVERSIONS;
                        if (r) return t(r);
                        e < 3 && setTimeout(() => a(e + 1), 500);
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
