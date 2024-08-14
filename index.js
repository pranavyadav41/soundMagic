require("dotenv").config({ path: "config/.env" });
const mongoose = require("mongoose");
const session = require('express-session');
const path = require("path");
const express = require("express");
const nodemailer = require("nodemailer");
const config = require("./config/config");
const nocache = require("nocache");

// Connect to MongoDB
mongoose.connect(process.env.DB_URL)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    console.log(process.env.DB_URL)
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', './views');

// Nocache
app.use(nocache());

// Session storage
app.use(session({
  secret: config.generateRandomString(32),
  resave: false,
  saveUninitialized: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// For user routes
const user_route = require('./routes/userRoute');
app.use('/', user_route);

// For admin routes
const admin_route = require('./routes/adminRoute');
app.use('/admin', admin_route);

app.listen(3000, function () {
  console.log("server is running on port http://localhost:3000");
});
