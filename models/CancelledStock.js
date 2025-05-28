const mongoose = require('mongoose');

const CancelledStockSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  orderQuantity: { type: Number, required: true },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  pricePerUnit: { type: Number, required: true },
  cancelledDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CancelledStock', CancelledStockSchema);
