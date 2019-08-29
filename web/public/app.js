// Loads navbar.html using the navbar id on division tag
$('#navbar').load('navbar.html');

const token = localStorage.getItem('token');
// Stores the api url hosted using now
const API_URL = "https://abi-care-api.herokuapp.com/api";
// Stores the mqtt url hosted using now
//const MQTT_URL = "";

$('#register').on('click', function () 
{
    const name = $('#name').val();
    const email = $(`#email`).val();
    const password = $('#password').val();
    const confirmpassword = $('#confirm-password').val();
    const usertype = "patient";

    if(name == null || email == null || password == null || confirmpassword == null)
    {
        $('#message').append(`<p class="alert alert-danger"> Please fill out all the details </p>`);
        console.log("Some fields are empty");
    }
    if(password != confirmpassword)
    {
        $('#message').append(`<p class="alert alert-danger"> Passwords do not match </p>`);
        console.log("Passwords do not match");
    }
    if(password.length <= 6)
    {
        $('#message').append(`<p class="alert alert-danger"> Password should be more than 6 characters </p>`);
        console.log("Password length is less than 6 characters");
    }
    if (password == confirmpassword) 
    {
        console.log("Passwords are the same, sending request to the api")
        $.post(`${API_URL}/registration`, { name, email, password, usertype }).then((response) => {
            console.log(response);
            if (response.success) {
                location.href = '/login';
            }
            else {
                $('#message').append(`<p class="alert alert-danger">${response}</p>`);
            }
        })
        .catch(err => {
            $('#message').append(`<p class="alert alert-danger">${err.responseJSON.message}</p>`);
            console.log(err.responseJSON.message);
        });
    }
    else 
    {
        $('#message').append(`<p class="alert alert-danger"> Something went wrong </p>`);
        console.log("Something went wrong");
    }
});

$('#login').on('click', () => {
    const email = $('#email').val();
    const password = $('#password').val();

    if(email == null || password == null)
    {
        $('#message').append(`<p class="alert alert-danger"> Please fill out all the details </p>`);
        console.log("Some fields are empty");
    }
    else
    {
        $.post(`${API_URL}/authenticate`, { email, password }).then((response) => {
            if (response.success) 
            {
                console.log(response);
                localStorage.setItem('token', response.token);
                location.href = '/login';
            }
            else {
                console.log('error')
                $('#error-message').append(`<p class="alert alert-danger">${response}</p>`);
            }
        })
        .catch((err) => {
            console.log(err.responseJSON.message);
            $('#error-message').append(`<p class="alert alert-danger">${err.responseJSON.message}</p>`);
        });
    }
});

// Loads footer.html using the footer id on division tag
$('#footer').load('footer.html');