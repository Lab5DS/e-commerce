// models/Product.js
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Product = sequelize.define('Product', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
   // En models/Product.js — AGREGAR dentro de la definicion de campos:
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'stores', key: 'id' }
  },
  name:        { type: DataTypes.STRING,  allowNull: false },
  description: { type: DataTypes.TEXT },
  price:       { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  stock:       { type: DataTypes.INTEGER, defaultValue: 0 },
  imageUrl:    { type: DataTypes.STRING }
});

module.exports = Product;