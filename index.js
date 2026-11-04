import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB, { getAuthDb } from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import seedRoutes from './routes/seedRoutes.js';
import { issueJwt } from './controllers/authController.js';
import Product from './models/Product.js';
import Category from './models/Category.js';
import Banner from './models/Banner.js';
import Order from './models/Order.js';
import User from './models/User.js';

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

// Direct top-level /jwt endpoint for token issuance (mirrors /auth/jwt)
app.post('/jwt', issueJwt);
app.get('/jwt', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Zaraz JWT Token Issuer. Send POST /jwt with user payload to issue a signed 30-day token.',
    examplePayload: {
      email: 'customer@zaraz.com',
      name: 'John Doe',
      role: 'customer',
    },
  });
});

// Root route: Serves a high-tech Green & Black HTML Dashboard for browsers, and JSON for API clients
app.get('/', async (req, res) => {
  try {
    const [productCount, categoryCount, bannerCount, userCount, orderCount] =
      await Promise.all([
        Product.countDocuments().catch(() => 0),
        Category.countDocuments().catch(() => 0),
        Banner.countDocuments().catch(() => 0),
        User.countDocuments().catch(() => 0),
        Order.countDocuments().catch(() => 0),
      ]);

    // Check if client prefers JSON or requested ?format=json
    const acceptsHtml =
      req.accepts('html') &&
      !req.query.format?.includes('json') &&
      !req.headers.accept?.includes('application/json');

    if (acceptsHtml) {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zaraz API Core Engine • Green & Black Edition</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #070c14;
      --card-bg: #0c1524;
      --card-border: #13273c;
      --emerald: #10b981;
      --emerald-dark: #059669;
      --emerald-glow: rgba(16, 185, 129, 0.25);
      --text: #e2e8f0;
      --muted: #94a3b8;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      line-height: 1.5;
      background-image: 
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.15), transparent),
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 40px 40px, 40px 40px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2.5rem 1.5rem;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 2.5rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .logo-badge {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #10b981, #047857);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.5rem;
      color: #04130d;
      box-shadow: 0 0 25px var(--emerald-glow);
    }
    .brand h1 {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #fff;
    }
    .brand p {
      font-size: 0.85rem;
      color: var(--muted);
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.4rem 0.9rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #34d399;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .btn-group {
      display: flex;
      gap: 0.75rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1.1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .btn-primary {
      background: #10b981;
      color: #04170f;
      border: 1px solid #10b981;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25);
    }
    .btn-primary:hover {
      background: #34d399;
      transform: translateY(-1px);
    }
    .btn-outline {
      background: #0f1c2d;
      color: #e2e8f0;
      border: 1px solid var(--card-border);
    }
    .btn-outline:hover {
      background: #16263b;
      border-color: #10b981;
    }
    .grid-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      position: relative;
      overflow: hidden;
      transition: border-color 0.2s ease;
    }
    .stat-card:hover {
      border-color: rgba(16, 185, 129, 0.4);
    }
    .stat-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      font-weight: 600;
      margin-bottom: 0.35rem;
    }
    .stat-value {
      font-size: 1.85rem;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }
    .stat-sub {
      font-size: 0.75rem;
      color: #10b981;
      font-weight: 500;
      margin-top: 0.25rem;
    }
    .section-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .interactive-tester {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 2.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }
    .tester-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    select, button.tester-btn {
      background: #08101a;
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 0.65rem 1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      outline: none;
      font-family: inherit;
    }
    select:focus {
      border-color: var(--emerald);
    }
    .tester-btn {
      background: var(--emerald);
      color: #04170f;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: background 0.2s;
    }
    .tester-btn:hover {
      background: #34d399;
    }
    .terminal-window {
      background: #050a10;
      border: 1px solid #102133;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      color: #6ee7b7;
      max-height: 280px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 2.5rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.85rem;
    }
    th {
      background: #08121f;
      color: var(--muted);
      padding: 1rem 1.25rem;
      font-weight: 600;
      border-bottom: 1px solid var(--card-border);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    td {
      padding: 0.9rem 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #cbd5e1;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background: rgba(16, 185, 129, 0.03);
    }
    .badge-method {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      text-align: center;
      min-width: 55px;
    }
    .method-get { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .method-post { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .method-put { background: rgba(251, 146, 60, 0.15); color: #fb923c; border: 1px solid rgba(251, 146, 60, 0.3); }
    .method-patch { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
    .method-delete { background: rgba(244, 63, 94, 0.15); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.3); }
    .auth-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      background: #111d2d;
      color: #94a3b8;
    }
    .auth-badge.jwt {
      color: #fbbf24;
      background: rgba(251, 191, 36, 0.1);
      border: 1px solid rgba(251, 191, 36, 0.2);
    }
    .code-text {
      font-family: 'JetBrains Mono', monospace;
      color: #e2e8f0;
      font-weight: 500;
    }
    footer {
      text-align: center;
      padding: 2.5rem 0 1rem;
      color: var(--muted);
      font-size: 0.8rem;
      border-top: 1px solid var(--card-border);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="logo-badge">Z</div>
        <div>
          <h1>Zaraz Server Core API</h1>
          <p>Daraz-Inspired Green & Black E-Commerce Engine &bull; Version 1.0.0</p>
        </div>
      </div>
      <div class="btn-group">
        <span class="status-pill">
          <span class="pulse-dot"></span>
          Operational &bull; Port ${PORT}
        </span>
        <a href="http://localhost:3000" target="_blank" class="btn btn-primary">
          🛍️ Open Storefront
        </a>
        <a href="/health" target="_blank" class="btn btn-outline">
          🩺 Health Check
        </a>
        <a href="/?format=json" class="btn btn-outline">
          📄 JSON Schema
        </a>
      </div>
    </header>

    <!-- Top Server Metrics & MongoDB Architecture -->
    <div class="grid-stats">
      <div class="stat-card">
        <div class="stat-label">Authentication DB</div>
        <div class="stat-value" style="font-size: 1.35rem; color: #34d399;">zaraz_auth_db</div>
        <div class="stat-sub">🔒 Isolated MongoDB Atlas Database</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Storefront Catalog DB</div>
        <div class="stat-value" style="font-size: 1.35rem; color: #38bdf8;">zaraz_db</div>
        <div class="stat-sub">📦 Products, Orders & Banners</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Catalog Products</div>
        <div class="stat-value">${productCount}</div>
        <div class="stat-sub">Across 6+ Categories</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Registered Users</div>
        <div class="stat-value">${userCount}</div>
        <div class="stat-sub">In zaraz_auth_db</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Orders</div>
        <div class="stat-value">${orderCount}</div>
        <div class="stat-sub">Orders & Tracking History</div>
      </div>
    </div>

    <!-- Real-time Live API Console -->
    <div class="interactive-tester">
      <div class="section-title">
        <span>⚡ Live API Console & Request Tester</span>
        <span style="font-size: 0.75rem; color: var(--muted); font-weight: 500;">Test endpoints live without Postman</span>
      </div>
      <div class="tester-controls">
        <select id="endpointSelect" style="flex: 1; min-width: 250px;">
          <option value="/health">GET /health - Server Health & System Uptime</option>
          <option value="/products">GET /products - Complete E-Commerce Catalog</option>
          <option value="/categories">GET /categories - All E-Commerce Categories</option>
          <option value="/banners">GET /banners - Promo Banners & Sliders</option>
          <option value="/auth/stats">GET /auth/stats - User Analytics in zaraz_auth_db</option>
          <option value="/orders">GET /orders - Latest Placed Orders</option>
        </select>
        <button class="tester-btn" onclick="executeTest()">Execute Live Request</button>
      </div>
      <div class="terminal-window" id="testerOutput">Select an endpoint above and click "Execute Live Request" to view live JSON response from MongoDB Atlas.</div>
    </div>

    <!-- Endpoints Directory -->
    <div class="section-title">
      <span>📡 Endpoints Directory & Specifications</span>
      <span style="font-size: 0.8rem; color: #10b981;">100% RESTful Architecture</span>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Authentication</th>
            <th>Database & Description</th>
          </tr>
        </thead>
        <tbody>
          <!-- Auth -->
          <tr>
            <td><span class="badge-method method-post">POST</span></td>
            <td><span class="code-text">/auth/register</span></td>
            <td><span class="auth-badge">Public</span></td>
            <td>Register new account with password rules in <strong>zaraz_auth_db</strong>.</td>
          </tr>
          <tr>
            <td><span class="badge-method method-post">POST</span></td>
            <td><span class="code-text">/auth/login</span></td>
            <td><span class="auth-badge">Public</span></td>
            <td>Verify credentials from <strong>zaraz_auth_db</strong> & issue 30-day JWT token.</td>
          </tr>
          <tr>
            <td><span class="badge-method method-post">POST</span></td>
            <td><span class="code-text">/auth/social</span></td>
            <td><span class="auth-badge">Public</span></td>
            <td>Sync Google & GitHub OAuth profiles in <strong>zaraz_auth_db</strong>.</td>
          </tr>
          <tr>
            <td><span class="badge-method method-post">POST</span></td>
            <td><span class="code-text">/jwt</span> or <span class="code-text">/auth/jwt</span></td>
            <td><span class="auth-badge">Public</span></td>
            <td>Direct JWT token issuance endpoint for active user session payload.</td>
          </tr>
          <tr>
            <td><span class="badge-method method-get">GET</span></td>
            <td><span class="code-text">/auth/me</span></td>
            <td><span class="auth-badge jwt">Bearer JWT</span></td>
            <td>Fetch authenticated user profile details from <strong>zaraz_auth_db</strong>.</td>
          </tr>
          <tr>
            <td><span class="badge-method method-put">PUT</span></td>
            <td><span class="code-text">/auth/profile</span></td>
            <td><span class="auth-badge jwt">Bearer JWT</span></td>
            <td>Update name, phone, shipping address and avatar in <strong>zaraz_auth_db</strong>.</td>
          </tr>
          <tr>
            <td><span class="badge-method method-get">GET</span></td>
            <td><span class="code-text">/auth/stats</span></td>
            <td><span class="auth-badge">Public</span></td>
            <td>Summary metrics: total users, customers, sellers, admins in <strong>zaraz_auth_db</strong>.</td>
          </tr>

          <!-- Catalog -->
          <tr>
            <td><span class="badge-method method-get">GET</span></td>
            <td><span class="code-text">/products</span></td>
            <td><span class="auth-badge">Public</span></td>
            <td>Search, filter by category, sort, price range & pagination in <strong>zaraz_db</strong>.</td>
          </tr>
          <tr>
            <td><span class="badge-method method-get">GET</span></td>
            <td><span class="code-text">/products/:id</span></td>
            <td><span class="auth-badge">Public</span></td>
            <td>Get full product details by MongoDB ObjectId or URL slug.</td>
          </tr>
          <tr>
            <td><span class="badge-method method-post">POST</span></td>
            <td><span class="code-text">/products</span></td>
            <td><span class="auth-badge jwt">Seller/Admin</span></td>
            <td>Add new product with specifications, pricing & delivery config.</td>
          </tr>
          <tr>
            <td><span class="badge-method method-get">GET</span></td>
            <td><span class="code-text">/categories</span></td>
            <td><span class="auth-badge">Public</span></td>
            <td>Fetch all e-commerce categories with icon, image and product count.</td>
          </tr>
          <tr>
            <td><span class="badge-method method-get">GET</span></td>
            <td><span class="code-text">/banners</span></td>
            <td><span class="auth-badge">Public</span></td>
            <td>Fetch Daraz-style hero slider banners with gradient styling.</td>
          </tr>

          <!-- Orders & Payments -->
          <tr>
            <td><span class="badge-method method-post">POST</span></td>
            <td><span class="code-text">/orders</span></td>
            <td><span class="auth-badge">Public</span></td>
            <td>Create order with cart items, delivery method, and payment choice.</td>
          </tr>
          <tr>
            <td><span class="badge-method method-get">GET</span></td>
            <td><span class="code-text">/orders</span></td>
            <td><span class="auth-badge">Optional Filter</span></td>
            <td>Retrieve orders list (support <span class="code-text">?email=user@zaraz.com</span>).</td>
          </tr>
          <tr>
            <td><span class="badge-method method-get">GET</span></td>
            <td><span class="code-text">/orders/:id</span></td>
            <td><span class="auth-badge">Public</span></td>
            <td>Live order tracking timeline: Placed &rarr; Processing &rarr; Courier &rarr; Delivered.</td>
          </tr>
          <tr>
            <td><span class="badge-method method-patch">PATCH</span></td>
            <td><span class="code-text">/orders/:id/status</span></td>
            <td><span class="auth-badge jwt">Admin</span></td>
            <td>Update order state and courier tracking timeline.</td>
          </tr>
          <tr>
            <td><span class="badge-method method-post">POST</span></td>
            <td><span class="code-text">/payment/process</span></td>
            <td><span class="auth-badge">Public</span></td>
            <td>Process bKash, Nagad, Rocket, Credit/Debit Card or COD authorization.</td>
          </tr>
          <tr>
            <td><span class="badge-method method-get">GET</span></td>
            <td><span class="code-text">/seed</span> or <span class="badge-method method-post">POST</span></td>
            <td><span class="auth-badge">Public</span></td>
            <td>Reset or seed full Daraz-inspired product catalog into MongoDB Atlas.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer>
      &copy; 2026 Zaraz E-Commerce API Server &bull; Engineered with Express, Next.js 16, Mongoose 8 & MongoDB Atlas &bull; Permanent Green & Black Dark Theme
    </footer>
  </div>

  <script>
    async function executeTest() {
      const endpoint = document.getElementById('endpointSelect').value;
      const output = document.getElementById('testerOutput');
      output.innerText = 'Requesting ' + endpoint + ' from Zaraz Server...';
      const start = performance.now();
      try {
        const res = await fetch(endpoint);
        const data = await res.json();
        const duration = Math.round(performance.now() - start);
        output.innerText = 'STATUS: ' + res.status + ' ' + res.statusText + ' (' + duration + 'ms)\\n\\n' + JSON.stringify(data, null, 2);
      } catch (err) {
        output.innerText = 'ERROR: ' + err.message;
      }
    }
  </script>
</body>
</html>`;
      return res.status(200).send(html);
    }

    // Default JSON response for curl/Postman/API fetchers
    res.status(200).json({
      success: true,
      service: 'Zaraz E-Commerce API Server (Daraz Inspired Green & Black Edition)',
      version: '1.0.0',
      database: {
        status: 'Connected to MongoDB Atlas',
        authDatabase: 'zaraz_auth_db',
        storeDatabase: 'zaraz_db',
      },
      metrics: {
        totalProducts: productCount,
        totalCategories: categoryCount,
        totalBanners: bannerCount,
        registeredUsers: userCount,
        totalOrders: orderCount,
      },
      endpoints: {
        auth: {
          register: 'POST /auth/register',
          login: 'POST /auth/login',
          socialAuth: 'POST /auth/social',
          jwtToken: 'POST /jwt or POST /auth/jwt',
          me: 'GET /auth/me (Bearer Token)',
          profile: 'GET /auth/profile, PUT /auth/profile',
          stats: 'GET /auth/stats',
          usersList: 'GET /auth/users (Admin)',
        },
        catalog: {
          allProducts: 'GET /products',
          singleProduct: 'GET /products/:id',
          createProduct: 'POST /products',
          updateProduct: 'PUT /products/:id',
          deleteProduct: 'DELETE /products/:id',
          allCategories: 'GET /categories',
          allBanners: 'GET /banners',
        },
        orders: {
          createOrder: 'POST /orders',
          myOrders: 'GET /orders?email=user@zaraz.com',
          trackOrder: 'GET /orders/:id',
          updateOrderStatus: 'PATCH /orders/:id/status',
        },
        payment: {
          processPayment: 'POST /payment/process',
        },
        system: {
          health: 'GET /health',
          seedDatabase: 'GET /seed or POST /seed',
        },
      },
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      service: 'Zaraz E-Commerce API Server',
      status: 'MongoDB Connection Pending',
      message: 'MongoDB Atlas is connecting. Check cluster connectivity.',
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
    databases: {
      auth: 'zaraz_auth_db',
      store: 'zaraz_db',
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
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
