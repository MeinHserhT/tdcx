var uname = document.querySelector('input[name="fname"]').value,
    phone_number = document.querySelector('input[name="sdt"]').value,
    add = document.querySelector('input[name="add"]').value,
    value = parseFloat(document.querySelector('#itotal').innerText.replace(/\D/g,''));
  

function phoneValidation(input) {
    var phoneRegex = /^\d{10}|^\d{11}/gi
    return phoneRegex.test(input)
};

if(phoneValidation(phone_number) 
    && add && uname){
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
        'value': value
    })
};