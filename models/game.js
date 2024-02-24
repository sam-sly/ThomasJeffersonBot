const mongoose = require('mongoose');

module.exports = mongoose.model('Game', new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  emojiId: {
    type: String,
    required: true,
  },
  roleId: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  subscribers: {
    type: Number,
    default: 0,
  },
}));
