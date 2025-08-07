function test() {
  if (location.hostname !== "mirin.corp.google.com") {
    return false;
  }

  function padTo2Digits(num) {
    return num.toString().padStart(2, "0");
  }

  function formatDateV2(date, format = "Y-m-d H:i:s") {
    _dateformat = format ? format : "d/m/Y";
    var _replace = _dateformat.replace("d", ("0" + date.getDate()).slice(-2));
    _replace = _replace.replace("m", ("0" + (date.getMonth() + 1)).slice(-2));
    _replace = _replace.replace("Y", date.getFullYear());
    _replace = _replace.replace("H", padTo2Digits(date.getHours()));
    _replace = _replace.replace("i", padTo2Digits(date.getMinutes()));
    _replace = _replace.replace("s", padTo2Digits(date.getSeconds()));

    return _replace;
  }

  // _TrustScript
  function _TrustScript(_string) {
    const staticHtmlPolicyv2 = trustedTypes.createPolicy("foo-static", {
      createHTML: () => _string,
    });
    return staticHtmlPolicyv2.createHTML("");
  }

  var onElmClick = function (n, t) {
    document.addEventListener("click", function (c) {
      c.target.matches(n) && t(c);
    });
  };

  onElmClick(".agent_ui--btnenableboard", (e) => {
    if (localStorage.getItem("_mirinBoard")) {
      localStorage.removeItem("_mirinBoard");
    } else {
      localStorage.setItem("_mirinBoard", "1");
    }
    location.reload();
  });

  var _check_ldap = () => {
    try {
      if ((elm = document.querySelector('[aria-label *= "@google.com"]'))) {
        var me_email = elm.getAttribute("aria-label");
        regex = /\S+[a-z0-9]@[a-z0-9\.]+/gim;
        var ldap_me = me_email.match(regex)[0].split("@")[0].trim();
        return ldap_me;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  window.once_act = window.once_act || 0;

  var st = `

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
      
      
      
      /* -- -- */
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
    
    // #agent_ui ul li:not(.isperforming) * {
    //     filter: grayscale(1)
    // }
    
    #agent_ui ul li:not(.isperforming):before {
        content: "";
        position: absolute;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800px' height='800px' viewBox='0 0 24 24' fill='none' style='&%2310;'%3E%3Cg id='System / Wifi_Off'%3E%3Cpath id='Vector' d='M17.8506 11.5442C17.0475 10.6829 16.0641 10.0096 14.9707 9.57227M20.7759 8.81625C19.5712 7.52437 18.0961 6.51439 16.4561 5.8584C14.816 5.20241 13.0514 4.91635 11.2881 5.02111M8.34277 14.5905C8.95571 13.9332 9.73448 13.4532 10.5971 13.2012C11.4598 12.9491 12.3745 12.9335 13.2449 13.1574M6.14941 11.5438C7.09778 10.5268 8.29486 9.77461 9.62259 9.36133M3.22363 8.81604C4.1215 7.85319 5.17169 7.04466 6.33211 6.42285M4.41406 4L18.5562 18.1421M12 19C11.4477 19 11 18.5523 11 18C11 17.4477 11.4477 17 12 17C12.5523 17 13 17.4477 13 18C13 18.5523 12.5523 19 12 19Z' stroke='%23ff0000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='&%2310;'/%3E%3C/g%3E%3C/svg%3E");
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

  var _style_elm = () => {
    return document.querySelector("#style");
  };
  if (!_style_elm()) {
    document.head.insertAdjacentHTML(
      "beforeEnd",
      _TrustScript(`<style id="style">${st}</style>`)
    );
  } else {
    _style_elm().innerHTML = _TrustScript(st);
  }

  function observeOnce(
    callback,
    targetNode = document.body,
    config = { attributes: true, childList: true, subtree: true }
  ) {
    var observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
  }

  function _remindme() {
    window.once_act = 1;

    window._is_silent =
      window._is_silent || "1" == localStorage.getItem("__issilent")
        ? 1
        : 0 || 0;

    var url =
      "https://bucket-o39pcy.s3.ap-southeast-1.amazonaws.com/cdtx.lyl.vn/assets/mp3/palomita_iphone.mp3";
    var myAudio = new Audio(url);

    window._once_play = window._once_play || 0;
    var ntime = 0;
    myAudio.addEventListener(
      "ended",
      function () {
        // console.log(ntime)
        if (ntime > 0) {
          return false;
        }
        ntime = ntime + 1;

        this.currentTime = 0;
        this.play();
      },
      false
    );

    var _play_remind = function () {
      if (window._once_play == 1) return false;
      window._once_play = 1;
      ntime = 0;

      if (window._is_silent) return false;
      myAudio.play();
    };

    test;
    _play_remind();

    window.objThongKe = window.objThongKe || {};
    window.objThongKe[formatDateV2(new Date(), "Ymd")] =
      window.objThongKe[formatDateV2(new Date(), "Ymd")] || {};
    var addTimeOver6min = (agent, strmin) => {
      // console.log('HERE', strmin.replace(/\D/g, ""))
      if (parseInt(strmin.replace(/\D/g, "")) > 6) {
        window.objThongKe[formatDateV2(new Date(), "Ymd")][agent] = 1;
      }
    };

    var uiList = () => {
      // console.log('HERE', window.objThongKe);
      try {
        var _listagent = [];
        var temp = {};

        document.querySelectorAll(".table-rows .agent").forEach((elm) => {
          temp = {
            ldap: elm.querySelector(".agent-display-ldap").innerText,
            name: elm.querySelector(".agent-display-name").innerText,
            photo: elm.querySelector(".profile-photo").getAttribute("src"),
            state: elm.querySelector(".state-text").innerText.trim(),
            time: elm.querySelector(".time").innerText.trim(),
            isme: 0,
            isperforming: elm.classList.contains("performing-agent") ? 1 : 0,
          };

          if (temp.ldap == _check_ldap()) {
            temp.isme = 1;
          }

          _listagent.push(temp);
        });

        // console.log(_listagent);

        var _li = "";
        var _n_phone = 0;
        _listagent.forEach((item) => {
          if (item.state.includes("a call")) {
            addTimeOver6min(item.ldap, item.time);
          }

          if (item.state.toLocaleLowerCase() == "phone") {
            _n_phone++;
          }

          function getCurrentTimeCompare() {
            let now = new Date();
            let hour = now.getHours();
            let minute = now.getMinutes();
            return hour + "" + minute;
          }

          var _class_alert = () => {
            if (window._is_silent) return false;

            if (
              !(
                parseInt(getCurrentTimeCompare()) < 1801 &&
                parseInt(getCurrentTimeCompare()) > 1001
              )
            )
              return "";

            if (localStorage.getItem("remindme") == 1) return;

            if (item.isme != 1) return "";
            if (item.time) {
              var _lst = item.time
                .trim()
                .replace(/[^\d ]+/g, "")
                .split(" ");
              var _min = 0;
              var _state = item.state.toLocaleLowerCase();
              if (_lst.length == 2) {
                _min = _min + parseInt(_lst[0]) * 60;
                _min = _min + parseInt(_lst[1]);
              }

              if (_lst.length == 1) {
                _min = _min + parseInt(_lst[0]);
              }

              // console.log('min', _min);

              if (_state.includes("email") || _state.includes("coffee break")) {
                return _min > 9 ? "agent_ui--alertovertime" : "";
              }

              if (_state.includes("lunch break")) {
                return _min > 59 ? "agent_ui--alertovertime" : "";
              }

              return _min;
            }
          };

          _li += `<li data-isme="${
            item.isme || 0
          }" data-state="${item.state.toLocaleLowerCase()}" class="${_class_alert()} ${
            item.isperforming ? "isperforming" : ""
          }  "  >
                      <span data-avatar="" style="background-image: url(${
                        item.photo
                      })"></span>
                      <span data-name="${item.ldap}">${item.name}</span>
                      <span data-statetime="${item.time}">${item.state}</span>
                  </li>`;

          if (item.isme == 1) {
            if (item.state.toLocaleLowerCase().includes("dialing")) {
              _play_remind();
            }

            // If have break (coffee break, lunch break, on break, email)
            if (
              item.state.toLocaleLowerCase().includes("break") ||
              item.state.toLocaleLowerCase().includes("email")
            ) {
              window._once_play = 0;
            }
          }
        });

        var _str_class = "";
        switch (_n_phone) {
          case 3:
          case 2:
            _str_class = "warning";

            break;
          case 1:
          case 0:
            _str_class = "alert";
            break;
          default:
          // code block
        }

        var _ul = _TrustScript(`<div id="agent_ui--outer" >
                <span id="agent_ui--issound" data-issilent="${
                  window._is_silent
                }" ${window._once_play == 0 ? "data-isenable" : ""} ></span>
                <span class="agent_ui--btntoggle_remindme" data-status="${
                  localStorage.getItem("remindme") == "1" ? "ok" : "no"
                }" ></span>
                <span class="agent_ui--btntestsoundalarm" >Test alarm</span>
                
              <span id="agent_ui--n_agent" class="${_str_class}" >${_n_phone}<small>${
          _listagent.length
        }</small></span>
              <ul>${_li}</ul></div>`);

        if ((_ui_agent = document.querySelector("#agent_ui"))) {
          _ui_agent.innerHTML = _ul;
        } else {
          var _ui_agent = document.createElement("div");
          _ui_agent.id = "agent_ui";
          _ui_agent.innerHTML = _ul;
          document.body.insertAdjacentElement("afterEnd", _ui_agent);
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (document.querySelectorAll(".agent-display-ldap").length) {
      uiList();
    }

    onElmClick("#agent_ui--issound[data-issilent]", (e) => {
      window._is_silent = window._is_silent ? 0 : 1;
      e.target.setAttribute("data-issilent", window._is_silent);
      localStorage.setItem("__issilent", window._is_silent);
    });

    onElmClick(".agent_ui--btntestsoundalarm", (e) => {
      e.target.classList.add("playing");
      myAudio.play();

      setTimeout(() => {
        e.target.classList.remove("playing");
      }, 5000);
    });

    // RUN
    var myTime = setInterval(() => {
      if (document.querySelectorAll(".agent-display-ldap").length) {
        clearInterval(myTime);

        observeOnce((elm) => {
          uiList();
        });
      }
    }, 500);
  }

  _remindme();
}
