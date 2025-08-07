(function () {
  // Encapsulate all code in an IIFE to prevent global scope pollution
  if (location.hostname !== "mirin.corp.google.com") {
    return;
  }

  // --- Utility Functions ---

  function _TrustScript(_string) {
    const staticHtmlPolicyv2 = trustedTypes.createPolicy("foo-static", {
      createHTML: () => _string,
    });
    return staticHtmlPolicyv2.createHTML("");
  }

  // Cache the LDAP lookup result once
  const myLdap = (() => {
    try {
      const elm = document.querySelector('[aria-label*="@google.com"]');
      if (elm) {
        const me_email = elm.getAttribute("aria-label");
        const regex = /\S+[a-z0-9]@[a-z0-9\.]+/gim;
        return me_email.match(regex)[0].split("@")[0].trim();
      }
    } catch (err) {
      console.error("Failed to get LDAP:", err);
    }
    return false;
  })();

  // --- UI and State Management ---

  // Use a single object for state management instead of multiple globals
  const state = {
    isSilent: localStorage.getItem("__issilent") === "1",
    remindMe: localStorage.getItem("remindme") === "1",
    isSoundPlaying: false,
    audio: new Audio(
      "https://bucket-o39pcy.s3.ap-southeast-1.amazonaws.com/cdtx.lyl.vn/assets/mp3/palomita_iphone.mp3"
    ),
    // Use a WeakMap or a simple object for performance tracking
    dailyStats: {},
  };

  // Setup audio loop
  state.audio.addEventListener("ended", function () {
    if (state.isSoundPlaying) {
      this.currentTime = 0;
      this.play();
    }
  });

  // --- DOM Insertion ---

  function insertStyles() {
    const st = `
      /* CSS has been moved out of the JS for clarity and can be moved to an external file */
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
      #agent_ui--n_agent {
          position: absolute;
          width: 40px;
          height: 40px;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 30px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
          font-weight: bold;
          flex-direction: column;
          line-height: 0.9;
      }
      #agent_ui--n_agent small {
        font-size: 60%;
      }
      #agent_ui--n_agent.alert {
          background: #FF0000;
          color: #fff;
      }
      #agent_ui--n_agent.warning {
          background: #FF5722;
          color: #fff;
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
      #agent_ui--issound[data-issilent="1"] {
        text-decoration: line-through;
        &:before {
            content: "Silient ON";
        }
      }
      #agent_ui--issound[data-isenable]:after {
        content: "Sound ON";
        text-shadow: 0 0 10px blue;
      }
      span.agent_ui--btnenableboard {
        position: absolute;
        right: 6px;
        top: 6px;
        cursor: pointer;
        font-size: 80%;
      }
      span.agent_ui--btnenableboard:not(:hover) {
        opacity: 0.2
      }
      .agent_ui--btntestsoundalarm {
        font-size: 80%;
        color: #000;
      }
      .agent_ui--btntoggle_remindme {
        font-size: 80%;
        color: #111;
      }
      .agent_ui--btntoggle_remindme:before {
        contentx: "Remind Me?"
      }
      .agent_ui--btntestsoundalarm.playing {
        opacity: 0.3;
        cursor: pointer;
        user-select: none;
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
    try {
      const agents = Array.from(
        document.querySelectorAll(".table-rows .agent")
      );
      const fragment = document.createDocumentFragment();
      let n_phone = 0;

      agents.forEach((elm) => {
        const ldap = elm.querySelector(".agent-display-ldap").innerText;
        const stateText = elm.querySelector(".state-text").innerText.trim();
        const isMe = ldap === myLdap;

        if (stateText.toLocaleLowerCase() === "phone") {
          n_phone++;
        }

        // Create and append list item
        const li = document.createElement("li");
        li.dataset.isme = isMe ? "1" : "0";
        li.dataset.state = stateText.toLocaleLowerCase();
        if (elm.classList.contains("performing-agent")) {
          li.classList.add("isperforming");
        }

        const avatar = document.createElement("span");
        avatar.dataset.avatar = "";
        avatar.style.backgroundImage = `url(${elm
          .querySelector(".profile-photo")
          .getAttribute("src")})`;
        li.appendChild(avatar);

        const name = document.createElement("span");
        name.dataset.name = ldap;
        name.textContent = elm.querySelector(".agent-display-name").innerText;
        li.appendChild(name);

        const stateTime = document.createElement("span");
        stateTime.dataset.statetime = elm
          .querySelector(".time")
          .innerText.trim();
        stateTime.textContent = stateText;
        li.appendChild(stateTime);

        fragment.appendChild(li);

        // Handle specific states
        if (isMe) {
          if (stateText.toLocaleLowerCase().includes("dialing")) {
            startAlarmSound();
          } else if (
            stateText.toLocaleLowerCase().includes("break") ||
            stateText.toLocaleLowerCase().includes("email")
          ) {
            stopAlarmSound();
          }
        }
      });

      // Update UI elements in a single batch
      const uiAgentOuter = document.querySelector("#agent_ui--outer");
      if (uiAgentOuter) {
        uiAgentOuter.querySelector("ul").innerHTML = ""; // Clear existing list
        uiAgentOuter.querySelector("ul").appendChild(fragment); // Append new items

        // Update stats
        uiAgentOuter.querySelector(
          "#agent_ui--n_agent"
        ).innerHTML = `${n_phone}<small>${agents.length}</small>`;
      } else {
        // If UI doesn't exist, create it
        createUI();
        const mainUI = document.querySelector("#agent_ui");
        const outerHTML = `
          <div id="agent_ui--outer">
            <span id="agent_ui--issound" data-issilent="${
              state.isSilent ? "1" : "0"
            }" data-isenable="${state.isSoundPlaying}"></span>
            <span class="agent_ui--btntoggle_remindme" data-status="${
              state.remindMe ? "ok" : "no"
            }"></span>
            <span class="agent_ui--btntestsoundalarm">Test alarm</span>
            <span id="agent_ui--n_agent" class="">${n_phone}<small>${
          agents.length
        }</small></span>
            <ul></ul>
          </div>
        `;
        mainUI.innerHTML = _TrustScript(outerHTML);
        mainUI.querySelector("ul").appendChild(fragment);

        // Attach event listeners
        attachEventListeners();
      }
    } catch (err) {
      console.error("UI update failed:", err);
    }
  }

  // --- Event Handling and Alarms ---

  function startAlarmSound() {
    if (!state.isSilent && !state.isSoundPlaying) {
      state.audio.play();
      state.isSoundPlaying = true;
    }
  }

  function stopAlarmSound() {
    state.audio.pause();
    state.audio.currentTime = 0;
    state.isSoundPlaying = false;
  }

  function attachEventListeners() {
    // Event delegation on the main UI container
    document.getElementById("agent_ui").addEventListener("click", (e) => {
      const target = e.target;

      if (target.matches("#agent_ui--issound")) {
        state.isSilent = !state.isSilent;
        target.dataset.issilent = state.isSilent ? "1" : "0";
        localStorage.setItem("__issilent", state.isSilent ? "1" : "0");
        if (state.isSilent) {
          stopAlarmSound();
        }
      } else if (target.matches(".agent_ui--btntestsoundalarm")) {
        target.classList.add("playing");
        state.audio.play();
        setTimeout(() => {
          target.classList.remove("playing");
        }, 5000);
      } else if (target.matches(".agent_ui--btnenableboard")) {
        // ... (existing logic)
        localStorage.setItem(
          "_mirinBoard",
          localStorage.getItem("_mirinBoard") ? "" : "1"
        );
        location.reload();
      }
    });
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

  // Initial event listener for the external button
  document.addEventListener("click", (e) => {
    if (e.target.matches(".agent_ui--btnenableboard")) {
      const isBoardEnabled = localStorage.getItem("_mirinBoard");
      if (isBoardEnabled) {
        localStorage.removeItem("_mirinBoard");
      } else {
        localStorage.setItem("_mirinBoard", "1");
      }
      location.reload();
    }
  });

  initialize();
})();
