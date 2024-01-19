const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  offerName:{type:String,required:true},
  validFrom: { type: String, required: true },
  expiry: { type: String, required: true },
  discountPercentage: { type: Number, required: true },
  listed:{type:Number,required:true,default:1}
});

module.exports = mongoose.model("offer", offerSchema);