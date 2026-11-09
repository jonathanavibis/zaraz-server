/**
 * Zaraz Server Dashboard & Component View Engine
 * Styled strictly matching the Zaraz E-Commerce Website Theme:
 * Deep Matte Obsidian (#090d16), Deep Emerald (#041d13), Vibrant Emerald Green (#10b981, #34d399)
 * Clean Dribbble-inspired server layout with 100% REAL, actionable Zaraz services.
 */

export const isHtmlRequest = (req) => {
  if (req.query.format === 'json') return false;
  if (req.query.format === 'html' || req.query.format === 'component') return true;

  const accept = req.headers.accept || '';
  if (accept.includes('application/json')) return false;

  const secFetchDest = req.headers['sec-fetch-dest'];
  if (secFetchDest === 'document') return true;

  return accept.includes('text/html') && !req.xhr;
};

export const renderBaseLayout = ({
  title = 'Zaraz Dashboard',
  activeNav = 'dashboard',
  content = '',
  jsonUrl = '?format=json',
  extraHead = '',
  extraScripts = '',
}) => {
  const isDashboard = activeNav === 'dashboard';

  return `<!DOCTYPE html>
<html lang="en" data-theme="emerald">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} • Zaraz Core Server</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* ==========================================================================
       ZARAZ WEBSITE-MATCHED THEME (Green & Matte Black)
       ========================================================================== */
    :root, [data-theme="emerald"] {
      --bg-main: #090d16;            /* Matches Website body */
      --bg-header: #041d13;          /* Matches Website topbar */
      --bg-sidebar: #060a12;         /* Pitch Obsidian */
      --bg-card: #0c1524;            /* Matches Website card */
      --bg-card-hover: #101c2e;
      --border-card: #13273c;        /* Matches Website border */
      --border-card-hover: rgba(16, 185, 129, 0.45);
      
      --emerald: #10b981;            /* Website Primary Green */
      --emerald-dark: #047857;
      --emerald-light: #34d399;       /* Website Accent Mint */
      --emerald-glow: rgba(16, 185, 129, 0.25);
      
      --text-heading: #ffffff;
      --text-body: #e2e8f0;
      --text-muted: #94a3b8;
      --muted: #94a3b8;
      --text-subtle: #64748b;
      
      --accent-orange: #fbbf24;      /* Website Daraz Flash Accent */
      --accent-danger: #f87171;
      --accent-blue: #38bdf8;
      
      --code-bg: #050a10;
      --code-text: #6ee7b7;
    }

    [data-theme="midnight"] {
      --bg-main: #04070d;
      --bg-header: #03150d;
      --bg-sidebar: #020509;
      --bg-card: #080f1a;
      --bg-card-hover: #0d1726;
      --border-card: #102133;
      --border-card-hover: rgba(52, 211, 153, 0.5);
      
      --emerald: #059669;
      --emerald-dark: #024e37;
      --emerald-light: #10b981;
      --emerald-glow: rgba(5, 150, 105, 0.3);
      
      --text-heading: #f8fafc;
      --text-body: #cbd5e1;
      --text-muted: #94a3b8;
      --text-subtle: #475569;
      
      --accent-orange: #f59e0b;
      --accent-danger: #ef4444;
      --accent-blue: #0ea5e9;
      
      --code-bg: #020408;
      --code-text: #34d399;
    }

    /* Base Reset */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { min-height: 100%; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: var(--bg-main);
      color: var(--text-body);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      display: flex;
      flex-direction: column;
      background-image: 
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16, 185, 129, 0.12), transparent),
        linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
      background-size: 100% 100%, 32px 32px, 32px 32px;
    }

    /* Top Window Frame */
    .app-topbar {
      background: var(--bg-header);
      border-bottom: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.6rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      z-index: 100;
    }
    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: #fff;
    }
    .brand-logo-pill {
      background: linear-gradient(135deg, #10b981, #047857);
      color: #04170f;
      font-weight: 900;
      font-size: 0.95rem;
      width: 32px;
      height: 32px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 14px var(--emerald-glow);
    }
    .brand-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .brand-badge {
      font-size: 0.68rem;
      font-weight: 700;
      background: rgba(16, 185, 129, 0.18);
      color: var(--emerald-light);
      padding: 0.15rem 0.55rem;
      border-radius: 9999px;
      border: 1px solid rgba(16, 185, 129, 0.35);
    }

    .topbar-center-url {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 8px;
      padding: 0.3rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: #cbd5e1;
    }
    .topbar-center-url span.locked { color: #10b981; }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.45rem 0.95rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      font-family: inherit;
    }
    .btn-emerald {
      background: var(--emerald);
      color: #04170f;
      font-weight: 800;
      box-shadow: 0 4px 15px var(--emerald-glow);
    }
    .btn-emerald:hover {
      background: var(--emerald-light);
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      color: var(--text-body);
    }
    .btn-secondary:hover {
      border-color: var(--emerald);
      color: #fff;
    }
    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #f87171;
    }
    .btn-danger:hover {
      background: #ef4444;
      color: #ffffff;
      transform: translateY(-1px);
    }
    .btn-sm {
      padding: 0.3rem 0.7rem;
      font-size: 0.75rem;
    }

    /* Tabs */
    .tab-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0.4rem 0.85rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .tab-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.04);
    }
    .tab-btn.active {
      background: var(--bg-card);
      color: var(--emerald-light);
      border-color: var(--emerald);
      box-shadow: 0 2px 10px rgba(0,0,0,0.4), 0 0 10px var(--emerald-glow);
    }

    /* Main App Layout */
    .app-shell {
      display: flex;
      flex: 1;
      width: 100%;
      min-height: calc(100vh - 50px);
    }

    /* Left Sidebar */
    .sidebar {
      width: 230px;
      min-width: 230px;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-card);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.25rem 0.85rem;
      z-index: 40;
    }
    .sidebar-section-title {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-subtle);
      font-weight: 800;
      padding: 0 0.75rem 0.6rem;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
      text-decoration: none;
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--text-muted);
      transition: all 0.18s ease;
      position: relative;
    }
    .nav-item:hover {
      color: #ffffff;
      background: rgba(16, 185, 129, 0.08);
    }
    .nav-item.active {
      background: var(--emerald);
      color: #04170f;
      font-weight: 800;
      box-shadow: 0 4px 14px var(--emerald-glow);
    }
    .nav-item.active svg { stroke: #04170f; }
    .nav-badge-count {
      margin-left: auto;
      background: rgba(16, 185, 129, 0.2);
      color: var(--emerald-light);
      font-size: 0.68rem;
      font-weight: 800;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
    }
    .nav-item.active .nav-badge-count {
      background: #04170f;
      color: var(--emerald-light);
    }

    /* Sidebar Profile */
    .sidebar-profile {
      padding-top: 1rem;
      border-top: 1px solid var(--border-card);
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .profile-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #047857);
      color: #04170f;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.82rem;
      flex-shrink: 0;
    }
    .profile-name { font-size: 0.8rem; font-weight: 700; color: #fff; }
    .profile-role { font-size: 0.68rem; color: var(--emerald-light); }

    /* Main Viewport */
    .main-viewport {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow-y: auto;
    }

    /* 2-Panel Layout for Dashboard */
    .dashboard-layout {
      display: flex;
      flex: 1;
      width: 100%;
    }

    /* Middle Column: REAL Services & Data Nodes */
    .services-column {
      width: 310px;
      min-width: 310px;
      background: rgba(8, 14, 24, 0.7);
      border-right: 1px solid var(--border-card);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.25rem 1rem;
    }
    .services-header {
      font-size: 0.82rem;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .service-card {
      padding: 0.85rem 1rem;
      border-radius: 12px;
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
      margin-bottom: 0.65rem;
    }
    .service-card:hover {
      border-color: var(--emerald);
      transform: translateX(2px);
    }
    .service-card.selected {
      background: rgba(16, 185, 129, 0.14);
      border-color: var(--emerald);
      box-shadow: 0 4px 18px var(--emerald-glow);
    }
    .service-title { font-size: 0.84rem; font-weight: 800; color: #fff; }
    .service-sub { font-size: 0.7rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; margin-top: 0.15rem; }
    .service-badge {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: var(--emerald-light);
      border: 1px solid rgba(16, 185, 129, 0.3);
      text-align: right;
    }

    /* Right Telemetry Pane */
    .telemetry-pane {
      flex: 1;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      min-width: 0;
    }

    /* Cards */
    .panel-card, .card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 16px;
      padding: 1.25rem 1.4rem;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .panel-card:hover, .card:hover {
      border-color: var(--border-card-hover);
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title h2 {
      font-size: 1.35rem;
      font-weight: 800;
      color: #fff;
    }
    .page-title p {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    .badge-api {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      font-weight: 700;
      background: rgba(16, 185, 129, 0.15);
      color: var(--emerald-light);
      padding: 0.25rem 0.65rem;
      border-radius: 8px;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .product-card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;
    }
    .product-card:hover {
      border-color: var(--emerald);
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.4), 0 0 15px var(--emerald-glow);
    }
    .product-img-wrap {
      height: 200px;
      background: #050a10;
      position: relative;
      overflow: hidden;
    }
    .product-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .product-card:hover .product-img {
      transform: scale(1.05);
    }
    .product-badge-corner {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      z-index: 2;
    }
    .product-body {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .product-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .product-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #fff;
      text-decoration: none;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 0.6rem;
      line-height: 1.4;
    }
    .product-title:hover {
      color: var(--emerald-light);
    }
    .price-wrap {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .current-price {
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
    }
    .orig-price {
      font-size: 0.8rem;
      color: var(--text-subtle);
      text-decoration: line-through;
    }
    .discount-pill {
      font-size: 0.68rem;
      font-weight: 800;
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .product-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 0.6rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .rating-wrap {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #fbbf24;
    }
    .badge-flash {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .badge-official {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }
    .badge-free-del {
      background: rgba(56, 189, 248, 0.2);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.4);
    }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.85rem;
    }
    .panel-title {
      font-size: 0.9rem;
      font-weight: 800;
      color: #fff;
    }
    .panel-metric {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--emerald-light);
      font-family: 'JetBrains Mono', monospace;
    }

    /* Grids */
    .grid-3 {
      display: grid;
      grid-template-columns: 1.25fr 1fr 1fr;
      gap: 1.25rem;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.25rem;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1.1rem;
    }

    /* Sparkline SVG */
    .sparkline-svg {
      width: 100%;
      height: 75px;
      overflow: visible;
    }
    .sparkline-path {
      fill: none;
      stroke: var(--emerald);
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(0 2px 8px var(--emerald-glow));
    }
    .sparkline-fill {
      fill: rgba(16, 185, 129, 0.08);
    }

    /* Tables */
    .table-card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.84rem; }
    th {
      background: #070d17;
      color: var(--text-muted);
      padding: 0.85rem 1.2rem;
      font-weight: 700;
      border-bottom: 1px solid var(--border-card);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    td {
      padding: 0.85rem 1.2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: var(--text-body);
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(16, 185, 129, 0.04); }

    .badge-pill {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    /* Forms */
    .form-group { margin-bottom: 1rem; }
    .form-group label {
      display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.35rem; text-transform: uppercase;
    }
    .form-control {
      width: 100%;
      background: #060a12;
      border: 1px solid var(--border-card);
      border-radius: 9px;
      padding: 0.65rem 0.85rem;
      color: #fff;
      font-size: 0.85rem;
      outline: none;
      font-family: inherit;
      transition: border-color 0.2s ease;
    }
    .form-control:focus { border-color: var(--emerald); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    /* Modal */
    .modal-backdrop {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .modal-backdrop.open { display: flex; }
    .modal-box {
      background: var(--bg-card);
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 18px;
      width: 100%;
      max-width: 650px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 1.75rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px var(--emerald-glow);
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid var(--border-card);
    }
    .modal-header h3 { font-size: 1.2rem; font-weight: 800; color: #fff; }
    .close-btn { background: none; border: none; color: var(--text-muted); font-size: 1.4rem; cursor: pointer; }
    .close-btn:hover { color: #fff; }

    /* Toast */
    #toastContainer {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .toast {
      padding: 0.75rem 1.2rem;
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      animation: slideIn 0.25s ease;
    }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .toast-success { background: #041d13; color: #6ee7b7; border: 1px solid var(--emerald); }
    .toast-error { background: #450a0a; color: #fca5a5; border: 1px solid #ef4444; }

    /* Responsive */
    @media (max-width: 1080px) {
      .grid-3 { grid-template-columns: 1fr; }
      .grid-2 { grid-template-columns: 1fr; }
      .services-column { width: 270px; min-width: 270px; }
    }
    @media (max-width: 860px) {
      .dashboard-layout { flex-direction: column; }
      .services-column { width: 100%; min-width: 100%; border-right: none; border-bottom: 1px solid var(--border-card); }
      .sidebar { width: 100%; min-width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--border-card); }
      .app-shell { flex-direction: column; }
    }

    ${extraHead}
  </style>
</head>
<body>
  <!-- Topbar matching Zaraz Website -->
  <header class="app-topbar">
    <a href="/" class="topbar-brand">
      <div class="brand-logo-pill">Z</div>
      <div class="brand-title">
        <span>Zaraz Server Core</span>
        <span class="brand-badge">Green & Black Engine</span>
      </div>
    </a>

    <div class="topbar-center-url">
      <span class="locked">🔒</span>
      <span>Live Endpoint:</span>
      <strong style="color: #34d399;">https://zaraz-server30.vercel.app</strong>
    </div>

    <div class="topbar-actions">
      <button type="button" class="btn btn-emerald btn-sm" onclick="openModal('quickAddProductModal')">
        ➕ Add Product
      </button>
      <a href="${jsonUrl}" class="btn btn-secondary btn-sm" title="View Raw JSON payload">
        📄 JSON
      </a>
      <a href="${process.env.CLIENT_URL || 'https://zaraz-shopping.vercel.app'}" target="_blank" class="btn btn-emerald btn-sm" title="Open Storefront">
        🛍️ Open Storefront ↗
      </a>
    </div>
  </header>

  <!-- App Shell -->
  <div class="app-shell">
    <aside class="sidebar">
      <div>
        <div class="sidebar-section-title">Operations</div>
        <nav class="sidebar-nav">
          <a href="/" class="nav-item ${activeNav === 'dashboard' ? 'active' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
            <span>Servers & Cluster</span>
          </a>

          <a href="/products" class="nav-item ${activeNav === 'products' ? 'active' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <span>Live Catalog</span>
          </a>

          <a href="/orders" class="nav-item ${activeNav === 'orders' ? 'active' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span>Customer Orders</span>
          </a>

          <a href="/auth" class="nav-item ${activeNav === 'auth' ? 'active' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Users & Auth DB</span>
          </a>

          <a href="/categories" class="nav-item ${activeNav === 'categories' ? 'active' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>Categories</span>
          </a>

          <a href="/banners" class="nav-item ${activeNav === 'banners' ? 'active' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>Promo Banners</span>
          </a>

          <a href="/health" class="nav-item ${activeNav === 'health' ? 'active' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span>Diagnostics</span>
          </a>
        </nav>
      </div>

      <!-- Profile -->
      <div class="sidebar-profile">
        <div class="profile-avatar">ZA</div>
        <div style="flex: 1; overflow: hidden;">
          <div class="profile-name">Zaraz Admin</div>
          <div class="profile-role">● MongoDB Connected</div>
        </div>
      </div>
    </aside>

    <!-- Main Viewport -->
    <main class="main-viewport">
      ${isDashboard ? content : `
        <div style="background: var(--bg-card); border-bottom: 1px solid var(--border-card); padding: 0.85rem 1.75rem; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <a href="/" class="btn btn-secondary btn-sm">← Back to Overview</a>
            <h2 style="font-size: 1.15rem; font-weight: 800; color: #fff;">${title}</h2>
          </div>
          <a href="${jsonUrl}" class="btn btn-secondary btn-sm">📄 Raw JSON</a>
        </div>
        <div style="padding: 1.75rem; max-width: 1320px; width: 100%; margin: 0 auto;">
          ${content}
        </div>
      `}
    </main>
  </div>

  <!-- Add Product Directly to Catalog Modal -->
  <div id="quickAddProductModal" class="modal-backdrop">
    <div class="modal-box">
      <div class="modal-header">
        <h3>🛍️ Add Product to Zaraz Catalog</h3>
        <button type="button" class="close-btn" onclick="closeModal('quickAddProductModal')">&times;</button>
      </div>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.25rem;">
        Data entered here is saved directly to MongoDB Atlas <code>zaraz_db</code> and immediately updates on the live Frontend Storefront!
      </p>

      <form id="quickAddForm" onsubmit="handleQuickAddProduct(event)">
        <div class="form-group">
          <label>Product Title *</label>
          <input type="text" id="qaTitle" class="form-control" placeholder="e.g. Sony WH-1000XM5 Wireless Headphones" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Brand *</label>
            <input type="text" id="qaBrand" class="form-control" placeholder="e.g. Sony" required />
          </div>
          <div class="form-group">
            <label>Category *</label>
            <select id="qaCategory" class="form-control" required>
              <option value="Smartphones & Gadgets|smartphones-gadgets">Smartphones & Gadgets</option>
              <option value="Laptops & Computers|laptops-computers">Laptops & Computers</option>
              <option value="Audio & Headphones|audio-headphones">Audio & Headphones</option>
              <option value="Smart Watches & Fitness|smart-watches">Smart Watches & Fitness</option>
              <option value="Gaming & Consoles|gaming-consoles">Gaming & Consoles</option>
              <option value="Home & Kitchen Appliances|home-kitchen">Home & Kitchen Appliances</option>
              <option value="Men's Fashion & Wear|mens-fashion">Men's Fashion</option>
              <option value="Women's Fashion|womens-fashion">Women's Fashion</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Sale Price (৳) *</label>
            <input type="number" id="qaPrice" class="form-control" placeholder="38500" required />
          </div>
          <div class="form-group">
            <label>Original Price (৳)</label>
            <input type="number" id="qaOrigPrice" class="form-control" placeholder="45000" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Stock Quantity</label>
            <input type="number" id="qaStock" class="form-control" value="25" />
          </div>
          <div class="form-group">
            <label>Image URL</label>
            <input type="url" id="qaImage" class="form-control" placeholder="https://images.unsplash.com/..." value="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800" />
          </div>
        </div>

        <div class="form-group">
          <label>Product Description</label>
          <textarea id="qaDesc" class="form-control" rows="3" placeholder="Enter rich product specifications, warranty info and authentic guarantee details..."></textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-secondary" onclick="closeModal('quickAddProductModal')">Cancel</button>
          <button type="submit" class="btn btn-emerald" id="qaSubmitBtn">🚀 Save to MongoDB & Sync to Frontend</button>
        </div>
      </form>
    </div>
  </div>

  <div id="toastContainer"></div>

  <script>
    function openModal(id) {
      var modal = document.getElementById(id);
      if (modal) modal.classList.add('open');
    }
    function closeModal(id) {
      var modal = document.getElementById(id);
      if (modal) modal.classList.remove('open');
    }

    function showToast(message, type) {
      type = type || 'success';
      var container = document.getElementById('toastContainer');
      var toast = document.createElement('div');
      toast.className = 'toast ' + (type === 'success' ? 'toast-success' : 'toast-error');
      toast.innerHTML = (type === 'success' ? '✓ ' : '✕ ') + message;
      container.appendChild(toast);
      setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(function() { toast.remove(); }, 300);
      }, 4000);
    }

    async function handleQuickAddProduct(e) {
      e.preventDefault();
      var btn = document.getElementById('qaSubmitBtn');
      btn.disabled = true;
      btn.innerText = 'Saving to MongoDB Atlas...';

      var catParts = document.getElementById('qaCategory').value.split('|');
      var price = Number(document.getElementById('qaPrice').value);
      var orig = Number(document.getElementById('qaOrigPrice').value) || price;
      var disc = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;

      var payload = {
        title: document.getElementById('qaTitle').value,
        brand: document.getElementById('qaBrand').value,
        category: catParts[0],
        categorySlug: catParts[1],
        price: price,
        originalPrice: orig,
        discountPercentage: disc,
        stock: Number(document.getElementById('qaStock').value) || 10,
        images: [document.getElementById('qaImage').value || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
        description: document.getElementById('qaDesc').value || (document.getElementById('qaTitle').value + ' authentic product with warranty.'),
        isFlashSale: true,
        isFreeDelivery: true,
        isOfficial: true,
        seller: {
          name: 'Zaraz Core Merchant',
          rating: 4.9,
          responseRate: '100%'
        }
      };

      try {
        var res = await fetch('/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        var data = await res.json();
        if (data.success) {
          showToast('Product successfully saved to MongoDB Atlas! Frontend is now updated.');
          closeModal('quickAddProductModal');
          setTimeout(function() { window.location.reload(); }, 900);
        } else {
          showToast(data.message || 'Error saving product', 'error');
          btn.disabled = false;
          btn.innerText = '🚀 Save to MongoDB & Sync to Frontend';
        }
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerText = '🚀 Save to MongoDB & Sync to Frontend';
      }
    }
  </script>
  ${extraScripts}
</body>
</html>`;
};
