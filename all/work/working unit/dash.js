if (window.location.href.includes("casemon2.corp")) {
    (() => {
        if (window.dashRun) return;
        window.dashRun = 1;

        class AgentDash {
            #cfg = {
                tblSel: ".agent-table-container",
                uiId: "agent_ui",
                styleId: "agent-dash-styles",
                link: "https://cdn-icons-png.flaticon.com/512",
                prior: {
                    active: 1,
                    phone: 2,
                    "lunch-break": 3,
                    email: 4,
                    "coffee-break": 5,
                    break: 6,
                    default: 99,
                },
                icons: {
                    "coffee-break": {
                        src: "/2935/2935413.png",
                        animation: "wiggle",
                    },
                    "lunch-break": {
                        src: "/4252/4252424.png",
                        animation: "pulse",
                    },
                    phone: { src: "/1959/1959283.png", animation: "wiggle" },
                    email: { src: "/15781/15781499.png", animation: "slide" },
                    break: { src: "/2115/2115487.png", animation: "wiggle" },
                    close: "/9403/9403346.png",
                },
            };

            #obs = null;
            #ldap = null;
            #ui = null;
            #tbl = null;
            #policy = null;

            constructor() {
                this.#ldap = this.#getLdap();
                this.#tbl = document.querySelector(this.#cfg.tblSel);
                if (!this.#tbl) return;

                this.#policy = window.trustedTypes.createPolicy(
                    "agent-dash-policy",
                    { createHTML: (s) => s }
                );

                for (const [key, icon] of Object.entries(this.#cfg.icons)) {
                    if (typeof icon === "string") {
                        this.#cfg.icons[key] = this.#cfg.link + icon;
                    } else {
                        icon.src = this.#cfg.link + icon.src;
                    }
                }

                this.#styles();
                this.#initUi();
                this.#initObs();
            }

            #getLdap() {
                return document
                    .querySelector("[alt='profile photo']")
                    ?.src?.match(/\/([^\/]+)\?/)?.[1];
            }

            #initUi() {
                let ui = document.getElementById(this.#cfg.uiId);
                if (!ui) {
                    ui = document.createElement("div");
                    ui.id = this.#cfg.uiId;
                    document.body.appendChild(ui);
                }
                this.#ui = ui;
                this.#ui.addEventListener("click", (e) => {
                    if (e.target.closest(".close-btn")) this.#close();
                });
            }

            #initObs() {
                this.#obs = new MutationObserver(this.#render.bind(this));
                this.#obs.observe(this.#tbl, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    characterData: true,
                });
                this.#render();
            }

            #close() {
                if (this.#ui) this.#ui.style.display = "none";
                if (this.#obs) this.#obs.disconnect();
                window.dashRun = 0;
            }

            #show() {
                if (this.#ui) this.#ui.style.display = "flex";
            }

            #parse() {
                const rows = this.#tbl.querySelectorAll("tbody tr");

                return Array.from(rows, (row) => {
                    const cells = row.querySelectorAll("td");
                    if (cells.length < 9) return null;

                    const phoneCap = (
                        cells[5].innerText.match(/[a-zA-Z\s]+/)?.[0] ?? ""
                    )
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "-");

                    return {
                        img: row.querySelector("img").src,
                        ldap: cells[1].innerText,
                        aux: cells[3].innerText,
                        time: cells[4].innerText,
                        phoneCap: phoneCap,
                        lastChg: cells[8].innerText.trim(),
                        lastSec: this.#toSec(cells[8].innerText),
                    };
                }).filter(Boolean);
            }

            #proc(agent) {
                let statusKey = agent.aux.toLowerCase().replace(/\s+/g, "-");
                let aux = agent.aux;

                if (agent.aux === "Active" && agent.phoneCap === "busy") {
                    aux = "Break";
                    statusKey = "break";
                }

                return { ...agent, aux, statusKey, css: `stt-${statusKey}` };
            }

            #sort(agents) {
                const { prior } = this.#cfg;

                return agents.sort((a, b) => {
                    const aPri = prior[a.statusKey] ?? prior.default;
                    const bPri = prior[b.statusKey] ?? prior.default;

                    return (
                        (b.ldap === this.#ldap) - (a.ldap === this.#ldap) ||
                        aPri - bPri ||
                        b.lastSec - a.lastSec
                    );
                });
            }

            #render() {
                const agents = this.#parse();
                const processed = agents.map(this.#proc.bind(this));
                const sorted = this.#sort(processed);

                const rows = sorted.map(this.#rowHtml).join("");
                const closeBtn = this.#closeHtml();

                const html = `
                  <div class="ui-content-wrapper">
                    ${closeBtn}
                    <div class="ui-table">${rows}</div>
                  </div>`;

                this.#ui.innerHTML = this.#policy.createHTML(html);
                this.#show();
            }

            #rowHtml = (agent) => {
                const icon = this.#iconHtml(agent.statusKey);
                const alt = `Avatar for ${agent.ldap}`;

                return `
                <div class="tr ${agent.css}">
                  <div class="td left">
                    <img src="${agent.img}" alt="${alt}" />
                    <p>${agent.ldap}</p>
                  </div>
                  <div class="td right">
                    <div>
                      <p>${agent.lastChg} <span>(${agent.time})</span></p>
                      <p>${agent.aux}</p> 
                    </div>
                    ${icon}
                  </div>
                </div>`;
            };

            #iconHtml(key) {
                const icon = this.#cfg.icons[key];
                return icon
                    ? `<img src="${icon.src}" animation="${icon.animation}" alt="${key} icon"/>`
                    : "";
            }

            #closeHtml() {
                return `<button class="close-btn" title="Close">
                        <img src="${this.#cfg.icons.close}" alt="Close"/>
                      </button>`;
            }

            #toSec(timeStr) {
                const parts = timeStr.match(/(\d+)(h|m|s)/g) ?? [];
                const factors = { h: 3600, m: 60, s: 1 };

                return parts.reduce((total, part) => {
                    const val = parseInt(part, 10);
                    const unit = part.slice(-1);
                    return total + val * (factors[unit] ?? 0);
                }, 0);
            }

            #styles() {
                const css = `
                #${this.#cfg.uiId} { 
                  position: fixed; height: 100%; width: 100%; top: 0; right: 0; 
                  background-color: rgba(0,0,0,0.1); z-index: 999; 
                  display: flex; justify-content: flex-end; align-items: center; 
                  padding: 20px;
                  font-family: 'Noto Serif', serif; pointer-events: none; 
                  box-sizing: border-box;
                }
                .ui-content-wrapper { position: relative; pointer-events: auto; width: 100%; max-width: 0px; }
                .close-btn { 
                  position: absolute; top: 0; right: 0;
                  transform: translate(40%, -40%); border: none; cursor: pointer;
                  z-index: 10; background: rgba(0, 0, 0, 0); transition: transform 0.2s ease; 
                }
                .close-btn:hover { transform: translate(40%, -40%) scale(1.4); }
                .ui-table { 
                  display: grid; grid-template-columns: repeat(2, 1fr); 
                  width: 100%; border-radius: 12px; 
                  overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); 
                }
                .ui-table .tr { display: contents; }
                .ui-table .td { 
                  padding: 8px 12px; display: flex; align-items: center; 
                  transition: background-color 0.4s ease, transform 0.2s ease; 
                }
                .ui-table .left { justify-content: flex-start; font-weight: 500; font-size: clamp(12px, 4vw, 16px); }
                .ui-table .right { justify-content: flex-end; text-align: right; font-size: clamp(10px, 3.5vw, 14px); }
                .ui-table .td { background-color: #F8F9FA; color: #495057; }
                .ui-table .tr.stt-active .td { background-color: #E6F4EA; color: #1E8449; }
                .ui-table .tr.stt-phone .td { background-color: #FEC7C0; color: #C0392B; }
                .ui-table .tr.stt-email .td { background-color: #ace0fe; color: #1d8fdcff; }
                .ui-table .tr.stt-coffee-break .td { background-color: #D2A993; color: #685347; }
                .ui-table .tr.stt-lunch-break .td { background-color: #FFEA99; color: #E58732; }
                .ui-table .tr.stt-break .td { background-color: #e9ecef; color: #495057; }
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
                @media (max-width: 350px) { .ui-table .right img[alt*="icon"] { display: none; } }
                @media (max-width: 280px) { .ui-table .left img[alt*="Avatar"] { display: none; } }
                @media (max-width: 240px) { .ui-table .right span { display: none; } }
              `;

                const styleEl =
                    document.getElementById(this.#cfg.styleId) ||
                    document.createElement("style");
                styleEl.id = this.#cfg.styleId;
                styleEl.innerHTML = this.#policy.createHTML(css);
                document.head.appendChild(styleEl);
            }
        }

        new AgentDash();
    })();
}