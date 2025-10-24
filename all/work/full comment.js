/**
 * =================================================================
 * SCRIPT FOR: cases.connect
 * =================================================================
 * This script adds call notifications (sound, flashing title) and
 * an autoclicker tool for managing calls.
 */
if (window.location.href.includes("cases.connect")) {
    /**
     * Observes the DOM for elements matching a selector and runs a callback.
     * Uses MutationObserver for dynamically added elements.
     * @param {string} selector - The CSS selector to watch for.
     * @param {function} callback - The function to run for each matching element.
     * @returns {MutationObserver} The observer instance.
     */
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
        // Also run on existing elements
        document.querySelectorAll(selector).forEach(callback);
        return observer;
    }

    /**
     * Helper function to safely click an element by its selector.
     * @param {string} selector - The CSS selector of the element to click.
     */
    function clickElement(selector) {
        document.querySelector(selector)?.click();
    }

    /**
     * Manages flashing the document title to alert the user.
     */
    const titleFlasher = {
        originalTitle: document.title,
        intervalId: null,

        /**
         * Starts flashing the title.
         * @param {string} [message=">>> ALERT!!! <<<"] - The message to flash in the title.
         */
        start(message = ">>> ALERT!!! <<<") {
            if (this.intervalId) return;

            this.originalTitle = document.title;
            this.intervalId = setInterval(() => {
                document.title =
                    document.title === this.originalTitle
                        ? message
                        : this.originalTitle;
            }, 1000);

            // Stop flashing when the user returns to the tab
            window.addEventListener("focus", this.stop.bind(this), {
                once: true,
            });
        },

        /**
         * Stops flashing the title and restores the original.
         */
        stop() {
            if (!this.intervalId) return;

            clearInterval(this.intervalId);
            this.intervalId = null;
            document.title = this.originalTitle;
        },
    };

    /**
     * Handles the notification sequence for an incoming call.
     * Plays a sound, flashes the title, and focuses the window.
     */
    async function handleDialogNotification() {
        const soundUrl =
            "https://cdn.pixabay.com/audio/2025/07/18/audio_da35bc65d2.mp3";
        const notificationSound = new Audio(soundUrl);
        await notificationSound.play();

        titleFlasher.start(">>> INCOMING CALL <<<");
        window.focus();
    }

    /**
     * Manages the autoclicker functionality and its UI button.
     */
    const autoClicker = {
        intervalId: null,
        isOn: false,
        button: null,
        CLICK_INTERVAL: 18000, // 18 seconds
        REMOVE_DELAY: 3000, // 3 seconds

        /**
         * Starts the autoclicker interval.
         * Clicks two elements in sequence every CLICK_INTERVAL.
         */
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

        /**
         * Stops the autoclicker interval.
         */
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

        /**
         * Toggles the autoclicker state (on/off).
         */
        toggle() {
            this.isOn ? this.stop() : this.start();
        },

        /**
         * Creates and injects the autoclicker toggle button onto the page.
         */
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

    /**
     * Initializes the script's functionalities.
     */
    function init() {
        const dialogSelector = "[debug-id=phoneTakeDialog]";
        // Start watching for the incoming call dialog
        observeElement(dialogSelector, handleDialogNotification);
        // Create the autoclicker button
        autoClicker.createButton();
    }

    // Run-once guard: Ensures the script only initializes a single time
    if (!window.scrRun) {
        window.scrRun = 1;
        init();
    }
} else if (window.location.href.includes("casemon2.corp")) {
    /**
     * =================================================================
     * SCRIPT FOR: casemon2.corp
     * =================================================================
     * This script creates a custom, sorted agent dashboard UI
     * by parsing the existing agent table on the page.
     */

    const LINK = "https://cdn-icons-png.flaticon.com/512";

    /**
     * Class to create and manage the Agent Dashboard UI.
     */
    class AgentDashboard {
        // ... (CONFIG properties are self-explanatory) ...
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
        #policy = null; // For Trusted Types

        /**
         * Initializes the dashboard.
         */
        constructor() {
            this.#myLdap = this.#getMyLdap();
            this.#agentTable = document.querySelector(
                this.#CONFIG.AGENT_TABLE_SELECTOR
            );
            // Create a Trusted Types policy for safe HTML injection
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

        /**
         * Gets the current user's LDAP/username from their profile photo URL.
         * @returns {string | undefined} The user's LDAP.
         */
        #getMyLdap() {
            return document
                .querySelector("[alt='profile photo']")
                ?.src?.match(/\/([^\/]+)\?/)?.[1];
        }

        /**
         * Creates the main container element for the custom UI.
         */
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

            // Add listener to the container to handle closing the UI
            this.#uiContainer.addEventListener("click", (e) => {
                if (e.target.closest(".close-btn")) {
                    this.#closeUi();
                }
            });
        }

        /**
         * Initializes the MutationObserver to watch the original agent table
         * and re-render the custom UI on any change.
         */
        #initObserver() {
            this.#observer = new MutationObserver(this.#render.bind(this));
            this.#observer.observe(this.#agentTable, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true,
            });
            this.#render(); // Initial render
        }

        /**
         * Closes and disconnects the dashboard.
         */
        #closeUi() {
            if (this.#uiContainer) this.#uiContainer.style.display = "none";
            if (this.#observer) this.#observer.disconnect();
            window.dashRun = 0; // Reset the run-once guard
        }

        /**
         * Shows the custom UI.
         */
        #showUi() {
            if (this.#uiContainer) this.#uiContainer.style.display = "flex";
        }

        /**
         * Parses the live DOM table into an array of agent objects.
         * @returns {Array<object>} An array of raw agent data.
         */
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
            }).filter(Boolean); // Filter out any null rows
        }

        /**
         * Enriches the raw agent data with processed info (e.g., statusKey, cssClass).
         * @param {object} agent - A raw agent object from #parseAgentTable.
         * @returns {object} The processed agent object.
         */
        #processAgentData(agent) {
            let processedAuxCode = agent.auxCode;
            let statusKey;

            // Special logic: "Active" + "busy" on phone = "Break"
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

        /**
         * Sorts agents based on a multi-level priority.
         * 1. Current user is always first.
         * 2. Status priority (e.g., 'phone' is high).
         * 3. Time spent in the current state (longest first).
         * @param {Array<object>} agents - The array of processed agent objects.
         * @returns {Array<object>} The sorted array of agents.
         */
        #sortAgents(agents) {
            const { PRIOR } = this.#CONFIG;

            return agents.sort((a, b) => {
                const aPriority = PRIOR[a.statusKey] ?? PRIOR.default;
                const bPriority = PRIOR[b.statusKey] ?? PRIOR.default;

                return (
                    (b.agentLdap === this.#myLdap) -
                        (a.agentLdap === this.#myLdap) || // 1. Current user
                    aPriority - bPriority || // 2. Status priority
                    b.lastChangeInSec - a.lastChangeInSec // 3. Time
                );
            });
        }

        /**
         * The main render pipeline.
         * Parses, processes, sorts, and then renders the HTML to the UI.
         */
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

            // Use Trusted Types policy to safely set HTML
            this.#uiContainer.innerHTML = this.#policy.createHTML(finalHtml);
            this.#showUi();
        }

        /**
         * Creates the HTML string for a single agent row in the custom UI.
         * @param {object} agent - The sorted, processed agent object.
         * @returns {string} An HTML string.
         */
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

        /**
         * Gets the icon HTML (including animation) for a given status.
         * @param {string} statusKey - The agent's processed status (e.g., "coffee-break").
         * @returns {string} An `<img>` HTML string or an empty string.
         */
        #getIconHtml(statusKey) {
            const icon = this.#CONFIG.ICONS[statusKey];
            return icon
                ? `<img src="${icon.src}" animation="${icon.animation}" alt="${statusKey} icon"/>`
                : "";
        }

        /**
         * Creates the HTML string for the UI's close button.
         * @returns {string} A `<button>` HTML string.
         */
        #createCloseButtonHtml() {
            return `<button class="close-btn" title="Close">
                    <img src="${this.#CONFIG.ICONS.close}" alt="Close"/>
                  </button>`;
        }

        /**
         * Utility to convert a time string (e.g., "1h 5m 10s") into total seconds.
         * @param {string} timeStr - The time string from the table.
         * @returns {number} The total time in seconds.
         */
        #strToSec(timeStr) {
            const parts = timeStr.match(/(\d+)(h|m|s)/g) ?? [];
            const factors = { h: 3600, m: 60, s: 1 };

            return parts.reduce((totalSeconds, part) => {
                const value = parseInt(part, 10);
                const unit = part.slice(-1);
                return totalSeconds + value * (factors[unit] ?? 0);
            }, 0);
        }

        /**
         * Injects all the CSS for the custom dashboard into the document's <head>.
         */
        #injectStyles() {
            const css = `
            /* ... (all the CSS styles from the original script) ... */
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
              width: 100%; max-width: 550px; border-radius: 12px; 
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

    // Run-once guard: Ensures the script only initializes a single time
    if (!window.dashRun) {
        window.dashRun = 1;
        new AgentDashboard();
    }
} else if (window.location.href.includes("adwords.corp")) {
    /**
     * =================================================================
     * SCRIPT FOR: adwords.corp
     * =================================================================
     * This script enhances the Google Ads conversion table by:
     * 1. Displaying the clean conversion label directly.
     * 2. Filtering out non-"web" conversions.
     * 3. Adding click-to-copy to labels.
     * 4. Displaying the AW-ID with click-to-copy.
     */

    /**
     * Adds a click-to-copy functionality to a given element.
     * @param {object} options - Configuration object
     * @param {HTMLElement} options.element - The DOM element to make clickable.
     * @param {string} options.textToCopy - The text to copy to the clipboard.
     * @param {string} [options.title="Click to copy"] - The tooltip title.
     * @param {string} [options.successText] - Optional text to display on copy success.
     * @param {string} [options.successBg='#007bff'] - Background color on success.
     * @param {string} [options.successColor='white'] - Text color on success.
     * @param {number} [options.timeout=800] - Duration of the success feedback.
     */
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
                // Store original state
                const originalBg = element.style.backgroundColor;
                const originalColor = element.style.color;
                const originalText = element.textContent;

                // Apply feedback state
                element.style.backgroundColor = successBg;
                element.style.color = successColor;
                if (successText) {
                    element.textContent = successText;
                }

                // Revert after timeout
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

    /**
     * Extracts the conversion type and label from the page's complex data array.
     * @param {Array} conversionData - The specific conversion's data array.
     * @returns {{type_cv: string|null, label_event: string|null}}
     */
    function extractConversionDetails(conversionData) {
        var type = null,
            label = null;

        // Check index [11] for type: 1 = Ads Conversion
        if (1 == conversionData[11]) {
            type = "Ads Conversion: ";
            label = conversionData[64]?.[2]?.[4]
                ?.split("'")?.[7]
                ?.split("/")?.[1];
        }

        // Check index [11] for type: 32 = GA4
        if (32 == conversionData[11]) {
            type = "GA4: ";
            label = conversionData[64]?.[1]?.[4]?.split("'")?.[3];
        }
        return { type_cv: type, label_event: label };
    }

    // Extract the AW-ID from the global page data
    const awID =
        conversions_data.SHARED_ALL_ENABLED_CONVERSIONS.match(/AW-(\d*)/)[1];

    // Auto-click all "expand" buttons to show all conversions
    document.querySelectorAll(".expand-more").forEach((button) => {
        button.click();
    });

    // Parse the main conversion data from the page
    const allConversionData = JSON.parse(
        conversions_data.SHARED_ALL_ENABLED_CONVERSIONS
    )[1];

    // Run the main DOM modifications after a delay to ensure the page is loaded
    setTimeout(() => {
        // Iterate over every conversion name cell in the table
        document
            .querySelectorAll(".conversion-name-cell .internal")
            .forEach((cellElement) => {
                let conversionName = cellElement.innerText;
                var conversionType = "",
                    conversionLabel = "no label",
                    matchedData = null;

                // --- Filter Table ---
                // Find the parent row of the cell
                var tableRow = cellElement.closest(".particle-table-row");
                if (tableRow) {
                    // Find the "Source" column in that row
                    let sourceElement = tableRow.querySelector(
                        '[essfield="aggregated_conversion_source"]'
                    );
                    // If the source is not "web", remove the entire row
                    if (!sourceElement?.innerText.match(/.*web.*/gi)) {
                        tableRow.remove();
                    }
                }

                // --- Find Matching Data ---
                // Loop through the parsed data to find the entry for this row
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

                // --- Modify DOM ---
                // If it's a GA4 conversion, color it yellow
                if ("GA4: " == conversionType) {
                    cellElement.innerHTML = `${conversionLabel}`;
                    cellElement.style.backgroundColor = "rgb(255, 229, 180)"; // Yellowish
                    cellElement.style.borderRadius = "10px";
                    cellElement.style.fontWeight = 500;
                }
                // If it's an Ads conversion, color it green
                else if (conversionType) {
                    cellElement.innerHTML = `${conversionLabel}`;
                    cellElement.style.backgroundColor = "rgb(160, 251, 157)"; // Greenish
                    cellElement.style.borderRadius = "10px";
                    cellElement.style.fontWeight = 500;
                }

                // --- Add Click-to-Copy ---
                if (conversionType && conversionLabel) {
                    addClickToCopy({
                        element: cellElement,
                        textToCopy: conversionLabel,
                        title: "Click to copy label",
                        timeout: 500,
                    });
                }
            });

        // --- UI Cleanup ---
        // Find all conversion category cards
        document
            .querySelectorAll(
                "category-conversions-container-view, conversion-goal-card"
            )
            .forEach((container) => {
                // If a card has no visible table rows left (after filtering), hide it
                if (!container.querySelectorAll(".particle-table-row").length) {
                    container.style.display = "none";
                }
            });
    }, 1000); // 1-second delay

    /**
     * Creates and displays a fixed element for the AW-ID.
     * @param {string} id - The AW-ID to display and make copyable.
     */
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
                fontSize: "14px",
                fontWeight: "bold",
                fontFamily: "monospace",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                transition: "background-color 0.3s ease",
            });
            document.body.appendChild(idEl);
        }
        // Set the initial text content
        idEl.textContent = `AW-ID: ${id}`;

        // Use the unified function to add click-to-copy
        addClickToCopy({
            element: idEl,
            textToCopy: id,
            title: "Click to copy ID",
            successText: "Copied!",
            timeout: 800,
        });
    }

    // Call the function to display the awID
    displayAwIdElement(awID);
}
