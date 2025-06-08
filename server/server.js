require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); 

const app = express();
app.use(cors());
app.use(express.json());

// Các routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/ProductRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes')); 
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/debts', require('./routes/debtRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));