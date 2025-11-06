document.addEventListener("wpcf7mailsent", function (e) {
    dataLayer.push({
        event: "gui_form",
        formID: e.detail,
    });
});

// -----------------------------------------------------------------------------
document.addEventListener("wpcf7mailsent", function (e) {
    var a = e.detail.inputs.find(function (e) {
        return e.name.includes("email");
    });
    if (a.value) {
        dataLayer.push({
            event: "data",
            email: a.value,
        });

        dataLayer.push({
            event: "gui_form",
            formID: e.detail.contactFormId,
        });
    }
});

document.addEventListener("wpcf7mailsent", function (e) {
    var a = e.detail.inputs.find(function (e) {
        return e.name.includes("email");
    });
    a.value &&
        dataLayer.push({
            event: "gui_form",
            formID: e.detail.contactFormId,
            email: a.value,
        });
});
// -----------------------------------------------------------------------------
document.addEventListener("wpcf7mailsent", function (e) {
    var b = e.detail.inputs.find(function (n) {
        return n.name.includes("phone");
    });
    b.value &&
        dataLayer.push({
            event: "gui_form",
            formID: e.detail.contactFormId,
            phone: "+84" + b.value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, ""),
        });
});

dataLayer.push({
    email: document.querySelector("[type='email']").value,
});

document.addEventListener("wpcf7mailsent", function (e) {
    var a = e.detail.inputs.find(function (i) {
        return i.name.includes("email");
    })?.value;
    var b = e.detail.inputs.find(function (i) {
        return i.name.includes("phone");
    })?.value;

    (a || b) &&
        dataLayer.push({
            event: "gui_form",
            formID: e.detail.contactFormId,
            email: a || "",
            phone: b ? "+84" + b.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "") : "",
        });
});

