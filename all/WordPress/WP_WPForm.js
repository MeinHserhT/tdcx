$("form.wpforms-validate.wpforms-form.wpforms-ajax-form").on(
  "wpformsAjaxSubmitSuccess",
  function (event) {
    var formId = $(event.target).attr("data-formid");

    dataLayer.push({
      event: "form_submission",
      formId: formId,
    });
  }
);
