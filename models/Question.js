const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Assuming you've set up your Sequelize instance

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  questionType: {
    type: DataTypes.ENUM('single', 'multiple'), // Assuming questionType can be 'single' or 'multiple'
    allowNull: false,
  },
  questionText: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Question;
