const CONFIG = {
  AGENT_TABLE_SELECTOR: ".agent-table-container",
  UI_CONTAINER_ID: "agent_ui",
  PRIORITY: { available: 1, default: 2, busy: 3 },
  ICONS: {
    coffeebreak: {
      src: "https://cdn-icons-png.flaticon.com/512/2935/2935413.png",
      animation: "wiggle",
    },
    lunchbreak: {
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
            previousStat: phoneCap + cells[3].innerText,
          }
        : {}),
    };
  });
const styleSheet = () => {
  var css = `
    #agent_ui { position: fixed; height: 100%; width: 100%; top: 0; left: 0; background-color: rgba(0,0,0,0.1); backdrop-filter: blur(4px); z-index: 999; display: flex; justify-content: center; align-items: center; padding: 20px; font-family: Noto Serif; }
    .ui-content-wrapper { position: relative; }
    .close-btn { position: absolute; top: 0; right: 0; transform: translate(40%, -40%); width: 32px; height: 32px; background: #ffffff; border: none; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.25); font-size: 24px; color: #555; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; font-weight: 300; transition: transform 0.2s ease, background-color 0.2s ease; padding-bottom: 2px; z-index: 10; }
    .close-btn:hover { background-color: #f2f2f2; transform: translate(40%, -40%) scale(1.1); }
    .ui-table { display: grid; grid-template-columns: repeat(2, 1fr); width: 100%; max-width: 550px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
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
    .ui-table .tr:hover .td { transform: scale(1.02); }
    .ui-table .td p { padding: 0 6px; margin: 1px 0; }
    img { border-radius: 12px; width: 36px; height: 36px; padding: 4px; }
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
  return "stt-" + agent.auxCode.toLowerCase().replace(/\s+/g, "-");
};
const iconHtml = (auxCode) => {
  const mapCode = auxCode.toLowerCase().replace(/\s/g, "");
  const icon = CONFIG.ICONS[mapCode];
  return icon ? `<img src="${icon.src}" animation="${icon.animation}"/>` : "";
};
const createAgentRowHtml = (agent) => {
  const timeToDisplay =
    agent.phoneCapacity !== agent.previousStat
      ? agent.lastChange
      : agent.timeSpent;
  agent.previousStat = agent.phoneCapacity;
  return `
    <div class="tr ${getStatusClass(agent)}">
      <div class="td left">
        <img src="${agent.imgSrc}" alt="Avatar for ${agent.agentLdap}" />
        <p>${agent.agentLdap}</p>
      </div>
      <div class="td right">
        <div>
          <p>${timeToDisplay}</p>
          <p>${agent.auxCode}</p>
        </div>
        ${iconHtml(agent.auxCode)}
      </div>
    </div>`;
};
const closeUi = () => {
  const uiContainer = document.getElementById(CONFIG.UI_CONTAINER_ID);
  if (uiContainer) uiContainer.style.display = "none";

  // This will now work because 'observer' is in the global scope
  if (observer) observer.disconnect();
};
const uiRender = () => {
  const agentTable = document.querySelector(CONFIG.AGENT_TABLE_SELECTOR);
  if (!agentTable) return;

  const agents = tableToJson(agentTable);
  agents.sort((a, b) => {
    const { PRIORITY } = CONFIG;
    const aPriority = PRIORITY[a.phoneCapacity] || PRIORITY.default;
    const bPriority = PRIORITY[b.phoneCapacity] || PRIORITY.default;
    return (
      (b.agentLdap === myLdap) - (a.agentLdap === myLdap) ||
      aPriority - bPriority ||
      b.lastChangeInSec - a.lastChangeInSec
    );
  });

  const rowsHtml = agents.map(createAgentRowHtml).join("");
  const closeButtonHtml = `<button id="close-btn" class="close-btn" title="Close">&times;</button>`;
  const tableHtml = `<div class="ui-table">${rowsHtml}</div>`;

  const finalHtml = _trustScript(`
    <div class="ui-content-wrapper">
        ${closeButtonHtml}
        ${tableHtml}
    </div>
  `);

  const container =
    document.getElementById(CONFIG.UI_CONTAINER_ID) ??
    document.body.appendChild(
      Object.assign(document.createElement("div"), {
        id: CONFIG.UI_CONTAINER_ID,
      })
    );

  container.style.display = "flex";
  container.innerHTML = finalHtml;

  const closeButton = document.getElementById("close-btn");
  if (closeButton) closeButton.addEventListener("click", closeUi);
};

const main = () => {
  styleSheet();
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
main();
