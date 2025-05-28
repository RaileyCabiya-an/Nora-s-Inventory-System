const express = require('express');
const Stock = require('../models/stockModel');
const Order = require('../models/orderModel');
const router = express.Router();

// GET: View all stock items, categorized by condition
router.get('/', async (req, res) => {
  try {
    const stockItems = await Stock.find().populate('product supplier');
    res.render('stock', { currentDate: new Date().toLocaleString(), stockItems });
  } catch (err) {
    console.error('Error fetching stock:', err);
    res.status(500).render('stock', { currentDate: new Date().toLocaleString(), stockItems: [] });
  }
});

// POST: Transfer order to stock (Include Price)
router.post('/transfer/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('product supplier');
    if (!order) return res.status(404).send('Order not found.');

    // Ensure order has arrived before transferring
    if (!order.arrivalDate || order.productCondition === 'Cancelled') {
      return res.status(400).send('Order cannot be transferred.');
    }

    // Create a new stock item
    const newStock = new Stock({
      product: order.product,
      category: order.product.category,
      quantity: order.orderQuantity,
      pricePerUnit: order.pricePerUnit, // Store Price per Unit
      arrivalCondition: order.productCondition,
      supplier: order.supplier,
      orderDate: order.orderDate,
      arrivalDate: order.arrivalDate,
      productCondition: order.productCondition,
      expirationDate: calculateExpirationDate(order.productCondition, order.arrivalDate)
    });

    await newStock.save();
    res.redirect('/stock');
  } catch (err) {
    console.error('Error transferring order to stock:', err);
    res.status(500).redirect('/stock');
  }
});

// Helper Function: Calculate Expiration Date Based on Product Condition
function calculateExpirationDate(condition, arrivalDate) {
  const expiryDays = condition === 'Good' ? 7 : 2; // 7 days for Good, 2 days for Damaged
  return new Date(arrivalDate.getTime() + expiryDays * 24 * 60 * 60 * 1000);
}

// GET: Edit stock details form
router.get('/edit/:id', async (req, res) => {
  try {
    const stockItem = await Stock.findById(req.params.id).populate('product supplier');
    if (!stockItem) return res.status(404).send('Stock item not found.');

    res.render('edit_stock', { stockItem });
  } catch (err) {
    console.error('Error fetching stock for edit:', err);
    res.redirect('/stock');
  }
});

// POST: Update stock details
router.post('/edit/:id', async (req, res) => {
  try {
    const { quantity, productCondition, pricePerUnit } = req.body;
    await Stock.findByIdAndUpdate(req.params.id, { quantity, productCondition, pricePerUnit });
    res.redirect('/stock');
  } catch (err) {
    console.error('Error updating stock:', err);
    res.redirect('/stock');
  }
});

// GET: Delete stock
router.get('/delete/:id', async (req, res) => {
  try {
    await Stock.findByIdAndDelete(req.params.id);
    res.redirect('/stock');
  } catch (err) {
    console.error('Error deleting stock:', err);
    res.redirect('/stock');
  }
});

// GET: Fetch Expired Stock Items for Dashboard Alerts
router.get('/expired', async (req, res) => {
  const today = new Date();
  const expiredProducts = await Stock.find({
    expirationDate: { $lte: today }
  });

  res.json(expiredProducts);
});

module.exports = router;
