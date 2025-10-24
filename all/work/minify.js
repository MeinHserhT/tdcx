if (window.location.href.includes("cases.connect")) {
    function t(t, e) {
        let i = new MutationObserver((i) => {
            for (let n of i)
                for (let o of n.addedNodes)
                    1 === o.nodeType &&
                        (o.matches(t) && e(o),
                        o.querySelectorAll(t).forEach(e));
        });
        return (
            i.observe(document.body, { childList: !0, subtree: !0 }),
            document.querySelectorAll(t).forEach(e),
            i
        );
    }
    function e(t) {
        document.querySelector(t)?.click();
    }
    let i = {
        originalTitle: document.title,
        intervalId: null,
        start(t = ">>> ALERT!!! <<<") {
            this.intervalId ||
                ((this.originalTitle = document.title),
                (this.intervalId = setInterval(() => {
                    document.title =
                        document.title === this.originalTitle
                            ? t
                            : this.originalTitle;
                }, 1e3)),
                window.addEventListener("focus", this.stop.bind(this), {
                    once: !0,
                }));
        },
        stop() {
            this.intervalId &&
                (clearInterval(this.intervalId),
                (this.intervalId = null),
                (document.title = this.originalTitle));
        },
    };
    async function n() {
        let t = new Audio(
            "https://cdn.pixabay.com/audio/2025/07/18/audio_da35bc65d2.mp3"
        );
        await t.play(), i.start(">>> INCOMING CALL <<<"), window.focus();
    }
    let o = {
        intervalId: null,
        isOn: !1,
        button: null,
        CLICK_INTERVAL: 18e3,
        REMOVE_DELAY: 3e3,
        start() {
            !this.intervalId &&
                ((this.isOn = !0),
                (this.intervalId = setInterval(() => {
                    e("#cdtx__uioncall--btn"),
                        setTimeout(() => {
                            e(".cdtx__uioncall_control-remove");
                        }, this.REMOVE_DELAY);
                }, this.CLICK_INTERVAL)),
                this.button &&
                    ((this.button.textContent = "Autoclick: ON"),
                    (this.button.style.backgroundColor = "#77DD77")));
        },
        stop() {
            this.intervalId &&
                (clearInterval(this.intervalId),
                (this.intervalId = null),
                (this.isOn = !1),
                this.button &&
                    ((this.button.textContent = "Autoclick: OFF"),
                    (this.button.style.backgroundColor = "#FF746C")));
        },
        toggle() {
            this.isOn ? this.stop() : this.start();
        },
        createButton() {
            (this.button = document.createElement("button")),
                (this.button.id = "auto-btn"),
                Object.assign(this.button.style, {
                    position: "fixed",
                    bottom: "16px",
                    left: "16px",
                    zIndex: "999",
                    padding: "12px 16px",
                    backgroundColor: "#FF746C",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    transition: "background-color 0.3s ease",
                }),
                (this.button.textContent = "Autoclick: OFF"),
                this.button.addEventListener("click", this.toggle.bind(this)),
                document.body.appendChild(this.button);
        },
    };
    function r() {
        t("[debug-id=phoneTakeDialog]", n), o.createButton();
    }
    window.scrRun || ((window.scrRun = 1), r());
} else if (window.location.href.includes("casemon2.corp")) {
    let a = "https://cdn-icons-png.flaticon.com/512";
    class l {
        #a = {
            AGENT_TABLE_SELECTOR: ".agent-table-container",
            UI_CONTAINER_ID: "agent_ui",
            STYLE_ID: "agent-dash-styles",
            PRIOR: {
                active: 1,
                phone: 2,
                "lunch-break": 3,
                email: 4,
                "coffee-break": 5,
                break: 6,
                default: 99,
            },
            ICONS: {
                "coffee-break": {
                    src: a + "/2935/2935413.png",
                    animation: "wiggle",
                },
                "lunch-break": {
                    src: a + "/4252/4252424.png",
                    animation: "pulse",
                },
                phone: { src: a + "/1959/1959283.png", animation: "wiggle" },
                email: { src: a + "/15781/15781499.png", animation: "slide" },
                break: { src: a + "/2115/2115487.png", animation: "wiggle" },
                close: a + "/9403/9403346.png",
            },
        };
        #b = null;
        #c = null;
        #d = null;
        #e = null;
        #f = null;
        constructor() {
            (this.#c = this.#g()),
                (this.#e = document.querySelector(
                    this.#a.AGENT_TABLE_SELECTOR
                )),
                (this.#f = window.trustedTypes.createPolicy(
                    "agent-dash-policy",
                    { createHTML: (t) => t }
                )),
                this.#h(),
                this.#i(),
                this.#j(),
                console.log(
                    "%cAgent Dashboard Initialized",
                    "color: blue; font-weight: bold;"
                );
        }
        #g() {
            return document
                .querySelector("[alt='profile photo']")
                ?.src?.match(/\/([^\/]+)\?/)?.[1];
        }
        #i() {
            let s = document.getElementById(this.#a.UI_CONTAINER_ID);
            s ||
                (((s = document.createElement("div")).id =
                    this.#a.UI_CONTAINER_ID),
                document.body.appendChild(s)),
                (this.#d = s),
                this.#d.addEventListener("click", (t) => {
                    t.target.closest(".close-btn") && this.#k();
                });
        }
        #j() {
            (this.#b = new MutationObserver(this.#l.bind(this))),
                this.#b.observe(this.#e, {
                    attributes: !0,
                    childList: !0,
                    subtree: !0,
                    characterData: !0,
                }),
                this.#l();
        }
        #k() {
            this.#d && (this.#d.style.display = "none"),
                this.#b && this.#b.disconnect(),
                (window.dashRun = 0);
        }
        #m() {
            this.#d && (this.#d.style.display = "flex");
        }
        #n() {
            let c = this.#e.querySelectorAll("tbody tr");
            return Array.from(c, (t) => {
                let e = t.querySelectorAll("td");
                if (e.length < 9) return null;
                let i = (e[5].innerText.match(/([a-zA-Z\s]+)/g)?.[0] ?? "")
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, "-");
                return {
                    imgSrc: t.querySelector("img").src,
                    agentLdap: e[1].innerText,
                    auxCode: e[3].innerText,
                    timeSpent: e[4].innerText,
                    phoneCapacity: i,
                    lastChange: e[8].innerText.trim(),
                    lastChangeInSec: this.#o(e[8].innerText),
                };
            }).filter(Boolean);
        }
        #p(d) {
            let u = d.auxCode,
                p;
            return (
                "Active" === d.auxCode && "busy" === d.phoneCapacity
                    ? ((u = "Break"), (p = "break"))
                    : (p = d.auxCode.toLowerCase().replace(/\s+/g, "-")),
                {
                    ...d,
                    processedAuxCode: u,
                    statusKey: p,
                    cssClass: `stt-${p}`,
                }
            );
        }
        #q(h) {
            let { PRIOR: g } = this.#a;
            return h.sort((t, e) => {
                let i = g[t.statusKey] ?? g.default,
                    n = g[e.statusKey] ?? g.default;
                return (
                    (e.agentLdap === this.#c) - (t.agentLdap === this.#c) ||
                    i - n ||
                    e.lastChangeInSec - t.lastChangeInSec
                );
            });
        }
        #l() {
            let b = this.#n(),
                $ = b.map(this.#p.bind(this)),
                f = this.#q($),
                y = f.map(this.#r).join(""),
                m = this.#s(),
                x = `
              <div class="ui-content-wrapper">
                ${m}
                <div class="ui-table">${y}</div>
              </div>`;
            (this.#d.innerHTML = this.#f.createHTML(x)), this.#m();
        }
        #r = (t) => {
            let [e, i] = [t.lastChange, t.timeSpent],
                n = this.#t(t.statusKey),
                o = `Avatar for ${t.agentLdap}`;
            return `
            <div class="tr ${t.cssClass}">
              <div class="td left">
                <img src="${t.imgSrc}" alt="${o}" />
                <p>${t.agentLdap}</p>
              </div>
              <div class="td right">
                <div>
                  <p>${e} <span>(${i})</span></p>
                  <p>${t.processedAuxCode}</p> 
                </div>
                ${n}
              </div>
            </div>`;
        };
        #t(C) {
            let _ = this.#a.ICONS[C];
            return _
                ? `<img src="${_.src}" animation="${_.animation}" alt="${C} icon"/>`
                : "";
        }
        #s() {
            return `<button class="close-btn" title="Close">
                    <img src="${this.#a.ICONS.close}" alt="Close"/>
                  </button>`;
        }
        #o(v) {
            let I = v.match(/(\d+)(h|m|s)/g) ?? [],
                E = { h: 3600, m: 60, s: 1 };
            return I.reduce((t, e) => {
                let i = parseInt(e, 10),
                    n = e.slice(-1);
                return t + i * (E[n] ?? 0);
            }, 0);
        }
        #h() {
            let A = `
            #${this.#a.UI_CONTAINER_ID} { 
              position: fixed; height: 100%; width: 100%; top: 0; right: 0; 
              background-color: rgba(0,0,0,0.1); z-index: 999; 
              display: flex; justify-content: flex-end; align-items: center; 
              padding: 20px; font-family: 'Noto Serif', serif; pointer-events: none; 
            }
            .ui-content-wrapper { position: relative; pointer-events: auto; }
            .close-btn { 
              position: absolute; top: 0; right: 0;
              transform: translate(40%, -40%); border: none; cursor: pointer;
              z-index: 10; background: rgba(0, 0, 0, 0); transition: transform 0.2s ease; 
            }
            .close-btn:hover { transform: translate(40%, -40%) scale(1.4); }
            .ui-table { 
              display: grid; grid-template-columns: repeat(2, 1fr); 
              width: 100%; max-width: 400px; border-radius: 12px; 
              overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); 
            }
            .ui-table .tr { display: contents; }
            .ui-table .td { 
              padding: 8px 12px; display: flex; align-items: center; 
              transition: background-color 0.4s ease, transform 0.2s ease; 
            }
            .ui-table .left { justify-content: flex-start; font-size: 16px; font-weight: 500; }
            .ui-table .right { justify-content: flex-end; text-align: right; font-size: 14px; }
            .ui-table .td { background-color: #F8F9FA; color: #495057; }
            .ui-table .tr.stt-active .td { background-color: #E6F4EA; color: #1E8449; }
            .ui-table .tr.stt-phone .td { background-color: #FEC7C0; color: #C0392B; }
            .ui-table .tr.stt-email .td { background-color: #ace0fe; color: #1d8fdcff; }
            .ui-table .tr.stt-coffee-break .td { background-color: #D2A993; color: #685347; }
            .ui-table .tr.stt-lunch-break .td { background-color: #FFEA99; color: #E58732; }
            .ui-table .tr.stt-break .td { background-color: #e9ecef; color: #495057; } /* Added style for 'break' */
            .ui-table .tr:hover .td { transform: scale(1.05); z-index: 5; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .ui-table .td p { padding: 0 6px; margin: 1px 0; }
            .ui-table .td span { opacity: 0.6; font-size: 0.9em; }
            img { border-radius: 12px; width: 36px; height: 36px; padding: 4px; object-fit: cover; }
            .close-btn img { width: 20px; height: 20px; }
            [animation="pulse"] { animation: pulse 2s infinite ease-in-out; }
            @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
            [animation="wiggle"] { animation: wiggle 0.9s infinite; }
            @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 15%, 45%, 75% { transform: rotate(8deg); } 30%, 60% { transform: rotate(-8deg); } }
            [animation="slide"] { animation: slide-lr 1.2s infinite alternate ease-in-out; }
            @keyframes slide-lr { from { transform: translateX(0); } to { transform: translateX(8px); } }
          `,
                k =
                    document.getElementById(this.#a.STYLE_ID) ||
                    document.createElement("style");
            (k.id = this.#a.STYLE_ID),
                (k.innerHTML = this.#f.createHTML(A)),
                document.head.appendChild(k);
        }
    }
    window.dashRun || ((window.dashRun = 1), new l());
} else if (window.location.href.includes("adwords.corp")) {
    function L({
        element: t,
        textToCopy: e,
        title: i = "Click to copy",
        successText: n,
        successBg: o = "#007bff",
        successColor: r = "white",
        timeout: a = 800,
    }) {
        (t.style.cursor = "pointer"),
            (t.style.userSelect = "none"),
            (t.title = i),
            t.dataset.copyListenerAdded ||
                ((t.dataset.copyListenerAdded = !0),
                t.addEventListener("click", (i) => {
                    i.preventDefault(),
                        i.stopPropagation(),
                        navigator.clipboard.writeText(e).then(() => {
                            let e = t.style.backgroundColor,
                                i = t.style.color,
                                l = t.textContent;
                            (t.style.backgroundColor = o),
                                (t.style.color = r),
                                n && (t.textContent = n),
                                setTimeout(() => {
                                    (t.style.backgroundColor = e),
                                        (t.style.color = i),
                                        n && (t.textContent = l);
                                }, a);
                        });
                }));
    }
    function T(t) {
        var e = null,
            i = null;
        return (
            1 == t[11] &&
                ((e = "Ads Conversion: "),
                (i = t[64]?.[2]?.[4]?.split("'")?.[7]?.split("/")?.[1])),
            32 == t[11] &&
                ((e = "GA4: "), (i = t[64]?.[1]?.[4]?.split("'")?.[3])),
            { type_cv: e, label_event: i }
        );
    }
    let S =
        conversions_data.SHARED_ALL_ENABLED_CONVERSIONS.match(/AW-(\d*)/)[1];
    document.querySelectorAll(".expand-more").forEach((t) => {
        t.click();
    });
    let w = JSON.parse(conversions_data.SHARED_ALL_ENABLED_CONVERSIONS)[1];
    function N(t) {
        let e = document.getElementById("gpt-aw-id-display");
        e ||
            (((e = document.createElement("div")).id = "gpt-aw-id-display"),
            Object.assign(e.style, {
                position: "fixed",
                bottom: "16px",
                left: "16px",
                zIndex: "9999",
                padding: "8px 12px",
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "bold",
                fontFamily: "monospace",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                transition: "background-color 0.3s ease",
            }),
            document.body.appendChild(e)),
            (e.textContent = `AW-ID: ${t}`),
            L({
                element: e,
                textToCopy: t,
                title: "Click to copy ID",
                successText: "Copied!",
                timeout: 800,
            });
    }
    setTimeout(() => {
        document
            .querySelectorAll(".conversion-name-cell .internal")
            .forEach((t) => {
                let e = t.innerText;
                var i = "",
                    n = "no label",
                    o = null,
                    r = t.closest(".particle-table-row");
                r &&
                    (r
                        .querySelector(
                            '[essfield="aggregated_conversion_source"]'
                        )
                        ?.innerText.match(/.*web.*/gi) ||
                        r.remove());
                for (let a = 0; a < w.length; a++)
                    if (w[a][1] == e) {
                        (o = w[a]), ({ type_cv: i, label_event: n } = T(o));
                        break;
                    }
                "GA4: " == i
                    ? ((t.innerHTML = `${n}`),
                      (t.style.backgroundColor = "rgb(255, 229, 180)"),
                      (t.style.borderRadius = "10px"),
                      (t.style.fontWeight = 500))
                    : i &&
                      ((t.innerHTML = `${n}`),
                      (t.style.backgroundColor = "rgb(160, 251, 157)"),
                      (t.style.borderRadius = "10px"),
                      (t.style.fontWeight = 500)),
                    i &&
                        n &&
                        L({
                            element: t,
                            textToCopy: n,
                            title: "Click to copy label",
                            timeout: 500,
                        });
            }),
            document
                .querySelectorAll(
                    "category-conversions-container-view, conversion-goal-card"
                )
                .forEach((t) => {
                    t.querySelectorAll(".particle-table-row").length ||
                        (t.style.display = "none");
                });
    }, 1e3),
        N(S);
}
