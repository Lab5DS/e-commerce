require('dotenv').config();
const express      = require('express');
const path         = require('path');
const session      = require('express-session');
const cookieParser = require('cookie-parser');
const ejsLayouts   = require('express-ejs-layouts');
const sequelize    = require('./config/database');
const { Order }    = require('./models');

const app  = express();
const port = process.env.PORT || 3000;

/* ─────────────────────────────
   ROUTES IMPORTS
───────────────────────────── */
const productRoutes    = require('./routes/products');
const cartRoutes       = require('./routes/cart');
const checkoutRoutes   = require('./routes/checkout');

const storeAuthRoutes  = require('./routes/storeAuth');
const userAuthRoutes   = require('./routes/userAuth');

const storeAdminRoutes = require('./routes/storeAdmin'); 
const customerRoutes   = require('./routes/customer');

/* ─────────────────────────────
   MIDDLEWARE CUSTOM
───────────────────────────── */
const { attachLocals } = require('./middleware/authMiddleware');

/* ─────────────────────────────
   VIEW ENGINE
───────────────────────────── */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(ejsLayouts);

/* ─────────────────────────────
   GLOBAL MIDDLEWARES (ORDENADO CRÍTICO)
───────────────────────────── */
// 🔥 1. Archivos estáticos al inicio absoluto para que resuelva /css/styles.css sin tocar rutas
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }
}));

app.use(attachLocals);

/* ─────────────────────────────
   CARRITO EN SESIÓN (ANTES DE LAS RUTAS)
───────────────────────────── */
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = { items: [], totalQty: 0, totalPrice: 0 };
  }
  res.locals.cartItemCount = req.session.cart.totalQty || 0;
  next();
});

/* ─────────────────────────────
   DESACTIVAR LAYOUT
───────────────────────────── */
app.use([
  '/store/login',
  '/store/register',
  '/storeadmin', 
  '/customer'
], (req, res, next) => {
  res.locals.layout = false;
  next();
});

/* ─────────────────────────────
   ROUTES SYSTEM
───────────────────────────── */
app.use('/store', storeAuthRoutes);
app.use('/user', userAuthRoutes);        
app.use('/storeadmin', storeAdminRoutes); // ✅ Coincide exactamente con el middleware de exclusión superior
app.use('/customer', customerRoutes);

app.use('/', productRoutes);
app.use('/cart', cartRoutes);
app.use('/checkout', checkoutRoutes);

/* ─────────────────────────────
   ORDER SUCCESS
───────────────────────────── */
app.get('/order-success/:id', async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  res.render('order-success', { order });
});

/* ─────────────────────────────
   404 HANDLER (AL FINAL)
───────────────────────────── */
app.use((req, res) => {
  console.error('\n❌ 404 DETECTADO');
  console.error('URL:', req.originalUrl);
  console.error('Método:', req.method);

  // 1. Apagamos el motor de layouts para esta respuesta específica
  res.locals.layout = false; 
  
  // 2. Enviamos un texto plano JSON o HTML crudo usando send o end
  res.status(404).send(`Error 404: La ruta [ ${req.originalUrl} ] no existe.`);
});

/* ─────────────────────────────
   SERVER
───────────────────────────── */
sequelize.sync()
  .then(() => {
    console.log('Base de datos sincronizada de forma segura');
    app.listen(port, () => {
      console.log(`Servidor en http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Error al sincronizar BD:', err.message);
    process.exit(1);
  });