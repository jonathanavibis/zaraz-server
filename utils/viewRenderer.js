/**
 * Zaraz Server Component View Engine
 * Renders high-performance, responsive Green & Black UI components for browser navigation
 * while preserving JSON output for API clients.
 */

export const renderBaseLayout = ({
  title = 'Zaraz E-Commerce Component API',
  activeNav = 'dashboard',
  content = '',
  jsonUrl = '?format=json',
  extraHead = '',
  extraScripts = '',
}) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} • Zaraz Core</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #070c14;
      --card-bg: #0c1524;
      --card-hover: #101c2e;
      --card-border: #13273c;
      --emerald: #10b981;
      --emerald-dark: #059669;
      --emerald-light: #34d399;
      --emerald-glow: rgba(16, 185, 129, 0.25);
      --text: #e2e8f0;
      --muted: #94a3b8;
      --danger: #ef4444;
      --warning: #f59e0b;
      --info: #38bdf8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      line-height: 1.5;
      background-image: 
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.12), transparent),
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 40px 40px, 40px 40px;
    }
    .container { max-width: 1260px; margin: 0 auto; padding: 1.5rem; }
    
    /* Top Navbar */
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.85rem 1.25rem;
      background: rgba(12, 21, 36, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      margin-bottom: 2rem;
      position: sticky;
      top: 1rem;
      z-index: 50;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: inherit;
    }
    .logo-badge {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #10b981, #047857);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.35rem;
      color: #04130d;
      box-shadow: 0 0 20px var(--emerald-glow);
    }
    .brand-title {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #fff;
    }
    .brand-tag {
      font-size: 0.65rem;
      background: rgba(16, 185, 129, 0.15);
      color: var(--emerald-light);
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
      border: 1px solid rgba(16, 185, 129, 0.3);
      font-weight: 700;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .nav-link {
      padding: 0.45rem 0.85rem;
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 600;
      text-decoration: none;
      color: var(--muted);
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .nav-link:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.05);
    }
    .nav-link.active {
      color: #fff;
      background: rgba(16, 185, 129, 0.18);
      border: 1px solid rgba(16, 185, 129, 0.35);
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    
    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.5rem 1rem;
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      font-family: inherit;
    }
    .btn-emerald {
      background: #10b981;
      color: #04170f;
      border: 1px solid #10b981;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25);
    }
    .btn-emerald:hover {
      background: #34d399;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #0f1c2d;
      color: #e2e8f0;
      border: 1px solid var(--card-border);
    }
    .btn-secondary:hover {
      background: #16263b;
      border-color: #10b981;
      color: #fff;
    }
    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .btn-danger:hover {
      background: #ef4444;
      color: #fff;
    }
    .btn-sm { padding: 0.35rem 0.7rem; font-size: 0.75rem; border-radius: 8px; }

    /* Page Header */
    .page-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .page-title h2 {
      font-size: 1.65rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .page-title p {
      font-size: 0.85rem;
      color: var(--muted);
      margin-top: 0.2rem;
    }
    .badge-api {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      background: #050a10;
      border: 1px solid var(--card-border);
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      color: var(--emerald-light);
    }

    /* Cards & Grids */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.5rem;
      transition: all 0.2s ease;
    }
    .card:hover {
      border-color: rgba(16, 185, 129, 0.35);
    }
    
    /* Product Grid & Cards */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.35rem;
      margin-bottom: 2.5rem;
    }
    .product-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }
    .product-card:hover {
      transform: translateY(-4px);
      border-color: rgba(16, 185, 129, 0.45);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    }
    .product-img-wrap {
      width: 100%;
      height: 200px;
      background: #050a10;
      position: relative;
      overflow: hidden;
    }
    .product-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .product-card:hover .product-img {
      transform: scale(1.04);
    }
    .product-badge-corner {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 2;
    }
    .badge-pill {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      backdrop-filter: blur(8px);
    }
    .badge-flash {
      background: rgba(239, 68, 68, 0.9);
      color: #fff;
    }
    .badge-official {
      background: rgba(16, 185, 129, 0.9);
      color: #04170f;
    }
    .badge-free-del {
      background: rgba(56, 189, 248, 0.9);
      color: #04170f;
    }
    .product-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .product-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.72rem;
      color: var(--muted);
      margin-bottom: 0.4rem;
    }
    .product-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      line-height: 1.35;
      margin-bottom: 0.6rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-decoration: none;
    }
    .product-title:hover {
      color: var(--emerald-light);
    }
    .price-wrap {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
      margin-bottom: 0.75rem;
    }
    .current-price {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--emerald-light);
    }
    .orig-price {
      font-size: 0.8rem;
      color: #64748b;
      text-decoration: line-through;
    }
    .discount-pill {
      font-size: 0.7rem;
      color: #f87171;
      font-weight: 700;
      background: rgba(239, 68, 68, 0.1);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    .product-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding-top: 0.85rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      margin-top: auto;
    }
    .rating-wrap {
      font-size: 0.75rem;
      color: #fbbf24;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    /* Table styling */
    .table-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 2rem;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
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
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(16, 185, 129, 0.03); }

    /* Modal */
    .modal-backdrop {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 100;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .modal-backdrop.open { display: flex; }
    .modal-box {
      background: #0c1626;
      border: 1px solid var(--card-border);
      border-radius: 20px;
      width: 100%;
      max-width: 650px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 2rem;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      position: relative;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--card-border);
    }
    .modal-header h3 { font-size: 1.25rem; font-weight: 800; color: #fff; }
    .close-btn {
      background: none; border: none; color: var(--muted); font-size: 1.4rem; cursor: pointer;
    }
    .close-btn:hover { color: #fff; }

    /* Forms */
    .form-group { margin-bottom: 1rem; }
    .form-group label {
      display: block; font-size: 0.75rem; font-weight: 700; color: var(--muted); margin-bottom: 0.35rem; text-transform: uppercase;
    }
    .form-control {
      width: 100%;
      background: #070e17;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 0.65rem 0.9rem;
      color: #fff;
      font-size: 0.85rem;
      outline: none;
      font-family: inherit;
    }
    .form-control:focus { border-color: var(--emerald); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    /* Toasts */
    #toastContainer {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 200;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .toast {
      padding: 0.85rem 1.25rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .toast-success { background: #064e3b; color: #a7f3d0; border: 1px solid #059669; }
    .toast-error { background: #7f1d1d; color: #fecaca; border: 1px solid #dc2626; }

    /* Footer */
    footer {
      text-align: center;
      padding: 2.5rem 0 1rem;
      color: var(--muted);
      font-size: 0.8rem;
      border-top: 1px solid var(--card-border);
      margin-top: 3rem;
    }

    ${extraHead}
  </style>
</head>
<body>
  <div class="container">
    <!-- Navbar -->
    <nav class="navbar">
      <a href="/" class="brand">
        <div class="logo-badge">Z</div>
        <div>
          <div class="brand-title">Zaraz API Core</div>
        </div>
        <span class="brand-tag">Component View</span>
      </a>

      <div class="nav-links">
        <a href="/" class="nav-link ${activeNav === 'dashboard' ? 'active' : ''}">⚡ Dashboard</a>
        <a href="/products" class="nav-link ${activeNav === 'products' ? 'active' : ''}">🛍️ Products</a>
        <a href="/categories" class="nav-link ${activeNav === 'categories' ? 'active' : ''}">📁 Categories</a>
        <a href="/banners" class="nav-link ${activeNav === 'banners' ? 'active' : ''}">🖼️ Banners</a>
        <a href="/orders" class="nav-link ${activeNav === 'orders' ? 'active' : ''}">📦 Orders</a>
        <a href="/auth" class="nav-link ${activeNav === 'auth' ? 'active' : ''}">🔐 Auth & Users</a>
        <a href="/health" class="nav-link ${activeNav === 'health' ? 'active' : ''}">🩺 Health</a>
      </div>

      <div class="nav-actions">
        <a href="${jsonUrl}" class="btn btn-secondary btn-sm" title="Switch to raw JSON API output">
          📄 Raw JSON
        </a>
        <a href="http://localhost:3000" target="_blank" class="btn btn-emerald btn-sm">
          🛍️ Storefront
        </a>
      </div>
    </nav>

    <!-- Main Content -->
    ${content}

    <!-- Toast Container -->
    <div id="toastContainer"></div>

    <!-- Footer -->
    <footer>
      &copy; 2026 Zaraz E-Commerce Component Engine &bull; Express, Mongoose 8 & MongoDB Atlas &bull; Permanent Green & Black Theme &bull; <a href="${jsonUrl}" style="color: var(--emerald-light); text-decoration: none;">View JSON Format</a>
    </footer>
  </div>

  <script>
    function showToast(message, type = 'success') {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      toast.className = 'toast ' + (type === 'success' ? 'toast-success' : 'toast-error');
      toast.innerHTML = (type === 'success' ? '✓ ' : '✕ ') + message;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }

    function openModal(id) {
      const modal = document.getElementById(id);
      if (modal) modal.classList.add('open');
    }

    function closeModal(id) {
      const modal = document.getElementById(id);
      if (modal) modal.classList.remove('open');
    }
  </script>
  ${extraScripts}
</body>
</html>`;
};
