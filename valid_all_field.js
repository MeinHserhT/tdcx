var uname = document.querySelector('#enrollment-form input[name="name"]').value,
    phone_number = document.querySelector('input[name="phone"]').value,
    email = document.querySelector('input[name="email"]').value,
    city = document.querySelector('select[name="location_city_id"]').value,
    time = document.querySelector('input[name="content"]').value;

function phoneValidation(input) {
    var phoneRegex = /^\d{10}|^\d{11}/gi
    return phoneRegex.test(input)
};

function emailValidation(input) {
    var emailRegex = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/
    return emailRegex.test(email)
};

if(phoneValidation(phone_number) 
    && emailValidation(email)
    && city && uname && time){
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

