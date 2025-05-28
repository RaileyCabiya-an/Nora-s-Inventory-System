const express = require('express');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Supplier = require('../models/supplierModel');
const Stock = require('../models/stockModel');
const router = express.Router();

// GET: Fetch all orders with products and suppliers
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('product supplier');
    const products = await Product.find();
    const suppliers = await Supplier.find();

    res.render('order', { orders, products, suppliers });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).render('order', { orders: [], products: [], suppliers: [] });
  }
});

// POST: Add a new order
router.post('/add', async (req, res) => {
  try {
    const { productId, orderQuantity, supplierId, orderDate, pricePerUnit } = req.body;

    if (!productId || !orderQuantity || !supplierId || !orderDate || !pricePerUnit) {
      return res.status(400).send('All fields are required.');
    }

    const order = new Order({
      product: productId,
      orderQuantity,
      supplier: supplierId,
      orderDate: new Date(orderDate),
      pricePerUnit,
      status: 'Pending'
    });

    await order.save();
    res.redirect('/order');
  } catch (err) {
    console.error('Error adding order:', err);
    res.status(500).send('Error processing order.');
  }
});

router.post('/order/update/:id', async (req, res) => {
  const { productCondition, arrivalDate } = req.body;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).send("Order not found.");
    }

    order.productCondition = productCondition;
    order.arrivalDate = arrivalDate;
    await order.save();

    // If order is "Cancelled," move it to Cancelled Stocks
    if (productCondition === "Cancelled") {
      const cancelledData = {
        orderId: order._id,
        product: order.product,
        orderQuantity: order.orderQuantity,
        supplier: order.supplier,
        pricePerUnit: order.pricePerUnit,
        cancelledDate: new Date(),
      };

      await CancelledStock.create(cancelledData);
    }

    res.redirect('/order');
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).send("Server error.");
  }
});

// POST: Update order (Transfer order to stock regardless of condition)
router.post('/update/:id', async (req, res) => {
  try {
    const { arrivalDate, productCondition, pricePerUnit } = req.body;
    
    // Validate required fields.
    if (!arrivalDate || !productCondition) {
      return res.status(400).send('Error: Arrival date and product condition are required.');
    }
    
    // Fetch the order along with its associated product and supplier.
    const order = await Order.findById(req.params.id).populate('product supplier');
    if (!order) {
      return res.status(404).send('Order not found.');
    }
    
    // Retrieve the supplier name.
    const supplierName = order.supplier ? order.supplier.name : "Unknown Supplier";
    
    // Create a new stock record based on the order.
    await Stock.create({
      product: order.product,
      category: order.product.category,
      quantity: order.orderQuantity,
      pricePerUnit: pricePerUnit || order.pricePerUnit,
      supplierName: supplierName,
      orderDate: order.orderDate,
      arrivalDate: new Date(arrivalDate),
      productCondition // This will be Good, Damaged, or Cancelled.
    });

    // Remove the transferred order from the orders collection.
    await Order.findByIdAndDelete(req.params.id);
    
    res.redirect('/order');
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).send('Server Error');
  }
});





// GET: Delete order
router.get('/delete/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.redirect('/order');
  } catch (err) {
    console.error('Error deleting order:', err);
    res.redirect('/order');
  }
});

module.exports = router;
