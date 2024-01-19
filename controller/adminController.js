const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const Order = require("../model/orderModel");
const PDFDocument = require("pdfkit");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");

const loadLogin = async (req, res) => {
  try {
    res.render("adminLogin");
  } catch (error) {
    console.log(error.message);
  }
};

const insertAdmin = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const user = await User.findOne({ email });
    // const admin = await User.findOne({isAdmin:'true'})

    if (!user) {
      res.render("adminLogin", { error: "Invalid Email or Password" });
    } else if (!user.isAdmin) {
      res.render("adminLogin", { error: "Oops! you are not admin." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      req.session.user_id = user._id;
      res.redirect("/admin/dashboard");
    } else {
      res.render("adminLogin", { error: "Invalid Email or Password" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    res.render("index");
  } catch (error) {
    console.log(error.message);
  }
};

const loadUsers = async (req, res) => {
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

    const user = await User.find({
      $or: [
        { firstname: { $regex: ".*" + search + ".*", $options: "i" } },
        { lastname: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
        { mobile: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.find({
      $or: [
        { firstname: { $regex: ".*" + search + ".*", $options: "i" } },
        { lastname: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
        { mobile: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    }).countDocuments();

    res.render("userList", {
      user,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      previous: page - 1,
      next: page + 1,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const salesReport = async (req, res) => {
  try {
    const pdfMake = require("pdfmake/build/pdfmake");
    const vfsFonts = require("pdfmake/build/vfs_fonts");

    const fromDate = new Date(req.body.startDate);
    const toDate = new Date(req.body.endDate);
    toDate.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      OrderDate: { $gte: fromDate, $lte: toDate },
    }).populate({ path: "products.productId" });

    // Generate PDF
    const pdfDoc = new PDFDocument();
    pdfDoc.pipe(fs.createWriteStream("sales_report.pdf"));

    pdfDoc.text("Sales Report\n\n");

    orders.forEach((order, index) => {
      pdfDoc.text(`Order ${index + 1}`);
      pdfDoc.text(`Order ID: ${order._id}`);
      pdfDoc.text(`Name: ${order.shippingAddress.fullname}`);
      pdfDoc.text(
        `Order Date: ${new Date(order.OrderDate).toLocaleDateString()}`
      );
      pdfDoc.text(
        `Product Name: ${order.products
          .map((product) => product.productId.productName)
          .join(", ")}`
      );
      pdfDoc.text(
        `Quantity: ${order.products
          .map((product) => product.quantity)
          .join(", ")}`
      );
      pdfDoc.text(`Total: ${order.totalAmount}`);
      pdfDoc.text(`Payment Method: ${order.paymentMethod}`);

      pdfDoc.text("\n"); // Add a newline between orders
    });

    pdfDoc.end();

    // Generate CSV
    const csvWriter = createCsvWriter({
      path: "sales_report.csv",
      header: [
        { id: "order_id", title: "Order ID" },
        { id: "name", title: "Name" },
        { id: "order_date", title: "Order Date" },
        { id: "product_name", title: "Product Name" },
        { id: "quantity", title: "Quantity" },
        { id: "total", title: "Total" },
        { id: "payment_method", title: "Payment Method" },
      ],
    });

    const csvData = orders.map((order) => ({
      order_id: order._id,
      name: order.shippingAddress.fullname,
      order_date: new Date(order.OrderDate).toLocaleDateString(),
      product_name: order.products
        .map((product) => product.productId.productName)
        .join(", "),
      quantity: order.products.map((product) => product.quantity).join(", "),
      total: order.totalAmount,
      payment_method: order.paymentMethod,
    }));

    csvWriter.writeRecords(csvData);
    res.json({ orders });
  } catch (error) {
    console.error("Sales report generation error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const monthlyReport = async (req, res) => {
  try {
    const monthlyData = await Order.aggregate([
      {
        $match: {
          OrderDate: {
            $gte: new Date(new Date().getFullYear(), 0, 1),
            $lt: new Date(new Date().getFullYear() + 1, 0, 1), 
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$OrderDate" } },
          totalSales: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    console.log(monthlyData);

    res.json({ data: monthlyData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const yearlyReport = async (req, res) => {
  try {
    const yearlyData = await Order.aggregate([
      {
        $match: {
          OrderDate: {
            $gte: new Date(0), 
            $lt: new Date(),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y", date: "$OrderDate" } },
          totalSales: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    console.log(yearlyData);

    res.json({ data: yearlyData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const downloadPdf = async (req, res) => {
  try {
    res.download("sales_report.pdf");
  } catch (error) {
    console.log(error.message);
  }
};

const downloadCsv = async (req, res) => {
  try {
    res.download("sales_report.csv");
  } catch (error) {
    console.log(error.message);
  }
};
// blocking
const userBlock = async (req, res) => {
  try {
    const userID = req.params.userID;
    const user = await User.findOne({ _id: userID });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.isBlocked = true;
    await user.save();
    res.json({ message: "User blocked successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// unblocking
const userUnblock = async (req, res) => {
  try {
    const userID = req.params.userID;

    const user = await User.findOne({ _id: userID });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.isBlocked = false;
    await user.save();
    res.json({ message: "User Unblocked successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const adminLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadLogin,
  insertAdmin,
  loadUsers,
  loadDashboard,
  userBlock,
  userUnblock,
  adminLogout,
  salesReport,
  downloadCsv,
  downloadPdf,
  monthlyReport,
  yearlyReport,
};
