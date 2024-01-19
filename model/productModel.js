
 const mongoose = require("mongoose");

 const productSchema = new mongoose.Schema({
    productName: {
       type:String,
       required:true
    },
   
     offerPrice:{
       type:Number,
       required:true
     },

     productOffer:{
      offerApplied:{ type:Boolean,default:false},
      amount:{type:Number,default:0},
      offerName:{type:String},
      offerPercentage:{type:Number}


     },
     categoryOffer:{
      offerApplied:{ type:Boolean,default:false},
      amount:{type:Number,default:0},
      offerName:{type:String},
      offerPercentage:{type:Number}

     },

     totalOfferPrice:{
      type:Number,
      default:0
     },
   
     image:{
       type:Array,
       required:true
     },
     
     description:{
       type:String,
       required:true
     },
     category:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Category",
      required:true
    },
  
     
     stock:{     
       type:Number,
       required:true
     },
   
     is_listed:{
       type:Boolean,
       default:true
     },
   
   }, );
   
   
   
   module.exports = mongoose.model('Product', productSchema);





   