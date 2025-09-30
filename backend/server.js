const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const sampleRoute = require('./routes/index');
app.use('/api', sampleRoute);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        app.listen(PORT);
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });