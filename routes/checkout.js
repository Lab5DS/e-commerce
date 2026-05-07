// routes/checkout.js
const express = require('express');
const router = express.Router();
const ctrl    = require('../controllers/checkoutController');
router.get( '/',                    ctrl.getCheckoutPage);
router.post('/process',             ctrl.processCheckout);       // crea orden BD + muestra PayPal
router.post('/create-paypal-order', ctrl.createPayPalOrder);    // crea orden en PayPal API
router.post('/capture-paypal-order',ctrl.capturePayPalOrder);   // captura el pago aprobado
// routes/checkout.js

// RUTA DE ÉXITO
router.get('/success', (req, res) => {
  // Extraemos los datos de la URL (ej: /success?orderId=123&total=50.00)
  const orderData = {
    id: req.query.orderId || 'N/A',
    total: req.query.total || 0
  };

  res.render('order-success', { 
    order: orderData 
    // No enviamos 'title' ni 'message' aquí porque tu EJS de éxito ya los tiene escritos a mano
  });
});

// RUTA DE ERROR (Aquí es donde sí se necesitan las variables)
router.get('/cancel', (req, res) => {
  res.render('payment-failed', { 
    title: 'Pago Cancelado', 
    message: 'El proceso de pago fue interrumpido. No se ha realizado ningún cargo.' 
  });
});

module.exports = router;