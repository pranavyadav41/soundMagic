const isLogin = async(req,res,next)=>{
    try {
        if(req.session.user_id){
         return next(); 
            
            
        }else{
          return res.redirect('/admin')
           
           
        }
        
       

        
    } catch (error) {
        console.log(error.message); 
        
    }
}


const isLogout = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            res.redirect('/admin/dashboard')
        }else{
            next(); 

        }
              
    } catch (error) {
        console.log(error.message);
        
    }
}

module.exports = {
    isLogin,
    isLogout
}