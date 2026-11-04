import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import seedRoutes from './routes/seedRoutes.js';
import Product from './models/Product.js';

dotenv.config();

// Attempt immediate connection for local servers
connectDB().catch((err) => console.error('[Init DB error]:', err.message));

const app = express();
const PORT = process.env.PORT || 5000;

// Enable pretty formatted JSON responses
app.set('json spaces', 2);

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, postman) or from frontend
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for evaluation and dev
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serverless DB connection middleware: ensures MongoDB is connected before handling routes
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (dbErr) {
    console.error('[DB Middleware Error]:', dbErr.message);
    next();
  }
});

// Root route: Serves formatted JSON showing API status and catalog overview
app.get('/', async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const recentProducts = await Product.find({}).sort({ createdAt: -1 }).limit(6);

    res.status(200).json({
      success: true,
      service: 'Zaraz E-Commerce API Server (Daraz Inspired Green & Black)',
      version: '1.0.0',
      database: 'Connected to MongoDB Atlas',
      totalProductsInCatalog: productCount,
      recentProductsSample: recentProducts,
      endpoints: {
        allProducts: 'GET /products',
        singleProduct: 'GET /products/:id',
        createProduct: 'POST /products',
        updateProduct: 'PUT /products/:id',
        deleteProduct: 'DELETE /products/:id',
        allCategories: 'GET /categories',
        allBanners: 'GET /banners',
        createOrder: 'POST /orders',
        myOrders: 'GET /orders?email=user@zaraz.com',
        trackOrder: 'GET /orders/:id',
        updateOrderStatus: 'PATCH /orders/:id/status',
        processPayment: 'POST /payment/process',
        userRegister: 'POST /auth/register',
        userLogin: 'POST /auth/login',
        userProfile: 'GET /auth/profile (Bearer token)',
        seedDatabase: 'GET /seed or POST /seed',
      },
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      service: 'Zaraz E-Commerce API Server',
      status: 'MongoDB Connection Pending',
      message: 'MongoDB Atlas is connecting. Provide or verify your connection string.',
      error: error.message,
    });
  }
});

// API Routes
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/banners', bannerRoutes);
app.use('/orders', orderRoutes);
app.use('/payment', paymentRoutes);
app.use('/auth', authRoutes);
app.use('/seed', seedRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'zaraz-server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found on Zaraz Server.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[Zaraz Server] Running at http://localhost:${PORT}`);
    console.log(`[Zaraz Server] Health check: http://localhost:${PORT}/health`);
  });
}

export default app;
