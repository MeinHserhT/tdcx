
const STORAGE_KEYS = {
    NAME: "__signature_name",
    LOGO: "__logo",
    TEAM: "__team",
    COMP: "__comp",
};

const DEFAULTS = {
    LOGO: "https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOO8Sb3VSgIBrfRYvW6cUA",
    TEAM: "Technical Solutions Team",
    COMP: "TDCX, on behalf of Google",
};

let userName = localStorage.getItem(STORAGE_KEYS.NAME);
if (!userName) {
    userName =
        prompt("Enter your name (it will save to localStorage): ")?.trim() ||
        "";
    if (userName) localStorage.setItem(STORAGE_KEYS.NAME, userName);
}

const getOrSet = (key, defaultValue) => {
    let value = localStorage.getItem(key);
    if (!value) {
        value = defaultValue;
        localStorage.setItem(key, value);
    }
    return value;
};

const logo = getOrSet(STORAGE_KEYS.LOGO, DEFAULTS.LOGO);
const team = getOrSet(STORAGE_KEYS.TEAM, DEFAULTS.TEAM);
const comp = getOrSet(STORAGE_KEYS.COMP, DEFAULTS.COMP);

const signatureHTML = `
<table style="border-collapse: collapse;">
    <tbody>
        <tr>
            <td style="width: 64px; vertical-align: top;">
                <img src="${logo}" width="64" height="64" style="display: block; border-radius: 4px;">
            </td>
            <td style="width: 10px;"></td>
            <td style="vertical-align: middle;">
                <p style="font-size: 14px; font-family: Roboto, sans-serif; margin: 0; line-height: 1.4; color: #3c4043;">
                    <strong data-infosetting="your-name" style="font-size: 110%;">${userName}</strong>
                    <br><span style="font-style: italic; color: #70757a;">${team}</span>
                    <br><span style="font-style: italic; color: #70757a;">${comp}</span>
                </p>
            </td>
        </tr>
    </tbody>
</table>`;

// 4. Injection
const targetTable = document.querySelector('table[width="348"]');
targetTable.innerHTML = signatureHTML;
