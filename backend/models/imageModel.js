const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  tags: [{
    type: String,
    required: false
  }],
  contentType: {
    type: String,
    required: true,
  },
  imageBase64: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

imageSchema.index({ filename: 'text', title: 'text', description: 'text', tags: 'text' });

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;