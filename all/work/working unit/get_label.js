if (window.location.href.includes("adwords.corp")) {
    (() => {
        const CONFIG = {
            MAX_TRIES: 3,
            POLL_INTERVAL: 500,
            PROCESS_DELAY: 1000,
            STYLES: {
                GA4: {
                    backgroundColor: "rgb(255, 229, 180)",
                    borderRadius: "10px",
                    fontWeight: "500",
                },
                ADS: {
                    backgroundColor: "rgb(160, 251, 157)",
                    borderRadius: "10px",
                    fontWeight: "500",
                },
                UI_OVERLAY: {
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
                    cursor: "pointer",
                    userSelect: "none",
                },
            },
        };

        const parseConversionData = (data) => {
            const typeId = data[11];
            const rawLabelStr = data[64];

            if (typeId === 1) {
                const label = rawLabelStr?.[2]?.[4]
                    ?.split("'")?.[7]
                    ?.split("/")?.[1];
                return { type: "ADS", label: label ?? "no label" };
            }

            if (typeId === 32) {
                const label = rawLabelStr?.[1]?.[4]?.split("'")?.[3];
                return { type: "GA4", label: label ?? "no label" };
            }

            return { type: null, label: "no label" };
        };

        const setupCopyFeature = (
            el,
            { text, title, okText, timeout = 800 }
        ) => {
            if (el.dataset.copyListener) return;
            el.dataset.copyListener = "true";

            el.style.cursor = "pointer";
            el.style.userSelect = "none";
            el.title = title;

            el.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();

                try {
                    await navigator.clipboard.writeText(text);
                    const originalBg = el.style.backgroundColor;
                    const originalColor = el.style.color;
                    const originalContent = el.textContent;

                    Object.assign(el.style, {
                        backgroundColor: "#007bff",
                        color: "white",
                    });
                    if (okText) el.textContent = okText;

                    setTimeout(() => {
                        Object.assign(el.style, {
                            backgroundColor: originalBg,
                            color: originalColor,
                        });
                        if (okText) el.textContent = originalContent;
                    }, timeout);
                } catch (err) {
                    console.error("Copy failed", err);
                }
            });
        };

        const updateUIOverlay = (id) => {
            let el = document.getElementById("gpt-aw-id-display");
            if (!el) {
                el = document.createElement("div");
                el.id = "gpt-aw-id-display";
                Object.assign(el.style, CONFIG.STYLES.UI_OVERLAY);
                document.body.appendChild(el);
            }

            el.textContent = `AW-ID: ${id}`;
            setupCopyFeature(el, {
                text: id,
                title: "Click to copy ID",
                okText: "Copied!",
            });
        };

        const processRows = (dataMap) => {
            const cells = document.querySelectorAll(
                ".conversion-name-cell .internal"
            );

            cells.forEach((cell) => {
                const row = cell.closest(".particle-table-row");
                if (row) {
                    const sourceField = row.querySelector(
                        '[essfield="aggregated_conversion_source"]'
                    );
                    if (!sourceField?.innerText.toLowerCase().includes("web")) {
                        row.remove();
                        return;
                    }
                }

                const match = dataMap.get(cell.innerText);
                if (!match) return;

                const { type, label } = parseConversionData(match);
                if (type && label !== "no label") {
                    cell.innerHTML = label;
                    Object.assign(cell.style, CONFIG.STYLES[type]);

                    setupCopyFeature(cell, {
                        text: label,
                        title: "Click to copy label",
                        timeout: 500,
                    });
                }
            });

            document
                .querySelectorAll(
                    "category-conversions-container-view, conversion-goal-card"
                )
                .forEach((container) => {
                    const hasRows = !!container.querySelector(
                        ".particle-table-row"
                    );
                    if (!hasRows) container.style.display = "none";
                });
        };

        const initialize = () => {
            const rawData =
                window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS;
            if (!rawData) return;

            const awId = rawData.match(/AW-(\d*)/)?.[1];
            if (!awId) {
                console.warn("AW-ID not found.");
                return;
            }

            document
                .querySelectorAll(".expand-more")
                .forEach((btn) => btn.click());

            try {
                const parsedEntries = JSON.parse(rawData)[1];
                const dataMap = new Map(
                    parsedEntries.map((entry) => [entry[1], entry])
                );

                setTimeout(() => processRows(dataMap), CONFIG.PROCESS_DELAY);
                updateUIOverlay(awId);
            } catch (e) {
                console.error("Data parsing failed", e);
            }
        };

        let attempts = 0;
        const poll = () => {
            const isDataReady =
                window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS;

            if (isDataReady) {
                initialize();
            } else if (attempts < CONFIG.MAX_TRIES) {
                attempts++;
                setTimeout(poll, CONFIG.POLL_INTERVAL);
            }
        };

        if (["complete", "interactive"].includes(document.readyState)) {
            poll();
        } else {
            window.addEventListener("DOMContentLoaded", poll);
        }
    })();
}
