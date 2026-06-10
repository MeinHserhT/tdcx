(function ($) {
    // 1. Guard clause: Ensure dataLayer exists so .push() doesn't throw an error
    window.dataLayer = window.dataLayer || [];

    $(".frm-fluent-form").each(function () {
        var $form = $(this);
        var FluentFormID = $form.data("form_id");

        // Push Form View
        window.dataLayer.push({
            event: "FluentFormActivities",
            eventCategory: "FluentForm",
            eventAction: "FormView",
            FluentFormID: FluentFormID,
        });

        // Listen for successful submission
        $form.on("fluentform_submission_success", function (event, data) {
            var formSubmittedData = {};

            // 2. Filter and serialize the form inputs
            var serializedData = $form
                .find(":input")
                .filter(function (i, el) {
                    // Optimized jQuery selector check
                    return !$(el).closest(".has-conditions.ff_excluded").length;
                })
                .serializeArray();

            // 3. Build the data object using $.each for ES5 safety
            $.each(serializedData, function (index, field) {
                var name = field.name;
                var value = field.value;
                var existing = formSubmittedData[name];

                // Elegant array builder: concatenates values into an array if duplicates exist
                formSubmittedData[name] =
                    existing !== undefined ? [].concat(existing, value) : value;
            });

            // 4. Fallback to strict ES5 object property checking (since optional chaining '?.' is ES6+)
            var serverResponse =
                data &&
                data.response &&
                data.response.data &&
                data.response.data.result &&
                data.response.data.result.message
                    ? data.response.data.result.message
                    : "";

            // Push Form Submitted
            window.dataLayer.push({
                event: "FluentFormActivities",
                eventCategory: "FluentForm",
                eventAction: "FormSubmitted",
                FluentFormID: FluentFormID,
                formSubmittedData: formSubmittedData,
                serverResponse: serverResponse,
            });
        });
    });
})(jQuery);
