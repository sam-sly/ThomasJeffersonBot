const mongoose = require('mongoose');

module.exports = mongoose.model('SocialChannel', new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
}));
