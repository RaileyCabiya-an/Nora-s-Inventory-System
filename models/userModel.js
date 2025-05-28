// models/UserModel.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String},
  username: { type: String, required: true },
  password: { type: String, required: true },
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
  birthDate: { type: Date },
  age: { type: Number },
  employmentDate: { type: Date },
  address: { type: String },
  contact: { type: String },
   profileImage: {
    type: String,
    default: "/images/default-profile.png"  // This points to your default image in the public folder.
  },
  type: { type: String, default: "staff" }
});

module.exports = mongoose.model('User', userSchema);
