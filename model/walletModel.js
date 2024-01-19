const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    balance:{
        type:Number,
        required:true,
        default:"0"
    },
    history:[
        {
    type:{
        type:String,
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    date:{
        type:Date,
        default:Date.now()
    }
}
],

})
module.exports = mongoose.model("wallet", walletSchema);