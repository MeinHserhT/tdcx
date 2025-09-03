// document
// {{Form Element}}

// function a() {
//     var e = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
//         a = {{Form Element}}.querySelector('input[name*="email"]').value;
//     if (a.match(e)) return a;
//     return "";
// }

// function a() {
//     var e = /^(\d{3})[-]?(\d{3})[-]?(\d{4})$/,
//         a = {{Form Element}}.querySelector('input[name*="Phone"]').value;
//     if (a.match(e)) return "+84" + a.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "");
//     return "";
// }

function a() {
  var a = document.querySelector("input[type=email]").value;
  return a ? a : "";
}

// function a() {
//   var a =
//     {{Form Element}}.querySelector('input[name*="mail"]').value ||
//     {{Form Element}}.querySelector("input[type=email]").value;
//   return a ? a : "";
// }

function a() {
  var a =
    {{Form Element}}.querySelector("input[name*=phone]").value ||
    {{Form Element}}.querySelector("input[type=tel]").value;
  return a ? "+84" + a.replace(/^0|^(84)0*|^(\+84)0*|\D+/g, "") : "";
}

// var PDF = function a() {
//   return {{Form Element}}.querySelector("[id*=browse_button]") ? "Y" : "N";
// };
