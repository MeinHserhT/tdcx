if (window.location.href.includes("adwords.corp")) {
    (function () {
        const GA4_STYLE = {
            backgroundColor: "rgb(255, 229, 180)",
            borderRadius: "10px",
            fontWeight: "500",
        };
        const ADS_STYLE = {
            backgroundColor: "rgb(160, 251, 157)",
            borderRadius: "10px",
            fontWeight: "500",
        };
        const MAX_ATTEMPTS = 3;
        let attempts = 0;

        function addCopy({
            el,
            text,
            title = "Click to copy",
            okText,
            okBg = "#007bff",
            okColor = "white",
            timeout = 800,
        }) {
            Object.assign(el.style, { cursor: "pointer", userSelect: "none" });
            el.title = title;

            if (el.dataset.copyListener) return;
            el.dataset.copyListener = true;

            el.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();

                navigator.clipboard.writeText(text).then(() => {
                    const { backgroundColor: origBg, color: origColor } =
                        el.style;
                    const origText = el.textContent;

                    Object.assign(el.style, {
                        backgroundColor: okBg,
                        color: okColor,
                    });
                    if (okText) el.textContent = okText;

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

        function extractDetails(data) {
            let type = null,
                label = null;
            const typeId = data[11];

            if (typeId === 1) {
                type = "Ads Conversion: ";
                label = data[64]?.[2]?.[4]?.split("'")?.[7]?.split("/")?.[1];
            } else if (typeId === 32) {
                type = "GA4: ";
                label = data[64]?.[1]?.[4]?.split("'")?.[3];
            }
            return { type, label };
        }

        function showAwId(id) {
            let el = document.getElementById("gpt-aw-id-display");
            if (!el) {
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

            addCopy({
                el: el,
                text: id,
                title: "Click to copy ID",
                okText: "Copied!",
                timeout: 800,
            });
        }

        function run() {
            const dataStr =
                window.conversions_data.SHARED_ALL_ENABLED_CONVERSIONS;
            const awID = dataStr.match(/AW-(\d*)/)[1];

            document
                .querySelectorAll(".expand-more")
                .forEach((btn) => btn.click());

            const allData = JSON.parse(dataStr)[1];

            setTimeout(() => {
                document
                    .querySelectorAll(".conversion-name-cell .internal")
                    .forEach((cell) => {
                        const name = cell.innerText;
                        let type = null,
                            label = "no label";

                        const row = cell.closest(".particle-table-row");
                        if (row) {
                            const srcEl = row.querySelector(
                                '[essfield="aggregated_conversion_source"]'
                            );
                            if (!srcEl?.innerText.match(/.*web.*/gi)) {
                                row.remove();
                                return;
                            }
                        }

                        const match = allData.find((d) => d[1] === name);
                        if (match) {
                            ({ type, label } = extractDetails(match));
                        }

                        if (type) {
                            cell.innerHTML = `${label}`;
                            const style =
                                type === "GA4: " ? GA4_STYLE : ADS_STYLE;
                            Object.assign(cell.style, style);

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

            showAwId(awID);
        }

        function poll() {
            if (
                typeof window.conversions_data !== "undefined" &&
                window.conversions_data.SHARED_ALL_ENABLED_CONVERSIONS
            ) {
                run();
            } else if (attempts < MAX_ATTEMPTS) {
                attempts++;
                setTimeout(poll, 500);
            } else {
                console.warn(
                    "Adwords script: Could not find `conversions_data`. Aborting."
                );
            }
        }

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
