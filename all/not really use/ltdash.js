(function () {
  if (location.hostname !== "casemon2.corp.google.com") {
    return;
  }
  function _TrustScript(_string) {
    const staticHtmlPolicyv2 = trustedTypes.createPolicy("foo-static", {
      createHTML: () => _string,
    });
    return staticHtmlPolicyv2.createHTML("");
  }

  // Cache the LDAP lookup result once
  const myLdap = (() => {
    var src = document.querySelector("[alt='profile photo']").src;
    return src.match(/\/([^\/]+)\?/)[1];
  })();
  // --- DOM Insertion ---
  function insertStyles() {
    const st = `
      #agent_ui {
          position: fixed;
          height: 100%;
          width: 100%;
          top: 0;
          left: 0;
          background: #00000057;
          z-index: 999;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow: scroll;
          max-height: 100vh;
      }
      #agent_ui [data-avatar] {
        position: absolute;
        width: 32px;
        height: 32px;
        left: 0;
        border-radius: 50%;
        background-position: center center;
        box-shadow: 0 0 10px #ccc;
        top: 50%;
        transform: translateY(-50%);
      }
      #agent_ui [data-state]:not([data-state*="in a call"]) [data-avatar] {
        &:not(:hover) {
            // filter: grayscale(1);
        }
      }
      #agent_ui [data-name] {
        margin-right: 16px
      }
      #agent_ui--outer {
          background: #fff;
          margin-top: 100px;
          list-style: none;
          padding: 12px;
          border-radius: 10px;
          position: relative;
          min-width: 400px;
      }
      #agent_ui--outer ul {
          display: flex;
          flex-direction: column;
          padding: 0;
      }
      #agent_ui ul li {
          margin: 0px;
          order: 10;
          display: flex;
          align-items: center;
          padding-left: 46px;
          margin-bottom: 12px;
          position: relative;
      }
      #agent_ui ul li[data-isme="1"] {
          order: 0 !important;
      }
      #agent_ui ul li[data-state*="dialing"] {
          order: 1;
          background-color: #ff6b6b;
          background-position: left 10px center;
          padding-right: 10px;
          padding-top: 10px;
          padding-bottom: 10px;
      }
      #agent_ui ul li[data-state="phone"] {
          order: 2;
      }
      #agent_ui ul li[data-state*="in a call"] {
          order: 3;
      }
      #agent_ui [data-statetime] {
          padding: 10px;
          background: #eee;
          border-radius: 4px;
          border: 1px solid #ccc;
          margin-left: auto;
          margin-right: 0;
          &:after {
              content: attr(data-statetime);
              font-size: 60%;
              margin-left: 10px;
          }
      }
      #agent_ui ul li[data-state="phone"] [data-statetime] {
          background: #d1faff;
          position: relative;
          overflow: hidden;
          &:before {
            content: "READY";
            font-weight: bold;
            position: absolute;
            opacity: 0.1;
            transform: rotate(20deg) scale(1.6);
            left: 30%;
            pointer-events: none;
            cursor: none;
          }
      }
      #agent_ui ul li[data-state*="in a call"] [data-statetime] {
          background: #8BC34A;
      }
      #agent_ui ul li[data-state*="email"] [data-statetime],
      #agent_ui ul li[data-state*="coffee"] [data-statetime] {
          background: #ff9370;
      }
      #agent_ui [data-name]:after {
          content: attr(data-name);
          font-size: 80%;
          display: block;
          color: #888;
      }
      #agent_ui--issound {
        font-size: 80%;
        cursor: pointer;
        position: relative;
      }
      #agent_ui--issound:after {
        content: "Sound OFF";
      }
      #agent_ui--issound:before {
        content: "Click set silient";
        position: absolute;
        font-size:80%;
        bottom: 100%;
        left: 0;
        white-space: nowrap;
        opacity: 0.7;
      }
      #agent_ui ul li.agent_ui--alertovertime [data-statetime] {
        background: #FF5722;
        animation: bellshake 1s cubic-bezier(.36,.07,.19,.97) both infinite;
      }
      @keyframes bellshake {
        0% { transform: rotate(0); }
        15% { transform: rotate(5deg) scale(1.4); }
        30% { transform: rotate(-5deg); }
        45% { transform: rotate(4deg); }
        60% { transform: rotate(-4deg) ; }
        75% { transform: rotate(2deg); }
        85% { transform: rotate(-2deg) scale(1.4); }
        92% { transform: rotate(1deg); }
        100% { transform: rotate(0); }
      }
      #agent_ui ul li:not(.isperforming) {
        order: 99;
        background-color: #eeeeee;
      }
      #agent_ui ul li:not(.isperforming):before {
        content: "";
        position: absolute;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800px' height='800px' viewBox='0 0 24 24' fill='none' style='&%2310;'%3E%3Cg id='System / Wifi_Off'%3E%3Cpath id='Vector' d='M17.8506 11.5442C17.0475 10.6829 16.0641 10.0096 14.9707 9.57227M20.7759 8.81625C19.5712 7.52437 18.0961 6.51439 16.4561 5.8584C14.816 5.20241 13.0514 4.91635 11.2881 5.02111M8.34277 14.5905C8.95571 13.9332 9.73448 13.4532 10.5971 13.2012C11.4598 12.9491 12.3745 12.9335 13.2449 13.1574M6.14941 11.5438C7.09778 10.5268 8.29486 9.77461 9.62259 9.36133M3.22363 8.81604C4.1215 7.85319 5.17169 7.04466 6.33211 6.42285M4.41406 4L18.5562 18.1421M12 19C11.4477 19 11 18.5523 11 18C11 17.4477 11.4477 17 12 19C12.5523 19 13 18.5523 13 18C13 18.5523 12.5523 19 12 19Z' stroke='%23ff0000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='&%2310;'/%3E%3C/g%3E%3C/svg%3E");
        background-size: contain;
        background-repeat: no-repeat;
        left: 50%;
        top: 50%;
        height: 30px;
        width: 30px;
        z-index: 9;
        transform: translate(-50%, -50%)
      }
    `;

    const styleElm = document.querySelector("#style");
    if (!styleElm) {
      document.head.insertAdjacentHTML(
        "beforeEnd",
        _TrustScript(`<style id="style">${st}</style>`)
      );
    } else {
      styleElm.innerHTML = _TrustScript(st);
    }
  }

  function createUI() {
    let ui_agent = document.querySelector("#agent_ui");
    if (!ui_agent) {
      ui_agent = document.createElement("div");
      ui_agent.id = "agent_ui";
      document.body.insertAdjacentElement("afterEnd", ui_agent);
    }
  }

  // --- UI Update Logic ---
  function updateUI() {
    var agents = document.querySelectorAll(".agent-table-container tbody tr"),
      fragment = document.createDocumentFragment();

    agents.forEach((elm) => {
      var ldap = elm.querySelector(".mdc-button__label").innerText,
        stateText = elm.querySelector(".agent-aux-code-cell").innerText,
        isMe = ldap === myLdap;
      // Create and append list item
      const li = document.createElement("li");
      li.dataset.isme = isMe ? "1" : "0";
      li.dataset.state = stateText.toLocaleLowerCase();

      // Get Avatar
      var avatar = document.createElement("span");
      avatar.dataset.avatar = "";
      avatar.style.backgroundImage = `url(${
        elm.querySelector(".avatar-sm").src
      })`;
      li.appendChild(avatar);

      const name = document.createElement("span");
      name.dataset.name = ldap;
      name.textContent = ldap;
      li.appendChild(name);

      const stateTime = document.createElement("span");
      stateTime.dataset.statetime = elm.querySelector(
        ".agent-last-status-change"
      ).innerText;
      console.log(elm.querySelector(".agent-last-status-change").innerText);
      stateTime.textContent = stateText;
      li.appendChild(stateTime);

      fragment.appendChild(li);
    });

    // Update UI elements in a single batch
    const uiAgentOuter = document.querySelector("#agent_ui--outer");
    if (uiAgentOuter) {
      uiAgentOuter.querySelector("ul").innerHTML = ""; // Clear existing list
      uiAgentOuter.querySelector("ul").appendChild(fragment); // Append new items
    } else {
      // If UI doesn't exist, create it
      createUI();
      const mainUI = document.querySelector("#agent_ui");
      const outerHTML = `
          <div id="agent_ui--outer">
            <ul></ul>
          </div>
        `;
      mainUI.innerHTML = _TrustScript(outerHTML);
      mainUI.querySelector("ul").appendChild(fragment);
    }
  }
  // --- Initialization ---

  function initialize() {
    insertStyles();

    // Observe for the target elements to appear, then start the UI update cycle
    const observer = new MutationObserver((mutations, obs) => {
      if (document.querySelectorAll(".agent-display-ldap").length > 0) {
        updateUI(); // Initial render
        obs.disconnect();

        // Now, observe the target list for changes
        const agentTable = document.querySelector(".table-rows");
        if (agentTable) {
          new MutationObserver(updateUI).observe(agentTable, {
            childList: true,
            subtree: true,
          });
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  initialize();
})();
