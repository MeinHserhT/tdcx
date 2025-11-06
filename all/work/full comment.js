/**
 * ===================================================================================
 * SCRIPT 1: cases.connect
 * This script runs on 'cases.connect'. It adds UI elements (buttons) to the page
 * for two main purposes:
 * 1. A "Follow-up" button that shows a badge with the count of follow-up items.
 * 2. An "Auto-Clicker" button (ON/OFF) that periodically clicks an on-call button
 * and then a remove button, likely to keep a session active or clear a queue.
 * It also plays a notification sound when a specific dialog appears.
 * ===================================================================================
 */
if (window.location.href.includes("cases.connect")) {
    (function () {
        // Run-once guard: If the script has already run (window.scrRun is set), exit.
        if (window.scrRun) return;
        window.scrRun = 1; // Set the guard to prevent re-running.

        /**
         * Observes the DOM for elements matching a selector, including future elements.
         * When an element is found, the callback is executed.
         * @param {string} selector - The CSS selector to watch for.
         * @param {function(Element)} callback - The function to call with the found element.
         * @returns {MutationObserver} The configured MutationObserver instance.
         */
        function observeElement(selector, callback) {
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType !== 1) continue; // Ensure it's an element
                        // Check if the added node itself matches
                        if (node.matches(selector)) {
                            callback(node);
                        }
                        // Check if any children of the added node match
                        node.querySelectorAll(selector).forEach(callback);
                    }
                }
            });

            // Start observing the entire body for new child nodes
            observer.observe(document.body, { childList: true, subtree: true });

            // Also run the callback for any elements that *already* exist
            document.querySelectorAll(selector).forEach(callback);
            return observer;
        }

        /**
         * Helper function to safely click an element by its selector.
         * Uses optional chaining (?) to prevent errors if the element isn't found.
         * @param {string} selector - The CSS selector of the element to click.
         */
        function clickElement(selector) {
            document.querySelector(selector)?.click();
        }

        /**
         * Performs the two-click sequence to open the follow-up list.
         * 1. Clicks the main 'home' dock item.
         * 2. Waits 500ms, then clicks the follow-up list item in the popup.
         */
        function clickFollowupChain() {
            clickElement('[debug-id="dock-item-home"]');
            setTimeout(() => {
                clickElement(".li-popup_lstcasefl");
            }, 500);
        }

        /**
         * Updates the count on the follow-up badge.
         * It finds the follow-up list item, reads its 'data-attr' (the count),
         * and updates the badge's text content and visibility.
         */
        function updateFollowupCount() {
            const badge = document.getElementById("follow-up-badge");
            const popupItem = document.querySelector(".li-popup_lstcasefl");

            if (popupItem && badge) {
                const count = popupItem.dataset.attr;
                badge.textContent = count;
                badge.style.display = "block"; // Show the badge
            }
        }

        /**
         * Handles the notification for a new dialog.
         * Plays a sound and brings the browser tab into focus.
         */
        async function handleDialogNotification() {
            const soundUrl =
                "https://cdn.pixabay.com/audio/2025/07/18/audio_da35bc65d2.mp3";
            const notificationSound = new Audio(soundUrl);
            try {
                await notificationSound.play();
            } catch (err) {
                console.warn(
                    "Audio playback failed. User may need to interact with the page first.",
                    err
                );
            }
            window.focus(); // Bring the window to the front
        }

        // 1. MODIFIED BASE_BUTTON_STYLE (updated transition)
        /**
         * A constant object holding the shared CSS styles for the script's buttons.
         * Includes transitions for a smooth click effect.
         */
        const BASE_BUTTON_STYLE = {
            zIndex: "1",
            padding: "12px 16px",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            transition:
                "background-color 0.3s ease, transform 0.1s ease, box-shadow 0.1s ease",
        };

        /**
         * Creates the "Follow-up" button and appends it to the container.
         * This button includes an icon and a badge (span) that will hold the count.
         * @param {HTMLElement} container - The parent element to append the button to.
         */
        function createFollowupButton(container) {
            const button = document.createElement("button");
            button.id = "follow-up-btn";
            button.title = "Click Follow-up Item"; // Updated tooltip
            button.style.position = "relative"; // For positioning the badge

            // Apply base styles and button-specific styles
            Object.assign(button.style, BASE_BUTTON_STYLE, {
                padding: "10px 12px",
                backgroundColor: "#A2BFFE",
                fontSize: "16px",
                lineHeight: "0", // To center the icon
            });

            // Set the button's content (icon and badge)
            button.innerHTML = `
                <img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 20px; height: 20px; vertical-align: middle;">
                <span id="follow-up-badge" style="
                    display: none; 
                    position: absolute; 
                    top: -5px; 
                    right: -5px; 
                    background: red; 
                    color: white; 
                    font-size: 10px; 
                    font-weight: bold; 
                    border-radius: 50%; 
                    padding: 2px 5px; 
                    line-height: 1;
                "></span>
            `;

            // Add the click listener
            button.addEventListener("click", clickFollowupChain);
            container.appendChild(button);
        }

        /**
         * An object that encapsulates all logic for the auto-clicker feature.
         * It manages its own state (isOn), interval, and UI button.
         */
        const autoClicker = {
            intervalId: null, // Stores the ID from setInterval
            isOn: false, // Tracks the on/off state
            button: null, // Holds a reference to its DOM button
            CLICK_INTERVAL: 18000, // 18 seconds
            REMOVE_DELAY: 3000, // 3 seconds

            /**
             * Starts the auto-clicking interval.
             * Clicks the on-call button, then clicks the remove button after a delay.
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

                // Update button UI
                if (this.button) {
                    this.button.textContent = "ON";
                    this.button.style.backgroundColor = "#77DD77"; // Green
                }
            },

            /**
             * Stops the auto-clicking interval.
             */
            stop() {
                if (!this.intervalId) return; // Already stopped
                clearInterval(this.intervalId);
                this.intervalId = null;
                this.isOn = false;

                // Update button UI
                if (this.button) {
                    this.button.textContent = "OFF";
                    this.button.style.backgroundColor = "#FF746C"; // Red
                }
            },

            /**
             * Toggles the auto-clicker state (on/off).
             */
            toggle() {
                this.isOn ? this.stop() : this.start();
            },

            /**
             * Creates the ON/OFF toggle button for the auto-clicker.
             * @param {HTMLElement} container - The parent element to append the button to.
             */
            createButton(container) {
                this.button = document.createElement("button");
                this.button.id = "auto-btn";

                // Apply base styles and button-specific styles
                Object.assign(this.button.style, BASE_BUTTON_STYLE, {
                    backgroundColor: "#FF746C", // Default to OFF (Red)
                    fontSize: "14px",
                });

                this.button.textContent = "OFF";
                // Bind the 'toggle' function to 'this' (the autoClicker object)
                this.button.addEventListener("click", this.toggle.bind(this));
                container.appendChild(this.button);
            },
        };

        /**
         * Creates the main floating container in the bottom-left corner
         * that will hold all the script's buttons.
         * @returns {HTMLElement} The created container element.
         */
        function createButtonContainer() {
            const container = document.createElement("div");
            container.id = "script-button-container";
            Object.assign(container.style, {
                position: "fixed",
                bottom: "16px",
                left: "16px",
                zIndex: "999",
                display: "flex",
                gap: "8px",
                alignItems: "center",
            });
            document.body.appendChild(container);
            return container;
        }

        // 2. ADDED injectCasesConnectStyles function
        /**
         * Injects a <style> tag into the document <head> to provide
         * CSS :hover and :active (click) effects for the buttons.
         * These pseudo-classes cannot be set via 'element.style'.
         */
        function injectCasesConnectStyles() {
            const styleId = "cases-connect-styles";
            if (document.getElementById(styleId)) return; // Prevent double-injection

            const css = `
                /* Target all buttons inside your container */
                [id='script-button-container'] button:hover {
                    opacity: 0.9; /* A simple hover effect */
                }
        
                [id='script-button-container'] button:active {
                    transform: scale(0.96); /* The "click" effect */
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2); /* Smaller shadow on click */
                }
            `;

            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = css;
            document.head.appendChild(style);
        }

        // 3. MODIFIED init() function
        /**
         * The entry point for the 'cases.connect' script.
         * It sets up the dialog observer, creates the button UI,
         * injects the CSS, and updates the follow-up count.
         */
        function init() {
            const dialogSelector = "[debug-id=phoneTakeDialog]";
            // Start observing for the phone dialog to play a sound
            observeElement(dialogSelector, handleDialogNotification);

            // Create the UI
            const buttonContainer = createButtonContainer();
            injectCasesConnectStyles(); // <-- ADDED THIS CALL
            autoClicker.createButton(buttonContainer);
            createFollowupButton(buttonContainer);

            // Do an initial check for the follow-up count
            updateFollowupCount();
        }

        // Run the script
        init();
    })();
} else if (window.location.href.includes("casemon2.corp")) {
    /**
     * ===================================================================================
     * SCRIPT 2: casemon2.corp
     * This script runs on 'casemon2.corp'. It creates a floating "Agent Dashboard"
     * UI on the right side of the screen. This dashboard reads data from an existing
     * agent table on the page, processes it, and displays a sorted, summarized,
     * and styled view.
     * * Key Features:
     * - Creates a new UI overlay.
     * - Watches the original agent table for changes using MutationObserver.
     * - Parses the table data.
     * - Processes data (e.g., identifies "Break" status).
     * - Sorts agents: Puts the current user first, then sorts by status priority
     * and time in status.
     * - Displays the sorted list with icons, animations, and status colors.
     * - Includes a "Close" button to hide the dashboard.
     * ===================================================================================
     */
    (function () {
        // Run-once guard
        if (window.dashRun) return;
        window.dashRun = 1;

        // Base URL for flaticon icons
        const LINK = "https://cdn-icons-png.flaticon.com/512";

        /**
         * Manages the entire Agent Dashboard UI and logic.
         */
        class AgentDashboard {
            // Private configuration for the dashboard
            #CONFIG = {
                AGENT_TABLE_SELECTOR: ".agent-table-container", // Original table
                UI_CONTAINER_ID: "agent_ui", // ID for the new UI
                STYLE_ID: "agent-dash-styles", // ID for the injected <style> tag
                PRIOR: {
                    // Sort priority for agent statuses (lower is higher)
                    active: 1,
                    phone: 2,
                    "lunch-break": 3,
                    email: 4,
                    "coffee-break": 5,
                    break: 6,
                    default: 99,
                },
                ICONS: {
                    // Icon URLs and animations for each status
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
                    close: LINK + "/9403/9403346.png", // Close button icon
                },
            };

            // Private instance variables
            #observer = null; // The MutationObserver
            #myLdap = null; // The current user's username
            #uiContainer = null; // The floating UI element
            #agentTable = null; // The original agent table
            #policy = null; // Trusted Types policy for safe HTML injection

            /**
             * Initializes the dashboard.
             */
            constructor() {
                this.#myLdap = this.#getMyLdap();
                this.#agentTable = document.querySelector(
                    this.#CONFIG.AGENT_TABLE_SELECTOR
                );
                // Create a Trusted Types policy to safely set innerHTML
                this.#policy = window.trustedTypes.createPolicy(
                    "agent-dash-policy",
                    {
                        createHTML: (s) => s, // Simple policy (dev-controlled)
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
             * @returns {string | undefined} The user's LDAP string.
             */
            #getMyLdap() {
                return document
                    .querySelector("[alt='profile photo']")
                    ?.src?.match(/\/([^\/]+)\?/)?.[1];
            }

            /**
             * Creates the main floating UI container or finds it if it already exists.
             * Attaches a click listener to the container to handle the close button.
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

                // Event delegation: listen on the container for clicks on the close button
                this.#uiContainer.addEventListener("click", (e) => {
                    if (e.target.closest(".close-btn")) {
                        this.#closeUi();
                    }
                });
            }

            /**
             * Initializes the MutationObserver to watch the original agent table.
             * Any change to the table will trigger a re-render of the dashboard.
             */
            #initObserver() {
                // Bind 'this' to #render so it has the correct context
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
             * Closes and cleans up the dashboard UI.
             * Hides the UI, disconnects the observer, and resets the run-guard.
             */
            #closeUi() {
                if (this.#uiContainer) this.#uiContainer.style.display = "none";
                if (this.#observer) this.#observer.disconnect();
                window.dashRun = 0; // Allow the script to be re-run
            }

            /**
             * Shows the dashboard UI.
             */
            #showUi() {
                if (this.#uiContainer) this.#uiContainer.style.display = "flex";
            }

            /**
             * Parses the original agent table DOM and extracts data for each agent.
             * @returns {Array<Object>} An array of agent data objects.
             */
            #parseAgentTable() {
                const rows = this.#agentTable.querySelectorAll("tbody tr");

                return Array.from(rows, (row) => {
                    const cells = row.querySelectorAll("td");
                    if (cells.length < 9) return null; // Invalid row

                    // Extract phone capacity (e.g., "Busy")
                    const phoneCap = (
                        cells[5].innerText.match(/([a-zA-Z\s]+)/g)?.[0] ?? ""
                    )
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "-");

                    return {
                        imgSrc: row.querySelector("img").src,
                        agentLdap: cells[1].innerText,
                        auxCode: cells[3].innerText, // e.g., "Active"
                        timeSpent: cells[4].innerText, // e.g., "(0m 5s)"
                        phoneCapacity: phoneCap, // e.g., "busy"
                        lastChange: cells[8].innerText.trim(), // e.g., "0m 5s"
                        lastChangeInSec: this.#strToSec(cells[8].innerText), // e.g., 5
                    };
                }).filter(Boolean); // Filter out any null (invalid) rows
            }

            /**
             * Processes raw agent data to determine the "real" status.
             * e.g., "Active" + "busy" phone = "Break" status.
             * @param {Object} agent - A raw agent data object from #parseAgentTable.
             * @returns {Object} The processed agent data object with new properties.
             */
            #processAgentData(agent) {
                let processedAuxCode = agent.auxCode;
                let statusKey;

                // Special case: "Active" aux code but "busy" phone capacity means "Break".
                if (
                    agent.auxCode === "Active" &&
                    agent.phoneCapacity === "busy"
                ) {
                    processedAuxCode = "Break";
                    statusKey = "break";
                } else {
                    // Standard case: "lunch-break", "coffee-break", etc.
                    statusKey = agent.auxCode
                        .toLowerCase()
                        .replace(/\s+/g, "-");
                }

                return {
                    ...agent,
                    processedAuxCode, // The "display" name for the status
                    statusKey, // The internal key for styling/icons
                    cssClass: `stt-${statusKey}`, // CSS class for styling
                };
            }

            /**
             * Sorts the list of processed agents.
             * Sort logic:
             * 1. The current user ("myLdap") always comes first.
             * 2. All other agents are sorted by status priority (from #CONFIG.PRIOR).
             * 3. Agents with the same status are sorted by time (longest time first).
             * @param {Array<Object>} agents - An array of processed agent objects.
             * @returns {Array<Object>} The sorted array.
             */
            #sortAgents(agents) {
                const { PRIOR } = this.#CONFIG;

                return agents.sort((a, b) => {
                    const aPriority = PRIOR[a.statusKey] ?? PRIOR.default;
                    const bPriority = PRIOR[b.statusKey] ?? PRIOR.default;

                    return (
                        // (true - false) = 1, (false - true) = -1, (true - true) = 0
                        // This pushes the user to the top.
                        (b.agentLdap === this.#myLdap) -
                            (a.agentLdap === this.#myLdap) ||
                        // Sort by status priority
                        aPriority - bPriority ||
                        // Sort by time in status (descending)
                        b.lastChangeInSec - a.lastChangeInSec
                    );
                });
            }

            /**
             * The main render function. Called by the observer and constructor.
             * It orchestrates the parsing, processing, sorting, and HTML generation.
             */
            #render() {
                const rawAgents = this.#parseAgentTable();
                const processedAgents = rawAgents.map(
                    this.#processAgentData.bind(this)
                );
                const sortedAgents = this.#sortAgents(processedAgents);

                const rowsHtml = sortedAgents
                    .map(this.#createAgentRowHtml) // Call for each agent
                    .join("");
                const closeButtonHtml = this.#createCloseButtonHtml();

                const finalHtml = `
                  <div class="ui-content-wrapper">
                    ${closeButtonHtml}
                    <div class="ui-table">${rowsHtml}</div>
                  </div>`;

                // Use the Trusted Types policy to set the HTML
                this.#uiContainer.innerHTML =
                    this.#policy.createHTML(finalHtml);
                this.#showUi(); // Ensure the UI is visible
            }

            /**
             * Creates the HTML string for a single agent row in the dashboard.
             * @param {Object} agent - A processed agent object.
             * @returns {string} The HTML string for that agent's row.
             */
            #createAgentRowHtml = (agent) => {
                const [displayTime, stateTime] = [
                    agent.lastChange, // "1m 5s"
                    agent.timeSpent, // "(1m 5s)"
                ];
                const icon = this.#getIconHtml(agent.statusKey);
                const altText = `Avatar for ${agent.agentLdap}`;

                // Uses CSS Grid 'display: contents' on the .tr
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
             * Helper to get the icon HTML for a given status.
             * @param {string} statusKey - The agent's internal status key.
             * @returns {string} An <img> HTML string, or an empty string if no icon.
             */
            #getIconHtml(statusKey) {
                const icon = this.#CONFIG.ICONS[statusKey];
                return icon
                    ? `<img src="${icon.src}" animation="${icon.animation}" alt="${statusKey} icon"/>`
                    : "";
            }

            /**
             * Creates the HTML string for the close button.
             * @returns {string} The <button> HTML string.
             */
            #createCloseButtonHtml() {
                return `<button class="close-btn" title="Close">
                        <img src="${this.#CONFIG.ICONS.close}" alt="Close"/>
                      </button>`;
            }

            /**
             * Utility function to convert a time string (e.g., "1h 5m 10s")
             * into a total number of seconds for sorting.
             * @param {string} timeStr - The time string.
             * @returns {number} The total seconds.
             */
            #strToSec(timeStr) {
                const parts = timeStr.match(/(\d+)(h|m|s)/g) ?? [];
                const factors = {
                    h: 3600,
                    m: 60,
                    s: 1,
                };

                return parts.reduce((totalSeconds, part) => {
                    const value = parseInt(part, 10);
                    const unit = part.slice(-1); // 'h', 'm', or 's'
                    return totalSeconds + value * (factors[unit] ?? 0);
                }, 0);
            }

            /**
             * Injects the CSS for the dashboard UI into the document <head>.
             * This includes all styles for the container, rows, colors, and animations.
             */
            #injectStyles() {
                const css = `
                /* ... (A large block of CSS for styling the dashboard) ... */
                #${this.#CONFIG.UI_CONTAINER_ID} { 
                  position: fixed; height: 100%; width: 100%; top: 0; right: 0; 
                  background-color: rgba(0,0,0,0.1); z-index: 999; 
                  display: flex; justify-content: flex-end; align-items: center; 
                  padding: 20px;
                  font-family: 'Noto Serif', serif; pointer-events: none; 
                  box-sizing: border-box;
                }
                .ui-content-wrapper { 
                  position: relative; 
                  pointer-events: auto; 
                  width: 100%;
                  max-width: 400px;
                }
                .close-btn { 
                  position: absolute; top: 0; right: 0;
                  transform: translate(40%, -40%); border: none; cursor: pointer;
                  z-index: 10; background: rgba(0, 0, 0, 0); transition: transform 0.2s ease; 
                }
                .close-btn:hover { transform: translate(40%, -40%) scale(1.4); }
                .ui-table { 
                  display: grid; grid-template-columns: repeat(2, 1fr); 
                  width: 100%;
                  border-radius: 12px; 
                  overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); 
                }
                .ui-table .tr { display: contents; }
                .ui-table .td { 
                  padding: 8px 12px; display: flex; align-items: center; 
                  transition: background-color 0.4s ease, transform 0.2s ease; 
                }
                .ui-table .left { 
                  justify-content: flex-start; 
                  font-weight: 500; 
                  font-size: clamp(12px, 4vw, 16px); 
                }
                .ui-table .right { 
                  justify-content: flex-end; 
                  text-align: right; 
                  font-size: clamp(10px, 3.5vw, 14px); 
                }
                .ui-table .td { background-color: #F8F9FA; color: #495057; }
                /* Status-specific colors */
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
                
                /* Animations */
                [animation="pulse"] { animation: pulse 2s infinite ease-in-out; }
                @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
                [animation="wiggle"] { animation: wiggle 0.9s infinite; }
                @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 15%, 45%, 75% { transform: rotate(8deg); } 30%, 60% { transform: rotate(-8deg); } }
                [animation="slide"] { animation: slide-lr 1.2s infinite alternate ease-in-out; }
                @keyframes slide-lr { from { transform: translateX(0); } to { transform: translateX(8px); } }
                
                /* Responsive media queries */
                @media (max-width: 350px) {
                    .ui-table .right img[alt*="icon"] {
                        display: none;
                    }
                }
                @media (max-width: 280px) {
                    .ui-table .left img[alt*="Avatar"] {
                        display: none;
                    }
                }
                @media (max-width: 240px) {
                    .ui-table .right span {
                        display: none;
                    }
                }
              `;

                const styleEl =
                    document.getElementById(this.#CONFIG.STYLE_ID) ||
                    document.createElement("style");
                styleEl.id = this.#CONFIG.STYLE_ID;
                styleEl.innerHTML = this.#policy.createHTML(css); // Use policy
                document.head.appendChild(styleEl);
            }
        }

        // Start the dashboard script
        new AgentDashboard();
    })();
} else if (window.location.href.includes("adwords.corp")) {
    /**
     * ===================================================================================
     * SCRIPT 3: adwords.corp
     * This script runs on 'adwords.corp'. It's a helper for viewing conversion data.
     * * Key Features:
     * - Polls for a global 'conversions_data' object to become available.
     * - Extracts the AdWords ID (AW-ID) and displays it in a floating UI element
     * in the bottom-left corner. This UI is clickable to copy the ID.
     * - Parses a large JSON object containing all conversion data.
     * - Iterates over the conversion table visible on the page.
     * - For each conversion, it finds the matching data (e.g., GA4 vs. Ads) and
     * replaces the conversion name with its more useful "label".
     * - It styles the cell (yellow for GA4, green for Ads) and makes it
     * clickable to copy the label.
     * - It automatically expands all conversion categories and hides any
     * categories that are empty after filtering.
     * ===================================================================================
     */
    (function () {
        /**
         * A reusable utility to make a DOM element copy text to the clipboard on click.
         * Shows temporary feedback (e.g., "Copied!") on the element itself.
         * @param {Object} options - Configuration object.
         * @param {HTMLElement} options.element - The element to make clickable.
         * @param {string} options.textToCopy - The text to copy.
         * @param {string} [options.title] - Tooltip text.
         * @param {string} [options.successText] - Text to show on success (e.g., "Copied!").
         * @param {string} [options.successBg] - Background color on success.
         * @param {string} [options.successColor] - Text color on success.
         * @param {number} [options.timeout] - How long to show the success state (ms).
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

            // Run-once guard for this element
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

                    // Apply success state
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
         * Extracts the conversion type (Ads/GA4) and its label from the
         * complex, index-based conversion data object.
         * @param {Array} conversionData - The data array for a single conversion.
         * @returns {Object} An object with { type_cv, label_event }.
         */
        function extractConversionDetails(conversionData) {
            var type = null,
                label = null;

            // '1' seems to be 'Ads Conversion'
            if (1 == conversionData[11]) {
                type = "Ads Conversion: ";
                label = conversionData[64]?.[2]?.[4]
                    ?.split("'")?.[7]
                    ?.split("/")?.[1];
            }

            // '32' seems to be 'GA4'
            if (32 == conversionData[11]) {
                type = "GA4: ";
                label = conversionData[64]?.[1]?.[4]?.split("'")?.[3];
            }
            return {
                type_cv: type,
                label_event: label,
            };
        }

        /**
         * Creates (or finds) and updates the floating UI element that
         * displays the AW-ID in the bottom-left corner.
         * @param {string} id - The AdWords ID (AW-ID) to display.
         */
        function displayAwIdElement(id) {
            let idEl = document.getElementById("gpt-aw-id-display");
            if (!idEl) {
                // Create the element if it doesn't exist
                idEl = document.createElement("div");
                idEl.id = "gpt-aw-id-display";
                Object.assign(idEl.style, {
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
                });
                document.body.appendChild(idEl);
            }

            // Update text
            idEl.textContent = `AW-ID: ${id}`;

            // Make it clickable to copy the ID
            addClickToCopy({
                element: idEl,
                textToCopy: id,
                title: "Click to copy ID",
                successText: "Copied!",
                timeout: 800,
            });
        }

        // Style objects for GA4 (yellow) and Ads (green) conversions
        const ga4Style = {
            backgroundColor: "rgb(255, 229, 180)", // Yellowish
            borderRadius: "10px",
            fontWeight: "500",
        };
        const adsStyle = {
            backgroundColor: "rgb(160, 251, 157)", // Greenish
            borderRadius: "10px",
            fontWeight: "500",
        };

        /**
         * The main function for the 'adwords.corp' script.
         * Runs after the 'conversions_data' is confirmed to exist.
         */
        function runAdwordsScript() {
            // Extract AW-ID from the data object
            const awID =
                conversions_data.SHARED_ALL_ENABLED_CONVERSIONS.match(
                    /AW-(\d*)/
                )[1];

            // Click all "expand" buttons to show all conversions
            document.querySelectorAll(".expand-more").forEach((button) => {
                button.click();
            });

            // Parse the main conversion data JSON
            const allConversionData = JSON.parse(
                conversions_data.SHARED_ALL_ENABLED_CONVERSIONS
            )[1];

            // Wait 1 second for tables to expand
            setTimeout(() => {
                // Loop over every conversion name cell in the table
                document
                    .querySelectorAll(".conversion-name-cell .internal")
                    .forEach((cellElement) => {
                        let conversionName = cellElement.innerText;
                        var conversionType = "",
                            conversionLabel = "no label",
                            matchedData = null;

                        // Find the parent row
                        var tableRow = cellElement.closest(
                            ".particle-table-row"
                        );
                        if (tableRow) {
                            // Filter out non-web conversions
                            let sourceElement = tableRow.querySelector(
                                '[essfield="aggregated_conversion_source"]'
                            );
                            if (!sourceElement?.innerText.match(/.*web.*/gi)) {
                                tableRow.remove(); // Remove non-web rows
                            }
                        }

                        // Find the matching data for this conversion
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

                        // If we found a match, update the cell
                        if (conversionType) {
                            cellElement.innerHTML = `${conversionLabel}`;
                            const styleToApply =
                                "GA4: " == conversionType ? ga4Style : adsStyle;
                            Object.assign(cellElement.style, styleToApply);
                        }

                        // Make the cell clickable to copy the label
                        if (conversionType && conversionLabel) {
                            addClickToCopy({
                                element: cellElement,
                                textToCopy: conversionLabel,
                                title: "Click to copy label",
                                timeout: 500,
                            });
                        }
                    });

                // Clean up: Hide any category cards that are now empty
                document
                    .querySelectorAll(
                        "category-conversions-container-view, conversion-goal-card"
                    )
                    .forEach((container) => {
                        if (
                            !container.querySelectorAll(".particle-table-row")
                                .length
                        ) {
                            container.style.display = "none";
                        }
                    });
            }, 1000);

            // Finally, display the AW-ID
            displayAwIdElement(awID);
        }

        let attempts = 0;
        const maxAttempts = 3;

        /**
         * Polls for the global 'conversions_data' object.
         * This script relies on data loaded asynchronously by the page,
         * so it waits until that data is available before running.
         */
        function pollForData() {
            if (
                typeof conversions_data !== "undefined" &&
                conversions_data.SHARED_ALL_ENABLED_CONVERSIONS
            ) {
                // Data is ready, run the script
                runAdwordsScript();
            } else if (attempts < maxAttempts) {
                // Data not ready, try again shortly
                attempts++;
                setTimeout(pollForData, 500);
            } else {
                // Gave up after max attempts
                console.warn(
                    "Adwords script: Could not find `conversions_data` object. Aborting."
                );
            }
        }

        // Start the poller
        if (
            document.readyState === "complete" ||
            document.readyState === "interactive"
        ) {
            pollForData();
        } else {
            window.addEventListener("DOMContentLoaded", pollForData);
        }
    })();
}
