(() => {

    if (location.hostname !== "cases.connect.corp.google.com") return;


    const getConfig = (key, defaultValue, promptMsg = null) => {
        let val = localStorage.getItem(key);
        if (!val && promptMsg) val = prompt(promptMsg);
        val = (val || defaultValue).trim();
        localStorage.setItem(key, val);
        return val;
    };


    const createTrustedHTML = (html) => {
        if (window.trustedTypes && window.trustedTypes.createPolicy) {
            const policy = trustedTypes.createPolicy("foo-static", {
                createHTML: (str) => str,
            });
            return policy.createHTML(html);
        }
        return html; 
    };

    const init = () => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const node = selection.getRangeAt(0).startContainer.parentNode;
        if (!node.closest("[contenteditable]")) return;

        const name = getConfig(
            "__signature_yourname",
            "",
            "Enter your name (it will save to localStorage):"
        );
        const logo = getConfig(
            "__signature_logo_gv2",
            "https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOO8Sb3VSgIBrfRYvW6cUA"
        );
        const team = getConfig("__signature_team", "Technical Solutions Team");
        const company = getConfig(
            "__signature_company",
            "TDCX, on behalf of Google"
        );

        // 5. Build the HTML signature
        const nameHtml = name
            ? `<span data-infosetting="your-name" data-highlight="need_recheck">${name}</span>`
            : "";
        const signatureHtml = `
            <table data-tableid="${Date.now()}">
                <tbody>
                    <tr>
                        <td width="64px">
                            <img src="${logo}" width="64px" height="64px">
                        </td>
                        <td width="10px"></td>
                        <td>
                            <p style="font-size: 14px; font-family:Roboto,sans-serif;margin: 0;line-height: 1.3;">
                                ${nameHtml}<br>
                                <span style="font-style: italic; font-size: 90%">${team}</span><br>
                                <span style="font-style: italic; font-size: 90%">${company}</span>
                            </p>
                        </td>
                    </tr>
                </tbody>
            </table>`;

        // 6. Inject the signature at the cursor natively
        document.execCommand(
            "insertHTML",
            false,
            createTrustedHTML(signatureHtml)
        );
    };

    init();
})();
