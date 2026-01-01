// routes/books.js (or your existing file)
// routes/books.js (or your existing file)
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const Request = require('../models/Request');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/* ================= CONSTANTS ================= */
const CATEGORY_OPTIONS = [
  'Programming',
  'Networking',
  'DBMS',
  'AI',
  'Maths',
  'OS',
  'Deep Learning',
  'Other',
];

const ALLOWED_STATUSES = ['available', 'requested', 'exchanged', 'sold'];

/* ================= MULTER ================= */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ================= ADD BOOK ================= */
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const ownerId = req.user.id;

    const {
      title,
      author,
      category,
      description,
      edition,
      isbn,
      condition,
      yearOfPublication,
      department,
      rate,
      status,
    } = req.body;

    if (!title || !author || !category) {
      return res.status(400).json({
        message: 'Title, author and category are required',
      });
    }

    if (!CATEGORY_OPTIONS.includes(category)) {
      return res.status(400).json({
        message: 'Invalid category',
      });
    }

    const bookData = {
      owner: new mongoose.Types.ObjectId(ownerId),
      title,
      author,
      category,
      description,
      edition,
      isbn,
      condition,
      yearOfPublication: yearOfPublication ? Number(yearOfPublication) : undefined,
      department,
      rate: rate ? Number(rate) : 0,
      status: ALLOWED_STATUSES.includes(status) ? status : 'available',
    };

    if (req.file) {
      bookData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const book = await Book.create(bookData);

    return res.status(201).json({
      message: 'Book added successfully',
      book,
    });
  } catch (err) {
    console.error('Add book error:', err);
    return res.status(500).json({
      message: 'Server error',
    });
  }
});

/* ================= GET AVAILABLE BOOKS (✅ FIXED) ================= */
router.get('/available', authMiddleware, async (req, res) => {
  try {
    const books = await Book.find({
      status: 'available',
      owner: { $ne: req.user.id },
    })
      .populate('owner', 'name department yearOfStudy') // ✅ FIXED
      .select('-image.data');

    return res.status(200).json({
      success: true,
      books,
    });
  } catch (err) {
    console.error('Fetch available books error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
    });
  }
});

/* ================= GET MY BOOKS ================= */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const books = await Book.find({ owner: req.user.id })
      .populate('owner', 'name department yearOfStudy') // ✅ FIXED
      .select('-image.data');

    return res.status(200).json({
      success: true,
      books,
    });
  } catch (err) {
    console.error('Fetch my books error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch my books',
    });
  }
});

/* ================= UPDATE BOOK ================= */
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const fields = [
      'title',
      'author',
      'category',
      'description',
      'edition',
      'isbn',
      'condition',
      'department',
      'status',
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        book[field] = req.body[field];
      }
    });

    if (req.body.yearOfPublication !== undefined) {
      book.yearOfPublication = Number(req.body.yearOfPublication);
    }

    if (req.body.rate !== undefined) {
      book.rate = Number(req.body.rate);
    }

    if (req.file) {
      book.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    await book.save();

    return res.status(200).json({
      message: 'Book updated successfully',
      book,
    });
  } catch (err) {
    console.error('Update book error:', err);
    return res.status(500).json({
      message: 'Server error',
    });
  }
});

/* ================= SEND REQUEST ================= */
router.post('/:id/request', authMiddleware, async (req, res) => {
  try {
    const { type, message } = req.body;

    if (!['buy', 'exchange'].includes(type)) {
      return res.status(400).json({ message: 'Invalid request type' });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.owner.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot request your own book' });
    }

    const request = await Request.create({
      book: book._id,
      requester: req.user.id,
      owner: book.owner,
      type,
      message,
      status: 'pending',
    });

    book.status = 'requested';
    await book.save();

    return res.status(201).json({
      message: 'Request sent successfully',
      request,
    });
  } catch (err) {
    console.error('Send request error:', err);
    return res.status(500).json({
      message: 'Failed to send request',
    });
  }
});

/* ================= DELETE BOOK ================= */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await book.deleteOne();

    return res.status(200).json({
      message: 'Book deleted successfully',
    });
  } catch (err) {
    console.error('Delete book error:', err);
    return res.status(500).json({
      message: 'Server error',
    });
  }
});

/* ================= BOOK IMAGE ================= */
router.get('/:id/image', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).select('image');

    if (!book || !book.image?.data) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.set('Content-Type', book.image.contentType);
    res.send(book.image.data);
  } catch (err) {
    console.error('Fetch image error:', err);
    return res.status(500).json({
      message: 'Server error',
    });
  }
});

module.exports = router;
