const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
  isVerified:{type:Boolean,default:false},
  isBlocked:{type:Boolean},
  isAdmin:{type:Boolean},
  referral:{type:String},
  referredBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',default:null}
});

module.exports = mongoose.model('User',userSchema)

