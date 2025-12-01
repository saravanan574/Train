

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
    amo.innerHTML = "";

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
            regDiv.innerHTML = `
                <h3 class = "failed">Given data is wrong<br>Please Register again</h3>
            `;
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
                regDiv.innerHTML = "<h3 class = 'success'>Registration successful! Redirecting...<br>Please wait..</h3>";
                setTimeout(() => window.location.href = '/login', 1500);
            } else {
                const result = await response.text();
                regDiv.innerHTML = `<h3 class = 'failed'>Registration failed: ${result.message}</h3>`;
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
    const mainDiv = document.getElementById("main");

    // Redirect to register page
    $scope.goRegister = function () {
        window.location.href = "/register";
    };

    // LOGIN FUNCTION
    $scope.login = async function () {

        const phone = ($scope.user.log_phone || "").trim();
        const password = ($scope.user.log_pw || "").trim();
        if (!phone) {
            $scope.message = "Phone number is required";
            return;
        }

        if (phone.length !== 10 || isNaN(phone)) {
            $scope.message = "Enter a valid 10-digit phone number";
            return;
        }

        if (!password) {
            $scope.message = "Password is required";
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
                mainDiv.innerHTML = `
                    <h3 class="success" style="text-align:center;">
                        Login successful! Redirecting to your account...<br>
                        Please wait...
                    </h3>
                `;

                setTimeout(() => window.location.href = "/home", 1000);

            } else {
                $scope.$applyAsync(() => {
                    $scope.message = result.message || "Incorrect phone number or password";
                });
            }

        } catch (err) {
            $scope.$applyAsync(() => {
                $scope.message = "Server error. Please try again later.";
            });
        }
    };
});


        app.controller("train_ticket", ($scope, $http) => {

            $scope.ticket_booking = async () => {
        
                const mainDiv = document.getElementById("main");
        
                // Read values safely
                const ss = ($scope.sstation || document.getElementById("sstation").value || "").trim();
                const ds = ($scope.dstation || document.getElementById("dstation").value || "").trim();
                const tnop = $scope.tnop;
                const price = (document.getElementById("price").value || "").trim();
                const phoneno = ($scope.tphoneno || "").trim();
                const date = $scope.date;
        
                // ------------------------------
                // === VALIDATION SECTION ===
                // ------------------------------
                if (!ss) return alert("Source station is required");
                if (!ds) return alert("Destination station is required");
                if (!tnop || isNaN(tnop) || tnop <= 0) return alert("Enter valid number of passengers");
                if (!price || isNaN(price) || price <= 0) return alert("Price is missing or invalid");
                if (!phoneno || phoneno.length !== 10) return alert("Enter a valid 10-digit phone number");
                if (!date) return alert("Please select a journey date");
        
                const token = localStorage.getItem("token");
                const logid = localStorage.getItem("logid");
        
                if (!token) return alert("User not authenticated. Please login again.");
                if (!logid) return alert("Invalid user ID. Login again.");
        
                // Confirm payment
                const confirmPay = confirm("Pay the amount " + price + " rupees?");
                if (!confirmPay) {
                    alert("Payment cancelled");
                    setTimeout(() =>window.location.href = '/train-ticket', 1500);
                    return;
                }
        
                const pay = parseInt(prompt("Pay the amount: " + price + " rupees"));
                if (pay !== parseInt(price)) {
                    alert("Insufficient amount. Payment failed.");
                    return;
                }
        
                // Payload
                const payload = {
                    logid: logid,
                    source: ss,
                    destination: ds,
                    passengers: tnop,
                    amount: price,
                    phoneno: phoneno,
                    date: date
                };
        
                // ------------------------------
                // === API CALL SECTION ===
                // ------------------------------
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
                        mainDiv.innerHTML = `
                            <h3 class="success">
                                Ticket booked successfully! Redirecting to Booking History...<br>
                                Please wait...
                            </h3>
                        `;
                        setTimeout(() => window.location.href = "/booking-history", 1500);
                    } else {
                        mainDiv.innerHTML = `
                            <h3 class="failure">
                                Booking Failed: ${result.message || "Unknown error"}
                            </h3>
                        `;
                        setTimeout(() =>window.location.href = '/train-ticket', 3500);
                    }
        
                } catch (err) {
                    console.error("Ticket booking error:", err);
                    mainDiv.innerHTML = `<h3 class="failure">Server Error! Try again later.</h3>`;
                    setTimeout(() =>window.location.href = '/train-ticket', 1500);                }
            };
        });
                    
        