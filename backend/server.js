import express from "express";
import path from "path";
import {fileURLToPath} from "url";
import session from "express-session";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt"
import {User,Ticket,Platform} from "./models/model.js"
dotenv.config();

const app = express();
const Port = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin:true,credentials:true
}));


const filename = fileURLToPath(import.meta.url);
const frontend = path.join(path.dirname(filename),"../frontend");
const img = path.join(path.dirname(filename),"../Image");
const bend = path.dirname(filename);

app.use(express.static(frontend));  // Serve HTML, CSS, JS
app.use("/bd",express.static(bend));
app.use("/img", express.static(img));
// Middlewares

app.use(
  session({
    secret: "Don't see my privacy",
    cookie: { maxAge: 100000 },
    resave: true,
    saveUninitialized: true,
  })
);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

// REGISTER USER
app.post("/register", async (req, res) => {
  try {
    const { rname, rage, rgender, rmail, phoneno, rpass } = req.body;

    // Check if phone already exists
    let exists = await User.findOne({ phoneNo: phoneno });
    if (exists) {
      return res.status(400).json({ success: false, message: "Phone number already registered" });
    }

    // Generate registration number
    const regNo = Math.round(Date.now() * 100000);
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(rpass,salt);
    // Create new user
    const newUser = new User({
      regNo,
      name: rname.toUpperCase(),
      age: rage,
      gender: rgender,
      createdAt: new Date(),
      emailId: rmail,
      phoneNo: phoneno,
      password
    });
    await newUser.save();
    console.log(`${newUser.name} registered successfully`);

    // Send JSON response for SPA
    res.status(200).json({ status: "success", message: "Registration successful", regNo });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "failed", message: "Server error. Try again later." });
  }
});


//Check login or not
app.get("/logverify",async(req,res) => {
  const token = req.cookies.token;
  if(!token) res.status(200).json({message:false,status:"failed"});
  else {
    const verify = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    res.status(200).json({message:true,status :"success",auth:{id:verify.userId,token}});
  }
})

const verifyToken = (req,res,next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if(!token) return res.status(401).json({message:"Token is not provided",status:"failed"});
  try{
    const decode = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    req.userId = decode.userId;
    next();
  }
  catch(err){
    console.error(err);
    return res.status(402).json({message:"Invalid token",status:"failed"});
  }
}

// Login route
app.post("/login", async (req, res) => {
  let phone = req.body.log_phone;
  let password = req.body.log_pw;
  const user = await User.findOne({ phoneNo:phone });
  console.log
  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid password" });
  const token = jwt.sign(
    {userId:user.regNo}, 
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn:"1d"}
  )
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });
  console.log(`${user.name} logged in successfully`);

  res.status(200).json({message:"User is found",status:"success",userId:user.regNo,token});
});


//Logout route
app.get("/log-out",verifyToken,async(req,res) => {
  const cookie = req.cookies.token;
  if(cookie) {
    res.clearCookie("token");
    console.log(req.userId," Logged out success ",new Date());
    res.status(200).json({message:"Logout successfully",status:"success"});
  }
  else{ 
    console.log("Logged out failed ");
    res.status(401).json({message:"Logout failed",status:"failed"});
  }

})

app.get("/get-profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ regNo: req.userId });

    if (!user) {
      return res.status(404).json({
        message: "Profile not found",
        status: "failed"
      });
    }

    res.status(200).json({
      message: "Profile found successfully",
      status: "success",
      user
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", status: "failed" });
  }
});

// BOOK TRAIN TICKET
app.post("/booktrain", verifyToken,async (req, res) => {
  try {
    // ticket ID
    const ticketId = "TT-" + String(Math.floor(100000 + Math.random() * 900000));
    // match exactly with frontend payload
    const userId = req.body.logid;
    const source = (req.body.source || "").toUpperCase();
    const destination = (req.body.destination || "").toUpperCase();
    const journey = req.body.date || "";
    const passenger = req.body.passengers || "";
    const price = req.body.amount || "";
    const phone = req.body.phoneno || "";

    // create ticket
    const t = new Ticket({
      userId,
      ticketNo: ticketId,
      source: source,
      destination: destination,
      journeyDate: journey,
      passengerCount: passenger,
      bookedAt:new Date(),
      price: price,
      phoneNo: phone,
      status: "Booked",
    });

    // save
    await t.save();
    res.status(200).json({message:"Ticket booked successfully",status:"success"});

  } catch (err) {
    console.log("BOOK TRAIN ERROR:", err);
    res.status(500).json({message:"Internal Server Error",status:"failed"});
  }
});
const getIST = () => {
  const date = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + offset);
}
// BOOK PLATFORM TICKET
app.post("/booking_platform",verifyToken, async(req, res) => {
  try{
    let s = "PT-" + Math.round(Math.random() * 100000);
    let p = new Platform({
      userId: req.userId,
      ticketNo: s,
      station: req.body.stationName.toUpperCase(),
      passengerCount: req.body.passenger_count,
      price: parseInt(req.body.amount),
      bookedAt:getIST(),
      status: "Booked",
    });
    await p.save();
    res.status(200).json({message:"Ticket booked successfully",status:"success"});
  } catch (err) {
    res.status(500).json({message:"Internal Server Error",status:"failed"});
  }
  });

app.get("/ticket-history", verifyToken,async(req,res) => {
  let today = new Date();
  today.setHours(0, 0, 0, 0);

  // Train tickets with future journey date
  let ticket_data = await Ticket.find({
      userId: req.userId,
      journeyDate: { $gt: today-1 }
  }).sort({ _id: -1 });

  // Platform ticket (if you also have a date field)
  let platform_data = await Platform.find({
      userId: req.userId
  }).sort({ _id: -1 });
    if(!ticket_data || !platform_data) res.status(401).json({message:"User id is not found",status:"failed"});
    res.status(200).json({message:true,status :"success",ticket_data,platform_data});
});




// CANCEL TRAIN
app.patch("/cancel-ticket",verifyToken, async(req, res) => {
  let d = await Ticket.updateOne(
    { ticketNo: req.body.id, status: "Booked",userId:req.userId },
    { status: "Cancelled" }
  );

  if (!d.matchedCount) return res.status(401).json({message:"Train Ticket id is not found or already cancelled Please check it",status:"failed"});
  res.status(200).json({message:"Train Ticket is cancelled successfully",status:"success"});
});

// CANCEL PLATFORM
app.patch("/cancel-platform",verifyToken, async (req, res) => {
  let d = await Platform.updateOne(
    { ticketNo: req.body.id, status: "Booked" ,userId:req.userId},
    { status: "Cancelled" }
  );

  if (!d.matchedCount) return res.status(401).json({message:"Platform Ticket id is not found or already cancelled Please check it",status:"failed"});
  res.status(200).json({message:"Platform Ticket is cancelled successfully",status:"success"});
});

app.delete("/delete-ticket/:id",verifyToken,async(req,res) => {
  const id = req.params.id;
  const type = req.query.type;
  let data;
  if(type == "train"){
    data = await Ticket.deleteOne({userId:req.userId,ticketNo:id});
  }
  else if(type == "platform"){
    data = await Platform.deleteOne({userId:req.userId,ticketNo:id});
  }
  else{
    return res.status(400).json({message:"Ticket type is not defined ",status:"Failed"});
  }
  if(!data) return res.status(401).json({message:" Ticket id is not found or already cancelled\nPlease check it",status:"failed"});
  res.status(200).json({message:"Ticket is deleted successfully",status:"success"});
})

// MAIN PAGE → load layout, then load login page inside it
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontend, "layout.html"));
});

// RUN SERVER
app.listen(Port, () =>
  console.log("Server running on port 3000 ")
);
