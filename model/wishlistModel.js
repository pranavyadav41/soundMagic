const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "user",
    required: true,
  },
  products: [
    {
      productId:{
          type:mongoose.Types.ObjectId,
          ref:'Product',
          required:true
      }
  }
  ],
});

module.exports = mongoose.model("wishlist", wishlistSchema);