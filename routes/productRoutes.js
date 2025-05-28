// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/productModel'); // Ensure this path is correct

// POST: Add a new product
router.post('/add', async (req, res) => {
  try {
    const { name, category } = req.body;

    // Validate required fields
    if (!name || !category) {
      return res.status(400).send("Error: Product Name and Category are required.");
    }

    // Save the product in the database
    const product = new Product({ name, category });
    await product.save();
    console.log("Product successfully added:", product);

    // Redirect to the orders page or product list page
    res.redirect('/order'); // Adjust if needed
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).send("Error processing product.");
  }
});

module.exports = router;
