(function ($) {
    window.dataLayer = window.dataLayer || [];

    $(".frm-fluent-form").each(function () {
        var $form = $(this);
        var FluentFormID = $form.data("form_id");

        $form.on("fluentform_submission_success", function (event, data) {
            var formData = {};

            var serializedData = $form
                .find(":input")
                .filter(function (i, el) {
                    return !$(el).closest(".has-conditions.ff_excluded").length;
                })
                .serializeArray();

            $.each(serializedData, function (index, field) {
                var name = field.name;
                var value = field.value;
                var existing = formData[name];


                formData[name] =
                    existing !== undefined ? [].concat(existing, value) : value;

                if (typeof value === 'string' && value.trim() !== '') {
                    if (value.indexOf('@') !== -1) {
                        formData['email'] = value;
                    }

                    var digitsOnly = value.replace(/\D/g, '');
                    if (digitsOnly.length >= 9 && digitsOnly.length <= 10) {
                        formData['phone'] = "+84" + value.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
                    }
                }
            });

            var serverResponse =
                data &&
                    data.response &&
                    data.response.data &&
                    data.response.data.result &&
                    data.response.data.result.message
                    ? data.response.data.result.message
                    : "";

            window.dataLayer.push({
                event: "fluent_formmm",
                FluentFormID: FluentFormID,
                formData: formData,
                serverResponse: serverResponse,
            });
        });
    });
})(jQuery);