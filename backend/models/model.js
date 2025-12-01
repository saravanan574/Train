import mongoose from "mongoose";

// ================= USER SCHEMA ==================
const userSchema = new mongoose.Schema({
    regNo: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: String, required: true },
    gender: { type: String, required: true },
    createdAt: { type: Date, required: true },
    emailId: { type: String, required: true },
    phoneNo: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

// ================= TRAIN TICKET SCHEMA ==================
const ticketSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    ticketNo: { type: String, required: true },
    source: { type: String, required: true },
    destination: { type: String, required: true },
    journeyDate: { type: Date, required: true },
    passengerCount: { type: String, required: true },
    price: { type: Number, required: true },
    phoneNo: { type: String, required: true },
    status: { type: String, required: true },
});

// ================= PLATFORM TICKET SCHEMA ==================
const platformSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    ticketNo: { type: String, required: true },
    station: { type: String, required: true },
    passengerCount: { type: String, required: true },
    price: { type: Number, required: true },
    status: { type: String, required: true },
});

// ================= EXPORT MODELS ==================
const User = mongoose.model("userData", userSchema);
const Ticket = mongoose.model("trainTicket", ticketSchema);
const Platform = mongoose.model("platformTicket", platformSchema);

export { User, Ticket, Platform };
