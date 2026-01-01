const mongoose = require('mongoose');
const CATEGORY_OPTIONS = [
  'Programming',
  'Networking',
  'DBMS',
  'AI',
  'Maths',
  'OS',
  'Deep Learning'
];


const bookSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  title: {
    type: String,
    required: true
  },

  author: {
    type: String,
    required: true
  },

  category: {
    type: String,
    enum: CATEGORY_OPTIONS,
    required: true
  },

  description: {
    type: String
  },

  edition: {
    type: String
  },

  isbn: {
    type: String
  },

  condition: {
    type: String
  },

  yearOfPublication: {
    type: Number
  },

  department: {
    type: String
  },

  image: {
    data: Buffer,
    contentType: String
  },

  imageUrl: {
    type: String
  },

  rate: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['available', 'requested', 'exchanged', 'sold'],
    default: 'available'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Book', bookSchema);
