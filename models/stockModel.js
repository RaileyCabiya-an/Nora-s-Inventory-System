const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }, // Reference, but not required
  supplierName: { type: String, required: true }, // Ensure supplier name is stored
  orderDate: { type: Date, required: true },
  arrivalDate: { type: Date, required: true },
  productCondition: { type: String, required: true },
});

const Stock = mongoose.model('Stock', stockSchema);
module.exports = Stock;
