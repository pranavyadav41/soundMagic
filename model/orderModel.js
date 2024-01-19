const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  orderId:{
    type:String,
    required:true,

  },
  shippingAddress: {
    fullname: {
      type: String,
      required: true,
    },
    mobile: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    pincode: {
      type: Number,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      productOrderStatus:{
        type:String,
        default:"Order placed"
      },
      returnOrderStatus:{
        status:{
          type:String
        },
        reason:{ 
          type:String
        },
        date:{
          type:Date,
        }
        
      },

    },
  ],
  OrderStatus: {
    type: String,
    default: "Order placed",
    required: true,
  },
  OrderDate: {
    type:Date,
    default:Date.now(),
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  discountedPrice:{
    type:Number,
    default:0,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("order", orderSchema);