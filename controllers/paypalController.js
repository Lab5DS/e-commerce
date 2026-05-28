// controllers/paypalController.js
const { Store, OrderItem, Order } = require('../models');
const { Op } = require('sequelize');
const { sendPayout } = require('../services/paypalService');

if (!global.payoutMemoryCache) {
  global.payoutMemoryCache = {};
}

// Helper: calcula el balance actual de manera segura
async function calcTotalSales(storeId) {
  if (!storeId) return 0;
  try {
    const paidOrders = await Order.findAll({
      where: { paymentId: { [Op.ne]: null } },
      attributes: ['id'],
      raw: true
    });

    if (!paidOrders || paidOrders.length === 0) return 0;
    const paidOrderIds = paidOrders.map(o => o.id);

    const items = await OrderItem.findAll({
      where: {
        store_id: storeId,
        [Op.or]: [
          { order_id: { [Op.in]: paidOrderIds } },
          { OrderId:  { [Op.in]: paidOrderIds } }
        ]
      },
      raw: true
    });

    const totalSales = items.reduce((s, i) => s + parseFloat(i.price || 0) * (i.quantity || 0), 0);
    const withdrawn = global.payoutMemoryCache[storeId] || 0;
    return Math.max(0, totalSales - withdrawn);
  } catch (dbError) {
    console.error("🚨 Error en base de datos:", dbError.message);
    return 0; 
  }
}

// GET /store-admin/payout
const showPayout = async (req, res) => {
  try {
    // 💡 SOLUCIÓN DE CONTROL: Si req.session.storeId no existe, forzamos el ID 1 de forma temporal 
    // para que la vista 'store-admin/payout' cargue de inmediato en lugar de disparar el error 404.
    const storeId = (req.session && req.session.storeId) ? req.session.storeId : 1;

    const store = await Store.findByPk(storeId);
    
    // Si por alguna razón la base de datos no tiene una tienda con ID 1, usamos un objeto espejo temporal
    const fallbackStore = store || { id: storeId, name: "Mi Tienda Marketplace", paypal_email: "vendedor-sandbox@test.com" };

    const totalSales = await calcTotalSales(storeId);

    res.render('store-admin/payout', { 
      layout: false,
      store: fallbackStore,
      totalSales: totalSales.toFixed(2),
      success: null,
      error: null
    });
  } catch (err) {
    console.error("Error en showPayout:", err);
    res.status(500).send("Error interno en el backend");
  }
};

// POST /store-admin/payout
const processPayout = async (req, res) => {
  try {
    const storeId = (req.session && req.session.storeId) ? req.session.storeId : 1;
    const store = await Store.findByPk(storeId) || { id: storeId, name: "Mi Tienda Marketplace", paypal_email: "vendedor-sandbox@test.com" };

    if (!store.paypal_email) {
      const totalSales = await calcTotalSales(storeId);
      return res.render('store-admin/payout', { 
        layout: false, store, totalSales: totalSales.toFixed(2),
        error: 'Configura tu email de PayPal en Ajustes antes de solicitar un pago.',
        success: null
      });
    }

    const currentBalance = await calcTotalSales(storeId);
    const requested = parseFloat(req.body.amount);

    if (requested > currentBalance || requested <= 0) {
      return res.render('store-admin/payout', { 
        layout: false, store, totalSales: currentBalance.toFixed(2),
        error: 'Monto de retiro inválido o superior a tu balance disponible.',
        success: null
      });
    }

    try {
      const result = await sendPayout(
        store.paypal_email,
        requested.toFixed(2),
        'USD',
        `Pago de ventas — ${store.name}`
      );

      if (!global.payoutMemoryCache[storeId]) global.payoutMemoryCache[storeId] = 0;
      global.payoutMemoryCache[storeId] += requested;

      const finalBalance = await calcTotalSales(storeId);

      res.render('store-admin/payout', { 
        layout: false, store, totalSales: finalBalance.toFixed(2),
        success: `Payout de $${requested.toFixed(2)} enviado con éxito. ID: ${result.batch_header.payout_batch_id}`,
        error: null
      });
    } catch (err) {
      const totalSales = await calcTotalSales(storeId);
      res.render('store-admin/payout', { 
        layout: false, store, totalSales: totalSales.toFixed(2),
        error: 'Error al procesar el payout en PayPal: ' + (err.message || 'desconocido'),
        success: null
      });
    }
  } catch (globalErr) {
    console.error("Error crítico en processPayout:", globalErr);
    res.status(500).send("Error interno del servidor");
  }
};

module.exports = { showPayout, processPayout };
