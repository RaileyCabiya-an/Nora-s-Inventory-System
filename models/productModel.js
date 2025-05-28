const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Fruit', 'Vegetable'], required: true }
});

module.exports = mongoose.model('Product', productSchema);
