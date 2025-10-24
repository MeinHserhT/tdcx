function LT() {
    if (window.scrRun) {
        return;
    }
    window.scrRun = 1;

    // --- 1. Setup for Element Observer ---
    function observeElement(selector, callback) {
        const checkNode = (node) => {
            if (node.nodeType !== 1) return;
            if (node.matches(selector)) callback(node);
            try {
                for (const element of node.querySelectorAll(selector)) {
                    if (element !== node) callback(element);
                }
            } catch {}
        };
        const observer = new MutationObserver((mutations) => {
            for (const { addedNodes } of mutations) {
                for (const node of addedNodes) checkNode(node);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        for (const element of document.querySelectorAll(selector)) {
            callback(element);
        }
        return observer;
    }

    const dialogSelector = "[debug-id=phoneTakeDialog]";
    const soundUrl =
        "https://cdn.pixabay.com/audio/2025/07/18/audio_da35bc65d2.mp3";
    const notificationSound = new Audio(soundUrl);

    // --- MODIFIED SECTION ---
    observeElement(dialogSelector, () => {
        // 1. Play sound (your original code)
        notificationSound.play().catch(console.error);

        // 2. Attempt to focus the window (may be blocked by the browser)
        window.focus();

        // 3. Flash the tab title to reliably get attention
        const originalTitle = document.title;
        const alertMessage = ">>> ALERT!!! <<<";
        let isFlashing = true;

        const titleFlasher = setInterval(() => {
            document.title =
                document.title === originalTitle ? alertMessage : originalTitle;
        }, 1000); // Flashes every second

        // 4. Stop flashing when the user returns to the tab
        window.onfocus = () => {
            if (isFlashing) {
                isFlashing = false;
                clearInterval(titleFlasher);
                document.title = originalTitle; // Restore the original title
                window.onfocus = null; // Clean up the event listener
            }
        };
    });

    // --- 2. Setup for Auto-Clicker ---
    function clickElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.click();
        }
    }
    setInterval(() => {
        clickElement("#cdtx__uioncall--btn");
        setTimeout(() => {
            clickElement(".cdtx__uioncall_control-remove");
        }, 3000); // 3 seconds
    }, 18000); // 18 seconds

    console.log("%cScript run", "color: green");
}

const CONFIG = {
    AGENT_TABLE_SELECTOR: ".agent-table-container",
    UI_CONTAINER_ID: "agent_ui",
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
            src: "https://cdn-icons-png.flaticon.com/512/2935/2935413.png",
            animation: "wiggle",
        },
        "lunch-break": {
            src: "https://cdn-icons-png.flaticon.com/512/4252/4252424.png",
            animation: "pulse",
        },
        phone: {
            src: "https://cdn-icons-png.flaticon.com/512/1959/1959283.png",
            animation: "wiggle",
        },
        email: {
            src: "https://cdn-icons-png.flaticon.com/512/15781/15781499.png",
            animation: "slide",
        },
        break: {
            src: "https://cdn-icons-png.flaticon.com/512/2115/2115487.png",
            animation: "wiggle",
        },
        close: "https://cdn-icons-png.flaticon.com/512/9403/9403346.png",
    },
};
let observer;
const myLdap = document
    .querySelector("[alt='profile photo']")
    .src.match(/\/([^\/]+)\?/)[1];
const _trustScript = (s) =>
    trustedTypes
        .createPolicy("foo-static", { createHTML: () => s })
        .createHTML("");
const strToSec = (timeStr) =>
    (timeStr.match(/(\d+)(h|m|s)/g) || []).reduce(
        (sec, part) =>
            sec + parseInt(part) * { h: 3600, m: 60, s: 1 }[part.slice(-1)],
        0
    );
const tableToJson = (table) =>
    Array.from(table.querySelectorAll("tbody tr"), (row) => {
        const cells = row.querySelectorAll("td");
        const phoneCap = cells[5].innerText
            .match(/([a-zA-Z\s]+)/g)[0]
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-");
        return {
            imgSrc: row.querySelector("img").src,
            ...(cells.length > 1
                ? {
                      agentLdap: cells[1].innerText,
                      auxCode: cells[3].innerText,
                      timeSpent: cells[4].innerText,
                      phoneCapacity: phoneCap,
                      lastChange: cells[8].innerText.trim(),
                      lastChangeInSec: strToSec(cells[8].innerText),
                  }
                : {}),
        };
    });
const styleSheet = () => {
    var css = `
  #agent_ui { position: fixed; height: 100%; width: 100%; top: 0; left: 0; background-color: rgba(0,0,0,0.1); z-index: 999; display: flex; justify-content: flex-start; align-items: center; padding: 20px; font-family: Noto Serif; pointer-events: none; }
  .ui-content-wrapper { position: relative; pointer-events: auto; }
  .close-btn { position: absolute; top: 0; right: 0; transform: translate(40%, -40%); border: none; cursor: pointer; z-index: 10; background: rgba(0, 0, 0, 0)}
  .close-btn:hover { transform: translate(40%, -40%) scale(1.4); }
  .ui-table { display: grid; grid-template-columns: repeat(2, 1fr); width: 100%; max-width: 550px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
  .ui-table .tr { display: contents; }
  .ui-table .td { padding: 8px 12px; display: flex; align-items: center; transition: background-color 0.4s ease, transform 0.2s ease; }
  .ui-table .left { justify-content: flex-start; font-size: 16px; font-weight: 500; }
  .ui-table .right { justify-content: flex-end; text-align: right; font-size: 14px; }
  .ui-table .td { background-color: #F8F9FA; color: #495057; }
  .ui-table .tr.stt-active .td { background-color: #E6F4EA; color: #1E8449; }
  .ui-table .tr.stt-phone .td { background-color: #FEC7C0; color: #C0392B; }
  .ui-table .tr.stt-email .td { background-color: #ace0fe; color: #1d8fdcff; }
  .ui-table .tr.stt-coffee-break .td { background-color: #D2A993; color: #685347; }
  .ui-table .tr.stt-lunch-break .td { background-color: #FFEA99; color: #E58732; }
  .ui-table .tr:hover .td { transform: scale(1.1); }
  .ui-table .td p { padding: 0 6px; margin: 1px 0; }
  .ui-table .td span { opacity: 0.5 }
  img { border-radius: 12px; width: 36px; height: 36px; padding: 4px; }
  .close-btn img { width: 20px; height: 20px; }
  [animation="pulse"] { animation: pulse 2s infinite ease-in-out; }
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
  [animation="wiggle"] { animation: wiggle 0.9s infinite; }
  @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 15%, 45%, 75% { transform: rotate(8deg); } 30%, 60% { transform: rotate(-8deg); } }
  [animation="slide"] { animation: slide-lr 1.2s infinite alternate ease-in-out; }
  @keyframes slide-lr { from { transform: translateX(0); } to { transform: translateX(8px); } }
`;
    (
        document.getElementById("style") ??
        document.head.appendChild(
            Object.assign(document.createElement("style"), { id: "style" })
        )
    ).innerHTML = _trustScript(css);
};
const getStatusClass = (agent) => {
    if (agent.auxCode === "Active" && agent.phoneCapacity === "busy")
        agent.auxCode = "Break";
    return agent.auxCode.toLowerCase().replace(/\s+/g, "-");
};
const iconHtml = (agent) => {
    const icon = CONFIG.ICONS[agent.statusKey];
    return icon ? `<img src="${icon.src}" animation="${icon.animation}"/>` : "";
};
const createAgentRowHtml = (agent) => {
    const [displayTime, resvTime] = [agent.lastChange, agent.timeSpent];
    return `
  <div class="tr ${"stt-" + getStatusClass(agent)}">
    <div class="td left">
      <img src="${agent.imgSrc}" alt="Avatar for ${agent.agentLdap}" />
      <p>${agent.agentLdap}</p>
    </div>
    <div class="td right">
      <div>
        <p>${displayTime} <span>(${resvTime})</span></p>
        <p>${agent.auxCode}</p>
      </div>
      ${iconHtml(agent)}
    </div>
  </div>`;
};
const closeUi = () => {
    const uiContainer = document.getElementById(CONFIG.UI_CONTAINER_ID);
    if (uiContainer) uiContainer.style.display = "none";

    if (observer) observer.disconnect();
};
const uiRender = () => {
    const agentTable = document.querySelector(CONFIG.AGENT_TABLE_SELECTOR);
    if (!agentTable) return;

    const agents = tableToJson(agentTable);
    const proAgents = agents.map((agent) => ({
        ...agent,
        statusKey: getStatusClass(agent),
    }));
    proAgents.sort((a, b) => {
        const { PRIOR } = CONFIG;
        const aPriority = PRIOR[a.statusKey] || PRIOR.default;
        const bPriority = PRIOR[b.statusKey] || PRIOR.default;
        return (
            (b.agentLdap === myLdap) - (a.agentLdap === myLdap) ||
            aPriority - bPriority ||
            b.lastChangeInSec - a.lastChangeInSec
        );
    });
    const rowsHtml = proAgents.map(createAgentRowHtml).join("");
    const closeButtonHtml = `<button class="close-btn" title="Close"><img src="${CONFIG.ICONS.close}"/></button>`;
    const tableHtml = `<div class="ui-table">${rowsHtml}</div>`;

    const finalHtml = _trustScript(`
  <div class="ui-content-wrapper">
    ${closeButtonHtml}
    ${tableHtml}
  </div>
`);

    const container = document.getElementById(CONFIG.UI_CONTAINER_ID);
    if (container) {
        container.style.display = "flex";
        container.innerHTML = finalHtml;
    }
};
const dash = () => {
    styleSheet();
    const container =
        document.getElementById(CONFIG.UI_CONTAINER_ID) ??
        document.body.appendChild(
            Object.assign(document.createElement("div"), {
                id: CONFIG.UI_CONTAINER_ID,
            })
        );

    container.addEventListener("click", (e) => {
        if (e.target.closest(".close-btn")) {
            closeUi();
        }
    });

    observer = new MutationObserver(uiRender);
    const targetNode = document.querySelector(CONFIG.AGENT_TABLE_SELECTOR);
    if (targetNode) {
        observer.observe(targetNode, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true,
        });
        uiRender();
    } else {
        console.error("Target element not found.");
    }
};

if (window.location.href.includes("cases.connect")) LT();
if (window.location.href.includes("casemon2.corp")) dash();
