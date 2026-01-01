const express = require('express');
const Request = require('../models/Request');
const Book = require('../models/Book');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * SENT REQUESTS
 */
router.get('/sent', auth, async (req, res) => {
  const requests = await Request.find({ requester: req.user._id })
    .populate('book')
    .populate('owner', 'name');

  res.json({ requests });
});

/**
 * RECEIVED REQUESTS
 */
router.get('/received', auth, async (req, res) => {
  const requests = await Request.find({ owner: req.user._id })
    .populate('book')
    .populate('requester', 'name');

  res.json({ requests });
});

/**
 * ACCEPT REQUEST
 */
router.patch('/:id/accept', auth, async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });

  if (request.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  request.status = 'accepted';
  await request.save();

  // Update book status
  const book = await Book.findById(request.book);
  if (book) {
    book.status = request.type === 'buy' ? 'sold' : 'exchanged';
    await book.save();
  }

  res.json({ request, book });
});

/**
 * REJECT REQUEST
 */
router.patch('/:id/reject', auth, async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });

  if (request.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  request.status = 'rejected';
  await request.save();

  res.json({ request });
});

module.exports = router;
