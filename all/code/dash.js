function a() {
  function detectType_and_getLabel(CV_array) {
    var type_cv = null,
      label_event = null;
    if (CV_array[11] == 1) {
      type_cv = "Ads Conversion: ";
      label_event = CV_array[64][2][4]?.split("'")[7].split("/")[1];
    }
    if (CV_array[11] == 32) {
      type_cv = "GA4: ";
      label_event = CV_array[64][1][4]?.split("'")[3];
    }
    return { type_cv, label_event };
  }
  function replace_to_label(all_cv_data) {
    document
      .querySelectorAll(".conversion-name-cell .internal")
      .forEach((element) => {
        const cv_uniquNo = element.innerText;
        var type_cv = "",
          label_event = "no label",
          target_Object = "";

        for (let i = 0; i < all_cv_data.length; i++) {
          if (all_cv_data[i][1] == cv_uniquNo) {
            target_Object = all_cv_data[i];
            ({ type_cv, label_event } = detectType_and_getLabel(target_Object));
            break;
          }
        }
        if (type_cv == "GA4: ") {
          element.innerHTML = `<span id="copy-icon-${cv_uniquNo}" style="cursor: pointer; font-size: 1.5em;">💹</span> ${label_event}`;
          element.style.backgroundColor = "rgb(255, 229, 180)";
          element.style.borderRadius = "10px";
          element.style.fontWeight = 500;
        } else if (type_cv) {
          element.innerHTML = `<span id="copy-icon-${cv_uniquNo}" style="cursor: pointer; font-size: 1.5em;">📋</span> ${label_event}`;
          var copy_icon = document.querySelector(`#copy-icon-${cv_uniquNo}`);
          copy_icon.style.cursor = "pointer";
          element.style.backgroundColor = "rgb(160, 251, 157)";
          element.style.borderRadius = "10px";
          element.style.fontWeight = 500;

          copy_icon.addEventListener("click", function () {
            var copy_content = label_event;
            navigator.clipboard.writeText(copy_content);
            var modal_msg = copy_content + "<br><br>Copied";
            showToast(modal_msg);
            Flag_innerText_replace = true;
          });
        }
        var row = element.closest(".particle-table-row");
        row
          .querySelector('[essfield="aggregated_conversion_source"]')
          .innerText.match(/.*web.*/gi) || row.remove();
      });
    const categoryContainers = document.querySelectorAll(
      "category-conversions-container-view"
    );

    categoryContainers.forEach((container) => {
      const table = container.querySelector(".ess-table-wrapper");
      const rows = table.querySelectorAll(".particle-table-row");
      rows.length === 0 && (container.style.display = "none");
    });
  }
  function showToast(modal_msg) {
    if (document.querySelector("#toast")) {
      document.querySelector("#toast").style.display = "block";
      document.querySelector("#toast").style.opacity = "1";
      return;
    }
    var toast = document.createElement("div");
    toast.id = "toast";
    toast.style.position = "fixed";
    toast.style.backgroundColor = "#fff";
    toast.style.color = "#333";
    toast.style.padding = "45px";
    toast.style.border = "2px solid #ccc";
    toast.style.bold = 700;
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0px 1px 2px 0px rgba(60,64,67,0.3),";
    toast.style.zIndex = "1000";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.5s";
    toast.innerHTML = modal_msg;
    toast.style.top = "50%";
    toast.style.left = "50%";
    toast.style.transform = "translate(-50%,-50%)";
    document.body.appendChild(toast);

    toast.style.opacity = "1";

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => {
        if (toast && toast.parentElement) {
          document.body.removeChild(toast);
        }
      }, 500);
    }, 2000);
  }

  function showConvID(conversion_id) {
    var css = `.spinner { animation: rotate 1s linear infinite; }
    @keyframes rotate {
      to { transform: rotate(360deg); }
    }`,
      head = document.head || document.getElementsByTagName("head")[0],
      style = document.createElement("style");

    head.appendChild(style);
    style.type = "text/css";
    style.appendChild(document.createTextNode(css));

    var convid = document.createElement("div");
    convid.id = "convid";
    convid.className = "spinner";
    convid.style.position = "absolute";
    convid.style.backgroundColor = "transparent";
    convid.style.color = "black";
    convid.style.fontWeight = "bold";
    convid.style.fontSize = "2em";
    convid.style.zIndex = "1000";
    convid.innerHTML = conversion_id;
    convid.style.bottom = "128px";
    convid.style.left = "128px";
    document.body.appendChild(convid);
  }

  function show_cv_label_event() {
    var result_text = "Conversion ID: " + conversion_id + "\n";
    var modal_msg = "All Copied\n";

    all_cv_data.forEach((CV_array) => {
      var { type_cv, label_event } = detectType_and_getLabel(CV_array);
      if (!label_event)
        result_text += type_cv + " " + CV_array[3] + ": " + label_event + "\n";
    });

    if (!result_text) modal_msg = "CID Not found";
    if (!Flag_innerText_replace) replace_to_label(all_cv_data);
    navigator.clipboard
      .writeText(result_text)
      .then(() => {
        showToast(modal_msg);
      })
      .catch(() => {
        showToast("Error copy!");
      });
  }
  var all_cv_data = JSON.parse(
    conversions_data.SHARED_ALL_ENABLED_CONVERSIONS
  )[1];
  var conversion_id = JSON.parse(conversions_data.CT_CUSTOMER)[1][0][2][1];
  var Flag_innerText_replace = null;
  showConvID(conversion_id);
  show_cv_label_event();
}
