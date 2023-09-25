const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
const pollRoutes = require('./routes/pollRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/polls', pollRoutes);
app.use('/users', userRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
