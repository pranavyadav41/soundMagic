const express = require('express');

const user_route = express();

user_route.set('views','./views/user')

const userController = require('../controller/userController');
const auth = require('../middleware/userAuth');


//BLOCKED BY ADMIN
user_route.get('/isBlocked',userController.userIsBlocked)


//signup
user_route.get('/',userController.loadRegister);

user_route.post('/',userController.insertUser);

//verifyOtp
user_route.get('/verify',userController.loadOtp)

user_route.post('/verify',userController.verifyOtp);

//Resend Otp

user_route.get('/resendOTP',userController.resendOtp)



//Login
user_route.get('/login',auth.isLogout,userController.Login);

//Logout
user_route.get('/logout',auth.isLogin,userController.Logout)

user_route.post('/login',userController.userLogin);

//Forget password

user_route.get('/forgetOtp',userController.forgetPassword)
user_route.post('/forgetOtp',userController.emailForgetPassword)
user_route.post('/verifyOtp',userController.forgetVerifyOtp)

//Update password

user_route.post('/updatePassword',userController.updatePassword);
 

//Home
user_route.get('/home',auth.isLogin,auth.isBlocked,userController.loadHome);

//Shop
user_route.get('/shop',auth.isLogin,auth.isBlocked,userController.loadShop);

//Product Detail
user_route.get('/productDetail',auth.isLogin,auth.isBlocked,userController.productDetail);

//Cart
user_route.get('/cart',auth.isLogin,auth.isBlocked,userController.loadCart)

//User Profile

user_route.get('/user-profile',auth.isLogin,auth.isBlocked,userController.loadProfile)
user_route.post('/changePassword',auth.isLogin,auth.isBlocked,userController.changePassword)
user_route.post('/addAddress',auth.isLogin,auth.isBlocked,userController.addAddress)
user_route.post('/deleteAddress',auth.isLogin,auth.isBlocked,userController.deleteAddress)
user_route.get('/myWallet',auth.isLogin,auth.isBlocked,userController.myWallet)
user_route.get('/editAddress/:id',auth.isLogin,auth.isBlocked,userController.editAddress)
user_route.post('/editAddress',auth.isLogin,auth.isBlocked,userController.addressEdit)




//Add to Cart

user_route.post('/addToCart',auth.isLogin,auth.isBlocked,userController.addToCart)
user_route.post('/updateQuantity',auth.isLogin,auth.isBlocked,userController.updateQuantity)
user_route.post('/removeProduct',auth.isLogin,auth.isBlocked,userController.removeProduct)

//Checkout

user_route.get('/checkout',auth.isLogin,auth.isBlocked,userController.loadCheckout)
user_route.post('/placeOrder',auth.isLogin,auth.isBlocked,userController.placeOrder)
user_route.get('/successOrder',auth.isLogin,auth.isBlocked,userController.orderPlaced)
user_route.post('/paymentVerify',auth.isLogin,auth.isBlocked,userController.paymentVerify)

//Orders
user_route.get('/myOrders',auth.isLogin,auth.isBlocked,userController.loadOrders)
user_route.get('/orderDetail/:orderId/:productId',auth.isLogin,auth.isBlocked,userController.orderDetail)
user_route.post('/cancelOrder',auth.isLogin,auth.isBlocked,userController.cancelOrder)
user_route.post('/returnOrder',auth.isLogin,auth.isBlocked,userController.returnOrder)

//Wishlist
user_route.get('/wishlist',auth.isLogin,auth.isBlocked,userController.loadWishlist)
user_route.post('/addToWish',auth.isLogin,auth.isBlocked,userController.addToWishList)
user_route.post('/removeWish',auth.isLogin,auth.isBlocked,userController.removeWish)

//INVOICE

user_route.post('/downloadInvoice',auth.isLogin,auth.isBlocked,userController.downloadInvoice);








module.exports = user_route;