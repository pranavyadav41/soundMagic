const express = require('express');
const admin_route = express();

admin_route.set('views','./views/admin')

const adminController = require('../controller/adminController')
const categoryController = require('../controller/categoryController')
const productController = require('../controller/productController')
const Multer = require('../middleware/multerConfig')
const auth = require("../middleware/auth")


//Login

admin_route.get('/',auth.isLogout,adminController.loadLogin)

admin_route.post('/',adminController.insertAdmin)

//Logout

admin_route.get('/logout',auth.isLogin,adminController.adminLogout)

//Dashboard

admin_route.get('/dashboard',auth.isLogin,adminController.loadDashboard)
admin_route.post('/dashboard',auth.isLogin,adminController.salesReport)
admin_route.post('/dashboard/monthly',auth.isLogin,adminController.monthlyReport)
admin_route.post('/dashboard/yearly',auth.isLogin,adminController.yearlyReport)
admin_route.get('/download-pdf',auth.isLogin,adminController.downloadPdf)
admin_route.get('/download-csv',auth.isLogin,adminController.downloadCsv)


//Users

admin_route.get('/users',auth.isLogin,adminController.loadUsers)

//blocking user

admin_route.patch('/block-user/:userID',adminController.userBlock)
admin_route.patch('/Unblock-user/:userID',adminController.userUnblock)

//Categories

admin_route.get('/categories',auth.isLogin,categoryController.loadCategories)

admin_route.post('/categories',auth.isLogin,categoryController.addCategories)

//editCategories

admin_route.get('/categories/edit/:id',auth.isLogin,categoryController.loadEditCategories)
admin_route.post('/categories/edit/:id',auth.isLogin,categoryController.editCategories)

//ListAndUnlist Categories

admin_route.patch('/list-category/:id',auth.isLogin,categoryController.listCategory)
admin_route.patch('/unlist-category/:id',auth.isLogin,categoryController.unlistCategory)

//CategoryOffer
admin_route.post('/addCategoryOffer',auth.isLogin,categoryController.addCategoryOffer)
admin_route.post('/removeCategoryOffer',auth.isLogin,categoryController.removeCategoryOffer)



//Products

admin_route.get('/products',auth.isLogin,productController.loadProduct)


//Add Products

admin_route.get('/products/add-product',auth.isLogin,productController.loadAddProduct)

admin_route.post('/products/add-product',Multer.array('image',4),auth.isLogin,productController.addProduct)


//List/Unlist Products

admin_route.patch('/list-product/:id',auth.isLogin,productController.listProduct);

admin_route.patch('/unlist-product/:id',auth.isLogin,productController.unlistProduct);

//Edit Products
admin_route.get('/products/edit/:id',auth.isLogin,productController.loadEditProduct)

admin_route.post('/products/edit/:id',Multer.array('image',4),auth.isLogin,productController.editProduct)

//MY ORDERS
admin_route.get('/orders',auth.isLogin,productController.orders)

admin_route.get('/orderDetail/:orderID',auth.isLogin,productController.orderDetail)

admin_route.post('/orderStatus',auth.isLogin,productController.orderStatus)

admin_route.get('/returnOrders',auth.isLogin,productController.returnOrders)

//OFFERS

admin_route.get('/offers',auth.isLogin,productController.loadOffers)
admin_route.get('/addOffer',auth.isLogin,productController.addOffer)
admin_route.post('/addOffer',auth.isLogin,productController.offerAdd)
admin_route.get('/editOffer/:id',auth.isLogin,productController.editOffer)
admin_route.post('/offerEdit',auth.isLogin,productController.offerEdit)

admin_route.patch('/list-offer/:id',auth.isLogin,productController.listOffer);
admin_route.patch('/unlist-offer/:id',auth.isLogin,productController.unlistOffer);


admin_route.post('/addProductOffer',auth.isLogin,productController.addProductOffer)
admin_route.post('/removeProductOffer',auth.isLogin,productController.removeProductOffer)


//COUPON

admin_route.get('/coupons',auth.isLogin,productController.coupons)
admin_route.get('/addCoupon',auth.isLogin,productController.addCoupons)
admin_route.post('/addCoupon',auth.isLogin,productController.couponAdd)
admin_route.get('/editCoupon/:id',auth.isLogin,productController.editCoupon)
admin_route.post('/editCoupon',auth.isLogin,productController.couponEdit)

admin_route.patch('/list-coupon/:id',auth.isLogin,productController.listCoupon);
admin_route.patch('/unlist-coupon/:id',auth.isLogin,productController.unlistCoupon);


//BANNER

admin_route.get('/banner',auth.isLogin,productController.loadBanner)
admin_route.get('/addBanner',auth.isLogin,productController.addBanner)
admin_route.post('/addBanner',Multer.single('image'),auth.isLogin,productController.bannerAdd)
admin_route.get('/editBanner/:id',auth.isLogin,productController.editBanner)
admin_route.post('/bannerEdit/:id',auth.isLogin,Multer.single('image'),productController.bannerEdit)

admin_route.patch('/list-banner/:id',auth.isLogin,productController.listBanner);
admin_route.patch('/unlist-banner/:id',auth.isLogin,productController.unlistBanner);






module.exports = admin_route;

