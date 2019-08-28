// Loads navbar.html using the navbar id on division tag
$('#navbar').load('navbar.html');

// Stores the api url hosted using now
const API_URL = "http://localhost:5000/api";
// Stores the mqtt url hosted using now
//const MQTT_URL = "";

$('#register-patient').on('click', function () 
{
    const name = $('#name').val();
    const email = $(`#email`).val();
    const password = $('#password').val();
    const confirmpassword = $('#confirm-password').val();
    const usertype = "patient";

    if(name == null || email == null || password == null || confirmpassword == null)
    {
        $('#message').append(`<p class="alert alert-danger"> Please fill out all the details </p>`);
        Console.log("Some fields are empty");
    }
    if(password != confirmpassword)
    {
        $('#message').append(`<p class="alert alert-danger"> Passwords do not match </p>`);
        Console.log("Passwords do not match");
    }
    if(password.length <= 6)
    {
        $('#message').append(`<p class="alert alert-danger"> Password should be more than 6 characters </p>`);
        Console.log("Password length is less than 6 characters");
    }
    if (password == confirmpassword) 
    {
        Console.log("Passwords are the same, sending request to the api")
        $.post(`${API_URL}/registration`, { name, email, password, usertype }).then((response) => {
            if (response.success) {
                location.href = '/login';
            }
            else {
                $('#message').append(`<p class="alert alert-danger">${response}</p>`);
            }
        });
    }
    else 
    {
        $('#message').append(`<p class="alert alert-danger"> Something went wrong </p>`);
        Console.log("Something went wrong");
    }
});

$('#login-patient').on('click', () => {
    const email = $('#email').val();
    const password = $('#password').val();

    if(email == null || password == null)
    {
        $('#message').append(`<p class="alert alert-danger"> Please fill out all the details </p>`);
        Console.log("Some fields are empty");
    }
    else
    {
        $.post(`${API_URL}/authenticate`, { email, password }).then((response) => {
            if (response.success) 
            {

            }
            else {
                $('#error-message').append(`<p class="alert alert-danger">${response}</p>`);
            }
        });
    }
});

// Loads footer.html using the footer id on division tag
$('#footer').load('footer.html');