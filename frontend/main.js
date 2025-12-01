window.setInterval(() => time(), 1000);

function time() {
    const d = new Date();
    const t = document.getElementById("time");
    if (!t) return;

    t.innerHTML = `📅 ${zero(d.getDate())}/${zero(d.getMonth()+1)}/${d.getFullYear()}
                   <br>⏳ ${zero(d.getHours())}:${zero(d.getMinutes())}:${zero(d.getSeconds())}`;
}

function zero(a) { return a < 10 ? "0" + a : a; }

// -------------------------------
//  LOAD PAGE CONTENT
// -------------------------------
const loadPage = (page) => {
    fetch(page)
        .then(res => res.text())
        .then(data => {
            const main = document.getElementById("main"); // ✔ FIX
            main.innerHTML = data;
            const scope = angular.element(main).scope();
            const injector = angular.element(main).injector();
            injector.invoke(function($compile, $rootScope) {
                $compile(main)(scope);
                scope.$digest();
            });
            const event = new Event('pageLoaded');
            main.dispatchEvent(event);
        })
        .catch(() => {
            document.getElementById("main").innerHTML = "Page not found";
        });
};

//  LOGIN CHECK
const handleLogged = async () => {
    try {
        const res = await fetch("/logverify", { method:"GET",credentials: "include" });
        const data = await res.json();
        const loggedInLinks = document.querySelectorAll(".loggedIn");
        const loggedOutLinks = document.querySelectorAll(".loggedOut");
        if (data.message) {
            if(!localStorage.getItem("token")){
                localStorage.setItem("token",data.auth.token);
                localStorage.setItem("logid",data.auth.id);
            }
            loggedInLinks.forEach(e => e.style.display = "block");
            loggedOutLinks.forEach(e => e.style.display = "none");
        } else {
            loggedInLinks.forEach(e => e.style.display = "none");
            loggedOutLinks.forEach(e => e.style.display = "block");
        }
    } catch (err) {
        console.error("Login Check Error:"+ err);
    }
};

handleLogged();

const handleRoute = async() => {
    let page = window.location.pathname;
    let route;
    const res = await fetch("http://localhost:3000/logverify", { method:"GET",credentials: "include" });
    const data = await res.json();
    if (data.message && (page === "/login" || page === "/register")) {
        window.history.pushState({}, "", "/home");
        route = "/home.html";  // override
    }
    if(!data.message && !(page === "/" || page === "/login" || page === "/register")){
        window.history.pushState({}, "", "/login");
        route = "/login.html";
    }
    const routes = {
        "/home": "/home.html",
        "/login": "/login.html",
        "/logout": "/logout.html",
        "/about": "/about.html",
        "/register": "/register.html",
        "/booking-history": "/booking_history.html",
        "/profile":"/profile.html",
        "/train-ticket": "/train_ticket.html",
        "/platform-ticket": "/platform_ticket.html",
        "/platform-ticket-cancel": "/platform_ticket_cancel.html",
        "/ticket-cancel": "/ticket_cancel.html"
    };
    route = routes[page] || "/home.html";
    if(page == "/booking-history")
        booking_history();
    if(page == "/profile")
        getProfileData();
    loadPage(route);
    document.getElementById("main").addEventListener("pageLoaded", () => {
        if (document.getElementById("trainTicketSection")) {
            initTrainTicketForm();
        }
        else if(document.getElementById("platformTicketSection")){
            initPlatformTicketForm();
        }
    });
};

handleRoute();

const openPage = (page) => {
    window.history.pushState({}, "", page);
    handleRoute();
};
window.addEventListener("popstate", () => {
    handleRoute();
});

//To check the login user data is valid or not

const setToday = (id) => {
    const input = document.getElementById(id);
                var now = new Date();
                var today = `${now.getFullYear()}-${zero(now.getMonth() + 1)}-${zero(now.getDate())}`;
                input.min = today;
}

async function logout(){
    const data = await fetch("/log-out",{
        method:"GET",
        headers:{"Authorization":"Bearer "+ localStorage.getItem("token")}
    });
    if(data.ok){
        localStorage.removeItem("token");
        localStorage.removeItem("logid");
        document.getElementById("main").innerHTML = "<h3 class = 'success'>Logout successful! Redirecting to login page...<br>Please wait..</h3>";
                setTimeout(() => window.location.href = '/login', 1500);
    }
    else{
        document.getElementById("main").innerHTML = "<h3 class = 'failed' >Logout failed! <br>Please try again..</h3>";
        handleRoute();
        setTimeout(() => window.location.href = '/login', 1500);
    }
}
//Display the profile page 
const getProfileData = async() => {
    try{ 
        const res = await fetch("/get-profile",{
            method:"GET",
            headers:{
                "Authorization":"Bearer "+localStorage.getItem("token")
            }
        });
        
        const data = await res.json();
        const main = document.getElementById("main");
        if(res.ok){
            let user = data.user;
            main.innerHTML = `
                <h3>
                    <table width="450" cellpadding="2" id="view" cellspacing="5">
                    <tr><th>Reg. No</th><td>${user.regNo}</td></tr>
                    <tr><th>Name</th><td>${user.name}</td></tr>
                    <tr><th>Age</th><td>${user.age}</td></tr>
                    <tr><th>Gender</th><td>${user.gender}</td></tr>
                    <tr><th>Email</th><td>${user.emailId.toLowerCase()}</td></tr>
                    <tr><th>Phone</th><td>${user.phoneNo}</td></tr>
                    </table>
                </h3>`;
        }
        else{
            main.innerHTML = `<span id = 'failed' >Error : ${data.message}</span>`
        }
    }
    catch{
        main.innerHTML = `<span id = 'failed' >Error : ${data.message}</span>`
    }
}

let ticket_data = [];
let platform_data = [];

const booking_history = async() =>{
    try{
    const data = await fetch("/ticket-history",{
                        method:"GET",
                        headers:{"Authorization":"Bearer "+localStorage.getItem("token")}
    });
    const result = await data.json();
    if(data.ok){
        ticket_data = result.ticket_data; // store tickets globally
        platform_data = result.platform_data;

    }
    else{
        console.log("Not found");
    }}
    catch(err){
        console.log("Error: "+err);
    }
}

//Get the train ticket history and send to traindisplay function
const ticket_history = () => {
    const tag = document.getElementById("train");
    // If no tickets
    if (!ticket_data || ticket_data.length === 0) {
        tag.innerHTML = `
            <h4>No Train ticket bookings found</h4>
        `;
        return;
    }

    // If tickets exist
    tag.innerHTML = ticket_data.map(ticket => `
        <table width="400" cellpadding="5" cellspacing="5" style={background:none !important} >
    <tr><th>Ticket ID</th><td>${ticket.ticketNo}</td></tr>
    <tr><th>From</th><td>${ticket.source}</td></tr>
    <tr><th>To</th><td>${ticket.destination}</td></tr>
    <tr><th>Journey Date</th><td>${ticket.journeyDate?ticket.journeyDate.split("T")[0] : ''}</td></tr>
    <tr><th>No. of Passengers</th><td>${ticket.passengerCount}</td></tr>
    <tr><th>Phone</th><td>${ticket.phoneNo}</td></tr>
    <tr><th>Amount</th><td>₹${ticket.price}</td></tr>
    <tr><th>Status</th><td class = "weight" style="color:${ticket.status === 'Booked' ? 'green' : 'red'};">${ticket.status}</td></tr>
</table>
<br>    `).join("");   // VERY IMPORTANT
};

const platform_history = () => {
    const tag = document.getElementById("platform");
    // If no platform tickets
    if (!platform_data || platform_data.length === 0) {
        tag.innerHTML = `
            <h4 >No Platform ticket bookings found</h4>
        `;
        return;
    }

    // If platform tickets exist
    tag.innerHTML = platform_data.map(ticket => `
<table width="400" cellpadding="5" cellspacing="5">
    <tr><th>Ticket No</th><td>${ticket.ticketNo}</td></tr>
    <tr><th>Station Name</th><td>${ticket.station}</td></tr>
    <tr><th>No. of Passengers</th><td>${ticket.passengerCount}</td></tr>
    <tr><th>Amount</th><td>₹${ticket.price}</td></tr>
    <tr><th>Status</th><td class = "weight" style=color:${ticket.status == "Booked"?"green":"red"};>${ticket.status}</td></tr>
</table>
<hr>
    `).join("");
};

const ticket_cancel = async() => {
    const id = document.getElementById("ticket_id").value;
    const main = document.getElementById("main");

    if(!/^TT-\d{4,7}$/i.test(id)) {
        document.getElementById("failed").innerHTML = "Given id is not valid or incorrect";
        return;
    }

    try {
        const res = await fetch("/cancel-ticket",{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer " + localStorage.getItem("token")
            },
            body:JSON.stringify({ id })
        });

        const result = await res.json();

        if(res.ok){
            alert("Train Ticket cancelled successfully");
            main.innerHTML = "<span class='success'>Train Ticket cancelled successfully.<br>Redirecting...</span>";
            setTimeout(() => window.location.href = '/booking-history', 1500);
        } else {
            alert(result.message);
            main.innerHTML = "<span class ='failed'>Ticket Cancellation failed.<br>Redirecting...</span>";
            setTimeout(() =>window.location.href = '/ticket-cancel', 1500);
        }
    }
    catch(err){
        console.log("Error: ",err);
        alert("Server error!");
    }
};


// Booking platform ticket
async function platform_ticket() {
    var sn = document.getElementById("stationName").value;
    var np = document.getElementById("passenger_count").value;
    var mainDiv = document.getElementById("main");
    if(!sn) {
        document.getElementById("stationError").display = "block";
        return;
    }
    var d = confirm("Pay the amount " + np * 10 + " rupees");
    if (d) {
        var a = parseInt(prompt("Pay the amount " + np * 10 + " rupees"));
        if (a === np * 10) {
            const payload = {
                logid:localStorage.getItem("logid"),
                stationName: sn,
                passenger_count: np,
                amount: a
            };
            try {
                const token = localStorage.getItem("token"); // if using JWT for auth
                const res = await fetch("/booking_platform", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },
                    body: JSON.stringify(payload)
                });
    
                const result = await res.json();
                if (res.ok && result.status === "success") {
                    alert("Ticket booked successfully");
                    mainDiv.innerHTML = "<h4 class = 'success' >Platform ticket booked successfully. Redirecting to Booking history...<br>Please wait..</h4>";
                    setTimeout(() => window.location.href = '/booking-history', 1500);
                } else {

                    mainDiv.innerHTML = `<h4 class = 'failed'>Booking failed: ${result.message}</h4>`;
                    setTimeout(() => window.location.href = '/platform-ticket', 2000);
                }
            } catch (err) {
                console.error(err);
                mainDiv.innerHTML = "<p class = 'failed'>Error connecting to server.</p>";
                setTimeout(() =>window.location.href = '/platform-ticket', 1500);
            }
            
        } else {
            mainDiv.innerHTML = "<p class = 'failed'>Insufficient amount<br>Payment failed</p>";
            setTimeout(() =>window.location.href = '/platform-ticket', 3500);
        }
    } else {
        alert("Payment cancelled")
        setTimeout(() =>window.location.href = '/platform-ticket');
    }
}

// Cancel platform ticket details
const platform_cancel = async() => {
    const id = document.getElementById("ticket_id").value;
    const main = document.getElementById("main");

    if(!/^PT-\d{4,7}$/i.test(id)) {
        document.getElementById("failed").innerHTML = "Given id is not valid or incorrect";
        return;
    }

    try {
        const res = await fetch("/cancel-platform",{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer " + localStorage.getItem("token")
            },
            body:JSON.stringify({ id })
        });

        const result = await res.json();

        if(res.ok){
            alert("Platform Ticket cancelled successfully");
            main.innerHTML = "<span class='success'>Platform Ticket cancelled successfully.<br>Redirecting...</span>";
            setTimeout(() => window.location.href = '/booking-history', 1500);
        } else {
            alert(result.message);
            main.innerHTML = "<span class ='failed'>Ticket Cancellation failed.<br>Redirecting...</span>";
            setTimeout(() =>window.location.href = '/platform-ticket-cancel', 1500);
        }
    }
    catch(err){
        alert("Server error!");
        setTimeout(() =>window.location.href = '/platform-ticket-cancel');
    }
};