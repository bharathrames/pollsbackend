const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Assuming you've set up your Sequelize instance

const Option = sequelize.define('Option', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  optionText: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Option;
