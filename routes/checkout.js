// routes/checkout.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/checkoutController');
router.get( '/',                    ctrl.getCheckoutPage);
router.post('/process',             ctrl.processCheckout);       // crea orden BD + muestra PayPal
router.post('/create-paypal-order', ctrl.createPayPalOrder);    // crea orden en PayPal API
router.post('/capture-paypal-order',ctrl.capturePayPalOrder);   // captura el pago aprobado
// REEMPLAZA TU RUTA ACTUAL POR ESTA:
router.get( '/success', (req, res) => res.render('order-success', { 
  title: 'Pedido Completado', 
  order: { 
    id: req.query.orderId, 
    total: req.query.total // <- Aquí atrapamos el total de la URL
  } 
}));
router.get( '/cancel',              ctrl.handleCancelPayment);
module.exports = router;