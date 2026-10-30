$("form.wpforms-validate.wpforms-form.wpforms-ajax-form").on(
  "wpformsAjaxSubmitSuccess",
  function (event) {
    var $form = $(event.target);
    var formId = $form.attr("data-formid");
    var formData = {};

    // Lặp qua tất cả input/textarea có name thuộc wpforms[fields]
    $form.find(":input[name^='wpforms[fields]']").each(function () {
      var nameAttr = $(this).attr("name");
      var fieldIdMatch = nameAttr ? nameAttr.match(/\[fields\]\[(\d+)\]/) : null;

      if (fieldIdMatch && fieldIdMatch[1]) {
        var fieldId = fieldIdMatch[1];
        formData["field_" + fieldId] = $(this).val();
      }
    });

    dataLayer.push({
      event: "form_submission",
      formId: formId,
      formData: formData,
    });
  }
);