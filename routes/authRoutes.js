// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/UserModel'); // Adjust the path if your model file is named differently

// GET route for login page
router.get('/login', (req, res) => {
  // Render login.ejs and pass an empty error message
  res.render('login', { error: null });
});

// GET route for registration page
router.get('/register', (req, res) => {
  res.redirect('/account'); // Or render a different view as needed.
});


// POST route for handling login authentication
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    // Find user by username
    const user = await User.findOne({ username });
    
    // If user not found or password does not match, render login with an error
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { error: 'Invalid username or password' });
    }
    
    // If successful, set user in session and redirect to account page
    req.session.user = user;
    res.redirect('/account');
  } catch (err) {
    console.error('Login Error:', err);
    res.render('login', { error: 'An unexpected error occurred' });
  }
});

// POST route for handling user registration
router.post('/register', async (req, res) => {
  console.log("Registration POST received. req.body:", req.body); // Debug log

  try {
    // Destructure fields from the request body
    const {
      username,
      password,
      type,
      firstName,
      middleName,
      lastName,
      birthDate,
      age,
      employmentDate,
      address,
      contact
    } = req.body;

    // Ensure required fields are present
    if (!username || !password) {
      console.error("Missing username or password");
      return res.send("Required fields missing");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user document using the submitted data.
    // Convert dates and numbers only if values exist.
    const newUser = new User({
      username,
      password: hashedPassword,
      type,
      firstName,
      middleName,
      lastName,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      age: age ? Number(age) : undefined,
      employmentDate: employmentDate ? new Date(employmentDate) : undefined,
      address,
      contact
    });

    // Save the new user to the database
    await newUser.save();
    console.log("User successfully registered:", newUser);

    // Redirect back to the account page (or any destination you prefer)
    res.redirect('/account');

  } catch (error) {
    console.error("Error during registration:", error);
    res.send("Registration error: " + error.message);
  }
});

// GET route for handling logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error while logging out:', err);
      // If session destruction fails, redirect the user back to the account page
      return res.redirect('/account');
    }
    // After logout, redirect to the login page
    res.redirect('/auth/login');
  });
});

module.exports = router;
