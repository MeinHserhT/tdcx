// This script checks the URL of the current page.
// If it includes "cases.connect", it runs the first block of code.

if (window.location.href.includes("cases.connect")) {
    (function () {
        "use strict"; // Enforces stricter parsing and error handling in JavaScript.

        // --- SCRIPT GUARD ---
        // This is a guard to ensure the script only runs once per page load.
        // If 'window.scrRun' is already set, it stops further execution.
        if (window.scrRun) return;
        window.scrRun = 1; // Mark the script as having run.

        // --- CONFIGURATION ---
        // Stores all magic strings (like selectors) and numbers in one place for easy updates.
        const CONFIG = {
            SOUND_URL:
                "https://cdn.pixabay.com/audio/2025/07/18/audio_da35bc65d2.mp3",
            AUTO_CLICK_INTERVAL: 18000, // 18 seconds
            AUTO_REMOVE_DELAY: 6000, // 6 seconds
            SELECTORS: {
                AUTO_CLICK_BTN: "#cdtx__uioncall--btn",
                AUTO_REMOVE_BTN: ".cdtx__uioncall_control-remove",
                HOME_BUTTON: '[debug-id="dock-item-home"]',
                FOLLOWUP_ITEM: ".li-popup_lstcasefl",
                FOLLOWUP_BADGE: "#follow-up-badge",
                APPOINTMENT_TIME_BTN: '[data-infocase="appointment_time"]',
                FOLLOWUP_TIME_BTN: '[data-infocase="follow_up_time"]',
                DATEPICKER_TODAY: ".datepicker-grid .today",
                FOLLOWUP_INPUT: "#follow-up-days-input",
                PHONE_DIALOG: "[debug-id=phoneTakeDialog]",
                SET_FOLLOWUP_BTN: "[data-type=follow_up_time]",
                FINISH_BTN: '[data-thischoice="Finish"]',
                UI_PANEL: "#script-btn-panel",
            },
        };

        // --- STYLES ---
        // A reusable style object for the custom buttons.
        const BTN_STYLE = {
            zIndex: "10",
            padding: "12px 16px",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            transition:
                "background-color 0.3s ease, transform 0.1s ease, box-shadow 0.1s ease",
            fontSize: "14px",
        };

        // --- UTILITY: watchNode ---
        /**
         * Watches for new nodes being added to the DOM and calls a callback
         * when a node matching the selector is found.
         * @param {string} selector - The CSS selector to watch for.
         * @param {function(Node)} cb - The callback function to execute with the found node.
         */
        function watchNode(selector, cb) {
            // MutationObserver is a modern API to watch for DOM changes.
            const observer = new MutationObserver((mutations) => {
                for (const m of mutations) { // Loop through all mutations
                    for (const n of m.addedNodes) { // Loop through all nodes that were added
                        if (n.nodeType !== 1) continue; // Ignore non-element nodes
                        if (n.matches(selector)) {
                            cb(n); // Call callback if the node itself matches
                        } else {
                            // Or check if any children of the node match
                            n.querySelectorAll(selector).forEach(cb);
                        }
                    }
                }
            });
            // Start observing the entire body for child additions.
            observer.observe(document.body, { childList: true, subtree: true });
            return observer;
        }

        // --- UTILITY: waitOn ---
        /**
         * Waits for an element to exist and be visible in the DOM.
         * Returns a Promise that resolves with the element.
         * @param {string} selector - The CSS selector to wait for.
         * @param {object} [options] - Optional settings { interval, timeout }.
         */
        function waitOn(selector, { interval = 500, timeout = 3000 } = {}) {
            return new Promise((resolve, reject) => {
                const start = Date.now();
                const timer = setInterval(() => {
                    const el = document.querySelector(selector);
                    // Check if element exists AND is visible (offsetParent is not null)
                    if (el && el.offsetParent !== null) {
                        clearInterval(timer);
                        resolve(el);
                        return;
                    }
                    // Reject if the timeout is exceeded
                    if (Date.now() - start > timeout) {
                        clearInterval(timer);
                        reject(new Error(`Timeout for ${selector}`));
                    }
                }, interval);
            });
        }

        // --- UTILITY: clickWait ---
        /**
         * A helper function that combines 'waitOn' with a 'click'.
         * Can also click a sibling element 'steps' away.
         * @param {string} selector - The CSS selector to wait for and click.
         * @param {number} [steps=0] - Number of siblings to step over before clicking.
         * @param {object} [opts={}] - Options to pass to 'waitOn'.
         */
        async function clickWait(selector, steps = 0, opts = {}) {
            // Wait for the element to appear
            const el = await waitOn(selector, opts);
            let target = el;
            // If 'steps' is provided, navigate to the nth sibling
            if (steps > 0) {
                for (let i = 0; i < steps; i++) {
                    if (target) {
                        target = target.nextElementSibling;
                    } else {
                        throw new Error(`No sibling at ${i} for ${selector}`);
                    }
                }
            }
            // Click the target element
            if (target) {
                target.click();
                return target;
            } else {
                throw new Error(`No target for ${selector}`);
            }
        }

        // --- UTILITY: click ---
        /**
         * A simple, safe click utility that won't error if the element doesn't exist.
         * @param {string} selector - The CSS selector to click.
         */
        function click(selector) {
            document.querySelector(selector)?.click(); // Uses optional chaining
        }

        // --- FEATURE: Auto Click ---
        // An object to manage the state of the auto-clicker.
        const autoClick = {
            id: null, // Stores the setInterval ID
            on: false, // State
            btn: null, // Reference to the DOM button
            start() {
                if (this.id) return; // Already running
                this.on = true;
                this.id = setInterval(() => {
                    // Click the main button
                    click(CONFIG.SELECTORS.AUTO_CLICK_BTN);
                    // After a delay, click the remove button
                    setTimeout(
                        () => click(CONFIG.SELECTORS.AUTO_REMOVE_BTN),
                        CONFIG.AUTO_REMOVE_DELAY
                    );
                }, CONFIG.AUTO_CLICK_INTERVAL);
                this.updateBtn(); // Update button text/color
            },
            stop() {
                if (!this.id) return; // Already stopped
                clearInterval(this.id);
                this.id = null;
                this.on = false;
                this.updateBtn(); // Update button text/color
            },
            toggle() {
                this.on ? this.stop() : this.start();
            },
            updateBtn() {
                if (!this.btn) return;
                this.btn.textContent = this.on ? "ON" : "OFF";
                this.btn.style.backgroundColor = this.on
                    ? "#77DD77" // Green
                    : "#FF746C"; // Red
            },
            createBtn(parent) {
                this.btn = document.createElement("button");
                this.btn.id = "auto-btn";
                Object.assign(this.btn.style, BTN_STYLE); // Apply common styles
                this.btn.addEventListener("click", () => this.toggle());
                parent.appendChild(this.btn);
                this.updateBtn(); // Set initial state
            },
        };

        // --- FEATURE: Follow-Up Button ---
        /**
         * Event handler for the custom Follow-Up button.
         * Clicks home, then clicks the follow-up item.
         */
        async function onFLClick() {
            try {
                click(CONFIG.SELECTORS.HOME_BUTTON);
                await clickWait(CONFIG.SELECTORS.FOLLOWUP_ITEM, 0);
            } catch (e) {
                console.error(e);
            }
        }

        /**
         * Updates the custom follow-up badge count.
         * Reads the count from a 'data-attr' on the original element.
         */
        function updateFLBadge() {
            const badge = document.getElementById(
                CONFIG.SELECTORS.FOLLOWUP_BADGE.substring(1)
            );
            const item = document.querySelector(CONFIG.SELECTORS.FOLLOWUP_ITEM);
            if (item && badge) {
                const count = item.dataset.attr; // Get count from data attribute
                badge.textContent = count;
                badge.style.display = count ? "block" : "none"; // Show/hide badge
            }
        }

        /**
         * Creates and appends the Follow-Up button to the panel.
         * @param {Node} parent - The panel element to attach to.
         */
        function addFLBtn(parent) {
            const btn = document.createElement("button");
            btn.id = "follow-up-btn";
            btn.title = "Click Follow-up Item";
            btn.style.position = "relative"; // For positioning the badge
            Object.assign(btn.style, BTN_STYLE, {
                padding: "10px 12px",
                backgroundColor: "#A2BFFE",
                lineHeight: "0",
            });
            // Set inner HTML for the icon and the badge
            btn.innerHTML = `
            <img src="https://cdn-icons-png.flaticon.com/512/1069/1069138.png" style="width: 20px; height: 20px; vertical-align: middle;">
            <span id="${CONFIG.SELECTORS.FOLLOWUP_BADGE.substring(1)}" style="
                display: none; position: absolute; top: -5px; right: -5px;
                background: red; color: white; font-size: 10px; font-weight: bold;
                border-radius: 50%; padding: 2px 5px; line-height: 1;
            "></span>
        `;
            btn.addEventListener("click", onFLClick);
            parent.appendChild(btn);

            // Wait for the original follow-up item to exist
            waitOn(CONFIG.SELECTORS.FOLLOWUP_ITEM)
                .then((el) => {
                    // Once it exists, observe it for changes to its 'data-attr'
                    const observer = new MutationObserver(updateFLBadge);
                    observer.observe(el, {
                        attributes: true,
                        attributeFilter: ["data-attr"],
                    });
                    updateFLBadge(); // Run once to get initial count
                })
                .catch((e) => console.error(e));
        }

        // --- FEATURE: Appointment Button ---
        /**
         * Event handler for the "FL Up" button.
         * Automates setting an appointment and a follow-up.
         */
        async function onApptClick() {
            try {
                const apptBtn = document.querySelector(
                    CONFIG.SELECTORS.APPOINTMENT_TIME_BTN
                );

                // 1. If appointment time is not set, set it to "Today".
                if (apptBtn && !apptBtn.dataset.valchoice) {
                    click(CONFIG.SELECTORS.APPOINTMENT_TIME_BTN);
                    await clickWait(CONFIG.SELECTORS.DATEPICKER_TODAY, 0);
                }

                // 2. Get follow-up days from our custom input
                const input = document.getElementById(
                    CONFIG.SELECTORS.FOLLOWUP_INPUT.substring(1)
                );
                let steps = +input.value; // Convert to number

                // 3. Open the follow-up time dialog
                click(CONFIG.SELECTORS.FOLLOWUP_TIME_BTN);

                // 4. Click the correct date:
                //    - If steps=0, click "Finish"
                //    - If steps>0, find "Today" and click 'steps' siblings away
                await clickWait(
                    !steps
                        ? CONFIG.SELECTORS.FINISH_BTN
                        : CONFIG.SELECTORS.DATEPICKER_TODAY,
                    steps
                );

                // 5. Click the final "Set Follow-up" button
                await clickWait(CONFIG.SELECTORS.SET_FOLLOWUP_BTN, 0);
            } catch (e) {
                console.error(e);
            }
        }

        /**
         * Creates and appends the Appointment button group to the panel.
         * @param {Node} parent - The panel element to attach to.
         */
        function addApptBtn(parent) {
            const div = document.createElement("div");
            div.id = "today-btn-group";
            const span = document.createElement("span");
            span.id = "today-btn-label";
            span.textContent = "FL Up:";
            span.title = "Set appointment to Today + Follow-up";
            span.addEventListener("click", onApptClick);

            const input = document.createElement("input");
            input.id = CONFIG.SELECTORS.FOLLOWUP_INPUT.substring(1);
            input.type = "text";
            input.value = "2"; // Default to 2 days
            input.title = "Days to follow-up";

            // Only allow a single digit
            input.addEventListener("input", (e) => {
                e.target.value = e.target.value
                    .replace(/\D/g, "") // Remove non-digits
                    .substring(0, 1); // Max 1 char
            });

            // Select text on focus for easy changing
            input.addEventListener("focus", (e) => e.target.select());

            div.appendChild(span);
            div.appendChild(input);
            parent.appendChild(div);
        }

        // --- FEATURE: Dialog Notification ---
        /**
         * Callback function when the phone dialog appears.
         * Plays a sound and focuses the window.
         */
        async function onDialog() {
            const sound = new Audio(CONFIG.SOUND_URL);
            try {
                await sound.play();
                window.focus(); // Bring tab to front
            } catch (err) {
                // User may need to interact with the page first
                console.error("Audio play failed. User interaction needed.", err);
            }
        }

        // --- SETUP ---
        /**
         * Creates the main floating panel to hold the buttons.
         * @returns {Node} The created panel element.
         */
        function addPanel() {
            const div = document.createElement("div");
            div.id = CONFIG.SELECTORS.UI_PANEL.substring(1);
            Object.assign(div.style, {
                position: "fixed",
                bottom: "16px",
                left: "16px",
                display: "flex",
                gap: "8px",
                alignItems: "center",
                zIndex: "9999",
            });
            document.body.appendChild(div);
            return div;
        }

        /**
         * Injects all custom CSS rules into the document <head>.
         */
        function addCSS() {
            const id = "cases-connect-enhanced-styles";
            if (document.getElementById(id)) return; // Don't add styles twice
            const rules = `
            #${CONFIG.SELECTORS.UI_PANEL.substring(1)} button:hover { 
                opacity: 0.9; transform: translateY(-1px); 
            }
            #${CONFIG.SELECTORS.UI_PANEL.substring(1)} button:active { 
                transform: scale(0.96); box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
            }
            #today-btn-group { 
                position: relative; display: inline-block; 
            }
            #today-btn-label {
                display: inline-block; padding: 12px 48px 12px 16px; 
                color: white; background-color: #55B4B0; border-radius: 4px;
                font-weight: bold; font-size: 14px; cursor: pointer;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                transition: background-color 0.3s ease; user-select: none;
            }
            #today-btn-label:hover { background-color: #4a9d9a; }
            #${CONFIG.SELECTORS.FOLLOWUP_INPUT.substring(1)} {
                position: absolute; top: 50%; transform: translateY(-50%);
                right: 8px; width: 32px; height: 28px;
                padding: 0; border: none; border-radius: 3px; 
                background: rgba(255, 255, 255, 0.9); color: #333;
                font-weight: bold; font-size: 14px; text-align: center;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); 
                transition: box-shadow 0.2s ease; -moz-appearance: textfield;
            }
            #${CONFIG.SELECTORS.FOLLOWUP_INPUT.substring(
                1
            )}::-webkit-outer-spin-button,
            #${CONFIG.SELECTORS.FOLLOWUP_INPUT.substring(
                1
            )}::-webkit-inner-spin-button {
                -webkit-appearance: none; margin: 0;
            }
            #${CONFIG.SELECTORS.FOLLOWUP_INPUT.substring(1)}:focus {
                outline: none;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px rgba(255, 255, 255, 0.7);
            }
        `;
            const el = document.createElement("style");
            el.id = id;
            el.textContent = rules;
            document.head.appendChild(el);
        }

        /**
         * Main initialization function.
         */
        function init() {
            // Start watching for the phone dialog
            watchNode(CONFIG.SELECTORS.PHONE_DIALOG, onDialog);
            // Add custom styles
            addCSS();
            // Create the UI panel
            const panel = addPanel();
            // Add all the feature buttons to the panel
            autoClick.createBtn(panel);
            addFLBtn(panel);
            addApptBtn(panel);
        }

        // Run the script
        init();
    })();
}
// If the URL includes "casemon2.corp", run this script instead.
else if (window.location.href.includes("casemon2.corp")) {
    (function () {
        // --- SCRIPT GUARD ---
        if (window.dashRun) return;
        window.dashRun = 1;

        // --- Main Dashboard Class ---
        class AgentDash {
            // --- Private Class Fields ---
            // Configuration for selectors, IDs, and priorities.
            #cfg = {
                tblSel: ".agent-table-container", // The original table
                uiId: "agent_ui", // ID for our new UI
                styleId: "agent-dash-styles",
                link: "https://cdn-icons-png.flaticon.com/512", // Base URL for icons
                // Priority map: lower number = higher priority
                prior: {
                    active: 1,
                    phone: 2,
                    "lunch-break": 3,
                    email: 4,
                    "coffee-break": 5,
                    break: 6,
                    default: 99,
                },
                // Icon definitions
                icons: {
                    "coffee-break": {
                        src: "/2935/2935413.png",
                        animation: "wiggle",
                    },
                    "lunch-break": {
                        src: "/4252/4252424.png",
                        animation: "pulse",
                    },
                    phone: {
                        src: "/1959/1959283.png",
                        animation: "wiggle",
                    },
                    email: {
                        src: "/15781/15781499.png",
                        animation: "slide",
                    },
                    break: {
                        src: "/2115/2115487.png",
                        animation: "wiggle",
                    },
                    close: "/9403/9403346.png", // Close button icon
                },
            };

            #obs = null; // To store the MutationObserver
            #ldap = null; // To store the current user's LDAP
            #ui = null; // To store the new UI element
            #tbl = null; // To store the original table element
            #policy = null; // To store the TrustedTypes policy

            constructor() {
                // Get current user's LDAP from profile photo
                this.#ldap = this.#getLdap();
                // Find the original table
                this.#tbl = document.querySelector(this.#cfg.tblSel);
                if (!this.#tbl) return; // Stop if table not found

                // Create a TrustedTypes policy for safely inserting HTML
                this.#policy = window.trustedTypes.createPolicy(
                    "agent-dash-policy",
                    { createHTML: (s) => s }
                );

                // Build full icon URLs
                Object.keys(this.#cfg.icons).forEach((k) => {
                    const icon = this.#cfg.icons[k];
                    if (typeof icon === "string") {
                        this.#cfg.icons[k] = this.#cfg.link + icon;
                    } else {
                        icon.src = this.#cfg.link + icon.src;
                    }
                });

                // Initialize the script
                this.#styles(); // Add CSS
                this.#initUi(); // Create UI container
                this.#initObs(); // Start observing the original table
            }

            // --- Private Methods ---

            /**
             * Gets the user's LDAP (username) by parsing the profile photo URL.
             * @returns {string|undefined} The user's LDAP.
             */
            #getLdap() {
                return document
                    .querySelector("[alt='profile photo']")
                    ?.src?.match(/\/([^\/]+)\?/)?.[1]; // Regex to find LDAP in URL
            }

            /**
             * Creates the main UI container element.
             */
            #initUi() {
                let ui = document.getElementById(this.#cfg.uiId);
                if (!ui) {
                    ui = document.createElement("div");
                    ui.id = this.#cfg.uiId;
                    document.body.appendChild(ui);
                }
                this.#ui = ui;

                // Add a single click listener to the container for the close button (event delegation)
                this.#ui.addEventListener("click", (e) => {
                    if (e.target.closest(".close-btn")) {
                        this.#close();
                    }
                });
            }

            /**
             * Initializes the MutationObserver to watch the original table for changes.
             */
            #initObs() {
                // Call this.#render whenever the table changes
                this.#obs = new MutationObserver(this.#render.bind(this));
                this.#obs.observe(this.#tbl, {
                    attributes: true, // Watch for attribute changes (e.g., style)
                    childList: true, // Watch for nodes being added/removed
                    subtree: true, // Watch all descendants
                    characterData: true, // Watch for text changes
                });
                this.#render(); // Run one initial render
            }

            /**
             * Stops the script and hides the UI.
             */
            #close() {
                if (this.#ui) this.#ui.style.display = "none";
                if (this.#obs) this.#obs.disconnect(); // Stop observing
                window.dashRun = 0; // Allow script to run again if re-injected
            }

            /**
             * Shows the UI.
             */
            #show() {
                if (this.#ui) this.#ui.style.display = "flex";
            }

            /**
             * Scrapes the data from the original HTML table into an array of objects.
             * @returns {Array<object>} An array of agent data objects.
             */
            #parse() {
                const rows = this.#tbl.querySelectorAll("tbody tr");

                return Array.from(rows, (row) => {
                    const cells = row.querySelectorAll("td");
                    if (cells.length < 9) return null; // Skip invalid rows

                    // Extract and clean the "phoneCap" text
                    const phoneCap = (
                        cells[5].innerText.match(/[a-zA-Z\s]+/)?.[0] ?? ""
                    )
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "-");

                    // Return a clean object
                    return {
                        img: row.querySelector("img").src,
                        ldap: cells[1].innerText,
                        aux: cells[3].innerText,
                        time: cells[4].innerText,
                        phoneCap: phoneCap,
                        lastChg: cells[8].innerText.trim(),
                        lastSec: this.#toSec(cells[8].innerText), // Convert time to seconds for sorting
                    };
                }).filter(Boolean); // Filter out any null (invalid) rows
            }

            /**
             * Processes a single agent object, adding standardized status keys and business logic.
             * @param {object} agent - The raw agent object from #parse().
             * @returns {object} The processed agent object.
             */
            #proc(agent) {
                let statusKey = agent.aux.toLowerCase().replace(/\s+/g, "-");
                let aux = agent.aux;

                // --- Business Logic ---
                // If agent is "Active" but phone is "busy", treat them as "Break"
                if (agent.aux === "Active" && agent.phoneCap === "busy") {
                    aux = "Break";
                    statusKey = "break";
                }

                return {
                    ...agent,
                    aux,
                    statusKey,
                    css: `stt-${statusKey}`, // CSS class for styling
                };
            }

            /**
             * Sorts the array of processed agents based on priority.
             * @param {Array<object>} agents - The array of processed agents.
             * @returns {Array<object>} The sorted array.
             */
            #sort(agents) {
                const { prior } = this.#cfg;

                return agents.sort((a, b) => {
                    // Get the priority number for each agent
                    const aPri = prior[a.statusKey] ?? prior.default;
                    const bPri = prior[b.statusKey] ?? prior.default;

                    // Sorting logic:
                    // 1. Current user (this.#ldap) always comes first.
                    // 2. Sort by status priority (lower number is higher).
                    // 3. Sub-sort by time in status (longest time first).
                    return (
                        (b.ldap === this.#ldap) - (a.ldap === this.#ldap) || // Current user first
                        aPri - bPri || // Then by priority
                        b.lastSec - a.lastSec // Then by time
                    );
                });
            }

            /**
             * The main render function. Called by the observer.
             * Orchestrates parsing, processing, sorting, and HTML generation.
             */
            #render() {
                const agents = this.#parse();
                const processed = agents.map(this.#proc.bind(this));
                const sorted = this.#sort(processed);

                // Generate HTML for all rows
                const rows = sorted.map(this.#rowHtml).join("");
                const closeBtn = this.#closeHtml();

                const finalHtml = `
                  <div class="ui-content-wrapper">
                    ${closeBtn}
                    <div class="ui-table">${rows}</div>
                  </div>`;

                // Safely inject the HTML using the TrustedTypes policy
                this.#ui.innerHTML = this.#policy.createHTML(finalHtml);
                this.#show(); // Ensure the UI is visible
            }

            // --- HTML Template Functions ---

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
                    : ""; // Return empty string if no icon
            }

            #closeHtml() {
                return `<button class="close-btn" title="Close">
                        <img src="${this.#cfg.icons.close}" alt="Close"/>
                      </button>`;
            }

            // --- Utility Functions ---

            /**
             * Converts a time string (e.g., "1h 5m 10s") into total seconds.
             * @param {string} timeStr - The time string.
             * @returns {number} Total seconds.
             */
            #toSec(timeStr) {
                const parts = timeStr.match(/(\d+)(h|m|s)/g) ?? [];
                const factors = { h: 3600, m: 60, s: 1 };

                return parts.reduce((total, part) => {
                    const val = parseInt(part, 10);
                    const unit = part.slice(-1);
                    return total + val * (factors[unit] ?? 0);
                }, 0);
            }

            /**
             * Injects all custom CSS rules for the dashboard.
             */
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
                .ui-content-wrapper { position: relative; pointer-events: auto; width: 100%; max-width: 400px; }
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
                .ui-table .tr { display: contents; } /* Use CSS Grid as table */
                .ui-table .td { 
                  padding: 8px 12px; display: flex; align-items: center; 
                  transition: background-color 0.4s ease, transform 0.2s ease; 
                }
                .ui-table .left { justify-content: flex-start; font-weight: 500; font-size: clamp(12px, 4vw, 16px); }
                .ui-table .right { justify-content: flex-end; text-align: right; font-size: clamp(10px, 3.5vw, 14px); }
                /* Status-specific styles */
                .ui-table .td { background-color: #F8F9FA; color: #495057; }
                .ui-table .tr.stt-active .td { background-color: #E6F4EA; color: #1E8449; }
                .ui-table .tr.stt-phone .td { background-color: #FEC7C0; color: #C0392B; }
                .ui-table .tr.stt-email .td { background-color: #ace0fe; color: #1d8fdcff; }
                .ui-table .tr.stt-coffee-break .td { background-color: #D2A993; color: #685347; }
                .ui-table .tr.stt-lunch-break .td { background-color: #FFEA99; color: #E58732; }
                .ui-table .tr.stt-break .td { background-color: #e9ecef; color: #495057; }
                /* Hover/Animation styles */
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
                /* Responsive styles */
                @media (max-width: 350px) { .ui-table .right img[alt*="icon"] { display: none; } }
                @media (max-width: 280px) { .ui-table .left img[alt*="Avatar"] { display: none; } }
                @media (max-width: 240px) { .ui-table .right span { display: none; } }
              `;

                const styleEl =
                    document.getElementById(this.#cfg.styleId) ||
                    document.createElement("style");
                styleEl.id = this.#cfg.styleId;
                // Safely inject CSS
                styleEl.innerHTML = this.#policy.createHTML(css);
                document.head.appendChild(styleEl);
            }
        }

        // Create a new instance of the class to run the script.
        new AgentDash();
    })();
}
// If the URL includes "adwords.corp", run this script instead.
else if (window.location.href.includes("adwords.corp")) {
    (function () {
        // --- STYLES ---
        // Style objects for GA4 and Ads conversion labels.
        const GA4_STYLE = {
            backgroundColor: "rgb(255, 229, 180)", // Yellow
            borderRadius: "10px",
            fontWeight: "500",
        };
        const ADS_STYLE = {
            backgroundColor: "rgb(160, 251, 157)", // Green
            borderRadius: "10px",
            fontWeight: "500",
        };

        // --- CONFIGURATION ---
        const MAX_ATTEMPTS = 3; // Max times to poll for data
        let attempts = 0; // Current attempt counter

        // --- UTILITY: addCopy ---
        /**
         * Adds a "click to copy" feature to a DOM element.
         * @param {object} options - Configuration for the copy action.
         */
        function addCopy({
            el, // The element to make clickable
            text, // The text to copy
            title = "Click to copy",
            okText, // Text to show on success (e.g., "Copied!")
            okBg = "#007bff",
            okColor = "white",
            timeout = 800, // How long to show the success state
        }) {
            Object.assign(el.style, { cursor: "pointer", userSelect: "none" });
            el.title = title;

            // Guard to prevent adding multiple listeners
            if (el.dataset.copyListener) return;
            el.dataset.copyListener = true;

            el.addEventListener("click", (e) => {
                e.preventDefault(); // Stop default click behavior
                e.stopPropagation(); // Stop click from bubbling up

                // Use the modern clipboard API
                navigator.clipboard.writeText(text).then(() => {
                    // Save original state
                    const { backgroundColor: origBg, color: origColor } =
                        el.style;
                    const origText = el.textContent;

                    // Show success state
                    Object.assign(el.style, {
                        backgroundColor: okBg,
                        color: okColor,
                    });
                    if (okText) el.textContent = okText;

                    // Revert to original state after timeout
                    setTimeout(() => {
                        Object.assign(el.style, {
                            backgroundColor: origBg,
                            color: origColor,
                        });
                        if (okText) el.textContent = origText;
                    }, timeout);
                });
            });
        }

        // --- UTILITY: extractDetails ---
        /**
         * Extracts the conversion type and label from the complex global data array.
         * @param {Array} data - A single conversion's data array.
         * @returns {object} { type, label }
         */
        function extractDetails(data) {
            let type = null,
                label = null;
            const typeId = data[11]; // This index identifies the conversion type

            if (typeId === 1) {
                // '1' is Google Ads Conversion
                type = "Ads Conversion: ";
                // Navigate the deeply nested array to find the label
                label = data[64]?.[2]?.[4]?.split("'")?.[7]?.split("/")?.[1];
            } else if (typeId === 32) {
                // '32' is GA4 Conversion
                type = "GA4: ";
                label = data[64]?.[1]?.[4]?.split("'")?.[3];
            }
            return { type, label };
        }

        // --- FEATURE: showAwId ---
        /**
         * Creates a small floating box to display the Adwords ID (AW-ID).
         * @param {string} id - The AW-ID to display.
         */
        function showAwId(id) {
            let el = document.getElementById("gpt-aw-id-display");
            if (!el) {
                // Create the element if it doesn't exist
                el = document.createElement("div");
                el.id = "gpt-aw-id-display";
                Object.assign(el.style, {
                    position: "fixed",
                    bottom: "16px",
                    left: "16px",
                    zIndex: "999",
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
                document.body.appendChild(el);
            }

            el.textContent = `AW-ID: ${id}`;

            // Make the box clickable to copy the ID
            addCopy({
                el: el,
                text: id,
                title: "Click to copy ID",
                okText: "Copied!",
                timeout: 800,
            });
        }

        // --- MAIN FUNCTION ---
        /**
         * Main function to modify the conversions page.
         */
        function run() {
            // 1. Get the raw conversion data from the global window object
            const dataStr =
                window.conversions_data.SHARED_ALL_ENABLED_CONVERSIONS;
            // Extract the AW-ID from the string
            const awID = dataStr.match(/AW-(\d*)/)[1];

            // 2. Click all "expand" buttons to load all rows into the DOM
            document
                .querySelectorAll(".expand-more")
                .forEach((btn) => btn.click());

            // 3. Parse the main JSON string
            const allData = JSON.parse(dataStr)[1];

            // 4. Wait for the DOM to update after clicks
            setTimeout(() => {
                // 5. Process each conversion row in the table
                document
                    .querySelectorAll(".conversion-name-cell .internal")
                    .forEach((cell) => {
                        const name = cell.innerText;
                        let type = null,
                            label = "no label";

                        // --- Filter Rows ---
                        const row = cell.closest(".particle-table-row");
                        if (row) {
                            // Find the "Source" column for this row
                            const srcEl = row.querySelector(
                                '[essfield="aggregated_conversion_source"]'
                            );
                            // If source is not "Web", remove the entire row
                            if (!srcEl?.innerText.match(/.*web.*/gi)) {
                                row.remove();
                                return; // Stop processing this row
                            }
                        }

                        // --- Find Data ---
                        // Find the matching data from the global object
                        const match = allData.find((d) => d[1] === name);
                        if (match) {
                            ({ type, label } = extractDetails(match));
                        }

                        // --- Modify DOM ---
                        if (type) {
                            // Replace cell text with the extracted label
                            cell.innerHTML = `${label}`;
                            // Apply the correct style
                            const style =
                                type === "GA4: " ? GA4_STYLE : ADS_STYLE;
                            Object.assign(cell.style, style);

                            // Make the new label copyable
                            if (label) {
                                addCopy({
                                    el: cell,
                                    text: label,
                                    title: "Click to copy label",
                                    timeout: 500,
                                });
                            }
                        }
                    });

                // --- Clean Up UI ---
                // Hide any category containers that are now empty
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
            }, 1000); // 1-second delay

            // 6. Display the AW-ID
            showAwId(awID);
        }

        // --- POLLING ---
        /**
         * Polls for the global 'conversions_data' object before running.
         */
        function poll() {
            if (
                typeof window.conversions_data !== "undefined" &&
                window.conversions_data.SHARED_ALL_ENABLED_CONVERSIONS
            ) {
                // Data is ready, run the script
                run();
            } else if (attempts < MAX_ATTEMPTS) {
                // Data not ready, try again
                attempts++;
                setTimeout(poll, 500);
            } else {
                // Max attempts reached, stop
                console.warn(
                    "Adwords script: Could not find `conversions_data`. Aborting."
                );
            }
        }

        // --- SCRIPT START ---
        // Start polling when the DOM is ready.
        if (
            document.readyState === "complete" ||
            document.readyState === "interactive"
        ) {
            poll();
        } else {
            window.addEventListener("DOMContentLoaded", poll);
        }
    })();
}