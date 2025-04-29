function a() {
  var e,
    t,
    r = JSON.parse(conversions_data.SHARED_ALL_ENABLED_CONVERSIONS)[1],
    o = JSON.parse(conversions_data.CT_CUSTOMER)[1][0][2][1],
    l = null;
  function n(e) {
    var t,
      r,
      o,
      l,
      n = null,
      s = null;
    return (
      1 == e[11] &&
        ((n = "Ads Conversion: "),
        (s =
          ((t = e),
          (r = t[64][2][4].split("'")[7].split("/")),
          r ? r[1] : null))),
      32 == e[11] &&
        ((n = "GA4: "),
        (s =
          ((o = e),
          (l = o[64][1][4].match(/gtag\('event',\s*'([^']+)'/)),
          l ? l[1] : null))),
      { type_cv: n, label_event: s }
    );
  }
  function s(e) {
    if (document.querySelector("#toast")) {
      (document.querySelector("#toast").style.display = "block"),
        (document.querySelector("#toast").style.opacity = "1");
      return;
    }
    var t = document.createElement("div");
    (t.id = "toast"),
      (t.style.position = "fixed"),
      (t.style.backgroundColor = "#fff"),
      (t.style.color = "#333"),
      (t.style.padding = "45px"),
      (t.style.border = "2px solid #ccc"),
      (t.style.bold = 700),
      (t.style.borderRadius = "8px"),
      (t.style.boxShadow = "0px 1px 2px 0px rgba(60,64,67,0.3),"),
      (t.style.zIndex = "1000"),
      (t.style.opacity = "0"),
      (t.style.transition = "opacity 0.5s"),
      (t.innerHTML = e),
      (t.style.position = "fixed"),
      (t.style.top = "50%"),
      (t.style.left = "50%"),
      (t.style.transform = "translate(-50%,-50%)"),
      document.body.appendChild(t),
      (t.style.opacity = "1"),
      setTimeout(() => {
        (t.style.opacity = "0"),
          setTimeout(() => {
            t && t.parentElement && document.body.removeChild(t);
          }, 500);
      }, 2e3);
  }
  (e = "Conversion ID: " + o + "\n"),
    (t = "All Copied\n"),
    r.forEach((t) => {
      var { type_cv: r, label_event: o } = n(t);
      o || (e += r + " " + t[3] + ": " + o + "\n");
    }),
    e || (t = "CID Not found"),
    l ||
      (function e(t) {
        document
          .querySelectorAll(".conversion-name-cell .internal")
          .forEach((e) => {
            let r = e.innerText;
            var o = "",
              i = "no label",
              c = "";
            for (let y = 0; y < t.length; y++)
              if (t[y][1] == r) {
                (c = t[y]), ({ type_cv: o, label_event: i } = n(c));
                break;
              }
            if ("GA4: " == o)
              (e.innerHTML = `<span id="copy-icon-${r}" style="cursor: pointer; font-size: 1.5em;">💹</span> ${i}`),
                (e.style.backgroundColor = "rgb(255, 229, 180)"),
                (e.style.borderRadius = "10px"),
                (e.style.fontWeight = 700);
            else if (o) {
              e.innerHTML = `<span id="copy-icon-${r}" style="cursor: pointer; font-size: 1.5em;">📋</span> ${i}`;
              var p = document.querySelector(`#copy-icon-${r}`);
              (p.style.cursor = "pointer"),
                (e.style.backgroundColor = "rgb(160, 251, 157)"),
                (e.style.borderRadius = "10px"),
                (e.style.fontWeight = 700),
                p.addEventListener("click", function () {
                  var e = c[3] + " " + i;
                  navigator.clipboard.writeText(e),
                    s(e + "<br><br>Copied"),
                    (l = !0);
                });
            }
            var d = e.closest(".particle-table-row");
            d
              .querySelector('[essfield="aggregated_conversion_source"]')
              .innerText.match(/.*web.*/gi) || d.remove();
          });
        let r = document.querySelectorAll(
          "category-conversions-container-view"
        );
        r.forEach((e) => {
          let t = e.querySelector(".ess-table-wrapper"),
            r = t.querySelectorAll(".particle-table-row");
          0 === r.length && (e.style.display = "none");
        });
      })(r),
    navigator.clipboard
      .writeText(e)
      .then(() => {
        s(t);
      })
      .catch(() => {
        s("Error copy!");
      });
}
