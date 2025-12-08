window.setInterval(() => time(), 1000);

function time() {
    const d = new Date();
    const t = document.getElementById("time");
    if (!t) return;

    const time = `${zero(d.getHours())}:${zero(d.getMinutes())}:${zero(d.getSeconds())}
                   <br>${zero(d.getDate())}/${zero(d.getMonth()+1)}/${d.getFullYear()}`;
    t.innerHTML = time;
}

function zero(a) { return a < 10 ? "0" + a : a; }

document.addEventListener("DOMContentLoaded", async () => {
    await handleLogged();
    time();               
});

const loadPage = (page) => {
    fetch(page)
        .then(res => res.text())
        .then(data => {
            const main = document.getElementById("main");
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
    const res = await fetch("/logverify", { method:"GET",credentials: "include" });
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
        showCopyMessage("Logout successful! Redirecting to login page\nPlease wait..","success");
        window.location.href = '/login';
    }
    else{
        showCopyMessage("Logout failed","failed");
        handleRoute();
        window.location.href = '/login';
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
                    <tr><th>User Id</th><td>${user.regNo}</td></tr>
                    <tr><th>Name</th><td>${user.name}</td></tr>
                    <tr><th>Age</th><td>${user.age}</td></tr>
                    <tr><th>Gender</th><td>${user.gender}</td></tr>
                    <tr><th>Email</th><td>${user.emailId.toLowerCase()}</td></tr>
                    <tr><th>Phone</th><td>${user.phoneNo}</td></tr>
                    </table>
                </h3>`;
        }
        else{
            showCopyMessage(data.message,"failed");
        }
    }
    catch{
        showCopyMessage(data.message,"failed");
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
        showCopyMessage("Error : "+result.message,"failed");
    }}
    catch(err){
        showCopyMessage("Error : "+err,"failed");
    }
}

function copyText(text) {
    navigator.clipboard.writeText(text)
        .then(() => showCopyMessage("Copied!", "success"))
        .catch(() => showCopyMessage("Copy Failed!", "error"));
}


function showCopyMessage(msg, type) {
    const box = document.getElementById("copyMsg");
    box.innerText = msg;
    if (type === "success") {
        box.style.background = "#d4eddb";
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

const deleteTicket = async (id, type) => {
    const pop = document.getElementById("popUp");
    pop.innerHTML = `
        <div style="background:#222; color:white; padding:20px; border-radius:10px; 
                    max-width:400px; margin:50px auto; text-align:center;">
            <p>Are you sure you want to delete <strong>${type} ticket (${id})</strong>?</p>
            <button id="confirmDelete" class="btn btn-danger">Yes, Delete</button>
            <button id="cancelDelete" class="btn btn-secondary ms-2">Cancel</button>
        </div>
    `;

    // CANCEL BUTTON
    document.getElementById("cancelDelete").onclick = () => {
        pop.innerHTML = "";  
    };

    // CONFIRM BUTTON
    document.getElementById("confirmDelete").onclick = async () => {

        try {
            const data = await fetch(`/delete-ticket/${id}?type=${type}`, {
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                }
            });

            const result = await data.json();

            if (data.ok) {
                showCopyMessage("Ticket deleted successfully", "success");
                setTimeout(() => window.location.href = "/booking-history", 1000);
            } else {
                showCopyMessage("Error: " + result.message, "failed");
            }

        } catch (err) {
            showCopyMessage("Error: " + err, "failed");
        }

        pop.innerHTML = "";  
    };
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
        <table width="400" cellpadding="5" cellspacing="5" style="background:none !important;">
            <tr>
                <th>Ticket ID</th>
                <td>
                    <div class="ticket-id-box">
                        ${ticket.ticketNo}
                        <button class="copy-btn" onclick="copyText('${ticket.ticketNo}')">📋</button>
                    </div>
                </td>
            </tr>
            <tr><th>From</th><td>${ticket.source}</td></tr>
            <tr><th>To</th><td>${ticket.destination}</td></tr>
            <tr><th>Journey Date</th><td>${ticket.journeyDate ? ticket.journeyDate.split("T")[0] : ''}</td></tr>
            <tr><th>No. of Passengers</th><td>${ticket.passengerCount}</td></tr>
            <tr><th>Phone</th><td>${ticket.phoneNo}</td></tr>
            <tr><th>Amount</th><td>₹${ticket.price}</td></tr>
            <tr><th>Booked At</th><td>${ticket.bookedAt.split("T")[0]} ${ticket.bookedAt.split("T")[1].substring(0,8)}</td></tr>
            <tr style="color:${ticket.status === 'Booked' ? '#d4eddb' : '#f8d7da'};background-color:${ticket.status === 'Booked' ? '#155724' : '#721c24'};">
                <th>Status</th>
                <td class="weight" ">
                    ${ticket.status === "Booked" 
                        ? 'Booked' 
                        : `<div class="ticket-id-box">
                                <div class="ticketIdText">Cancelled</div>
                                <button class="copy-btn" onclick="deleteTicket('${ticket.ticketNo}','train')">🗑️</button>
                           </div>`}
                </td>
            </tr>
        </table>
        <br>
    `).join("");
     
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
    <tr><th>Ticket No</th><td><div class="ticket-id-box"><div class="ticketIdText">${ticket.ticketNo}</div>
    <button class="copy-btn" onclick="copyText('${ticket.ticketNo}')">
        📋
    </button>
</div></td></tr>
    <tr><th>Station Name</th><td>${ticket.station}</td></tr>
    <tr><th>No. of Passengers</th><td>${ticket.passengerCount}</td></tr>
    <tr><th>Amount</th><td>₹${ticket.price}</td></tr>
    <tr><th>Booked At</th><td>${ticket.bookedAt.split("T")[0]} ${ticket.bookedAt.split("T")[1].substring(0,8)}</td></tr>

            <tr style="color:${ticket.status === 'Booked' ? '#d4eddb' : '#f8d7da'};background-color:${ticket.status === 'Booked' ? '#155724' : '#721c24'};">

                <th>Status</th>
                <td>
                    ${ticket.status === "Booked" 
                        ? 'Booked' 
                        : `<div class="ticket-id-box">
                                <div class="ticketIdText">Cancelled</div>
                                <button class="copy-btn" onclick="deleteTicket('${ticket.ticketNo}','platform')">🗑️</button>
                           </div>`}
                </td>
            </tr>
            </table>
<hr>
    `).join("");
};

const ticket_cancel = async() => {
    const id = document.getElementById("ticket_id").value;
    const main = document.getElementById("main");

    if(!/^TT-\d{4,7}$/i.test(id)) {
        setTimeout(()=>document.getElementById("failed").style.display = "none",5000);

        document.getElementById("failed").innerHTML = "Given id is not valid or incorrect";
        return;
    }

    try {
        const res = await fetch("/cancel-ticket",{
            method:"PATCH",
            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer " + localStorage.getItem("token")
            },
            body:JSON.stringify({ id })
        });

        const result = await res.json();

        if(res.ok){
            alert("Train Ticket cancelled successfully");
            showCopyMessage("Train Ticket cancelled successfully.\nAmount will return to your account","success");
            setTimeout(() => window.location.href = "/booking-history",1200);
        } else {
            setTimeout(()=>document.getElementById("failed").style.display = "none",5000);
            document.getElementById("failed").innerHTML = result.message;
            showCopyMessage("Train Ticket Cancellation failed.","failed");
        }
    }
    catch(err){
        showCopyMessage("Error"+err,"failed");
    }
};


// Booking platform ticket
async function platform_ticket() {
    var sn = document.getElementById("stationName").value;
    var np = document.getElementById("passenger_count").value;
    var mainDiv = document.getElementById("main");
    if(!sn) {
        setTimeout(()=>document.getElementById("stationError").style.display = "none",5000);
        document.getElementById("stationError").display = "block";
        return;
    }
    const confirmPay = confirm("Pay the amount " + np*10 + " rupees?");
        if (!confirmPay) {
            showCopyMessage("Payment cancelled","failed");
            window.location.href = '/platform-ticket';
            return;
        }
        const pay = parseInt(prompt("Pay the amount: " + np*10 + " rupees"));
        if (pay !== parseInt(np*10)) {
            showCopyMessage(" Payment failed : Entered Amount is not equal to the ticket price","failed");
            return;
        }

        const payload = {
            logid:localStorage.getItem("logid"),
            stationName: sn,
            passenger_count: np,
            amount: np*10
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
                    alert("Train Ticket booked successfully")
                    showCopyMessage("Platform ticket booked successfully.\nRedirecting to Booking history...","success");
                    setTimeout(() => window.location.href = "/booking-history",1200);
                } 
                else {
                    showCopyMessage("Booking failed"+ result.message,"failed");
                     window.location.href = '/platform-ticket';
                }
        } 
        catch (err) {
                showCopyMessage("Error: "+err,"failed");
                window.location.href = '/platform-ticket';
            }
            
}

// Cancel platform ticket details
const platform_cancel = async() => {
    const id = document.getElementById("ticket_id").value;
    const main = document.getElementById("main");

    if(!/^PT-\d{4,7}$/i.test(id)) {
        document.getElementById("failed").innerHTML = "Given id is not valid or incorrect";
        setTimeout(()=>document.getElementById("failed").style.display = "none",5000);

        return;
    }

    try {
        const res = await fetch("/cancel-platform",{
            method:"PATCH",
            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer " + localStorage.getItem("token")
            },
            body:JSON.stringify({ id })
        });

        const result = await res.json();

        if(res.ok){
            alert("Platform Ticket cancelled successfully");
            showCopyMessage("Platform Ticket cancelled successfully.\nAmount will return to your account","success");
            setTimeout(() => window.location.href = "/booking-history",1200);
        } else {
            setTimeout(()=>document.getElementById("failed").style.display = "none",5000);
            document.getElementById("failed").innerHTML = result.message;
            showCopyMessage("Platform Ticket Cancellation failed.","failed");
        }
    }
    catch(err){
        showCopyMessage("Error : "+err,"failed");
        window.location.href = '/platform-ticket-cancel';
    }
};
