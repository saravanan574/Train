# 🚆 UTS – Online Train & Platform Ticket Booking System  
A full-stack web application that allows users to book train tickets, book platform tickets, view booking history, cancel tickets, and manage profiles.  
Built using **Node.js**, **Express**, **MongoDB**, **AngularJS**, **HTML**, **CSS**, and **JavaScript**.

## Features

### 👤 User Authentication
- User Registration  
- Login with JWT + Session  
- Auto-login verification using `/logverify`  
- Logout Functionality  

### Train Ticket Booking
- Book train tickets  
- Select source, destination, date, passenger count  
- Calculates fare dynamically  
- Generates unique ticket ID (e.g., `TT-12345`)  
- Saves booking with IST (Indian Standard Time)

### Platform Ticket Booking
- Book platform tickets for any railway station  
- Generates platform ticket number  
- Price calculation based on passengers  

### Booking History
- Separate history for Train Tickets and Platform Tickets  
- Copy Ticket ID with one click (📋)  
- Popup notification ("Copied!")  

### Ticket Cancellation
- Cancel train or platform tickets  
- Uses HTTP `PATCH` method  
- Auto-redirect after cancellation  
- Same route used for both tickets (system detects type internally)

### User Profile
- View profile  
- Update basic information  

##  Tech Stack

### Frontend
- HTML5  
- CSS3  
- JavaScript  
- AngularJS (1.x)  
- Responsive UI  
- Dynamic SPA routing  

### Backend
- Node.js  
- Express.js  
- MongoDB (Mongoose)  
- JWT Authentication  
- REST APIs  

### Deploy the website in the render I given the link in the description you can verify it.
