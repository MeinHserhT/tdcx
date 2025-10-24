if (window.location.href.includes("cases.connect")) {
    function observeElement(selector, callback) {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (node.matches(selector)) {
                        callback(node);
                    }
                    node.querySelectorAll(selector).forEach(callback);
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        document.querySelectorAll(selector).forEach(callback);
        return observer;
    }
    function clickElement(selector) {
        document.querySelector(selector)?.click();
    }
    const titleFlasher = {
        originalTitle: document.title,
        intervalId: null,

        start(message = ">>> ALERT!!! <<<") {
            if (this.intervalId) return;

            this.originalTitle = document.title;
            this.intervalId = setInterval(() => {
                document.title =
                    document.title === this.originalTitle
                        ? message
                        : this.originalTitle;
            }, 1000);

            window.addEventListener("focus", this.stop.bind(this), {
                once: true,
            });
        },

        stop() {
            if (!this.intervalId) return;

            clearInterval(this.intervalId);
            this.intervalId = null;
            document.title = this.originalTitle;
        },
    };
    async function handleDialogNotification() {
        const soundUrl =
            "https://cdn.pixabay.com/audio/2025/07/18/audio_da35bc65d2.mp3";
        const notificationSound = new Audio(soundUrl);
        await notificationSound.play();

        titleFlasher.start(">>> INCOMING CALL <<<");
        window.focus();
    }
    const autoClicker = {
        intervalId: null,
        isOn: false,
        button: null,
        CLICK_INTERVAL: 18000, // 18 seconds
        REMOVE_DELAY: 3000, // 3 seconds

        start() {
            if (this.intervalId) return; // Already running
            this.isOn = true;
            this.intervalId = setInterval(() => {
                clickElement("#cdtx__uioncall--btn");
                setTimeout(() => {
                    clickElement(".cdtx__uioncall_control-remove");
                }, this.REMOVE_DELAY);
            }, this.CLICK_INTERVAL);

            if (this.button) {
                this.button.textContent = "Autoclick: ON";
                this.button.style.backgroundColor = "#77DD77"; // Green
            }
        },

        stop() {
            if (!this.intervalId) return;
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isOn = false;
            if (this.button) {
                this.button.textContent = "Autoclick: OFF";
                this.button.style.backgroundColor = "#FF746C"; // Red
            }
        },

        toggle() {
            this.isOn ? this.stop() : this.start();
        },

        createButton() {
            this.button = document.createElement("button");
            this.button.id = "auto-btn";

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
            });

            this.button.textContent = "Autoclick: OFF";
            this.button.addEventListener("click", this.toggle.bind(this));
            document.body.appendChild(this.button);
        },
    };

    function init() {
        const dialogSelector = "[debug-id=phoneTakeDialog]";
        observeElement(dialogSelector, handleDialogNotification);
        autoClicker.createButton();
    }
    if (!window.scrRun) {
        window.scrRun = 1;
        init();
    }
} else if (window.location.href.includes("casemon2.corp")) {
    const LINK = "https://cdn-icons-png.flaticon.com/512";

    class AgentDashboard {
        #CONFIG = {
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
                    src: LINK + "/2935/2935413.png",
                    animation: "wiggle",
                },
                "lunch-break": {
                    src: LINK + "/4252/4252424.png",
                    animation: "pulse",
                },
                phone: {
                    src: LINK + "/1959/1959283.png",
                    animation: "wiggle",
                },
                email: {
                    src: LINK + "/15781/15781499.png",
                    animation: "slide",
                },
                break: {
                    src: LINK + "/2115/2115487.png",
                    animation: "wiggle",
                },
                close: LINK + "/9403/9403346.png",
            },
        };

        #observer = null;
        #myLdap = null;
        #uiContainer = null;
        #agentTable = null;
        #policy = null;

        constructor() {
            this.#myLdap = this.#getMyLdap();
            this.#agentTable = document.querySelector(
                this.#CONFIG.AGENT_TABLE_SELECTOR
            );
            this.#policy = window.trustedTypes.createPolicy(
                "agent-dash-policy",
                {
                    createHTML: (s) => s,
                }
            );
            this.#injectStyles();
            this.#createUiContainer();
            this.#initObserver();
            console.log(
                "%cAgent Dashboard Initialized",
                "color: blue; font-weight: bold;"
            );
        }

        #getMyLdap() {
            return document
                .querySelector("[alt='profile photo']")
                ?.src?.match(/\/([^\/]+)\?/)?.[1];
        }
        #createUiContainer() {
            let container = document.getElementById(
                this.#CONFIG.UI_CONTAINER_ID
            );
            if (!container) {
                container = document.createElement("div");
                container.id = this.#CONFIG.UI_CONTAINER_ID;
                document.body.appendChild(container);
            }
            this.#uiContainer = container;

            this.#uiContainer.addEventListener("click", (e) => {
                if (e.target.closest(".close-btn")) {
                    this.#closeUi();
                }
            });
        }
        #initObserver() {
            this.#observer = new MutationObserver(this.#render.bind(this));
            this.#observer.observe(this.#agentTable, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true,
            });
            this.#render();
        }

        #closeUi() {
            if (this.#uiContainer) this.#uiContainer.style.display = "none";
            if (this.#observer) this.#observer.disconnect();
            window.dashRun = 0;
        }

        #showUi() {
            if (this.#uiContainer) this.#uiContainer.style.display = "flex";
        }

        #parseAgentTable() {
            const rows = this.#agentTable.querySelectorAll("tbody tr");

            return Array.from(rows, (row) => {
                const cells = row.querySelectorAll("td");
                if (cells.length < 9) return null;

                const phoneCap = (
                    cells[5].innerText.match(/([a-zA-Z\s]+)/g)?.[0] ?? ""
                )
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, "-");

                return {
                    imgSrc: row.querySelector("img").src,
                    agentLdap: cells[1].innerText,
                    auxCode: cells[3].innerText,
                    timeSpent: cells[4].innerText,
                    phoneCapacity: phoneCap,
                    lastChange: cells[8].innerText.trim(),
                    lastChangeInSec: this.#strToSec(cells[8].innerText),
                };
            }).filter(Boolean);
        }

        #processAgentData(agent) {
            let processedAuxCode = agent.auxCode;
            let statusKey;

            if (agent.auxCode === "Active" && agent.phoneCapacity === "busy") {
                processedAuxCode = "Break";
                statusKey = "break";
            } else {
                statusKey = agent.auxCode.toLowerCase().replace(/\s+/g, "-");
            }

            return {
                ...agent,
                processedAuxCode,
                statusKey,
                cssClass: `stt-${statusKey}`,
            };
        }

        #sortAgents(agents) {
            const { PRIOR } = this.#CONFIG;

            return agents.sort((a, b) => {
                const aPriority = PRIOR[a.statusKey] ?? PRIOR.default;
                const bPriority = PRIOR[b.statusKey] ?? PRIOR.default;

                return (
                    (b.agentLdap === this.#myLdap) -
                        (a.agentLdap === this.#myLdap) ||
                    aPriority - bPriority ||
                    b.lastChangeInSec - a.lastChangeInSec
                );
            });
        }
        #render() {
            const rawAgents = this.#parseAgentTable();
            const processedAgents = rawAgents.map(
                this.#processAgentData.bind(this)
            );
            const sortedAgents = this.#sortAgents(processedAgents);

            const rowsHtml = sortedAgents
                .map(this.#createAgentRowHtml)
                .join("");
            const closeButtonHtml = this.#createCloseButtonHtml();

            const finalHtml = `
              <div class="ui-content-wrapper">
                ${closeButtonHtml}
                <div class="ui-table">${rowsHtml}</div>
              </div>`;

            this.#uiContainer.innerHTML = this.#policy.createHTML(finalHtml);
            this.#showUi();
        }
        #createAgentRowHtml = (agent) => {
            const [displayTime, stateTime] = [
                agent.lastChange,
                agent.timeSpent,
            ];
            const icon = this.#getIconHtml(agent.statusKey);
            const altText = `Avatar for ${agent.agentLdap}`;

            return `
            <div class="tr ${agent.cssClass}">
              <div class="td left">
                <img src="${agent.imgSrc}" alt="${altText}" />
                <p>${agent.agentLdap}</p>
              </div>
              <div class="td right">
                <div>
                  <p>${displayTime} <span>(${stateTime})</span></p>
                  <p>${agent.processedAuxCode}</p> 
                </div>
                ${icon}
              </div>
            </div>`;
        };

        #getIconHtml(statusKey) {
            const icon = this.#CONFIG.ICONS[statusKey];
            return icon
                ? `<img src="${icon.src}" animation="${icon.animation}" alt="${statusKey} icon"/>`
                : "";
        }

        #createCloseButtonHtml() {
            return `<button class="close-btn" title="Close">
                    <img src="${this.#CONFIG.ICONS.close}" alt="Close"/>
                  </button>`;
        }

        #strToSec(timeStr) {
            const parts = timeStr.match(/(\d+)(h|m|s)/g) ?? [];
            const factors = { h: 3600, m: 60, s: 1 };

            return parts.reduce((totalSeconds, part) => {
                const value = parseInt(part, 10);
                const unit = part.slice(-1);
                return totalSeconds + value * (factors[unit] ?? 0);
            }, 0);
        }

        #injectStyles() {
            const css = `
            #${this.#CONFIG.UI_CONTAINER_ID} { 
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
          `;

            const styleEl =
                document.getElementById(this.#CONFIG.STYLE_ID) ||
                document.createElement("style");
            styleEl.id = this.#CONFIG.STYLE_ID;
            styleEl.innerHTML = this.#policy.createHTML(css); // Use policy
            document.head.appendChild(styleEl);
        }
    }

    if (!window.dashRun) {
        window.dashRun = 1;
        new AgentDashboard();
    }
} else if (window.location.href.includes("adwords.corp")) {
    function addClickToCopy({
        element,
        textToCopy,
        title = "Click to copy",
        successText,
        successBg = "#007bff",
        successColor = "white",
        timeout = 800,
    }) {
        element.style.cursor = "pointer";
        element.style.userSelect = "none";
        element.title = title;

        // Prevent adding multiple listeners if script runs again
        if (element.dataset.copyListenerAdded) return;
        element.dataset.copyListenerAdded = true;

        element.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalBg = element.style.backgroundColor;
                const originalColor = element.style.color;
                const originalText = element.textContent;

                element.style.backgroundColor = successBg;
                element.style.color = successColor;
                if (successText) {
                    element.textContent = successText;
                }
                setTimeout(() => {
                    element.style.backgroundColor = originalBg;
                    element.style.color = originalColor;
                    if (successText) {
                        element.textContent = originalText;
                    }
                }, timeout);
            });
        });
    }


    function extractConversionDetails(conversionData) {
        var type = null,
            label = null;

        if (1 == conversionData[11]) {
            type = "Ads Conversion: ";
            label = conversionData[64]?.[2]?.[4]
                ?.split("'")?.[7]
                ?.split("/")?.[1];
        }

        if (32 == conversionData[11]) {
            type = "GA4: ";
            label = conversionData[64]?.[1]?.[4]?.split("'")?.[3];
        }
        return { type_cv: type, label_event: label };
    }

    const awID =
        conversions_data.SHARED_ALL_ENABLED_CONVERSIONS.match(/AW-(\d*)/)[1];
    document.querySelectorAll(".expand-more").forEach((button) => {
        button.click();
    });

    const allConversionData = JSON.parse(
        conversions_data.SHARED_ALL_ENABLED_CONVERSIONS
    )[1];

    setTimeout(() => {
        document
            .querySelectorAll(".conversion-name-cell .internal")
            .forEach((cellElement) => {
                let conversionName = cellElement.innerText;
                var conversionType = "",
                    conversionLabel = "no label",
                    matchedData = null;

                // Filter table: Remove rows that aren't 'web' conversions
                var tableRow = cellElement.closest(".particle-table-row");
                if (tableRow) {
                    let sourceElement = tableRow.querySelector(
                        '[essfield="aggregated_conversion_source"]'
                    );
                    if (!sourceElement?.innerText.match(/.*web.*/gi)) {
                        tableRow.remove();
                    }
                }

                for (let i = 0; i < allConversionData.length; i++) {
                    if (allConversionData[i][1] == conversionName) {
                        matchedData = allConversionData[i];
                        ({
                            type_cv: conversionType,
                            label_event: conversionLabel,
                        } = extractConversionDetails(matchedData));
                        break;
                    }
                }

                if ("GA4: " == conversionType) {
                    cellElement.innerHTML = `${conversionLabel}`;
                    cellElement.style.backgroundColor = "rgb(255, 229, 180)"; // Yellowish
                    cellElement.style.borderRadius = "10px";
                    cellElement.style.fontWeight = 500;
                } else if (conversionType) {
                    cellElement.innerHTML = `${conversionLabel}`;
                    cellElement.style.backgroundColor = "rgb(160, 251, 157)"; // Greenish
                    cellElement.style.borderRadius = "10px";
                    cellElement.style.fontWeight = 500;
                }

                if (conversionType && conversionLabel) {
                    addClickToCopy({
                        element: cellElement,
                        textToCopy: conversionLabel,
                        title: "Click to copy label",
                        timeout: 500, // Use original 500ms timeout
                    });
                }
            });

        document
            .querySelectorAll(
                "category-conversions-container-view, conversion-goal-card"
            )
            .forEach((container) => {
                if (!container.querySelectorAll(".particle-table-row").length) {
                    container.style.display = "none";
                }
            });
    }, 1000);

    function displayAwIdElement(id) {
        let idEl = document.getElementById("gpt-aw-id-display");
        if (!idEl) {
            idEl = document.createElement("div");
            idEl.id = "gpt-aw-id-display";
            // Style the element
            Object.assign(idEl.style, {
                position: "fixed",
                bottom: "16px",
                left: "16px",
                zIndex: "9999",
                padding: "8px 12px",
                backgroundColor: "rgba(0, 0, 0, 0.75)", // Dark background
                color: "white",
                border: "none",
                borderRadius: "4px",
                // cursor: "pointer", // This is now set by addClickToCopy
                fontSize: "14px",
                fontWeight: "bold",
                fontFamily: "monospace",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                transition: "background-color 0.3s ease", // Smooth transition
            });
            document.body.appendChild(idEl);
        }

        idEl.textContent = `AW-ID: ${id}`;

        addClickToCopy({
            element: idEl,
            textToCopy: id,
            title: "Click to copy ID",
            successText: "Copied!",
            timeout: 800, // Use original 800ms timeout
        });

    }
    displayAwIdElement(awID);
}
