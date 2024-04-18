const mongoose = require('mongoose');

module.exports = mongoose.model('GamingChannel', new mongoose.Schema({
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
  number: {
    type: Number,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  activity: {
    type: String,
    default: null,
  },
  influence: {
    type: String,
    default: 'game',
  },
  ownerId: {
    type: String,
    default: null,
  },
  nameChanges: {
    type: [ Date ],
    default: [],
  },
  updateQueue: {
    type: Number,
    default: null,
  },
  privacyMode: {
    type: String,
    default: 'members',
  },
  lobbyId: {
    type: String,
    default: null,
  },
  privacyList: {
    type: String,
    default: null,
  },
  blacklist: {
    type: [ String ],
    default: [],
  },
  whitelist: {
    type: [ String ],
    default: [],
  },
}));
