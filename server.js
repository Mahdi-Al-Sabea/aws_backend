const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const Item = require('./models/Item');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// MongoDB Connection
// NOTE: In a real scenario, use process.env.MONGO_URI. 
// For this demo, we'll use a local instance or a placeholder if env is missing.
const db = process.env.MONGO_URI;

mongoose.connect(db)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Routes

// GET all items
app.get('/api/items', async (req, res) => {
    try {
        const items = await Item.find().sort({ date: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new item
app.post('/api/items', async (req, res) => {
    try {
        const newItem = new Item({
            name: req.body.name,
            description: req.body.description
        });
        const item = await newItem.save();
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE item
app.delete('/api/items/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false });
        await item.deleteOne();
        res.json({ success: true });
    } catch (err) {
        res.status(404).json({ success: false, error: err.message });
    }
});

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
