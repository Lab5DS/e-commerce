// controllers/cartController.js
const { Product } = require('../models');

const cartController = {
  getCart: (req, res) => {
    // Si no existe el carrito en la sesión, inicializamos uno vacío para evitar errores en la vista
    if (!req.session.cart) {
      req.session.cart = { items: [], totalQty: 0, totalPrice: 0 };
    }
    res.render('cart', { title: 'Carrito', cart: req.session.cart });
  },

  addToCart: async (req, res) => {
    try {
      const productId = parseInt(req.body.productId);
      const quantity  = parseInt(req.body.quantity) || 1;
      const product   = await Product.findByPk(productId);

      if (!product) return res.status(404).render('error', { title:'Error', message:'Producto no encontrado' });
      if (product.stock < quantity) return res.status(400).render('error', { title:'Error', message:'Stock insuficiente' });

      // SOLUCIÓN: Si el carrito no existe en la sesión, lo creamos aquí mismo
      if (!req.session.cart) {
        req.session.cart = { items: [], totalQty: 0, totalPrice: 0 };
      }
      let cart = req.session.cart;

      const idx = cart.items.findIndex(i => i.product.id === product.id);
      if (idx > -1) {
        // Validar que la suma total no supere el stock disponible
        if (cart.items[idx].quantity + quantity > product.stock) {
          return res.status(400).render('error', { title:'Error', message:'No puedes agregar más de este producto, stock insuficiente' });
        }
        cart.items[idx].quantity += quantity;
      } else {
        cart.items.push({ product: {
          id:       product.id,
          name:     product.name,
          price:    parseFloat(product.price),
          imageUrl: product.imageUrl || product.image_url || null, // Evitamos errores si no tiene imagen
          store_id: product.store_id || null   // Guardamos la tienda para usarla en OrderItem
        }, quantity });
      }

      cart.totalQty   = cart.items.reduce((t,i) => t + i.quantity, 0);
      cart.totalPrice = parseFloat(cart.items.reduce((t,i) => t + i.product.price * i.quantity, 0).toFixed(2));
      
      req.session.cart = cart;
      res.redirect('/cart');
    } catch (err) {
      console.error(err); // Esto te ayudará a ver errores en la terminal si algo falla
      res.status(500).render('error', { title:'Error', message:'Error al agregar al carrito' });
    }
  },

  updateCartItem: (req, res) => {
    try {
      const productId = parseInt(req.body.productId);
      const quantity  = parseInt(req.body.quantity);
      if (isNaN(quantity) || quantity <= 0) return res.redirect('/cart');
      
      let cart = req.session.cart;
      if (!cart) return res.redirect('/cart'); // Seguridad por si acceden directo a la ruta

      const idx = cart.items.findIndex(i => i.product.id === productId);
      if (idx > -1) {
        cart.items[idx].quantity = quantity;
        cart.totalQty   = cart.items.reduce((t,i) => t + i.quantity, 0);
        cart.totalPrice = parseFloat(cart.items.reduce((t,i) => t + i.product.price * i.quantity, 0).toFixed(2));
        req.session.cart = cart;
      }
      res.redirect('/cart');
    } catch (err) {
      res.status(500).render('error', { title:'Error', message:'Error al actualizar carrito' });
    }
  },

  removeCartItem: (req, res) => {
    try {
      const productId = parseInt(req.body.productId);
      let cart = req.session.cart;
      if (!cart) return res.redirect('/cart'); // Seguridad

      cart.items = cart.items.filter(i => i.product.id !== productId);
      cart.totalQty   = cart.items.reduce((t,i) => t + i.quantity, 0);
      cart.totalPrice = parseFloat(cart.items.reduce((t,i) => t + i.product.price * i.quantity, 0).toFixed(2));
      req.session.cart = cart;
      res.redirect('/cart');
    } catch (err) {
      res.status(500).render('error', { title:'Error', message:'Error al eliminar del carrito' });
    }
  }
};

module.exports = cartController;
