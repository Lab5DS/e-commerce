// controllers/storeAdminController.js 
const { Store, Product, Order, OrderItem } = require('../models');
const { Op } = require('sequelize');

// GET /storeadmin/
const dashboard = async (req, res) => {
  try {
    const storeId = req.session.storeId;
    const store   = await Store.findByPk(storeId);

    let monthSales = "0.00";
    let orderCount = 0;
    let productCount = 0;

    try {
      const now        = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const items = await OrderItem.findAll({
        where: { store_id: storeId, createdAt: { [Op.gte]: monthStart } }
      });
      
      monthSales   = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0).toFixed(2);
      orderCount   = new Set(items.map(i => i.order_id)).size;
      productCount = await Product.count({ where: { store_id: storeId } });
    } catch (dbError) {
      console.error("⚠️ Error en consultas métricas de DB, usando valores en 0:", dbError.message);
    }

    res.render('storeadmin/dashboard', { 
      layout: false,
      store, 
      monthSales, 
      orderCount, 
      productCount
    });
  } catch (error) {
    console.error("❌ Error crítico en Dashboard:", error);
    res.status(500).send('Error en el servidor de administración');
  }
};

// GET /storeadmin/products
const listProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { store_id: req.session.storeId },
      order: [['createdAt', 'DESC']]
    });
    res.render('storeadmin/products', { layout: false, products });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al listar productos');
  }
};

// GET /storeadmin/products/new
const showNewProduct = (req, res) =>
  res.render('storeadmin/product-form', { layout: false, product: null, error: null });

// POST /storeadmin/products
const createProduct = async (req, res) => {
  const { name, description, price, stock, imageUrl } = req.body;
  try {
    await Product.create({
      name, description, price, stock: stock || 0,
      imageUrl: imageUrl || '/images/placeholder.png',
      store_id: req.session.storeId
    });
    res.redirect('/storeadmin/products');
  } catch (err) {
    res.render('storeadmin/product-form', { layout: false, product: null, error: 'Error al crear el producto.' });
  }
};

// GET /storeadmin/products/:id/edit
const showEditProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, store_id: req.session.storeId }
    });
    if (!product) return res.redirect('/storeadmin/products');
    res.render('storeadmin/product-form', { layout: false, product, error: null });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al mostrar edición de producto');
  }
};

// POST /storeadmin/products/:id
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, stock, imageUrl } = req.body;
    await Product.update(
      { name, description, price, stock, imageUrl },
      { where: { id: req.params.id, store_id: req.session.storeId } }
    );
    res.redirect('/storeadmin/products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al actualizar producto');
  }
};

// POST /storeadmin/products/:id/delete
const deleteProduct = async (req, res) => {
  try {
    await Product.destroy({
      where: { id: req.params.id, store_id: req.session.storeId }
    });
    res.redirect('/storeadmin/products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al eliminar producto');
  }
};

// GET /storeadmin/orders
const listOrders = async (req, res) => {
  try {
    const items = await OrderItem.findAll({
      where: { store_id: req.session.storeId },
      include: [
        { model: Order,   as: 'order'   },
        { model: Product, as: 'product' }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    const ordersMap = {};
    items.forEach(item => {
      const oid = item.order_id;
      if (!ordersMap[oid]) ordersMap[oid] = { order: item.order, items: [] };
      ordersMap[oid].items.push(item);
    });
    const orders = Object.values(ordersMap);
    res.render('storeadmin/orders', { layout: false, orders });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al listar órdenes');
  }
};

// GET /storeadmin/settings
const showSettings = async (req, res) => {
  try {
    const store = await Store.findByPk(req.session.storeId);
    res.render('storeadmin/settings', { layout: false, store, success: null, error: null });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar configuraciones');
  }
};

// POST /storeadmin/settings
const updateSettings = async (req, res) => {
  try {
    const { name, description, paypal_email } = req.body;
    await Store.update(
      { name, description, paypal_email },
      { where: { id: req.session.storeId } }
    );
    const store = await Store.findByPk(req.session.storeId);
    res.render('storeadmin/settings', { layout: false, store, success: 'Configuracion actualizada.', error: null });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al actualizar configuraciones');
  }
};

module.exports = {
  dashboard, listProducts, showNewProduct, createProduct,
  showEditProduct, updateProduct, deleteProduct,
  listOrders, showSettings, updateSettings
};
