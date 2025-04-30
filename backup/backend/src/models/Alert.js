const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  severity: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['error', 'warning', 'info', 'success']]
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  onuId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  resolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Alert',
  timestamps: true,
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['read']
    },
    {
      fields: ['resolved']
    }
  ]
});

module.exports = Alert; 