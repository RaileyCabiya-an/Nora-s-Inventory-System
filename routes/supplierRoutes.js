const express = require('express');
const Supplier = require('../models/supplierModel');
const Stock = require('../models/stockModel'); // Ensure Stock model is included
const router = express.Router();

// GET: View all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.render('supplier', { currentDate: new Date().toLocaleString(), suppliers });
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    res.status(500).render('supplier', { currentDate: new Date().toLocaleString(), suppliers: [] });
  }
});

// GET: Render "Add Supplier" form
router.get('/add', (req, res) => {
  res.render('add_supplier', { currentDate: new Date().toLocaleString() });
});

// POST: Add a new supplier with validation
router.post('/add', async (req, res) => {
  try {
    const { name, contact, email, address } = req.body;

    if (!name || !contact || !address) {
      return res.status(400).send('Missing required fields: Name, Contact, and Address.');
    }

    const newSupplier = new Supplier({ name, contact, email, address });
    await newSupplier.save();
    res.redirect('/supplier');
  } catch (err) {
    console.error('Error adding supplier:', err);
    res.status(500).redirect('/supplier/add');
  }
});

// GET: Edit supplier form
router.get('/edit/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).send('Supplier not found.');

    res.render('edit_supplier', { supplier });
  } catch (err) {
    console.error('Error fetching supplier for edit:', err);
    res.redirect('/supplier');
  }
});

// POST: Update supplier details with validation
router.post('/edit/:id', async (req, res) => {
  try {
    const { name, contact, email, address } = req.body;
    if (!name || !contact || !address) {
      return res.status(400).send('Missing required fields.');
    }

    await Supplier.findByIdAndUpdate(req.params.id, { name, contact, email, address });
    res.redirect('/supplier');
  } catch (err) {
    console.error('Error updating supplier:', err);
    res.redirect('/supplier');
  }
});

// GET: Delete supplier, but preserve stock records
router.get('/delete/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).send('Supplier not found.');

    // Update stock items to retain supplier name before deleting
    await Stock.updateMany(
      { supplier: supplier._id },
      { $set: { supplierName: supplier.name }, $unset: { supplier: "" } }
    );

    // Remove supplier from database
    await Supplier.findByIdAndDelete(req.params.id);

    res.redirect('/supplier');
  } catch (err) {
    console.error('Error updating stock before deleting supplier:', err);
    res.redirect('/supplier');
  }
});

module.exports = router;
