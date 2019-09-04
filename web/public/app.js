// Loads navbar.html using the navbar id on division tag
$('#navbar').load('navbar.html');

const token = sessionStorage.getItem('token');
// Stores the api url hosted using now
const API_URL = "http://localhost:5000/api";
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
        //$('#message').append(`<p class="alert alert-danger"> Please fill out all the details </p>`);
        console.log("Some fields are empty");
    }
    if(password != confirmpassword)
    {
        //$('#message').append(`<p class="alert alert-danger"> Passwords do not match </p>`);
        
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Password do not match',
        })
        console.log("Passwords do not match");
    }
    if(password.length <= 6)
    {
        //$('#message').append(`<p class="alert alert-danger"> Password should be more than 6 characters </p>`);
        
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Password needs to be at least 6 characters',
        })
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
                //$('#message').append(`<p class="alert alert-danger">${response}</p>`);
            }
        })
        .catch(err => {
            //$('#message').append(`<p class="alert alert-danger">${err.responseJSON.message}</p>`);
            
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: `${err.responseJSON.message}`,
            })
            console.log(err.responseJSON.message);
        });
    }
    else
    {
        //$('#message').append(`<p class="alert alert-danger"> Something went wrong </p>`);
        console.log("Something went wrong");
    }
});

$('#login').on('click', () => {
    const email = $('#email').val();
    const password = $('#password').val();

    if(email == null || password == null)
    {
        //$('#message').append(`<p class="alert alert-danger"> Please fill out all the details </p>`);
        console.log("Some fields are empty");
    }
    else
    {
        $.post(`${API_URL}/authenticate`, { email, password }).then((response) => {
            if (response.success)
            {
                console.log(response);
                sessionStorage.setItem('token', response.token);
                location.href = '/home';
            }
            else {
                console.log('error')
                //$('#error-message').append(`<p class="alert alert-danger">${response}</p>`);
            }
        })
        .catch((err) => {


            console.log(err.responseJSON.message);

            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: 'Wrong credentials!',
              })


            //$('#error-message').append(`<p class="alert alert-danger">${err.responseJSON.message}</p>`);
        });
    }
});

function getDeviceData(e) {
    const device_id = e.getAttribute('data-id')
    $.ajax({
        url: `${API_URL}/devices/${device_id}`,
        type: 'GET',
        headers: {
            'Authorization': `bearer ${sessionStorage.getItem('token')}`
        },
        success: function(response) {
            console.log(response);
            // On clicking a device its details are shown using modal 
            $('#historyHead').append(`
                <tr>
                    <th>Date</th>
                    <th>Reading</th>
                </tr>
            `);
            response.data.map(response => {
                $('#historyBody').append(`
                    <tr>
                        <td>${response.name}</td>
                        <td>${response.type}</td>
                        <td>${response.data.date}</td>
                    </tr>
                `);
            });
            $('#historyModal').modal('show');
        },
        error: function(err) {
            if(err.status == 401) {
                location.href = '/login';
            } else {
                console.log(err);
            }
        }
    });
}

$(document).ready(function() {
    if (window.location.pathname == '/devices') {
        $.ajax({
            url: `${API_URL}/devices`,
            type: 'GET',
            headers: {
                'Authorization': `bearer ${sessionStorage.getItem('token')}`
            },
            success: function(response) {
                let count = 0;
                response.forEach(device => {
                    if(count % 3 == 0) $('#devices').append('<tr></tr>')
                    $('#devices tr:last').append(`
                    <td width="200px" style="padding-right: 10%; cursor: pointer;">
                        <img src="/Images/${device.type}.png" alt="${device.type}" width="220" height="220" data-id="${device._id}" onclick="getDeviceData(this)">
                    </td>
                    ${count % 3 == 2? "</tr>" : ""}
                    `)
                    count++;
                })
                console.log(response);
            },
            error: function(err) {
                if(err.status == 401) {
                    location.href = '/login';
                }
            }
        });
    }
});

function showAddDeviceform(el) {
    const type = el.getAttribute('data-type');
    document.getElementById("typeField").value = type;
    $('#addDeviceModal').modal('show');
}

$("#addDeviceForm").submit(function(event) {
    event.preventDefault();
    const type = document.getElementById("typeField").value;
    const name = document.getElementById("nameField").value;
    $.ajax({
        url: `${API_URL}/devices`,
        type: 'POST',
        headers: {
            'Authorization': `bearer ${sessionStorage.getItem('token')}`
        },
        data: {type, name},
        success: function(response) {
            console.log(response);
            location.href = '/devices';
        },
        error: function(err) {
            if(err.status == 401) {
                location.href = '/login';
            } else {
                console.log(err);
            }
        }
    });
});


// Loads footer.html using the footer id on division tag
$('#footer').load('footer.html');