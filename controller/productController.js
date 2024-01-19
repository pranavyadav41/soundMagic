const Product = require('../model/productModel')
const Category = require('../model/categoryModel')
const Order = require('../model/orderModel')
const Coupon = require('../model/couponModel')
const Banner = require('../model/bannerModel')
const Return = require('../model/returnModel')
const moment = require('moment')
const User= require('../model/userModel')
const now = moment();
const Offer = require("../model/offerModel")

const loadProduct = async(req,res)=>{
    try {

        var offers = await Offer.find({listed:1})

        var search = '';
        if(req.query.search){
            search = req.query.search;
        }
 
        var page = 1;
        if(req.query.page){
            page =Number(req.query.page);
        }

        const limit = 4;


    
        
        const products = await Product.find({
             productName: { $regex: '.*'+search+'.*',$options:'i'}
        }).populate('category')
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec() 

        console.log(products);

        const count = await Product.find({
            productName: { $regex: '.*'+search+'.*',$options:'i'}
       }).countDocuments();



        res.render('products',{products,offers,totalPages:Math.ceil(count/limit),currentPage:page,previous:page-1,next:page+1})
    } catch (error) {
        console.log(error.message);
    }
}

const loadAddProduct = async(req,res)=>{
    try {
        const categories = await Category.find({isListed:true},'name');
        res.render('addProduct',{categories})
    } catch (error) {
        
    }
}

const  addProduct = async(req,res)=>{

    try {
        
        const {
            productName,
            offerPrice,
            description,
            stock,
            category,

        } = req.body
        const categoryObject = await Category.findOne({ name: category });
        if (!categoryObject) {
            return res.status(400).json({ message: 'Invalid category' });
        }
        const image  = req.files.map((file)=>{
            const newPath = `${file.filename}`;

            file.path = newPath;

            return newPath

        });

        const newProduct = new Product({
            productName,
            offerPrice,
            description,
            stock,
            category:categoryObject._id,
            image
        })

        const saveProduct = await newProduct.save();
        res.redirect('/admin/products')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
        
    }
}

const listProduct = async(req,res)=>{
    try {

        const id = req.params.id
        const product = await Product.findOne({ _id: id })
        if (!product) {
            return res.status(404).json({ error: 'Category not found' });
        }
        product.is_listed = true;
        await product.save()
        res.json({ message: 'Category listed successfully' })

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });

    }

}

const unlistProduct = async(req,res)=>{
    try {

        const id = req.params.id

        const product = await Product.findOne({ _id: id })
        if (!product) {
            return res.status(404).json({ error: 'Category not found' });
        }
        product.is_listed = false;
        await product.save()
        res.json({ message: 'Category Unlisted successfully' })

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });

    }

}

const loadEditProduct = async(req,res)=>{
    try {
        const categories = await Category.find({isListed:true},'name');
        const productId = req.params.id;
        const product = await Product.findById(productId)
        res.render('editProduct',{product,categories})
    } catch (error) {
        
    }
}

const editProduct = async(req,res)=>{
    try {
        const productId = req.params.id;
        const category = req.body.category;
        const categoryObject = await Category.findOne({ name: category });
        if (!categoryObject) {
            return res.status(400).json({ message: 'Invalid category' });
        }
        const uploadedImg = req.files;
        const image  = uploadedImg.map((file)=>{
            const newPath = `${file.filename}`;

            file.path = newPath;

            return newPath

        });
        if(uploadedImg.length!==0){
            const productData = await Product.findByIdAndUpdate({_id:productId},
                {
                    $set: {
                        image:image,
                        productName: req.body.productName,
                        offerPrice: req.body.offerPrice,
                        stock: req.body.stock,
                        category: categoryObject._id,
                        description: req.body.description,
                    }
    
                })
                res.redirect('/admin/products')
             }else{
        const productData = await Product.findByIdAndUpdate({_id:productId},
            {
                $set: {
                   
                    productName: req.body.productName,
                    offerPrice: req.body.offerPrice,
                    stock: req.body.stock,
                    category: categoryObject._id,
                    description: req.body.description,
                }

            })
            res.redirect('/admin/products')

        }
        
    } catch (error) {
        console.log(error.message);
    }
}

const orders = async(req,res)=>{
    try {

        var page = 1;
        if(req.query.page){
            page =Number(req.query.page);
        }
        const limit = 6; 

        const orders = await Order.find().populate({path:'userId'}).limit(limit*1)
        .skip((page-1)*limit)
        .exec() ;

        
        const count = await Order.find().populate({path:'userId'}).countDocuments();
        
        res.render('orders',{orders,totalPages:Math.ceil(count/limit),currentPage:page,previous:page-1,next:page+1})

    } catch (error) {
         
    }
}
const orderDetail = async(req,res)=>{
    try {
        const orderId = req.params.orderID
        const orders = await Order.findOne({_id:orderId}).populate({path:'products.productId'});
        let totalDiscountPerProduct = 0;

        const totalAmount = orders.totalAmount;

        const discountPrice = orders.discountedPrice;
  
        if (discountPrice > 0) {
          const totalDiscount = totalAmount - discountPrice;
  
          totalDiscountPerProduct = totalDiscount / orders.products.length;
        }
        res.render('orderDetail',{orders,totalDiscountPerProduct})
    } catch (error) {
        console.log(error.message);
    }
}

const orderStatus = async(req,res)=>{
    try {
        const productId = req.body.productId;
        const orderId = req.body.orderId;
        const newStatus = req.body.newValue;

        const order = await Order.findOne({_id:orderId})

        const targetProduct = order.products.find(product=>product.productId.toString()===productId)
    
        targetProduct.productOrderStatus = newStatus 
    
        await order.save();
        
    } catch (error) {
        
        console.log(error.message)
    }
}

const returnOrders = async(req,res)=>{
    try {

        const returns = await Return.find({}).populate({path:'productId'});

        res.render('returnOrders',{returns})
        
    } catch (error) { 

        console.log(error.message);
        
    }
}

const loadOffers = async(req,res)=>{
    try {

        const offers = await Offer.find({})
        res.render('offers',{offers})
        
    } catch (error) {

        console.log(error.message);
        
    }
}

const addOffer = async(req,res)=>{
    try {

        res.render('addOffer')
        
    } catch (error) {

        console.log(error.message);
        
    }
}

const offerAdd = async(req,res)=>{
    try {

        const newOffer = new Offer({
            offerName:req.body.offerName,
            validFrom:req.body.validFrom,
            expiry:req.body.validTo,
            discountPercentage:req.body.discountPercentage,

        })

        await newOffer.save();
        res.json({success:true})
        
    } catch (error) {

        console.log(error.message);
        
    }
}

const editOffer = async(req,res)=>{
    try {


        const offer =await Offer.find({_id:req.params.id})

        res.render('editOffer',{offer})
        
    } catch (error) {

        console.log(error.message);
        
    }
}

const offerEdit = async(req,res)=>{
    try {

        const offer = await Offer.findByIdAndUpdate({_id:req.body.offerId},{
            $set:{
                offerName:req.body.offer.offerName,
                validFrom:req.body.offer.validFrom,
                expiry:req.body.offer.validTo,
                discountPercentage:req.body.offer.discountPercentage,
            }
        });

        res.json({success:true})

        
    } catch (error) {

        console.log(error.message);
        
    }
}

const listOffer = async(req,res)=>{
    try {

        const id = req.params.id
        const offer = await Offer.findOne({ _id: id })
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }
        offer.listed = 1;
        await offer.save()
        res.json({ message: 'Offer listed successfully' })


        
    } catch (error) {

        console.log(error.message);
        
    }
}

const unlistOffer = async(req,res)=>{
    try {

        const id = req.params.id

        const offer = await Offer.findOne({ _id: id })
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }
        offer.listed = 0;
        await offer.save()
        res.json({ message: 'Offer Unlisted successfully' })



        
    } catch (error) {

        console.log(error.message);
        
    }
}

const addProductOffer = async(req,res)=>{
    try {
        const offer = await Offer.find({_id:req.body.offerId})

        const discount = offer[0].discountPercentage;

        const product = await Product.find({_id:req.body.productId})

        const actualPrice = product[0].offerPrice; 

        const productOffer =Math.round(actualPrice*discount/100);

       
        const productSave = await Product.findOneAndUpdate({_id:req.body.productId},{$set:{'productOffer.amount':productOffer,'productOffer.offerApplied':true,'productOffer.offerName':offer[0].offerName,'productOffer.offerPercentage': offer[0].discountPercentage}});


        const totalOffer = actualPrice-(productOffer+product[0].categoryOffer.amount)

        const totalSave = await Product.findOneAndUpdate({_id:req.body.productId},{$set:{totalOfferPrice:totalOffer}})


        if(totalSave){
            res.json({success:true})
        }

        
    } catch (error) {

        console.log(error.message);
        
    }
}

const removeProductOffer = async(req,res)=>{
    try {

        const product = await Product.findOne({_id:req.body.productId});

        const productOffer = product.productOffer.amount

        const update = await Product.findOneAndUpdate({_id:req.body.productId},{$inc:{totalOfferPrice:productOffer},$set:{'productOffer.amount':0,'productOffer.offerApplied':false,'productOffer.offerName':null,'productOffer.offerPercentage':null}})

        if(update){
            res.json({success:true})
        }
        
    } catch (error) {

        console.log(error.message);
        
    }
}

const coupons = async(req,res)=>{
    try {

        const coupons = await Coupon.find();

        res.render('coupon',{coupons})
        
    } catch (error) {
       console.log(error.message) 
    }
}

const addCoupons = async(req,res)=>{
    try {

        res.render('addcoupon')
        
    } catch (error) {
        console.log(error.message)
    }
}

const couponAdd = async(req,res)=>{
    try {
        const copy = await Coupon.findOne({code:req.body.couponCode});
        if(copy){
            console.log("copy");
            return res.status(400).json({ error: "Coupon code already exists." });
           
        }

        const dupli = await Coupon.findOne({couponName:req.body.couponName})
        if(dupli){
            console.log("duplicate");
            return res.status(400).json({ error: "Coupon name already exists." });
           
        }
        const newCoupon = new Coupon({
            code:req.body.couponCode,
            couponName:req.body.couponName,
            validFrom:req.body.validFrom,
            expiry:req.body.validTo,
            discountAmount:req.body.discountAmount,
            minimumCartValue:req.body.minCartValue,
        })
        await newCoupon.save();
        res.json({success:true});
        

        
    } catch (error) {

        console.log(error)
        
    }

}

const editCoupon = async(req,res)=>{
    try {
        const couponId = req.params.id;
        const coupon = await Coupon.find({_id:couponId})

        console.log(coupon);

        res.render('editCoupon',{coupon});
        
    } catch (error) {

        console.log(error.message)
        
    }
}

const couponEdit = async(req,res)=>{
    try {
        console.log(req.body);

        const coupon = await Coupon.findByIdAndUpdate({_id:req.body.couponId},{
            $set:{
                code:req.body.coupon.couponCode,
                couponName:req.body.coupon.couponName,
                validFrom:req.body.coupon.validFrom,
                expiry:req.body.coupon.validTo,
                discountAmount:req.body.coupon.discountAmount,
                minimumCartValue:req.body.coupon.minCartValue
            }
        });

        res.json({success:true})
        
    } catch (error) {

        console.log(error.message);
        
    }
}

const listCoupon = async(req,res)=>{
    try {

        const id = req.params.id
        const coupon = await Coupon.findOne({ _id: id })
        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }
        coupon.listed = 1;
        await coupon.save()
        res.json({ message: 'Coupon listed successfully' })


        
    } catch (error) {
        
        console.log(error.message);
    }
}

const unlistCoupon = async(req,res)=>{
    try {

        const id = req.params.id

        const coupon = await Coupon.findOne({ _id: id })
        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }
        coupon.listed = 0;
        await coupon.save()
        res.json({ message: 'Coupon Unlisted successfully' })

        
    } catch (error) {

        console.log(error.message);
        
    }

}

const loadBanner = async(req,res)=>{
    try {

        const banners = await Banner.find();

        res.render('Banner',{banners})
        
    } catch (error) {

        console.log(error.message);
        
    }
}

const addBanner = async(req,res)=>{
    try {

        res.render("addBanner")


        
    } catch (error) {

        console.log(error.message);
        
    }
}

const bannerAdd = async(req,res)=>{
    try{

        let filename = req.file.filename;


        const newBanner = new Banner({
            title:req.body.title,
            description:req.body.description,
            image:filename
        })

        await newBanner.save();
        res.redirect("/admin/banner")







        
    } catch (error) {

        console.log(error.message);
        
    }
}

const editBanner = async(req,res)=>{
    try {

        const bannerId = req.params.id;

        const banner = await Banner.find({_id:bannerId});


        res.render('editBanner',{banner})


        
    } catch (error) {

        console.log(error.message);
        
    }
}

const bannerEdit = async(req,res)=>{
    try{

        let bannerId = req.params.id;

        if(req.file){
            let bannerUpdate = await Banner.findByIdAndUpdate({_id:bannerId},{
                $set:{
                    title:req.body.title,
                    description:req.body.description,
                    image:req.file.filename

                }
            })
            await bannerUpdate.save();
            res.redirect("/admin/banner")
        }else{
            let bannerUpdate = await Banner.findByIdAndUpdate({_id:bannerId},{
                $set:{
                    title:req.body.title,
                    description:req.body.description,
                }
            })

            await bannerUpdate.save();
            res.redirect("/admin/banner")



        }







        
    } catch (error) {

        console.log(error.message);
        
    }
}

const listBanner = async(req,res)=>{
    try {

        const id = req.params.id
        const banner = await Banner.findOne({ _id: id })
        if (!banner) {
            return res.status(404).json({ error: 'Coupon not found' });
        }
        banner.isListed = true;
        await banner.save()
        res.json({ message: 'Banner listed successfully' })



        
    } catch (error) {

        console.log(error.message);
        
    }
}

const unlistBanner = async(req,res)=>{
    try {

        const id = req.params.id

        const banner = await Banner.findOne({ _id: id })
        if (!banner) {
            return res.status(404).json({ error: 'Banner not found' });
        }
        banner.isListed = false;
        await banner.save()
        res.json({ message: 'Banner Unlisted successfully' })
        
    } catch (error) {

        console.log(error.message);
        
    }
}

module.exports = {
    loadProduct,
    loadAddProduct,
    addProduct,
    listProduct,
    unlistProduct,
    loadEditProduct,
    editProduct,
    orders,
    orderDetail,
    orderStatus,
    coupons,
    addCoupons,
    couponAdd,
    editCoupon,
    couponEdit,
    listCoupon,
    unlistCoupon,
    loadBanner,
    addBanner,
    bannerAdd,
    editBanner,
    bannerEdit,
    listBanner,
    unlistBanner,
    returnOrders,
    loadOffers,
    addOffer,
    offerAdd,
    editOffer,
    offerEdit,
    listOffer,
    unlistOffer,
    addProductOffer,
    removeProductOffer
}