const User =require("../model/userModel");


const isLogin = async(req,res,next)=>{
    try {
        if(req.session.userid){
            next();

        }else{
            res.redirect("/login")
        }
        
        
    } catch (error) {
        console.log(error.message)
    }
}



const isLogout = async(req,res,next)=>{
    try {

        if(req.session.userid){
            res.redirect("/home")
        }else{
        next();
        }
        
    } catch (error) {
        console.log(error.message)
    }
}

const isBlocked = async(req,res,next)=>{
    try {

        const user = await User.findOne({_id:req.session.userid})
        if(user.isBlocked){
             res.redirect('/isBlocked')
             req.session.destroy();
        }else{
            next();
        }
        
    } catch (error) {

        console.log(error.message);
        
    }
}

module.exports = {
    isLogin,
    isLogout,
    isBlocked
}