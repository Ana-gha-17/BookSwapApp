require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const booksRouter = require('./routes/books');
const requestRoutes = require('./routes/requests');
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); 
app.use('/api/auth', authRoutes);

app.use('/api/books', booksRouter);
app.use('/api/books/requests', requestRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(() => {
     console.log('✅ MongoDB connected');
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log('Server started on', port));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });