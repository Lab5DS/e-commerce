// ==========================================
// 1. CONFIGURACIÓN Y MÓDULOS EXTERNOS
// ==========================================
require('dotenv').config();
const express      = require('express');
const path         = require('path');
const session      = require('express-session');
const cookieParser = require('cookie-parser');
const ejsLayouts   = require('express-ejs-layouts');

// ==========================================
// 2. CONEXIÓN A BASE DE DATOS Y MODELOS
// ==========================================
const sequelize                     = require('./config/database');
const { Product, Order, OrderItem } = require('./models');

// ==========================================
// 3. ENRUTADORES (ROUTES)
// ==========================================
const productRoutes  = require('./routes/products');
const cartRoutes     = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');

// ==========================================
// 4. INICIALIZACIÓN Y CONFIGURACIÓN DE APP
// ==========================================
const app  = express();
const port = process.env.PORT || 3000;

// Configuración del motor de vistas (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout'); // Usa views/layout.ejs como plantilla base
app.use(ejsLayouts);         // Activa el sistema de layouts

// ==========================================
// 5. MIDDLEWARES GENERALES
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use(session({
  secret:            process.env.SESSION_SECRET || 'dev-secret',
  resave:            false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }
}));

// Middleware: Carrito vacío en sesión si no existe
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = { items: [], totalQty: 0, totalPrice: 0 };
  }
  res.locals.cartItemCount = req.session.cart.totalQty || 0;
  next();
});

// ==========================================
// 6. CONTROLADORES DE RUTA (ENDPOINTS)
// ==========================================
app.use('/',         productRoutes);
app.use('/cart',     cartRoutes);
app.use('/checkout', checkoutRoutes);

// Manejo de Error 404 (Ruta no encontrada)
app.use((req, res) => {
  res.status(404).render('404', { title: 'Página no encontrada' });
});

// ==========================================
// 7. SINCRONIZACIÓN Y ARRANQUE DEL SERVIDOR
// ==========================================
// Se agrega { alter: true } para actualizar tablas existentes en Render automáticamente
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Base de datos sincronizada y actualizada con alter:true');
    app.listen(port, () => {
      console.log(`Servidor corriendo exitosamente en http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Error crítico al sincronizar la BD:', err.message);
    process.exit(1);
  });
