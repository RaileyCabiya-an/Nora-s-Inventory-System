const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  orderQuantity: { type: Number, required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  orderDate: { type: Date, required: true },
  pricePerUnit: { type: Number, required: true }, // Ensure this field exists
  status: { type: String, default: 'Pending' }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;