

let ticketData = {};
function initPlatformTicketForm(){
    const sn = document.getElementById("stationName");
    fetch("bd/price.json")
        .then(res => res.json())
        .then(data => {
            let platformData = data;
            sn.innerHTML = '<option value="" disabled selected>Select source</option>';
            for (let source in data) {
                const opt = document.createElement("option");
                opt.value = source;
                opt.id = source;
                opt.textContent = source;
                sn.appendChild(opt);
            }
        })
}

function initTrainTicketForm() {
    const ss = document.getElementById("sstation");
    const dd = document.getElementById("dstation");
    const tnop = document.getElementById("tnop");

    // Fetch price.json
    fetch("bd/price.json")
        .then(res => res.json())
        .then(data => {
            ticketData = data;
            // Populate source
            ss.innerHTML = '<option value="" disabled selected>Select source</option>';
            for (let source in data) {
                const opt = document.createElement("option");
                opt.value = source;
                opt.id = source;
                opt.textContent = source;
                ss.appendChild(opt);
            }
            ss.addEventListener('change',populateDestination);
            
            tnop.addEventListener("input", calculatePrice);
        })
        .catch(err => console.error("Error loading price.json:", err));
}

function populateDestination() {
    const ss = document.getElementById("sstation");
    const dd = document.getElementById("dstation");
    dd.innerHTML = '<option disabled selected>Select destination</option>';
    for (let dest in ticketData[ss.value]) {
        const opt = document.createElement("option");
        opt.value = dest;
        opt.textContent = dest;
        dd.appendChild(opt);
    }

    dd.addEventListener("change",() => {
        
        calculatePrice();});
}

function calculatePrice() {
    const ss = document.getElementById("sstation").value;
    const dd = document.getElementById("dstation").value;
    const tnop = parseInt(document.getElementById("tnop").value) || 0;
    if (!ss || !dd || tnop <= 0) return;

    const pricePerTicket = parseInt(ticketData[ss][dd]);
    document.getElementById("sp").innerHTML = `1 Ticket is ₹${pricePerTicket}`;

    const amo = document.getElementById("amount");
    amo.style.display = "none";

    const td1 = document.createElement("td");

    td1.innerHTML = "Total Amount (₹)<br>(Fixed Price)";
    const td2 = document.createElement("td");
    const input = document.createElement("input");
    input.type = "number";
    input.id = "price";
    input.readOnly = true;
    input.value = tnop * pricePerTicket;
    input.classList.add("form-control");
    td2.appendChild(input);

    amo.appendChild(td1);
    amo.appendChild(td2);
}


//Check the valid name or not
function validName(n){
    var x=/^([a-zA-Z]\s?)+$/;
    if(n.match(x))
        return true;
    else    
        return false;
}

//Check the valid phone number or not
function validPhone(n){
    var x=/^\d{10}$/;
    if(n.match(x))
        return true;
    else        
        return false;
}

//Check the valid password or not
function validPass(n){
    if(n.length>=6 && n.length<=13)
        return true;
    else    
        return false;
}

//Check the valid registered date or not
function validDate(d){
    var y=new Date();
    var x=new Date(d);
    if(y.getDate()<=x.getDate()||y.getTime()<=x.getTime())
        return true; 
    else
        return false;
}


var app = angular.module("myApp", []);

// Main layout controller (optional)
app.controller("myctrl", function($scope){
    $scope.msg = 2; // for example {{1+1 = msg}}
});

// Register controller
app.controller("regCtrl", function($scope, $http){
    $scope.user = {};

    // Validation functions
    $scope.goLogin = function () {
        window.location.href = "/login";
    };

    $scope.register = async function() {
        const name = $scope.user.name || document.getElementById("name")?.value;
        const age = $scope.user.age || document.getElementById("age")?.value;
        const gender = $scope.user.gender ||
                       (document.getElementById("genderMale")?.checked ? "Male" :
                        document.getElementById("genderFemale")?.checked ? "Female" :
                        document.getElementById("genderOther")?.checked ? "Other" : "");
        const email = $scope.user.email || document.getElementById("email")?.value;
        const phone = $scope.user.phoneno || document.getElementById("phoneno")?.value;
        const password = $scope.user.password || document.getElementById("password")?.value;

        const regDiv = document.getElementById("main");

        if (!validName(name) || !validPhone(phone) || !validPass(password) || !gender || !age || !email) {
            showCopyMessage("Given data is wrong\nPlease Register again","failed");
            return;
        }

        const userData = {
            rname: name,
            rage: age,
            rgender: gender,
            rmail: email,
            phoneno: phone,
            rpass: password
        };
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                showCopyMessage("Registration successful!\nPlease wait..","success");
                setTimeout(() => window.location.href = '/login', 1500);
            } else {
                const result = await response.text();
                showCopyMessage("Registration failed: "+result.message,"failed");
                setTimeout(() =>window.location.href = '/register', 3500);
            }
        } catch(err) {
            console.error(err);
            regDiv.innerHTML = "<h3 class = 'failed'>Server error. Try again later.</h3>";
            setTimeout(() =>window.location.href = '/register', 1500);
        }
    };
});

app.controller("logCtrl", function ($scope) {

    $scope.user = {};
    const mainDiv = document.getElementById("message");

    // Redirect to register page
    $scope.goRegister = function () {
        window.location.href = "/register";
    };

    // LOGIN FUNCTION
    
    $scope.login = async function () {

        const phone = ($scope.user.log_phone || "").trim();
        const password = ($scope.user.log_pw || "").trim();
        if (!phone) {
            message.innerHTML = "Phone number is required";
            return;
        }

        if (phone.length !== 10 || isNaN(phone)) {
            message.innerHTML = "Enter a valid 10-digit phone number";
            setTimeout(() =>message.style.display = "none",5000);
            return;
        }

        if (!password) {
            message.innerHTML = "Password is required";
            setTimeout(() =>message.style.display = "none",5000);
            return;
        }

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ log_phone: phone, log_pw: password })
            });

            const result = await response.json();

            if (response.ok && result.status === "success") {
                localStorage.setItem("logid", result.userId);
                localStorage.setItem("token", result.token);

                // Show success message
                showCopyMessage(result.message,"success");
                window.location.href = "/home";

            } else {
                message.innerHTML = result.message || "Incorrect phone number or password";
                setTimeout(() =>message.style.display = "none",5000);
            }
            
        } catch (err) {
            message.innerHTML = "Server error. Please try again later.";
            setTimeout(() =>message.style.display = "none",5000);

        }
        
    };
});

function showCopyMessage(msg, type) {
    const box = document.getElementById("copyMsg");

    box.innerText = msg;
    if (type === "success") {
        box.style.background = "#d4edda";
        box.style.color = "#155724";
        box.style.border = "1px solid #c3e6cb";
    } else {
        box.style.background = "#f8d7da";
        box.style.color = "#721c24";
        box.style.border = "1px solid #f5c6cb";
    }

    box.style.display = "block";

    // Hide after 2 seconds
    setTimeout(() => {
        box.style.display = "none";
    }, 3000);
}

app.controller("train_ticket", ($scope, $http, $timeout) => {

    // message variables
    $scope.message = "";


    $scope.ticket_booking = async () => {

        const mainDiv = document.getElementById("main");

        const ss = ($scope.sstation || document.getElementById("sstation").value || "").trim();
        const ds = ($scope.dstation || document.getElementById("dstation").value || "").trim();
        const tnop = $scope.tnop;
        const price = (document.getElementById("price").value || "").trim();
        const phoneno = ($scope.tphoneno || "").trim();
        const date = $scope.date;

        // VALIDATION  
        if (!ss) return $scope.message = "Source station is required";
        if (!ds) return $scope.message = "Destination station is required";
        if (!tnop || isNaN(tnop) || tnop <= 0) return $scope.message = "Enter valid number of passengers";
        if (!price || isNaN(price) || price <= 0) return $scope.message = "Price is missing or invalid";
        if (!phoneno || phoneno.length !== 10) return $scope.message = "Enter a valid 10-digit phone number";
        if (!date) return $scope.message = "Please select a journey date";

        const token = localStorage.getItem("token");
        const logid = localStorage.getItem("logid");

        if (!token) return $scope.message = "User not authenticated. Please login again.";
        if (!logid) return $scope.message = "Invalid user ID. Login again.";

        // Payment confirm — replaced alert with custom message
        const confirmPay = confirm("Pay the amount " + price + " rupees?");
        if (!confirmPay) {
            showCopyMessage("Payment cancelled","failed");
            window.location.href = '/train-ticket';
            return;
        }

        const pay = parseInt(prompt("Pay the amount: " + price + " rupees"));
        if (pay !== parseInt(price)) {
            showCopyMessage("Payment failed : Entered Amount is not equal to ticket price.","failed");
            return;
        }

        const payload = {
            logid: logid,
            source: ss,
            destination: ds,
            passengers: tnop,
            amount: price,
            phoneno: phoneno,
            date: date
        };

        try {
            const res = await fetch("/booktrain", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (res.ok) {
                alert("Train Ticket booked successfully");
                showCopyMessage("Ticket booked successfully\nRedirecting to booking history...","success");
                setTimeout(() => window.location.href = "/booking-history",1200);
            } else {
                showCopyMessage("Booking Failed: " + result.message ,"failed");
                window.location.href = '/train-ticket';
            }

        } catch (err) {
            showCopyMessage(" Error : "+err,"failed");
            window.location.href = '/train-ticket';
        }
    };
});
      
        