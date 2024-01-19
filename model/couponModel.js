const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true },
  couponName:{type:String,required:true},
  validFrom: { type: String, required: true },
  expiry: { type: String, required: true },
  discountAmount: { type: Number, required: true },
  minimumCartValue: { type: Number, required: true },
  listed:{type:Number,required:true,default:1}
});

module.exports = mongoose.model("coupon", couponSchema);