// models/OrderItem.js
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // En models/OrderItem.js — AGREGAR:
store_id: {
  type: DataTypes.INTEGER,
  allowNull: true,  // permite null para ordenes antiguas
  references: { model: 'stores', key: 'id' }
},

  quantity: { type: DataTypes.INTEGER, allowNull: false },

  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

  OrderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = OrderItem;