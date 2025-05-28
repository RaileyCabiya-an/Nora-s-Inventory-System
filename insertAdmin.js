const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/UserModel'); // Adjust the path if needed

// Connect to MongoDB (adjust the connection string as needed)
mongoose.connect('mongodb://localhost:27017/inventory_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Connected to MongoDB');
    insertAdmin();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

async function insertAdmin() {
  try {
    const username = "admin";
    const plainPassword = "admin123";

    // Hash the plain text password using bcrypt with 10 salt rounds
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create a new user document, leaving other fields blank or as defaults
    const adminUser = new User({
      username: username,
      password: hashedPassword,
      // Other fields will be left empty or with default values as per your schema
    });

    // Save the new user into MongoDB
    const savedUser = await adminUser.save();
    console.log('Admin user inserted:', savedUser);
  } catch (error) {
    console.error('Error inserting admin user:', error);
  } finally {
    // Close the connection when done
    mongoose.connection.close();
  }
}
