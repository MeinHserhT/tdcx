function extractConversionDetails(conversionData) {
    var type = null,
        label = null;

    // Check for Ads Conversion (type 11)
    if (1 == conversionData[11]) {
        type = "Ads Conversion: ";
        label = conversionData[64][2][4]?.split("'")[7].split("/")[1];
    }
    // Check for GA4 (type 32)
    if (32 == conversionData[11]) {
        type = "GA4: ";
        label = conversionData[64][1][4]?.split("'")[3];
    }
    return { type_cv: type, label_event: label };
}
document.querySelectorAll(".expand-more").forEach((button) => {
    button.click();
});

setTimeout(
    (function (allConversionData) {
        document
            .querySelectorAll(".conversion-name-cell .internal")
            .forEach((cellElement) => {
                let conversionName = cellElement.innerText;
                var conversionType = "",
                    conversionLabel = "no label",
                    matchedData = null;

                for (let i = 0; i < allConversionData.length; i++) {
                    if (allConversionData[i][1] == conversionName) {
                        matchedData = allConversionData[i];
                        ({
                            type_cv: conversionType,
                            label_event: conversionLabel,
                        } = extractConversionDetails(matchedData));
                        break;
                    }
                }

                // --- Modify DOM based on conversion type ---
                if ("GA4: " == conversionType) {
                    cellElement.innerHTML = `<span style="font-size: 1.5em;">💹</span> ${conversionLabel}`;
                    cellElement.style.backgroundColor = "rgb(255, 229, 180)"; // Yellowish
                    cellElement.style.borderRadius = "10px";
                    cellElement.style.fontWeight = 500;
                } else if (conversionType) {
                    // i.e., "Ads Conversion: "
                    cellElement.innerHTML = `<span style="font-size: 1.5em;">📋</span> ${conversionLabel}`;
                    cellElement.style.backgroundColor = "rgb(160, 251, 157)"; // Greenish
                    cellElement.style.borderRadius = "10px";
                    cellElement.style.fontWeight = 500;
                }

                // Filter table: Remove rows that aren't 'web' conversions
                var tableRow = cellElement.closest(".particle-table-row");
                if (tableRow) {
                    let sourceElement = tableRow.querySelector(
                        '[essfield="aggregated_conversion_source"]'
                    );
                    if (
                        sourceElement &&
                        !sourceElement.innerText.match(/.*web.*/gi)
                    ) {
                        tableRow.remove();
                    }
                }
            });

        // Hide empty category containers
        document
            .querySelectorAll("category-conversions-container-view")
            .forEach((container) => {
                if (!container.querySelectorAll(".particle-table-row").length) {
                    container.style.display = "none";
                }
            });
    })(JSON.parse(conversions_data.SHARED_ALL_ENABLED_CONVERSIONS)[1]),
    1000
); // Pass data into IIFE
