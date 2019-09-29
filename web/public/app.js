// Loads navbar.html using the navbar id on division tag
const state = window.matchMedia("(max-width: 768px)").matches;
if (!state) {
    $('#navbar').load('navbar.html');
} else {
    $('#navbar').load('mobile_navbar.html');
}

// Loads footer.html using the footer id on division tag
$('#footer').load('footer.html');

const token = sessionStorage.getItem('token');
// Stores the api url hosted using now
const API_URL = "https://abi-care-api.herokuapp.com/api";

$('#register').on('click', function ()
{
    const name = $('#name').val();
    const email = $(`#email`).val();
    const password = $('#password').val();
    const confirmpassword = $('#confirm-password').val();
    const usertype = "patient";

    if(name == '' || email == '' || password == '' || confirmpassword == '')
    {
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Some fields are empty',
        })
        console.log("Some fields are empty");
        return;
    }
    if(password != confirmpassword)
    {
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Password do not match',
        })
        console.log("Passwords do not match");
        return;
    }
    if(password.length < 6)
    {
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Password needs to be at least 6 characters',
        })
        console.log("Password length is less than 6 characters");
        return;
    }
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

$('#registerDoctor').on('click', function ()
{
    const name = $('#name').val();
    const email = $(`#email`).val();
    const password = $('#password').val();
    const confirmpassword = $('#confirm-password').val();
    const usertype = "doctor";
    const streetaddress = $('#streetaddress').val();
    const city = $('#city').val();
    const state = $('#state').val();
    const postcode = $('#postcode').val();

    if(name == '' || email == '' || password == '' || confirmpassword == '' || streetaddress == '' || city == '' || state == '' || postcode == '')
    {
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Some fields are empty',
        })
        console.log("Some fields are empty");
        return;
    }
    if(password != confirmpassword)
    {
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Password do not match',
        })
        console.log("Passwords do not match");
        return;
    }
    if(password.length < 6)
    {
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Password needs to be at least 6 characters',
        })
        console.log("Password length is less than 6 characters");
        return;
    }
    if(isNaN(postcode)) {
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Postcode is in the wrong format',
        })
        console.log("Postcode is in the wrong format");
        return;
    }
    // was redirecting to login page even when no passwords were entered
    if (password == confirmpassword && password != '' && confirmpassword != '')
    {
        console.log("Passwords are the same, sending request to the api")
        $.post(`${API_URL}/registration`, { name, email, password, usertype, streetaddress, city, state, postcode }).then((response) => {
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
                sessionStorage.setItem('usertype', response.usertype);
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
    }
    if (window.location.pathname == '/appointments') {
        $.ajax({
            url: `${API_URL}/appointment`,
            type: 'GET',
            headers: {
                'Authorization': `bearer ${sessionStorage.getItem('token')}`
            },
            success: function(response) {
                response.forEach(appointment => {
                    $('#appointments').append(`
                    <tr>
                        <td colspan='2'>${appointment.date.slice(0, 10)}</td>
                        <td>${slotToTime(appointment.slot)}</td>
                        <td>${appointment.patient.name}</td>
                    </tr>
                    `)
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
    if (window.location.pathname == '/patients') {
        $.ajax({
            url: `${API_URL}/patients`,
            type: 'GET',
            headers: {
                'Authorization': `bearer ${sessionStorage.getItem('token')}`
            },
            success: function(response) {
                response.forEach(paitents => {
                    $('#patients').append(`
                    <tr>
                        <td>${paitents.name}</td>
                        <td>${paitents.email}</td>
                        <td><div class="login3">
                            <form method="post">
                                <a href="/history" class="myButton3">View</a>
                            </form>
                            </div>
                        </td>
                        <td><div class="login3">
                            <form method="post">
                                <a href="/historyadd" class="myButton3">Add</a>
                            </form>
                            </div>
                        </td>
                    </tr>
                    `)
                })
                console.log(response);
            },
            error: function(err) {
                if(err.status == 401) {
                    location.href = '/login';
                }
            }
        })
    }
    if (window.location.pathname == '/history') {
        $.ajax({
            url: `${API_URL}/history`,
            type: 'GET',
            headers: {
                'Authorization': `bearer ${sessionStorage.getItem('token')}`
            },
            success: function(response) {
                response.forEach(history => {
                    $('#history').append(`
                    <tr>
                        <td>${history.details}</td>
                        <td>${history.doctorsEmail}</td>
                        <td>${history.patientsEmail}</td>
                        <td>${history.notes}</td>
                        <td>${history.date}</td>
                    </tr>
                    `)
                })
                console.log(response);
            },
            error: function(err) {
                if(err.status == 401) {
                    location.href = '/login';
                }
            }
        })
    }
});

function slotToTime(slot) {
    switch(slot) {
        case 1:
            return "12:00 PM to 12:30 PM";
        case 2:
            return "12:30 PM to 1:00 PM";
        case 3:
            return "1:00 PM to 1:30 PM";
        default:
            return "NULL";
    }
}

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

function addHistory()
{
    //$("addHistoryForm").on('click', function(){
        const details = $('#details').val();
        const doctorsEmail = $('#doctorsEmail').val();
        const patientsEmail = $('#patientsEmail').val();
        const notes = $('#notes').val();
        const date = $('#date').val();

        if(details == '' || doctorsEmail == '' || patientsEmail == '' || notes == '' || date =='')
        {
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: 'Some fields are empty',
            })
            console.log("Some fields are empty");
            return;
        }

        $.ajax({
            url: `${API_URL}/history`,
            type: 'POST',
            headers: {
                'Authorization': `bearer ${sessionStorage.getItem('token')}`
            },
            data: {details, doctorsEmail, patientsEmail, notes, date},
            success: function(response) {
                console.log(response);
                location.href = '/patients';
            },
            error: function(err) {
                if(err.status == 401) {
                    location.href = '/login';
                } else {
                    Swal.fire({
                        type: 'error',
                        title: 'Oops...',
                        text: `${err.responseJSON.message}`,
                    })
                    console.log(err.responseJSON.message);
                    console.log(err);
                }
            }
        });
    //})
}
