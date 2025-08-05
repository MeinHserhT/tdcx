(function () {
  function convertNinjaFieldsToInputs(fields) {
    var inputs = {};
    for (var key in fields) {
      if (fields.hasOwnProperty(key)) {
        var label = fields[key].label;
        var slug = label.toLowerCase().replace(/ /g, "_");
        var value = fields[key].value;

        if (slug === "phone") {
          value = value.replace(/[\(\)\s-]/g, "");
          if (value.startsWith("0")) {
            value = "+84" + value.slice(1, value.length);
          } else {
            value = "+84" + value;
          }
        }
        inputs[slug] = value;
      }
    }
    return inputs;
  }

  jQuery(document).on(
    "nfFormSubmitResponse",
    function (event, responseData, id) {
      dataLayer.push({
        event: "ninja_form_submit",
        form_id: responseData.id,
        inputs: convertNinjaFieldsToInputs(responseData.response.data.fields),
      });
    }
  );
})();


//Ninja Form
jQuery(document).ready(function() {
  jQuery(document).on('nfFormSubmitResponse', function(event, response, id) {
    window.emailNFEC = response.response.data.fields["6"].value;
    dataLayer.push({
        'event': 'ninjaFormSubmission',
        'NFformID': response.id,    
      });
  });
});