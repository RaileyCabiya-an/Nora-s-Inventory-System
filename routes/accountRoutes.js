// routes/accountRoutes.js
const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const User = require('../models/UserModel');
const bcrypt = require('bcrypt');
const multer = require('multer');

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads/profileImages');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// GET /account – Display the user profile page
router.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  res.render('account', { user: req.session.user });
});

// Configure multer to save files in public/uploads/profileImages/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/profileImages/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage: storage });

// POST /account/edit – Update profile with file upload
router.post('/account/edit', upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.session.user._id;  // Assumes you store the logged-in user in the session.
    let updateData = {
      username: req.body.username,
      firstName: req.body.firstName,
      middleName: req.body.middleName,
      lastName: req.body.lastName,
      // Include any other fields as necessary.
    };

    if (req.file) {
      // Set the profileImage field to the relative URL of the uploaded file.
      updateData.profileImage = "/uploads/profileImages/" + req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    // Update session data so that changes are reflected immediately.
    req.session.user = updatedUser;
    res.redirect('/account');
  } catch (err) {
    console.error("Error updating profile: ", err);
    res.status(500).send("An error occurred.");
  }
});

// POST /edit – Update profile information without file upload (alternative route)
router.post('/edit', async (req, res) => {
  if (!req.session.user) {
    console.error('No user in session. Redirecting to login.');
    return res.redirect('/auth/login');
  }
  
  console.log('Attempting profile update for user:', req.session.user._id);
  console.log('Form data received:', req.body);
  
  try {
    // Destructure fields from the form
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
    
    // Build an update object, updating only the fields you want to change.
    const updateData = {
      username,
      firstName,
      middleName,
      lastName,
      address,
      contact
    };
    
    // If provided and non-empty, add date and numeric fields.
    if (birthDate && birthDate.trim()) {
      const newBirthDate = new Date(birthDate);
      if (isNaN(newBirthDate)) {
        throw new Error('Invalid birth date format.');
      }
      updateData.birthDate = newBirthDate;
    }
    if (age && age.trim()) {
      const newAge = Number(age);
      if (isNaN(newAge)) {
        throw new Error('Age must be a valid number.');
      }
      updateData.age = newAge;
    }
    if (employmentDate && employmentDate.trim()) {
      const newEmploymentDate = new Date(employmentDate);
      if (isNaN(newEmploymentDate)) {
        throw new Error('Invalid employment date format.');
      }
      updateData.employmentDate = newEmploymentDate;
    }
    
    // Only update the password if a non-empty value is provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    console.log('Update data to be applied:', updateData);
    
    // Attempt to update the user document in the database
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user._id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      throw new Error('User not found for update.');
    }
    
    // Update session data and log success
    req.session.user = updatedUser;
    console.log('Profile updated successfully:', updatedUser);
    res.redirect('/account');
  } catch (err) {
    console.error('Error during profile update:', err);
    // (For debugging, show detailed error message; remove before deploying to production.)
    res.send(`Error updating profile: ${err.message}`);
  }
});

module.exports = router;
