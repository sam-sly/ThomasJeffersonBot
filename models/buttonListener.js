const mongoose = require('mongoose');

module.exports = mongoose.model('ButtonListener', new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  messageId: {
    type: String,
    required: true,
  },
  callbackPath: {
    type: String,
    required: true,
  },
  callbackName: {
    type: String,
    required: true,
  },
  args: {
    type: Array,
    default: [],
  }
}));
