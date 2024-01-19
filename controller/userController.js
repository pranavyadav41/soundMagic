//For rendering signup page

const User = require("../model/userModel");
const mongoose = require("mongoose");
require("dotenv").config({ path: "config/.env" });
const sendMail = require("../services/otpVerification");
const crypto = require("crypto");
const Category = require("../model/categoryModel");
const Product = require("../model/productModel");
const Cart = require("../model/cartModel");
const Return = require("../model/returnModel");
const Address = require("../model/addressModel");
const Order = require("../model/orderModel");
const Razorpay = require("razorpay");
const PDFDocument = require("pdfkit");
const Coupon = require("../model/couponModel");
const Wallet = require("../model/walletModel");
const Wishlist = require("../model/wishlistModel");
const Banner = require("../model/bannerModel");
const moment = require("moment");
const now = moment(Date.now());

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

//IF USER IS BLOCKED
const userIsBlocked = async (req, res) => {
  try {
    res.render("isBlocked");
  } catch (error) {}
};

//hashing password
const bcrypt = require("bcrypt");
const { getMaxListeners } = require("events");
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const loadRegister = async (req, res) => {
  try {
    res.render("userSignup");
  } catch (error) {
    console.log(error.message);
  }
};

// Generate a random 6-digit otp
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

//Generate a random order id
function generateRandomOrderId() {
  const timestamp = new Date().getTime().toString();
  const randomString = Math.random().toString(36).substring(2, 8); // Use a random string of length 6

  return `${timestamp}-${randomString}`;
}

//For storing user details

const insertUser = async (req, res) => {
  try {
    function addRandomSuffixToEmail(email) {
      // Generate a random 4-character string
      const randomSuffix = Array.from({ length: 4 }, () =>
        String.fromCharCode(Math.floor(Math.random() * 62) + 48)
      ).join("");

      // Add the random suffix to the email
      const modifiedEmail = email + randomSuffix;

      return modifiedEmail;
    }
    const existUser = await User.findOne({ email: req.body.email });
    if (existUser) {
      res.render("userSignup", { message: "Email already exist!" });
      return false;
    }
    const spassword = await securePassword(req.body.password);
    let user;
    if (req.query.referralCode) {
      const email = req.query.referralCode.substring(
        0,
        req.query.referralCode.length - 4
      );

      let userdetail = await User.findOne({ email: email });

      user = new User({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        mobile: req.body.mno,
        email: req.body.email,
        password: spassword,
        isBlocked: 0,
        isAdmin: 0,
        referral: addRandomSuffixToEmail(req.body.email),
        referredBy: userdetail._id,
      });
    } else {
      user = new User({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        mobile: req.body.mno,
        email: req.body.email,
        password: spassword,
        isBlocked: 0,
        isAdmin: 0,
        referral: addRandomSuffixToEmail(req.body.email),
        refferedBy: "",
      });
    }
    const userData = await user.save();

    if (userData) {
      const otp = generateOTP();
      req.session.name = req.body.firstname;
      req.session.otp = otp;
      req.session.email = req.body.email;

      await sendMail(otp, req.body.email, req.body.firstname);
      res.redirect("/verify");
    } else {
      res.render("userSignup", {
        message: "Your registration has been faileed",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//Load otp page
const loadOtp = async (req, res) => {
  try {
    console.log(req.session.otp);
    res.render("verifyOtp");
  } catch (error) {
    console.log(error.message);
  }
};
//Compare otp and verify
const verifyOtp = async (req, res) => {
  try {
    userEnteredOtp =
      req.body.digit1 +
      req.body.digit2 +
      req.body.digit3 +
      req.body.digit4 +
      req.body.digit5 +
      req.body.digit6;
    userOtp = parseInt(userEnteredOtp);

    if (req.session.otp === userOtp) {
      const user = await User.updateOne(
        { email: req.session.email },
        { $set: { isVerified: true } }
      );

      console.log(user, "1");

      const userdetail = await User.find({ email: req.session.email });

      if (userdetail[0].referredBy !== null) {
        //////CREDITING MONEY TO REFERRED USER/////////
        let referredUserWallet = await Wallet.findOne({
          userId: userdetail[0].referredBy,
        });
        try {
          if (!referredUserWallet) {
            console.log("Wallet not found");

            referredUserWallet = new Wallet({
              userId: userdetail[0].referredBy,
              balance: 200,
              history: [
                {
                  type: "Credit",
                  amount: 200,
                },
              ],
            });

            await referredUserWallet.save();
          } else {
            console.log("Wallet found");

            referredUserWallet.history.push({
              type: "Credit",
              amount: 200,
            });

            referredUserWallet.balance = referredUserWallet.history.reduce(
              (total, transaction) => {
                return (
                  total +
                  (transaction.type === "Credit"
                    ? transaction.amount
                    : -transaction.amount)
                );
              },
              0
            );

            await referredUserWallet.save();
          }
        } catch (error) {
          console.error("Error processing referred user wallet:", error);
        }
        ////////////////////////////////////////////////
        ////////////////////////////////////////////////
        ////////CREDITING TO USER WALLET////////////////////////

        let userEmail = userdetail[0].referral.substring(
          0,
          userdetail[0].referral.length - 4
        );

        let customer = await User.find({ email: userEmail });
        let newWallet = new Wallet({
          userId: customer[0]._id,
          balance: 100,
          history: [{ type: "Credit", amount: 100 }],
        });

        await newWallet.save();
      }
      req.session.isVerified = 1;

      res.redirect("/login");
    } else {
      res.render("verifyOtp", { message: "Invalid OTP.Please try again." });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//render Login

const Login = async (req, res) => {
  try {
    res.render("userLogin");
  } catch (error) {
    console.log(error.message);
  }
};

const Logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};

//User Login

const userLogin = async (req, res) => {
  const email = req.body.email;
  req.session.email = email;
  const password = req.body.password;
  try {
    const user = await User.findOne({ email });
    req.session.userid = user._id;
    //email match
    if (!user) {
      res.render("userLogin", { error: "Invalid Email or Password" });
    }

    //checking block/unblock
    if (user.isBlocked) {
      res.render("userlogin", { error: "Failed to login,You are blocked" });
    }

    //isVerified
    if (!user.isVerified) {
      req.session.email = email;
      const generatedOtp = generateOTP();
      req.session.otp = generatedOtp;
      await sendMail(req.session.otp, req.session.email);
      res.render("userLogin", {
        verify: "Please verify your account before logging in",
      });
    }

    //compare password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      res.redirect("/home");
    } else {
      res.render("userLogin", { error: "Invalid Email or Password" });
    }
  } catch (error) {}
};

const loadHome = async (req, res) => {
  try {
    const products = await Product.find({ is_listed: true });
    const banners = await Banner.find({ isListed: true });
    const cart = await Cart.findOne({ userId: req.session.userid });

    res.render("index", { products, banners, cart });
  } catch (error) {
    console.log(error.message);
  }
};

const loadShop = async (req, res) => {
  try {
    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    var page = 1;
    if (req.query.page) {
      page = Number(req.query.page);
    }

    const limit = 6;
    let sortOption = "asc";
    if (req.query.sort) {
      sortOption = req.query.sort.toLowerCase();
    }

    let sortDirection = 1;
    if (sortOption === "desc") {
      sortDirection = -1;
    }

    let sortCriteria = { offerPrice: sortDirection };

    if (req.query.id) {
      const id = req.query.id;
      const category = await Category.find({ isListed: true });
      const products = await Product.find({
        is_listed: true,
        category: id,
        productName: { $regex: ".*" + search + ".*", $options: "i" },
      })
        .sort(sortCriteria)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      const count = await Product.find({
        is_listed: true,
        category: id,
        productName: { $regex: ".*" + search + ".*", $options: "i" },
      }).countDocuments();
      const cart = await Cart.findOne({ userId: req.session.userid });
      let totalPages = Math.ceil(count / limit);
      let previous = page > 1 ? page - 1 : 1;
      let next = page < totalPages ? page + 1 : totalPages;
      res.render("shop", {
        category,
        products,
        totalPages,
        currentPage: page,
        previous,
        next,
        cart,
      });
    } else {
      const products = await Product.find({
        is_listed: true,
        productName: { $regex: ".*" + search + ".*", $options: "i" },
      })
        .sort(sortCriteria)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      const count = await Product.find({
        is_listed: true,
        productName: { $regex: ".*" + search + ".*", $options: "i" },
      }).countDocuments();
      const cart = await Cart.findOne({ userId: req.session.userid });
      let totalPages = Math.ceil(count / limit);
      let previous = page > 1 ? page - 1 : 1;
      let next = page < totalPages ? page + 1 : totalPages;

      const category = await Category.find({ isListed: true });

      res.render("shop", {
        products,
        category,
        totalPages,
        currentPage: page,
        previous,
        next,
        cart,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const productDetail = async (req, res) => {
  try {
    const id = req.query.id;
    const product = await Product.findById({ _id: id });
    const cart = await Cart.findOne({ userId: req.session.userid });
    res.render("productDetail", { product: product, cart });
  } catch (error) {
    console.log(error.message);
  }
};

const resendOtp = async (req, res) => {
  try {
    const otp = await generateOTP();
    req.session.otp = otp;

    const name = req.session.name;

    await sendMail(otp, req.session.email, name);

    res.render("verifyOtp", { success: "Otp sent successfully" });
  } catch (error) {}
};

const loadCart = async (req, res) => {
  try {
    // Fetch cart data based on the user's session or authentication
    const userId = req.session.userid; // Adjust this based on your authentication logic
    const cartData = await Cart.findOne({ userId: userId }).populate(
      "items.productId"
    );
    res.render("cart", { cart: cartData });
  } catch (error) {
    console.error("Error rendering cart page:", error);
    res.status(500).send("Internal server error");
  }
};

const loadProfile = async (req, res) => {
  try {
    const userid = req.session.userid;
    const user = await User.findById(userid);
    const address = await Address.find({ userId: userid });
    const cart = await Cart.findOne({ userId: req.session.userid });
    res.render("profile", { user, address, cart });
  } catch (error) {
    console.log(error.message);
  }
};

const forgetPassword = async (req, res) => {
  try {
    res.render("forgetOtp");
  } catch (error) {
    console.log(error.message);
  }
};

const emailForgetPassword = async (req, res) => {
  try {
    const email = req.body.email;

    const user = await User.findOne({ email });

    if (user) {
      const otp = generateOTP();
      req.session.otp = otp;
      const email = user.email;
      req.session.email = email;
      const name = user.firstname;
      await sendMail(otp, email, name);
      res.render("passwordOtp");
    } else {
      res.render("forgetOtp", {
        error: "Email is not registered !",
      });
    }
  } catch (error) {}
};

const forgetVerifyOtp = async (req, res) => {
  try {
    userEnteredOtp =
      req.body.digit1 +
      req.body.digit2 +
      req.body.digit3 +
      req.body.digit4 +
      req.body.digit5 +
      req.body.digit6;
    userOtp = parseInt(userEnteredOtp);
    if (req.session.otp === userOtp) {
      res.render("updatePassword");
    } else {
      res.render("passwordOtp", { error: "OTP you have entered is invalid" });
    }
  } catch (error) {}
};

const updatePassword = async (req, res) => {
  try {
    const spassword = await securePassword(req.body.newPassword);
    const user = await User.findOneAndUpdate(
      { email: req.session.email },
      { password: spassword },
      { new: true }
    );
    res.redirect("/login");
    window.location.href = "login.html?passwordChanged=true";
  } catch (error) {
    console.log(error.message);
  }
};

const changePassword = async (req, res) => {
  const id = req.session.userid;

  const currentPassword = req.body.currentPassword;

  const user = await User.findById(id);

  const passwordMatch = await bcrypt.compare(currentPassword, user.password);

  if (passwordMatch) {
    const newPassword = await securePassword(req.body.newPassword);
    const user = await User.findOneAndUpdate(
      { _id: id },
      { password: newPassword },
      { new: true }
    );
    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } else {
    return res.status(400).json({ error: "Current password does not match" });
  }
};

const addToCart = async (req, res) => {
  try {
    const productId = req.body.productId;
    console.log(typeof productId);
    const userId = req.session.userid;
    const quantity = 1;
    let product = await Product.findOne({ _id: productId });
    const stock = product.stock;

    let userCart = await Cart.findOne({ userId });
    if (stock < 1) {
      return res.status(400).json({ error: "Product is out of stock" });
    }

    if (!userCart) {
      userCart = new Cart({
        userId: userId,
        items: [{ productId, quantity: 1 }],
      });
    } else {
      // Check if the product is already in the cart
      const checkItem = userCart.items.find((item) =>
        item.productId.equals(productId)
      );

      if (checkItem) {
        // If the product is already in the cart, update the quantity
        return res.status(400).json({ error: "Product already added to cart" });
      } else {
        // If the product is not in the cart, add it
        userCart.items.push({
          productId,
          quantity,
        });
      }
    }

    await userCart.save();
    res.json({ success: true, message: "Item added to cart successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const productId = req.body.productId;
    const quantity = req.body.newQuantity;
    const updatedCart = await Cart.findOneAndUpdate(
      { "items.productId": productId },
      { $set: { "items.$.quantity": quantity } },
      { new: true }
    );
    if (updatedCart) {
      res.json({ success: true });
    }
  } catch (error) {}
};

const addAddress = async (req, res) => {
  try {
    console.log(req.body);
    const userId = req.session.userid;
    const userAddress = new Address({
      userId: userId,
      fullname: req.body.Fullname,
      mobile: req.body.Mobile,
      address: req.body.Address,
      pincode: req.body.Pincode,
      city: req.body.city,
      State: req.body.state,
    });
    await userAddress.save();
    return res.json({ success: true, message: "Address added successfully" });
  } catch (error) {
    console.log(error.message);
  }
};

const deleteAddress = async (req, res) => {
  try {
    let Id = req.body.addressId;

    const productDetail = await Address.findByIdAndDelete({ _id: Id });
    if (productDetail) {
      res.json({ success: true });
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const myWallet = async (req, res) => {
  try {
    const wallet = await Wallet.find({ userId: req.session.userid });
    const cart = await Cart.findOne({ userId: req.session.userid });

    res.render("myWallet", { wallet, cart });
  } catch (error) {
    console.log(error.message);
  }
};

const editAddress = async (req, res) => {
  try {
    const addressId = req.params.id;

    const address = await Address.find({ _id: addressId });

    res.render("editAddress", { address });
  } catch (error) {
    console.log(error.message);
  }
};

const addressEdit = async (req, res) => {
  try {
    const update = await Address.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          fullname: req.body.address.Fullname,
          mobile: req.body.address.Mobile,
          address: req.body.address.Address,
          pincode: req.body.address.Pincode,
          city: req.body.address.city,
          State: req.body.address.state,
        },
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
  }
};

const removeProduct = async (req, res) => {
  try {
    const productId = req.body.productId;
    const deleteCart = await Cart.findOneAndUpdate(
      { "items.productId": productId },
      { $pull: { items: { productId: productId } } },
      { new: true }
    );
    if (deleteCart) {
      res.json({ success: true });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadCheckout = async (req, res) => {
  try {
    const userid = req.session.userid;
    const cart = await Cart.find({ userId: userid }).populate(
      "items.productId"
    );
    const coupons = await Coupon.find({ listed: 1 });
    const wallet = await Wallet.find({ userId: userid });
    ////CALCULATING SUBTOTAL////////////
    let subtotal = 0;
    cart[0].items.forEach((item) => {
      if (
        item.productId.productOffer.offerApplied == true ||
        item.productId.categoryOffer.offerApplied == true
      ) {
        subtotal += item.productId.totalOfferPrice * item.quantity;
      } else {
        subtotal += item.productId.offerPrice * item.quantity;
      }
    });
    ////////////////////////////////////
    const address = await Address.find({ userId: userid });

    res.render("checkout", { address, cart, subtotal, coupons, wallet });
  } catch (error) {
    console.log(error.message);
  }
};

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.userid;
    const addressId = req.body.addressId;
    const subtotal = req.body.subtotal;
    const orderId = generateRandomOrderId();
    let discountPrice = 0;
    if (req.body.newSubtotalValue) {
      discountPrice = req.body.newSubtotalValue;
    }
    const paymentMethod = req.body.paymentMethod;
    const user = await User.find({ _id: userId });
    const address = await Address.find({ _id: addressId }).populate("address");
    const cart = await Cart.find({ userId: userId });
    const products = cart[0].items;
    const date = new Date();

    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let currentDate = `${day}-${month}-${year}`;

    if (paymentMethod === "Cash on delivery") {
      const userOrder = new Order({
        userId: userId,
        orderId: orderId,
        shippingAddress: {
          fullname: address[0].fullname,
          mobile: address[0].mobile,
          address: address[0].address,
          pincode: address[0].pincode,
          city: address[0].city,
          state: address[0].State,
        },
        products: products,
        totalAmount: subtotal,
        discountedPrice: discountPrice,
        paymentMethod: paymentMethod,
      });
      const order = await userOrder.save();
      if (order) {
        await Cart.findOneAndUpdate(
          { userId: userId },
          { $set: { items: [] } }
        );
        //////Update Stock//////
        for (const product of products) {
          const productId = product.productId;
          const quantity = product.quantity;
          await Product.findOneAndUpdate(
            { _id: productId },
            { $inc: { stock: -quantity } }
          );
        }
        ////////////////////////
      }
      res.json({ success: true });
    } else if (paymentMethod === "Online payment") {
      let options;
      if (discountPrice > 0) {
        options = {
          amount: discountPrice * 100, // amount in the smallest currency unit
          currency: "INR",
          receipt: userId,
        };
      } else {
        options = {
          amount: subtotal * 100, // amount in the smallest currency unit
          currency: "INR",
          receipt: userId,
        };
      }

      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          console.log("Order created", order);

          res.json({ success: true, order, user, addressId, discountPrice });
        }
      });
    } else if (paymentMethod === "Paid through wallet") {
      console.log("hello");

      const userOrder = new Order({
        userId: userId,
        orderId: orderId,
        shippingAddress: {
          fullname: address[0].fullname,
          mobile: address[0].mobile,
          address: address[0].address,
          pincode: address[0].pincode,
          city: address[0].city,
          state: address[0].State,
        },
        products: products,
        totalAmount: subtotal,
        discountedPrice: discountPrice,
        paymentMethod: paymentMethod,
      });

      const order = await userOrder.save();

      if (order) {
        await Cart.findOneAndUpdate(
          { userId: userId },
          { $set: { items: [] } }
        );
        //////Update Stock//////
        for (const product of products) {
          const productId = product.productId;
          const quantity = product.quantity;
          await Product.findOneAndUpdate(
            { _id: productId },
            { $inc: { stock: -quantity } }
          );
        }
        ////////////////////////
      }

      let wallet = await Wallet.findOne({ userId: req.session.userid });

      if (discountPrice == 0) {
        wallet.history.push({
          type: "Debit",
          amount: subtotal,
          date: "1-1-2024",
        });
        wallet.balance = wallet.history.reduce((total, transaction) => {
          return (
            total +
            (transaction.type === "Credit"
              ? transaction.amount
              : -transaction.amount)
          );
        }, 0);
        await wallet.save();
        res.json({ success: true });
      } else if (discountPrice > 0) {
        wallet.history.push({
          type: "Debit",
          amount: discountPrice,
          date: "1-1-2024",
        });
        wallet.balance = wallet.history.reduce((total, transaction) => {
          return (
            total +
            (transaction.type === "Credit"
              ? transaction.amount
              : -transaction.amount)
          );
        }, 0);
        await wallet.save();
        res.json({ success: true });
      }
    } else if (paymentMethod === "Online and Wallet") {
    }
  } catch (error) {
    console.log(error.message);
  }
};

const orderPlaced = async (req, res) => {
  try {
    res.render("orderSuccess");
  } catch (error) {
    console.log(error.message);
  }
};

const paymentVerify = async (req, res) => {
  try {
    let hmac = crypto.createHmac("sha256", process.env.KEY_SECRET);
    hmac.update(
      req.body.payment.razorpay_order_id +
        "|" +
        req.body.payment.razorpay_payment_id
    );
    hmac = hmac.digest("hex");

    if (hmac === req.body.payment.razorpay_signature) {
      console.log("Payment successfull");
      const userid = req.body.order.receipt;
      const addressId = req.body.options.notes.address;
      const discountAmount = req.body.options.notes.discount;
      const paymentMethod = "Online payment";
      const address = await Address.find({ _id: addressId }).populate(
        "address"
      );
      const cart = await Cart.find({ userId: userid }).populate(
        "items.productId"
      );
      const products = cart[0].items;
      ////CALCULATING SUBTOTAL////////////
      let subtotal = 0;
      cart[0].items.forEach((item) => {
        if (
          item.productId.productOffer.offerApplied == true ||
          item.productId.categoryOffer.offerApplied == true
        ) {
          subtotal += item.productId.totalOfferPrice * item.quantity;
        } else {
          subtotal += item.productId.offerPrice * item.quantity;
        }
      });
      ////////////////////////////////////
      const orderId = generateRandomOrderId();

      const userOrder = new Order({
        userId: userid,
        orderId: orderId,
        shippingAddress: {
          fullname: address[0].fullname,
          mobile: address[0].mobile,
          address: address[0].address,
          pincode: address[0].pincode,
          city: address[0].city,
          state: address[0].State,
        },
        products: products,
        totalAmount: subtotal,
        discountedPrice: discountAmount,
        paymentMethod: paymentMethod,
      });
      const order = await userOrder.save();
      if (order) {
        await Cart.findOneAndUpdate(
          { userId: userid },
          { $set: { items: [] } }
        );
        //////Update Stock//////
        for (const product of products) {
          const productId = product.productId;
          const quantity = product.quantity;
          await Product.findOneAndUpdate(
            { _id: productId },
            { $inc: { stock: -quantity } }
          );
        }
        ////////////////////////
      }
      res.json({ success: true });
    } else {
      console.log("payment failed");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadOrders = async (req, res) => {
  try {
    const userId = req.session.userid;

    const orders = await Order.find({ userId }).populate({
      path: "products.productId",
    });

    let totalDiscountPerProduct = 0;

    for (const order of orders) {
      const totalAmount = order.totalAmount;

      const discountPrice = order.discountedPrice;

      if (discountPrice > 0) {
        const totalDiscount = totalAmount - discountPrice;

        totalDiscountPerProduct = totalDiscount / order.products.length;
      }
    }

    res.render("myOrders", { orders, totalDiscountPerProduct });
  } catch (error) {
    console.log(error.message);
  }
};

const orderDetail = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const productId = req.params.productId;

    const order = await Order.findOne({ _id: orderId });

    const targetProduct = order.products.find(
      (product) => product.productId.toString() === productId
    );

    const product = await Product.findOne({ _id: targetProduct.productId });

    res.render("orderDetail", { order, targetProduct, product });
  } catch (error) {
    console.log(error.message);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const productId = req.body.productId;

    const product = await Product.find({ _id: productId });

    const orderId = req.body.orderId;

    const order = await Order.findOne({ _id: orderId });

    const targetProduct = order.products.find(
      (product) => product.productId.toString() === productId
    );

    targetProduct.productOrderStatus = "Cancelled";

    targetProduct.returnOrderStatus = {
      status: "Cancelled",
      reason: req.body.selectedReason,
      date: Date.now(),
    };

    const cancel = await order.save();

    res.json({ success: true });

    if (cancel) {
      ///////////Update Stock//////////
      const quantity = targetProduct.quantity;
      await Product.findOneAndUpdate(
        { _id: productId },
        { $inc: { stock: quantity } }
      );
      ////////////////////////
      if (order.paymentMethod == "Online payment") {
        const totalAmount = order.totalAmount;
        const discountAmount = order.discountedPrice;
        const date = new Date();

        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        let currentDate = `${day}-${month}-${year}`;
        if (discountAmount > 0) {
          const totalOffer = totalAmount - discountAmount;
          const offerperProduct = totalOffer / order.products.length;

          let walletAmount;

          if (
            product[0].productOffer.offerApplied == true ||
            product[0].categoryOffer.offerApplied == true
          ) {
            walletAmount =
              product[0].totalOfferPrice * targetProduct.quantity -
              offerperProduct;
          } else {
            walletAmount =
              product[0].offerPrice * targetProduct.quantity - offerperProduct;
          }

          let wallet = await Wallet.findOne({ userId: req.session.userid });

          if (!wallet) {
            wallet = new Wallet({
              userId: req.session.userid,
              balance: walletAmount,
              history: [{ type: "Credit", amount: walletAmount }],
            });
            await wallet.save();
          } else {
            wallet.history.push({
              type: "Credit",
              amount: walletAmount,
            });

            wallet.balance = wallet.history.reduce((total, transaction) => {
              return (
                total +
                (transaction.type === "Credit"
                  ? transaction.amount
                  : -transaction.amount)
              );
            }, 0);
            await wallet.save();
          }
        } else {
          let walletAmount;

          if (
            product[0].productOffer.offerApplied == true ||
            product[0].categoryOffer.offerApplied == true
          ) {
            walletAmount = product[0].totalOfferPrice * targetProduct.quantity;
          } else {
            walletAmount = product[0].offerPrice * targetProduct.quantity;
          }
          let wallet = await Wallet.findOne({ userId: req.session.userid });

          if (!wallet) {
            wallet = new Wallet({
              userId: req.session.userid,
              balance: walletAmount,
              history: [{ type: "Credit", amount: walletAmount }],
            });
            await wallet.save();
          } else {
            wallet.history.push({
              type: "Credit",
              amount: walletAmount,
            });
            wallet.balance = wallet.history.reduce((total, transaction) => {
              return (
                total +
                (transaction.type === "Credit"
                  ? transaction.amount
                  : -transaction.amount)
              );
            }, 0);
            await wallet.save();
          }
        }
      } else if (order.paymentMethod == "Paid through wallet") {
        const totalAmount = order.totalAmount;
        const discountAmount = order.discountedPrice;
        const date = new Date();

        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        let currentDate = `${day}-${month}-${year}`;
        if (discountAmount > 0) {
          const totalOffer = totalAmount - discountAmount;
          const offerperProduct = totalOffer / order.products.length;

          let walletAmount;

          if (
            product[0].productOffer.offerApplied == true ||
            product[0].categoryOffer.offerApplied == true
          ) {
            walletAmount =
              product[0].totalOfferPrice * targetProduct.quantity -
              offerperProduct;
          } else {
            walletAmount =
              product[0].offerPrice * targetProduct.quantity - offerperProduct;
          }

          let wallet = await Wallet.findOne({ userId: req.session.userid });

          if (!wallet) {
            wallet = new Wallet({
              userId: req.session.userid,
              balance: walletAmount,
              history: [{ type: "Credit", amount: walletAmount }],
            });
            await wallet.save();
          } else {
            wallet.history.push({
              type: "Credit",
              amount: walletAmount,
            });

            wallet.balance = wallet.history.reduce((total, transaction) => {
              return (
                total +
                (transaction.type === "Credit"
                  ? transaction.amount
                  : -transaction.amount)
              );
            }, 0);
            await wallet.save();
          }
        } else {
          let walletAmount;

          if (
            product[0].productOffer.offerApplied == true ||
            product[0].categoryOffer.offerApplied == true
          ) {
            walletAmount = product[0].totalOfferPrice * targetProduct.quantity;
          } else {
            walletAmount = product[0].offerPrice * targetProduct.quantity;
          }
          let wallet = await Wallet.findOne({ userId: req.session.userid });

          if (!wallet) {
            wallet = new Wallet({
              userId: req.session.userid,
              balance: walletAmount,
              history: [{ type: "Credit", amount: walletAmount }],
            });
            await wallet.save();
          } else {
            wallet.history.push({
              type: "Credit",
              amount: walletAmount,
            });
            wallet.balance = wallet.history.reduce((total, transaction) => {
              return (
                total +
                (transaction.type === "Credit"
                  ? transaction.amount
                  : -transaction.amount)
              );
            }, 0);
            await wallet.save();
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const returnOrder = async (req, res) => {
  try {
    const productId = req.body.productId;
    const orderId = req.body.orderId;

    const product = await Product.find({ _id: productId });

    const order = await Order.findOne({ _id: orderId });

    const targetProduct = order.products.find(
      (product) => product.productId.toString() === productId
    );
    targetProduct.productOrderStatus = "Returned";

    const returned = await order.save();

    const newReturn = new Return({
      userId: req.session.userid,
      productId: productId,
      reason: req.body.selectedReason,
      summary: req.body.summary,
      orderId: orderId,
    });

    await newReturn.save();

    if (returned) {
      res.json({ success: true });
      ///////////Update Stock//////////
      const quantity = targetProduct.quantity;
      await Product.findOneAndUpdate(
        { _id: productId },
        { $inc: { stock: quantity } }
      );

      /////////////////////////////////

      const totalAmount = order.totalAmount;
      const discountAmount = order.discountedPrice;

      if (discountAmount > 0) {
        const totalOffer = totalAmount - discountAmount;
        const offerperProduct = totalOffer / order.products.length;

        let walletAmount;
        if (
          product[0].productOffer.offerApplied == true ||
          product[0].categoryOffer.offerApplied == true
        ) {
          walletAmount =
            product[0].totalOfferPrice * targetProduct.quantity -
            offerperProduct;
        } else {
          walletAmount =
            product[0].offerPrice * targetProduct.quantity - offerperProduct;
        }
        let wallet = await Wallet.findOne({ userId: req.session.userid });

        if (!wallet) {
          wallet = new Wallet({
            userId: req.session.userid,
            balance: walletAmount,
            history: [{ type: "Credit", amount: walletAmount }],
          });
          await wallet.save();
        } else {
          wallet.history.push({
            type: "Credit",
            amount: walletAmount,
          });
          wallet.balance = wallet.history.reduce((total, transaction) => {
            return (
              total +
              (transaction.type === "Credit"
                ? transaction.amount
                : -transaction.amount)
            );
          }, 0);
          await wallet.save();
        }
      } else {
        let walletAmount;
        if (
          product[0].productOffer.offerApplied == true ||
          product[0].categoryOffer.offerApplied == true
        ) {
          walletAmount = product[0].totalOfferPrice * targetProduct.quantity;
        } else {
          walletAmount = product[0].offerPrice * targetProduct.quantity;
        }

        let wallet = await Wallet.findOne({ userId: req.session.userid });

        if (!wallet) {
          wallet = new Wallet({
            userId: req.session.userid,
            balance: walletAmount,
            history: [{ type: "Credit", amount: walletAmount }],
          });
          await wallet.save();
        } else {
          wallet.history.push({
            type: "Credit",
            amount: walletAmount,
          });
          wallet.balance = wallet.history.reduce((total, transaction) => {
            return (
              total +
              (transaction.type === "Credit"
                ? transaction.amount
                : -transaction.amount)
            );
          }, 0);
          await wallet.save();
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({userId:req.session.userid}).populate({
      path: "products.productId",
    });
    const cart = await Cart.findOne({ userId: req.session.userid });

    res.render("wishlist", { wishlist, cart });
  } catch (error) {
    console.log(error.message);
  }
};

const addToWishList = async (req, res) => {
  try {
    const productId = req.body.productId;
    console.log(typeof productId);
    const userId = req.session.userid;
    const quantity = 1;
    let product = await Product.findOne({ _id: productId });
    const stock = product.stock;

    let wishList = await Wishlist.findOne({ userId: userId });

    if (!wishList) {
      wishList = new Wishlist({
        userId: userId,
        products: [{ productId }],
      });
    } else {
      // Check if the product is already in the wishlist
      const checkItem = wishList.products.find((product) =>
        product.productId.equals(productId)
      );

      if (checkItem) {
        // If the product is already in the wishlist, update the quantity
        return res
          .status(400)
          .json({ error: "Product already added to wishlist" });
      } else {
        // If the product is not in the cart, add it
        wishList.products.push({
          productId,
        });
      }
    }

    await wishList.save();
    res.json({ success: true, message: "Item added to cart successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const removeWish = async (req, res) => {
  try {
    const remove = await Wishlist.findOneAndUpdate(
      { "products.productId": req.body.productId },
      { $pull: { products: { productId: req.body.productId } } },
      { new: true }
    );

    if (remove) {
      res.json({ success: true });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const quantity = req.body.quantity;
    const productId = req.body.productId;

    const order = await Order.findOne({ _id: orderId });
    const product = await Product.findOne({ _id: productId });

    let totalDiscountPerProduct = 0;

    const totalAmount = order.totalAmount;

    const discountPrice = order.discountedPrice;

    if (discountPrice > 0) {
      const totalDiscount = totalAmount - discountPrice;

      totalDiscountPerProduct = totalDiscount / order.products.length;
    }

    console.log(order);
    console.log(product);

    // Create a PDF document
    const pdfDoc = new PDFDocument();
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${order.orderId}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");
    pdfDoc.pipe(res);

    // Add company details
    pdfDoc.fontSize(12).text("SoundMagic & Co", { align: "center" });
    pdfDoc
      .fontSize(10)
      .text("Magic Main Street, Magic City, India", { align: "center" });
    pdfDoc
      .fontSize(10)
      .text("Phone: +1 123 456 7890 | Email: soundmagic@example.com", {
        align: "center",
      });
    pdfDoc.moveDown();

    // Add customer details
    pdfDoc
      .fontSize(12)
      .text(`Invoice for Order #${order.orderId}`, { align: "center" });
    pdfDoc.moveDown();
    pdfDoc
      .fontSize(10)
      .text(`Customer: ${order.shippingAddress.fullname}`, { align: "left" });
    pdfDoc
      .fontSize(10)
      .text(`Mobile: ${order.shippingAddress.mobile}`, { align: "left" });
    pdfDoc
      .fontSize(10)
      .text(`Address: ${order.shippingAddress.address}`, { align: "left" });
    pdfDoc
      .fontSize(10)
      .text(`Pincode: ${order.shippingAddress.pincode}`, { align: "left" });
    pdfDoc
      .fontSize(10)
      .text(`City: ${order.shippingAddress.city}`, { align: "left" });
    pdfDoc
      .fontSize(10)
      .text(`State: ${order.shippingAddress.State}`, { align: "left" });
    pdfDoc.moveDown();

    // Add product details
    pdfDoc.fontSize(12).text("Products:", { align: "left" });
    pdfDoc.moveDown();

    pdfDoc
      .fontSize(10)
      .text(`${product.productName} - Quantity: ${quantity}`, {
        align: "left",
      });

    if (
      product.productOffer.offerApplied ||
      product.categoryOffer.offerApplied
    ) {
      pdfDoc.text(`Price: RS${product.totalOfferPrice.toFixed(2)}`);
    } else {
      pdfDoc.text(`Price: RS${product.offerPrice.toFixed(2)}`);
    }

    pdfDoc.moveDown();

    // Add total
    let totalPrice;
    if (
      product.productOffer.offerApplied ||
      product.categoryOffer.offerApplied
    ) {
      totalPrice = (
        product.totalOfferPrice * quantity -
        totalDiscountPerProduct
      ).toFixed(2);
    } else {
      totalPrice = (
        product.offerPrice * quantity -
        totalDiscountPerProduct
      ).toFixed(2);
    }
    pdfDoc.fontSize(12).text(`Total: RS${totalPrice}`, { align: "left" });
    pdfDoc.moveDown();

    // Finalize the PDF
    pdfDoc.end();

    res.download(`invoice_${order.orderId}.pdf`);
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = {
  loadRegister,
  insertUser,
  loadOtp,
  verifyOtp,
  Login,
  userLogin,
  loadHome,
  loadShop,
  productDetail,
  resendOtp,
  loadCart,
  loadProfile,
  forgetPassword,
  emailForgetPassword,
  forgetVerifyOtp,
  updatePassword,
  changePassword,
  addToCart,
  updateQuantity,
  addAddress,
  removeProduct,
  loadCheckout,
  deleteAddress,
  placeOrder,
  orderPlaced,
  Logout,
  loadOrders,
  orderDetail,
  userIsBlocked,
  cancelOrder,
  returnOrder,
  paymentVerify,
  myWallet,
  editAddress,
  addressEdit,
  loadWishlist,
  addToWishList,
  removeWish,
  downloadInvoice,
};
