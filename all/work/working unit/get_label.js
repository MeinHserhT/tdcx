if (window.location.href.includes("adwords.corp")) {
    (() => {
        const ga4Style = {
            backgroundColor: "rgb(255, 229, 180)",
            borderRadius: "10px",
            fontWeight: "500",
        };
        const adsStyle = {
            backgroundColor: "rgb(160, 251, 157)",
            borderRadius: "10px",
            fontWeight: "500",
        };
        const maxTries = 3;
        let tries = 0;

        const initCopy = ({
            el,
            text,
            title = "Click to copy",
            okText,
            okBg = "#007bff",
            okColor = "white",
            timeout = 800,
        }) => {
            if (el.dataset.copyListener) return;
            el.dataset.copyListener = true;

            Object.assign(el.style, {
                cursor: "pointer",
                userSelect: "none"
            });
            el.title = title;

            el.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();

                navigator.clipboard.writeText(text).then(() => {
                    const {
                        backgroundColor: origBg,
                        color: origColor
                    } =
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
        };

        const getDetails = (data) => {
            let type = null,
                label = null;
            const typeId = data[11];

            if (typeId === 1) {
                type = "Ads Conversion: ";
                const labelStr = data[64]?.[2]?.[4];
                label = labelStr?.split("'")?.[7]?.split("/")?.[1];
            } else if (typeId === 32) {
                type = "GA4: ";
                const labelStr = data[64]?.[1]?.[4];
                label = labelStr?.split("'")?.[3];
            }
            return {
                type,
                label: label || "no label"
            };
        };

        const showAwId = (id) => {
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
            initCopy({
                el: el,
                text: id,
                title: "Click to copy ID",
                okText: "Copied!",
                timeout: 800,
            });
        };

        const processRows = (dataMap) => {
            document
                .querySelectorAll(".conversion-name-cell .internal")
                .forEach((cell) => {
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

                    const name = cell.innerText;
                    const match = dataMap.get(name);

                    if (match) {
                        const {
                            type,
                            label
                        } = getDetails(match);

                        if (type && label !== "no label") {
                            cell.innerHTML = `${label}`;
                            const style =
                                type === "GA4: " ? ga4Style : adsStyle;
                            Object.assign(cell.style, style);

                            initCopy({
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
        };

        const run = () => {
            const dataStr =
                window.conversions_data.SHARED_ALL_ENABLED_CONVERSIONS;
            const awId = dataStr.match(/AW-(\d*)/)?.[1];

            if (!awId) {
                console.warn("Adwords script: Could not find AW-ID.");
                return;
            }

            document
                .querySelectorAll(".expand-more")
                .forEach((btn) => btn.click());

            const allData = JSON.parse(dataStr)[1];
            const dataMap = new Map(allData.map((d) => [d[1], d]));

            setTimeout(() => processRows(dataMap), 1000);

            showAwId(awId);
        };

        const poll = () => {
            if (
                typeof window.conversions_data !== "undefined" &&
                window.conversions_data.SHARED_ALL_ENABLED_CONVERSIONS
            ) {
                run();
            } else if (tries < maxTries) {
                tries++;
                setTimeout(poll, 500);
            } else {
                console.warn(
                    "Adwords script: Could not find `conversions_data`. Aborting."
                );
            }
        };

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