jQuery(document).ready(function ($) {
    $(document).on('submit_success', function (evt) {
        console.log(evt); // check exact code to get email
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event': 'lead_form',
            'email': evt.target.querySelector('input[type="email"]').value,
            'phone_number': evt.target.querySelector('input[placeholder="Phone"]').value,
            'eventCategory': 'Form',
            'eventAction': evt.target.name,
            'eventLabel': 'Submission'
        });
    });
});
