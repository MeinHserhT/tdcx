var phone_number = document.querySelector('#text-1693820847472').value;
var email = document.querySelector('#email').value;

function phoneValidation(input) {
    var phoneRegex = /^\d{10}|^\d{11}/gi
    return phoneRegex.test(input)
};

function emailValidation(input) {
    var emailRegex = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/
    return emailRegex.test(email)
};

if(phoneValidation(phone_number) && emailValidation(email)){
    var phone;
    if(phone_number.startsWith('0')) {
        phone = "+84" + phone_number.slice(1, phone_number.length);
    } else {
        phone = "+84" + phone_number;
    };

    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
        'event': 'form_sm',
        'phone': phone,
        'email': email
    })
};