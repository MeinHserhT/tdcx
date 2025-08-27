const _TrustScript = (_string) => {
  const staticHtmlPolicyv2 = trustedTypes.createPolicy("foo-static", {
    createHTML: () => _string,
  });
  return staticHtmlPolicyv2.createHTML("");
};
const strToSec = (timeStr) =>
  (timeStr.match(/(\d+)(h|m|s)/g) || []).reduce(
    (sec, part) =>
      sec + parseInt(part) * { h: 3600, m: 60, s: 1 }[part.slice(-1)],
    0
  );
const tableToJson = (table) => {
  const headers = [
    "agentLdap",
    "auxCode",
    "timeSpent",
    "phoneCapacity",
    "lastChange",
    "lastChangeInSec",
    "imgSrc",
  ];

  const data = [];
  const rows = table.querySelectorAll("tbody tr");

  for (const row of rows) {
    const cells = row.querySelectorAll("td");
    const rowData = {};

    if (cells.length > 1) {
      rowData[headers[0]] = cells[1].innerText;
      rowData[headers[1]] = cells[3].innerText;
      rowData[headers[2]] = cells[4].innerText;

      rowData[headers[3]] = cells[5].innerText
        .match(/([a-zA-Z\s]+)/g)[0]
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
      rowData[headers[4]] = cells[8].innerText.trim();
      rowData[headers[5]] = strToSec(cells[8].innerText);
    }

    rowData["imgSrc"] = row.querySelector("img").src;
    data.push(rowData);
  }
  return data;
};
const myLdap = document
  .querySelector("[alt='profile photo']")
  .src.match(/\/([^\/]+)\?/)[1];

var st = `
  #agent_ui {
    position: fixed;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.1); /* Softened backdrop */
    backdrop-filter: blur(8px);
    z-index: 999;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .ui-table {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    width: 100%;
    max-width: 450px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .ui-table .tr {
    display: contents;
  }

  .ui-table .td {
    padding: 8px 12px;
    display: flex;
    align-items: center;
    transition: background-color 0.4s ease;
  }

  .ui-table .left {
    justify-content: flex-start;
    font-size: 16px;
    font-weight: 500;
  }
  .ui-table .right {
    justify-content: flex-end;
    text-align: right;
    font-size: 14px;
  }

  /* Default row color */
  .ui-table .td {
    background-color: #F8F9FA;
    color: #495057;
  }
  .ui-table .tr.stt-active .td {
    background-color: #E6F4EA;
    color: #1E8449; 
  }
  .ui-table .tr.stt-phone .td {
    background-color: #FEC7C0;
    color: #C0392B;
  }
  .ui-table .tr.stt-email .td {
    background-color: #EBF5FB;
    color: #2980B9; 
  }
  .ui-table .tr.stt-coffee-break .td {
    background-color: #A27B5B; 
    color: #DCD7C9; 
  }
  .ui-table .tr.stt-lunch-break .td {
    background-color: #F8D794; 
    color: #E58732; 
  }

  .ui-table .tr:hover .td {
    background-color: #E9ECEF;
  }
  .ui-table .td p {
    padding: 0 6px;
    margin: 1px 0;
  }
  img {
    border-radius: 12px;
    width: 36px;
    height: 36px;
    padding: 4px;
  }
`;

const getStatusClass = (agent) => {
  if (agent.auxCode === "Active" && agent.phoneCapacity === "busy") {
    agent.auxCode = "Break";
  }
  return "stt-" + agent.auxCode.toLowerCase().replace(/\s+/g, "-");
};

// Injects the CSS into the document's head.
var _style_elm = () => document.querySelector("#style");
if (!_style_elm()) {
  document.head.insertAdjacentHTML(
    "beforeEnd",
    _TrustScript(`<style id="style">${st}</style>`)
  );
} else {
  _style_elm().innerHTML = _TrustScript(st);
}

var uiSetup = () => {
  const agents = tableToJson(document.querySelector(".agent-table-container"));
  agents.sort((a, b) => {
    if (a.agentLdap === myLdap) return -1;
    if (b.agentLdap === myLdap) return 1;

    const getStatePriority = (state) => {
      if (state === "available") return -1;
      if (state === "busy") return 1;
      return 0; // 'at-max-capacity' and others in the middle
    };

    const aStatePrior = getStatePriority(a.phoneCapacity);
    const bStatePrior = getStatePriority(b.phoneCapacity);
    if (aStatePrior !== bStatePrior) {
      return aStatePrior - bStatePrior;
    }

    return b.lastChangeInSec - a.lastChangeInSec;
  });

  const iconInput = (auxCode) =>
    auxCode === "Coffee Break"
      ? `<img
        src="https://www.clipartmax.com/png/small/295-2954738_coffee-icon-white-png.png"
        alt="Coffee Icon White Png @clipartmax.com"
      />`
      : "";
  var rows = "";
  agents.forEach((e) => {
    rows += `<div class="tr ${getStatusClass(e)}">
              <div class="td left">
                <img src="${e.imgSrc}"/>
                <p>${e.agentLdap}</p>
              </div>
              <div class="td right">
                <div>
                  <p>${e.lastChange}</p> 
                  <p>${e.auxCode}</p>
                </div> 
                ${iconInput(e.auxCode)}
              </div>
            </div>`;
  });

  var _ul = _TrustScript(`<div class="ui-table">${rows}</div>`);
  let _ui_agent = document.querySelector("#agent_ui");
  if (_ui_agent) {
    _ui_agent.innerHTML = _ul;
  } else {
    _ui_agent = document.createElement("div");
    _ui_agent.id = "agent_ui";
    _ui_agent.innerHTML = _ul;
    document.body.insertAdjacentElement("beforeend", _ui_agent);
  }
};

const observer = new MutationObserver(uiSetup);
const targetNode = document.querySelector(".agent-table-container");

if (targetNode) {
  observer.observe(targetNode, {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true,
  });

  uiSetup();
} else {
  console.error("Target element '.agent-table-container' not found.");
}
