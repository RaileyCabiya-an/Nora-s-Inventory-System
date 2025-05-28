require('dotenv').config();
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');



// Import route files
const CancelledStock = require('./models/CancelledStock');
const Stock = require('./models/stockModel');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const accountRoutes = require('./routes/accountRoutes'); // for GET /account (profile display)
const stockRoutes = require('./routes/stockRoutes');
const orderRoutes = require('./routes/orderRoutes');
const supplierRoutes = require('./routes/supplierRoutes');

// Multer is used to parse multipart/form-data
const multer = require('multer');
// Configure multer: you can change the destination or other options as needed.
const upload = multer({ dest: 'uploads/' });

const app = express();

// Session middleware configuration
app.use(session({
  secret: 'secret-key',  // use a strong secret in production!
  resave: false,
  saveUninitialized: true
}));

// Serve static assets from the 'public' folder
app.use(express.static('public'));

// Body parser middleware for urlencoded form data (won't handle multipart)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global middleware - makes currentDate available in all views
app.use((req, res, next) => {
  res.locals.currentDate = new Date().toLocaleString();
  next();
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/inventory_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Register route files with their base paths
app.use('/', accountRoutes);
app.use('/product', productRoutes);
app.use('/auth', authRoutes);
app.use('/reports', reportRoutes);
app.use('/account', accountRoutes); // GET /account is handled in accountRoutes.js
app.use('/stock', stockRoutes);
app.use('/order', orderRoutes);
app.use('/supplier', supplierRoutes);


app.get('/account', (req, res) => {
  // Assuming req.session.user holds the current user
  res.render('account', { user: req.session.user });
});

// Dashboard route -- only accessible if the user is logged in
app.get('/dashboard', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  try {
    // Query stocks from the database, populate the product field and sort by arrivalDate.
    const stocks = await Stock.find()
      .populate('product')  // this fetches the full product document
      .sort({ arrivalDate: 1 });
    
    res.render('dashboard', { 
      currentDate: new Date().toLocaleString(),
      stocks: stocks
    });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).send('Server error');
  }
});

app.post('/order/move-to-cancelled/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const cancelledStock = new CancelledStock({
      orderId: order._id,
      product: order.product,
      orderQuantity: order.orderQuantity,
      supplier: order.supplier,
      pricePerUnit: order.pricePerUnit,
      cancelledDate: new Date(),
    });

    await cancelledStock.save();
    res.json({ message: "Order moved to Cancelled Stocks successfully" });
  } catch (error) {
    console.error("Error moving order:", error);
    res.status(500).json({ message: "Server error" });
  }
});



// POST /order/update/:id
app.post('/order/update/:id', async (req, res) => {
  const { productCondition, arrivalDate } = req.body;

  try {
    // Find the order by ID.
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).send("Order not found.");
    }

    // Update the order's status and arrivalDate.
    order.productCondition = productCondition;
    order.arrivalDate = arrivalDate;
    await order.save();

    // If the updated status is "Cancelled", save that order data in CancelledStock.
    if (productCondition === "Cancelled") {
      const cancelledData = {
        orderId: order._id,
        product: order.product,         // Adjust according to your schema
        orderQuantity: order.orderQuantity,
        supplier: order.supplier,
        pricePerUnit: order.pricePerUnit,
        cancelledDate: new Date()
      };

      await CancelledStock.create(cancelledData);
    }

    // Redirect back to the orders page.
    res.redirect('/order');
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).send("Server error. Please try again later.");
  }
});


router.post('/edit', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  try {
    const {
      username,
      password,
      firstName,
      middleName,
      lastName,
      birthDate,
      age,
      employmentDate,
      address,
      contact
    } = req.body;

    // Convert dates and age
    const parsedBirthDate = birthDate ? new Date(birthDate) : undefined;
    const parsedEmploymentDate = employmentDate ? new Date(employmentDate) : undefined;
    const parsedAge = age ? Number(age) : undefined;
    
    // Update the user document in the database. For example:
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user._id,
      {
        username,
        // Update the password only if provided (and hash it)
        ...(password && password.trim() !== "" && { password: await bcrypt.hash(password, 10) }),
        firstName,
        middleName,
        lastName,
        ...(parsedBirthDate && { birthDate: parsedBirthDate }),
        ...(parsedAge != null && { age: parsedAge }),
        ...(parsedEmploymentDate && { employmentDate: parsedEmploymentDate }),
        address,
        contact
      },
      { new: true }
    );

    // Update session user
    req.session.user = updatedUser;
    res.redirect('/account');
  } catch (error) {
    console.error('Error updating profile:', error);
    res.redirect('/account');
  }
});


// Root redirect (if not logged in, go to login)
app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
