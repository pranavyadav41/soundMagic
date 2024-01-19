const multer = require("multer")

const productStorage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'./public/productImages')

    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name)

    }
})




const upload = multer({
    storage:productStorage,
    limits:{fileSize:5*1024*1024},
})

module.exports = upload;