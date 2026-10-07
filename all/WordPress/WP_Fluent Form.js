(function ($) {
    window.dataLayer = window.dataLayer || [];

    $(".frm-fluent-form").on("fluentform_submission_success", function (e, res) {
        var $form = $(this),
            formData = {},
            r = res && res.response && res.response.data && res.response.data.result;

        $form.find(":input").filter(function () {
            return !$(this).closest(".has-conditions.ff_excluded").length;
        }).serializeArray().forEach(function (f) {
            var v = f.value, d = v.replace(/\D/g, "");
            formData[f.name] = formData[f.name] !== undefined ? [].concat(formData[f.name], v) : v;

            if (v.indexOf("@") !== -1) formData.email = v;
            if (d.length >= 9 && d.length <= 10) {
                formData.phone = "+84" + v.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
            }
        });

        window.dataLayer.push({
            event: "fluent_mmm",
            FluentFormID: $form.data("form_id"),
            formData: formData,
            serverResponse: (r && r.message) || ""
        });
    });
})(jQuery);