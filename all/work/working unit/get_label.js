if (window.location.href.includes("adwords.corp")) {
    (() => {
        const STYLES = `
            .aw-ga4 { background-color: rgb(255, 229, 180); border-radius: 10px; font-weight: 500; cursor: pointer; user-select: none; }
            .aw-ads { background-color: rgb(160, 251, 157); border-radius: 10px; font-weight: 500; cursor: pointer; user-select: none; }
            .aw-copied { background-color: #007bff !important; color: white !important; }
            #gpt-aw-overlay { position: fixed; bottom: 16px; left: 16px; z-index: 999; padding: 8px 12px; background: rgba(0,0,0,0.75); color: white; border: none; border-radius: 4px; font-size: 14px; font-weight: bold; font-family: monospace; box-shadow: 0 4px 8px rgba(0,0,0,0.2); cursor: pointer; transition: background-color 0.3s ease; user-select: none; }
        `;

        const setupCopy = (el, text, tempText = null) => {
            if (el.dataset.cp) return;
            el.dataset.cp = "1";
            el.title = "Click to copy";

            el.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    await navigator.clipboard.writeText(text);
                    const origText = el.textContent;

                    el.classList.add("aw-copied");
                    if (tempText) el.textContent = tempText;

                    setTimeout(() => {
                        el.classList.remove("aw-copied");
                        if (tempText) el.textContent = origText;
                    }, 800);
                } catch (err) {
                    console.error("Copy failed", err);
                }
            });
        };

        const init = (rawData) => {
            document.head.insertAdjacentHTML(
                "beforeend",
                `<style>${STYLES}</style>`
            );

            const awId = rawData.match(/AW-(\d*)/)?.[1];
            if (awId) {
                const overlay =
                    document.getElementById("gpt-aw-overlay") ||
                    document.createElement("div");
                overlay.id = "gpt-aw-overlay";
                overlay.textContent = `AW-${awId}`;
                setupCopy(overlay, awId, "Copied!");
                if (!overlay.parentNode) document.body.appendChild(overlay);
            } else {
                console.warn("AW-ID not found.");
            }

            document
                .querySelectorAll(".expand-more")
                .forEach((btn) => btn.click());

            try {
                const dataMap = new Map(
                    JSON.parse(rawData)[1].map((entry) => [entry[1], entry])
                );

                setTimeout(() => {
                    // Process Rows
                    document
                        .querySelectorAll(".conversion-name-cell .internal")
                        .forEach((cell) => {
                            const row = cell.closest(".particle-table-row");
                            if (
                                row &&
                                !row
                                    .querySelector(
                                        '[essfield="aggregated_conversion_source"]'
                                    )
                                    ?.innerText.toLowerCase()
                                    .includes("web")
                            ) {
                                return row.remove();
                            }

                            const data = dataMap.get(cell.innerText);
                            if (!data) return;

                            let type, label;
                            const tId = data[11],
                                rawLbl = data[64];

                            if (tId === 1) {
                                type = "aw-ads";
                                label = rawLbl?.[2]?.[4]
                                    ?.split("'")?.[7]
                                    ?.split("/")?.[1];
                            } else if (tId === 32) {
                                type = "aw-ga4";
                                label = rawLbl?.[1]?.[4]?.split("'")?.[3];
                            }

                            if (type && label) {
                                cell.innerHTML = label;
                                cell.classList.add(type);
                                setupCopy(cell, label);
                            }
                        });

                    // Hide empty containers
                    document
                        .querySelectorAll(
                            "category-conversions-container-view, conversion-goal-card"
                        )
                        .forEach((c) => {
                            if (!c.querySelector(".particle-table-row"))
                                c.style.display = "none";
                        });
                }, 1000); // PROCESS_DELAY
            } catch (e) {
                console.error("Data parsing failed", e);
            }
        };

        const poll = (tries = 0) => {
            const rawData =
                window.conversions_data?.SHARED_ALL_ENABLED_CONVERSIONS;
            if (rawData) return init(rawData);
            if (tries < 3) setTimeout(() => poll(tries + 1), 500);
        };

        ["complete", "interactive"].includes(document.readyState)
            ? poll()
            : window.addEventListener("DOMContentLoaded", () => poll());
    })();
}
