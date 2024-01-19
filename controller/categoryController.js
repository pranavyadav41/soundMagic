const Category = require("../model/categoryModel");
const Offer = require("../model/offerModel");
const Product = require("../model/productModel");
const mongoose = require("mongoose");

const loadCategories = async (req, res) => {
  try {
    const offers = await Offer.find({});
    const categories = await Category.find().populate({ path: "offer" });
    res.render("categories", { categories, offers });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const addCategories = async (req, res) => {
  try {
    const name = req.body.name;
    const formattedName =
      name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    const copy = await Category.findOne({ name: formattedName });
    if (copy) {
      return res.status(400).json({ error: "Category already exists" });
    }
    const newCategory = new Category({
      name: formattedName,
      isListed: true,
    });
    const data = await newCategory.save();
    if (data) {
      res.redirect("/categories");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadEditCategories = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    res.render("editCategory", { category });
  } catch (error) {}
};

const editCategories = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const updateName = req.body.name;
    const formattedName =
      updateName.charAt(0).toUpperCase() + updateName.slice(1).toLowerCase();
    const copy = await Category.findOne({ name: formattedName });
    if (copy) {
      console.log("category name already exist");
      return false;
    }

    const category = await Category.findById(categoryId);
    category.name = updateName;
    await category.save();
    res.redirect("/admin/categories");
  } catch (error) {}
};

const listCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const category = await Category.findOne({ _id: id });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    category.isListed = true;
    await category.save();
    res.json({ message: "Category listed successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const unlistCategory = async (req, res) => {
  try {
    const id = req.params.id;

    const category = await Category.findOne({ _id: id });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    category.isListed = false;
    await category.save();
    res.json({ message: "Category Unlisted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addCategoryOffer = async (req, res) => {
  try {
    const products = await Product.find({ category: req.body.categoryId });

    const offer = await Offer.find({ _id: req.body.offerId });

    const discount = offer[0].discountPercentage;

    const category = await Category.findOneAndUpdate(
      { _id: req.body.categoryId },
      {
        $set: {
          "offer.offerApplied": true,
          "offer.offerName": offer[0].offerName,
        },
      }
    );

    for (const product of products) {
      let actualPrice = product.offerPrice;

      let categoryOffer = Math.round((actualPrice * discount) / 100);

      product.categoryOffer.amount = categoryOffer;
      product.categoryOffer.offerApplied = true;
      product.categoryOffer.offerName = offer[0].offerName;

      product.categoryOffer.offerPercentage = offer[0].discountPercentage;

      await product.save();

      const totalOffer =
        actualPrice - (categoryOffer + product.productOffer.amount);

      product.totalOfferPrice = totalOffer;

      await product.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
  }
};

const removeCategoryOffer = async (req, res) => {
  try {
    const products = await Product.find({ category: req.body.categoryId });

    const update = await Category.findOneAndUpdate(
      { _id: req.body.categoryId },
      { $set: { "offer.offerApplied": false, "offer.offerName": null } }
    );

    for (const product of products) {
      const categoryOffer = product.categoryOffer.amount;

      product.totalOfferPrice = product.totalOfferPrice + categoryOffer;

      product.categoryOffer.offerApplied = false;

      product.categoryOffer.offerName = null;

      product.categoryOffer.offerPercentage = null;

      await product.save();

      product.categoryOffer.amount = 0;

      await product.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadCategories,
  addCategories,
  loadEditCategories,
  editCategories,
  listCategory,
  unlistCategory,
  addCategoryOffer,
  removeCategoryOffer,
};
