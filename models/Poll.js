const Sequelize = require('sequelize');
const db = require('../config/database');

const Poll = db.define('poll', {
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  category: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  startDate: {
    type: Sequelize.STRING, // Store as string in YYYY-MM-DD format
    allowNull: false,
  },
  endDate: {
    type: Sequelize.STRING, // Store as string in YYYY-MM-DD format
    allowNull: false,
  },
  minReward: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  maxReward: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
});

module.exports = Poll;
