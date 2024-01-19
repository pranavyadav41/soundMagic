const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema({
  orderId: { type: mongoose.Types.ObjectId,ref:"order", required: true},
  productId:{ type: mongoose.Types.ObjectId,ref:"Product", required: true},
  reason: { type: String, required: true },
  summary:{type:String},
  date: { type: Date, default:Date.now()},
  userId:{ type: mongoose.Types.ObjectId,ref:"user", required: true},
});

module.exports = mongoose.model("returnRequest", returnSchema);