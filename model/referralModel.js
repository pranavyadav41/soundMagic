const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema({
    referralUserId: { type: mongoose.Types.ObjectId,ref:"User"},
    referrredUserId:{ type: mongoose.Types.ObjectId,ref:"User"},
    referralCode: { type: String, required: true},
    date: { type: Date, default:Date.now()},
  });
  
  module.exports = mongoose.model("referral", referralSchema);