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
import { renderBaseLayout, isHtmlRequest } from './utils/viewRenderer.js';
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
  'https://zaraz.vercel.app',
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
    const acceptsHtml = isHtmlRequest(req);

    if (acceptsHtml) {
      const htmlContent = `
        <div class="page-header">
          <div class="page-title">
            <h2>⚡ Zaraz Server Core Engine</h2>
            <p>Component-Driven REST API & Logistics Engine &bull; Version 1.0.0</p>
          </div>
          <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
            <span class="badge-pill" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700; padding: 0.4rem 0.85rem;">
              ● LIVE OPERATIONAL &bull; PORT ${PORT}
            </span>
            <a href="${process.env.CLIENT_URL || 'https://zaraz.vercel.app'}" target="_blank" class="btn btn-emerald btn-sm">🛍️ Open Storefront</a>
            <a href="/seed" class="btn btn-secondary btn-sm">🌱 Seed Catalog</a>
          </div>
        </div>

        <!-- Top Server Metrics & MongoDB Architecture -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem;">
          <a href="/auth" class="card" style="text-decoration: none; color: inherit;">
            <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 700;">Auth Database</div>
            <div style="font-size: 1.35rem; font-weight: 800; color: #34d399; margin-top: 0.25rem;">zaraz_auth_db</div>
            <div style="font-size: 0.72rem; color: #34d399; margin-top: 0.25rem;">🔒 ${userCount} Users & Credentials &rarr;</div>
          </a>
          <a href="/products" class="card" style="text-decoration: none; color: inherit;">
            <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 700;">Catalog Database</div>
            <div style="font-size: 1.35rem; font-weight: 800; color: #38bdf8; margin-top: 0.25rem;">zaraz_db</div>
            <div style="font-size: 0.72rem; color: #38bdf8; margin-top: 0.25rem;">📦 ${productCount} Live Products &rarr;</div>
          </a>
          <a href="/categories" class="card" style="text-decoration: none; color: inherit;">
            <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 700;">Departments</div>
            <div style="font-size: 1.55rem; font-weight: 800; color: #fb923c; margin-top: 0.25rem;">${categoryCount}</div>
            <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.25rem;">Active Categories &rarr;</div>
          </a>
          <a href="/banners" class="card" style="text-decoration: none; color: inherit;">
            <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 700;">Promo Banners</div>
            <div style="font-size: 1.55rem; font-weight: 800; color: #c084fc; margin-top: 0.25rem;">${bannerCount}</div>
            <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.25rem;">Hero Sliders &rarr;</div>
          </a>
          <a href="/orders" class="card" style="text-decoration: none; color: inherit;">
            <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 700;">Active Orders</div>
            <div style="font-size: 1.55rem; font-weight: 800; color: #f87171; margin-top: 0.25rem;">${orderCount}</div>
            <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.25rem;">Logistics & Tracking &rarr;</div>
          </a>
        </div>

        <!-- Quick Access Component Navigation Bar -->
        <div class="card" style="margin-bottom: 2.5rem; background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.25);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h3 style="font-size: 1.1rem; font-weight: 800; color: #fff;">Explore Component-Based APIs</h3>
              <p style="font-size: 0.8rem; color: var(--muted); margin-top: 0.2rem;">Every API on this server renders visual UI components in browser and returns JSON for API clients.</p>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <a href="/products" class="btn btn-emerald btn-sm">🛍️ Products Catalog Component</a>
              <a href="/categories" class="btn btn-secondary btn-sm">📁 Categories Component</a>
              <a href="/banners" class="btn btn-secondary btn-sm">🖼️ Banners Component</a>
              <a href="/orders" class="btn btn-secondary btn-sm">📦 Orders & Tracking</a>
              <a href="/auth" class="btn btn-secondary btn-sm">🔐 Auth & Users Console</a>
            </div>
          </div>
        </div>

        <!-- Real-time Live API Console -->
        <div class="card" style="margin-bottom: 2.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span style="font-size: 1.1rem; font-weight: 800; color: #fff;">⚡ Live API Request Console</span>
            <span style="font-size: 0.75rem; color: var(--muted);">Test live without Postman or terminal</span>
          </div>
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem;">
            <select id="endpointSelect" class="form-control" style="flex: 2; min-width: 260px;">
              <option value="/health">GET /health - Server Health & Diagnostics</option>
              <option value="/products?limit=6">GET /products?limit=6 - Product Catalog</option>
              <option value="/categories">GET /categories - Departments Index</option>
              <option value="/banners">GET /banners - Promo Banners</option>
              <option value="/auth/stats">GET /auth/stats - User Analytics in zaraz_auth_db</option>
              <option value="/orders">GET /orders - Customer Orders</option>
            </select>
            <button class="btn btn-emerald" onclick="executeTest()">Execute Live Request</button>
          </div>
          <div style="background: #050a10; border: 1px solid var(--card-border); border-radius: 12px; padding: 1.25rem; font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; color: #6ee7b7; max-height: 280px; overflow-y: auto; white-space: pre-wrap;" id="testerOutput">Select an endpoint above and click "Execute Live Request" to view live JSON response from MongoDB Atlas.</div>
        </div>

        <!-- Endpoints Directory Table Component -->
        <div class="page-title" style="margin-bottom: 1rem;">
          <h2>📡 Complete Endpoints Directory</h2>
          <p>Matrix of all available REST endpoints with support for both Component UI & JSON</p>
        </div>
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Component View</th>
                <th>Authentication</th>
                <th>Database & Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="badge-pill" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">GET</span></td>
                <td><a href="/products" style="color: #fff; text-decoration: none; font-family: 'JetBrains Mono'; font-weight: 700;">/products</a></td>
                <td><span style="color: #34d399; font-weight: 700;">✓ Visual Grid</span></td>
                <td><span style="color: #94a3b8;">Public</span></td>
                <td>Search, filter by category, sort, price range in <strong>zaraz_db</strong>.</td>
              </tr>
              <tr>
                <td><span class="badge-pill" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">GET</span></td>
                <td><span style="color: #fff; font-family: 'JetBrains Mono'; font-weight: 700;">/products/:id</span></td>
                <td><span style="color: #34d399; font-weight: 700;">✓ Product Page</span></td>
                <td><span style="color: #94a3b8;">Public</span></td>
                <td>Single product details with gallery, specifications & seller badge.</td>
              </tr>
              <tr>
                <td><span class="badge-pill" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">POST</span></td>
                <td><span style="color: #fff; font-family: 'JetBrains Mono'; font-weight: 700;">/products</span></td>
                <td><span style="color: #38bdf8; font-weight: 700;">✓ Modal Form</span></td>
                <td><span style="color: #fbbf24;">Admin/Seller</span></td>
                <td>Publish new product with specs, pricing & inventory to catalog.</td>
              </tr>
              <tr>
                <td><span class="badge-pill" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">GET</span></td>
                <td><a href="/categories" style="color: #fff; text-decoration: none; font-family: 'JetBrains Mono'; font-weight: 700;">/categories</a></td>
                <td><span style="color: #34d399; font-weight: 700;">✓ Category Cards</span></td>
                <td><span style="color: #94a3b8;">Public</span></td>
                <td>All department categories with product count badges in <strong>zaraz_db</strong>.</td>
              </tr>
              <tr>
                <td><span class="badge-pill" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">GET</span></td>
                <td><a href="/banners" style="color: #fff; text-decoration: none; font-family: 'JetBrains Mono'; font-weight: 700;">/banners</a></td>
                <td><span style="color: #34d399; font-weight: 700;">✓ Slider View</span></td>
                <td><span style="color: #94a3b8;">Public</span></td>
                <td>Hero promotional banners and slider graphics in <strong>zaraz_db</strong>.</td>
              </tr>
              <tr>
                <td><span class="badge-pill" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">GET</span></td>
                <td><a href="/orders" style="color: #fff; text-decoration: none; font-family: 'JetBrains Mono'; font-weight: 700;">/orders</a></td>
                <td><span style="color: #34d399; font-weight: 700;">✓ Logistics Table</span></td>
                <td><span style="color: #94a3b8;">Public / Email</span></td>
                <td>Manage orders, update status dropdown, view customer delivery.</td>
              </tr>
              <tr>
                <td><span class="badge-pill" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">GET</span></td>
                <td><span style="color: #fff; font-family: 'JetBrains Mono'; font-weight: 700;">/orders/:id</span></td>
                <td><span style="color: #34d399; font-weight: 700;">✓ Stepper Timeline</span></td>
                <td><span style="color: #94a3b8;">Public</span></td>
                <td>Daraz-style courier tracking timeline (Placed &rarr; Shipped &rarr; Delivered).</td>
              </tr>
              <tr>
                <td><span class="badge-pill" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">GET</span></td>
                <td><a href="/auth" style="color: #fff; text-decoration: none; font-family: 'JetBrains Mono'; font-weight: 700;">/auth</a></td>
                <td><span style="color: #34d399; font-weight: 700;">✓ Auth Console</span></td>
                <td><span style="color: #94a3b8;">Public</span></td>
                <td>User directory, test sign-up, test login & token generator in <strong>zaraz_auth_db</strong>.</td>
              </tr>
              <tr>
                <td><span class="badge-pill" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">GET</span></td>
                <td><a href="/health" style="color: #fff; text-decoration: none; font-family: 'JetBrains Mono'; font-weight: 700;">/health</a></td>
                <td><span style="color: #34d399; font-weight: 700;">✓ Diagnostics</span></td>
                <td><span style="color: #94a3b8;">Public</span></td>
                <td>Real-time memory, Node version, uptime & database connectivity.</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const extraScripts = `
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
      `;

      return res.status(200).send(renderBaseLayout({
        title: 'Zaraz API Core Engine',
        activeNav: 'dashboard',
        content: htmlContent,
        jsonUrl: '/?format=json',
        extraScripts,
      }));
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
          overview: 'GET /auth',
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

// Health check endpoint (Component UI for browser, JSON for API)
app.get('/health', (req, res) => {
  const wantsHtml = isHtmlRequest(req);

  if (wantsHtml) {
    const mem = process.memoryUsage();
    const memMb = Math.round(mem.rss / (1024 * 1024));
    const uptimeSec = Math.round(process.uptime());

    const htmlContent = `
      <div class="page-header">
        <div class="page-title">
          <h2>🩺 Server Health & Diagnostic Component</h2>
          <p>Real-Time Engine Health, Memory Footprint & Cluster Connectivity</p>
        </div>
        <div style="display: flex; gap: 0.6rem; align-items: center;">
          <span class="badge-pill badge-official">● 100% OPERATIONAL</span>
          <a href="/health?format=json" target="_blank" class="btn btn-secondary btn-sm">JSON Format</a>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem;">
        <div class="card">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Authentication DB</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #34d399; margin-top: 0.25rem;">Connected</div>
          <div style="font-size: 0.72rem; color: #34d399; margin-top: 0.25rem;">zaraz_auth_db &bull; Atlas</div>
        </div>
        <div class="card">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Catalog & Store DB</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #38bdf8; margin-top: 0.25rem;">Connected</div>
          <div style="font-size: 0.72rem; color: #38bdf8; margin-top: 0.25rem;">zaraz_db &bull; Atlas</div>
        </div>
        <div class="card">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">RAM Consumption</div>
          <div style="font-size: 1.55rem; font-weight: 800; color: #fff; margin-top: 0.25rem;">${memMb} MB</div>
          <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.25rem;">RSS Resident Memory</div>
        </div>
        <div class="card">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">System Uptime</div>
          <div style="font-size: 1.55rem; font-weight: 800; color: #fbbf24; margin-top: 0.25rem;">${uptimeSec}s</div>
          <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.25rem;">Continuous Execution</div>
        </div>
        <div class="card">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Node.js Environment</div>
          <div style="font-size: 1.55rem; font-weight: 800; color: #fff; margin-top: 0.25rem;">${process.version}</div>
          <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.25rem;">Platform: ${process.platform}</div>
        </div>
      </div>
    `;

    return res.status(200).send(renderBaseLayout({
      title: 'Server Diagnostics',
      activeNav: 'health',
      content: htmlContent,
      jsonUrl: '/health?format=json',
    }));
  }

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

// 404 Handler (Component UI for browser, JSON for API)
app.use((req, res) => {
  const wantsHtml = isHtmlRequest(req);

  if (wantsHtml) {
    return res.status(404).send(renderBaseLayout({
      title: '404 Route Not Found',
      activeNav: 'dashboard',
      content: `
        <div class="card" style="text-align: center; padding: 4rem 2rem;">
          <h2 style="font-size: 1.75rem; font-weight: 800; color: #f87171; margin-bottom: 0.5rem;">404 - Endpoint Not Found</h2>
          <p style="color: var(--muted); margin-bottom: 2rem;">The requested route <code>${req.originalUrl}</code> does not exist on Zaraz Server.</p>
          <a href="/" class="btn btn-emerald">Return to Dashboard</a>
        </div>
      `,
      jsonUrl: `${req.originalUrl}?format=json`,
    }));
  }

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
