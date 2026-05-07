// routes/checkout.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/checkoutController');
router.get( '/',                    ctrl.getCheckoutPage);
router.post('/process',             ctrl.processCheckout);       // crea orden BD + muestra PayPal
router.post('/create-paypal-order', ctrl.createPayPalOrder);    // crea orden en PayPal API
router.post('/capture-paypal-order',ctrl.capturePayPalOrder);   // captura el pago aprobado

res.render('order-success', { 
    title: '¡Pedido realizado!', 
    message: 'Gracias por tu compra. Tu pedido ha sido procesado exitosamente.' 
});

  
router.get( '/cancel',              ctrl.handleCancelPayment);
module.exports = router;