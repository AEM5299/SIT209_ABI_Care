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
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Some fields are empty',
        })
        console.log("Some fields are empty");
    }
    if(password != confirmpassword)
    {
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Password do not match',
        })
        console.log("Passwords do not match");
    }
    if(password.length <= 6)
    {
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Password needs to be at least 6 characters',
        })
        console.log("Password length is less than 6 characters");
    }
    // was redirecting to login page even when no passwords were entered
    if (password == confirmpassword && password != null && confirmpassword != null)
    {
        console.log("Passwords are the same, sending request to the api")
        $.post(`${API_URL}/registration`, { name, email, password, usertype }).then((response) => {
            console.log(response);
            if (response.success) {
                location.href = '/login';
            }
            else {
                Swal.fire({
                    type: 'error',
                    title: 'Oops...',
                    text: `${response.responseJSON.message}`,
                })
                console.log(response.responseJSON.message);
            }
        })
        .catch(err => {
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
        console.log("Something went wrong");
    }
});

$('#login').on('click', () => {
    const email = $('#email').val();
    const password = $('#password').val();

    if(email == null || password == null)
    {
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Missing Credentials',
          })
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
                Swal.fire({
                    type: 'error',
                    title: 'Oops...',
                    text:  `${response.responseJSON.message}`,
                  })
            }
        })
        .catch((err) => {
            console.log(err.responseJSON.message);
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text:  `${err.responseJSON.message}`,
              })
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
            showDeviceDataModal(response);
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
    } else if(window.location.pathname == '/doctors') {
        $.ajax({
            url: `${API_URL}/doctors`,
            type: 'GET',
            success: function(response) {
                console.log(response);
                const Geocoder = new google.maps.Geocoder();
                response.forEach(doctor => {
                    const address = `${doctor.address.street}, ${doctor.address.city} ${doctor.address.state} ${doctor.address.postcode}`
                    Geocoder.geocode({ address: address}, function(results, status) {
                        if (status === 'OK') {
                            if (results[0]) {
                                info = {coords: {lat: Number(results[0].geometry.location.lat()), lng: Number(results[0].geometry.location.lng())}, content: doctor.userID.name};
                                addMarker(info);
                            }
                        }
                    });
                })
            },
            error: function(err) {
                console.log(err);
            }
        });
    }
});

function showAddDeviceform(el) {
    const type = el.getAttribute('data-type');
    document.getElementById("typeField").value = type;
    $('#addDeviceModal').modal('show');
}

function showDeviceDataModal(response)
{
    // On clicking a device its details are shown using modal
    const Headers = {'BPM': ['High', 'Low'], 'HRM': ['Heart Rate'], 'SLM': ['Glucose Level']};
    $('#historyHead').empty();
    $('#historyBody').empty();
    $('#historyHead').append(`
        <tr>
            <th>Time</th>
            <th>${Headers[response.type][0]}</th>
            ${Headers[response.type][1]? `<th>${Headers[response.type][1]}</th>`:""}
        </tr>
    `);
    response.data.map(readings => {
        $('#historyBody').append(`
            <tr>
                <td>${readings[0]}</td>
                <td>${readings[1]}</td>
                ${readings[2]? `<th>${readings[2]}</th>`:""}
            </tr>
        `);
    });
    $('#showDeviceModal').modal('show');             
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
