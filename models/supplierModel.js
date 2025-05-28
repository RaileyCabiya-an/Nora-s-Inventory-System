const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, default: null },
  address: { type: String, required: true }
});

module.exports = mongoose.model('Supplier', supplierSchema);
