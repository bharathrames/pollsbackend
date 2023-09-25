const mysql = require('mysql');
const { promisify } = require('util');

// Database configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Promisify the pool.query method for easier async/await usage
const query = promisify(pool.query).bind(pool);

// Database setup script
const database = async () => {
  try {
    // Create the database if it doesn't exist
    await query('CREATE DATABASE IF NOT EXISTS poll_app');

    // Use the database
    await query('USE poll_app');

    // Create tables
    await query(`
      CREATE TABLE IF NOT EXISTS Polls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS Questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pollId INT NOT NULL,
        questionText TEXT NOT NULL,
        questionType ENUM('single', 'multiple') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (pollId) REFERENCES Polls(id) ON DELETE CASCADE
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS Options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        questionId INT NOT NULL,
        optionText TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (questionId) REFERENCES Questions(id) ON DELETE CASCADE
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL, -- Store securely (hashed)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS UserPolls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        pollId INT NOT NULL,
        questionId INT NOT NULL,
        optionId INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (pollId) REFERENCES Polls(id) ON DELETE CASCADE,
        FOREIGN KEY (questionId) REFERENCES Questions(id) ON DELETE CASCADE,
        FOREIGN KEY (optionId) REFERENCES Options(id) ON DELETE CASCADE
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS PollAnalytics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pollId INT NOT NULL,
        questionId INT NOT NULL,
        optionId INT NOT NULL,
        voteCount INT NOT NULL DEFAULT 0,
        FOREIGN KEY (pollId) REFERENCES Polls(id) ON DELETE CASCADE,
        FOREIGN KEY (questionId) REFERENCES Questions(id) ON DELETE CASCADE,
        FOREIGN KEY (optionId) REFERENCES Options(id) ON DELETE CASCADE
      )
    `);

    console.log('Database setup completed.');
  } catch (error) {
    console.error('Error setting up the database:', error);
  }
};

// Export the database query function and setupDatabase function
module.exports = { query, database };
