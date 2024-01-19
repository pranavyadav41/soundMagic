function validateForm() {
    // Validation for Firstname and Lastname (Allow only letters and spaces)
    var nameRegex = /^[a-zA-Z]+$/;
    var firstname = document.getElementById('firstname').value;
    var lastname = document.getElementById('lastname').value;

    if (!nameRegex.test(firstname)) {
        document.getElementById('firstnameError').innerHTML = 'Please enter a valid Firstname.';
        document.getElementById('firstnameError').style.display = 'block';
        return false;
    } else {
        document.getElementById('firstnameError').style.display = 'none';
    }


    if (!nameRegex.test(lastname)) {
        document.getElementById('lastnameError').innerHTML = 'Please enter a valid Lastname.';
        document.getElementById('lastnameError').style.display = 'block';
        return false;
    } else {
        document.getElementById('lastnameError').style.display = 'none';
    }

    // Validation for Mobile number (Allow only digits, and a length of 10)
    var mobileRegex = /^\d{10}$/;
    var mobile = document.getElementById('mno').value;

    if (!mobileRegex.test(mobile)) {
        document.getElementById('mnoError').innerHTML = 'Please enter a valid Mobile number.';
        document.getElementById('mnoError').style.display = 'block';
        return false;
    } else {
        document.getElementById('mnoError').style.display = 'none';
    }

    // Validation for Email
    var emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var email = document.getElementById('email').value;

    if (!emailRegex.test(email)) {
        document.getElementById('emailError').innerHTML = 'Please enter a valid Email address.';
        document.getElementById('emailError').style.display = 'block';
        return false;
    } else {
        document.getElementById('emailError').style.display = 'none';
    }

    // Validation for Password and Confirm Password
    var passwordRegex = /^.{6,}$/;
    var password = document.getElementById('password').value;
    if (!passwordRegex.test(password)) {
        document.getElementById('passwordError').innerHTML = 'Password must contain 6 characters';
        document.getElementById('passwordError').style.display = 'block';
        return false;
    } else {
        document.getElementById('passwordError').style.display = 'none';
    }

    var confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        document.getElementById('passwordMatchError').style.display = 'block';
        return false;
    } else {
        document.getElementById('passwordMatchError').style.display = 'none';
    }

    return true;
}