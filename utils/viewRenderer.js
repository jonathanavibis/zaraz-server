/**
 * Zaraz Server Dashboard & Component View Engine
 * Styled after modern Dribbble Server Dashboard (s.host / dark sidebar + lime accents + telemetry cards)
 * Includes first-class Theme Manager: Studio Clean (Light) vs Obsidian Cyber (Dark)
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
  title = 'Server Dashboard • Zaraz Core',
  activeNav = 'dashboard',
  content = '',
  jsonUrl = '?format=json',
  extraHead = '',
  extraScripts = '',
}) => {
  const isDashboard = activeNav === 'dashboard';

  return `<!DOCTYPE html>
<html lang="en" data-theme="studio">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} • zaraz.server</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script>
    // Immediate Theme Initialization to avoid flicker
    (function() {
      try {
        var savedTheme = localStorage.getItem('zaraz_server_theme') || 'studio';
        document.documentElement.setAttribute('data-theme', savedTheme);
      } catch (e) {}
    })();
  </script>
  <style>
    /* ==========================================================================
       THEME MANAGEMENT (Studio Clean vs Obsidian Dark)
       ========================================================================== */
    :root, [data-theme="studio"] {
      --sb-bg: #090e15;
      --sb-border: #141c2b;
      --sb-text: #94a3b8;
      --sb-text-hover: #ffffff;
      --sb-active-bg: #bdfc35;       /* Electric Lime button from screenshot */
      --sb-active-text: #090e15;
      
      --main-bg: #f4f6f9;
      --main-header-bg: #ffffff;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --card-hover-border: #cbd5e1;
      
      --text-heading: #0f172a;
      --text-body: #334155;
      --text-muted: #64748b;
      --text-subtle: #94a3b8;
      
      --pill-active-bg: #142a22;    /* Dark teal/forest tab from screenshot */
      --pill-active-text: #ffffff;
      
      --accent-lime: #bdfc35;
      --accent-emerald: #10b981;
      --accent-teal: #0d9488;
      --accent-danger: #ef4444;
      --accent-warning: #f59e0b;
      
      --graph-grid: rgba(0, 0, 0, 0.04);
      --graph-line: #0f172a;
      --graph-fill: rgba(16, 185, 129, 0.08);
      
      --code-bg: #0b111a;
      --code-text: #6ee7b7;
      
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
    }

    [data-theme="obsidian"] {
      --sb-bg: #05080e;
      --sb-border: #121824;
      --sb-text: #94a3b8;
      --sb-text-hover: #ffffff;
      --sb-active-bg: #bdfc35;
      --sb-active-text: #05080e;
      
      --main-bg: #090e17;
      --main-header-bg: #0d1522;
      --card-bg: #0e1625;
      --card-border: #172438;
      --card-hover-border: #22344f;
      
      --text-heading: #f8fafc;
      --text-body: #cbd5e1;
      --text-muted: #94a3b8;
      --text-subtle: #64748b;
      
      --pill-active-bg: #133a2e;
      --pill-active-text: #ffffff;
      
      --accent-lime: #bdfc35;
      --accent-emerald: #10b981;
      --accent-teal: #14b8a6;
      --accent-danger: #f87171;
      --accent-warning: #fbbf24;
      
      --graph-grid: rgba(255, 255, 255, 0.05);
      --graph-line: #34d399;
      --graph-fill: rgba(52, 211, 153, 0.12);
      
      --code-bg: #05080e;
      --code-text: #a7f3d0;
      
      --shadow-sm: 0 2px 6px rgba(0,0,0,0.4);
      --shadow-md: 0 8px 24px rgba(0,0,0,0.6);
    }

    /* Base Reset */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: var(--main-bg);
      color: var(--text-body);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      transition: background-color 0.25s ease, color 0.25s ease;
    }

    /* macOS Window Topbar Frame */
    .app-frame-topbar {
      background: var(--sb-bg);
      border-bottom: 1px solid var(--sb-border);
      padding: 0.55rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      user-select: none;
      z-index: 100;
    }
    .window-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      display: inline-block;
    }
    .dot-red { background: #ff5f56; }
    .dot-yellow { background: #ffbd2e; }
    .dot-green { background: #27c93f; }
    
    .browser-url-pill {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 0.25rem 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: #94a3b8;
      max-width: 480px;
      width: 100%;
      justify-content: center;
    }
    .browser-url-pill span.locked { color: #10b981; }
    .browser-url-pill strong { color: #f8fafc; font-weight: 600; }
    
    .frame-right-actions {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    /* App Shell Container */
    .app-shell {
      display: flex;
      flex: 1;
      min-height: calc(100vh - 42px);
      width: 100%;
    }

    /* ==========================================================================
       LEFT SIDEBAR (Matte Dark, Lime Button, Clean Nav, Profile)
       ========================================================================== */
    .sidebar {
      width: 240px;
      min-width: 240px;
      background: var(--sb-bg);
      border-right: 1px solid var(--sb-border);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.5rem 1rem 1.25rem;
      z-index: 40;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0 0.5rem 1.75rem;
      text-decoration: none;
      color: #ffffff;
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.03em;
    }
    .sidebar-brand-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent-lime);
      box-shadow: 0 0 10px var(--accent-lime);
    }
    
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--sb-text);
      transition: all 0.18s ease;
      position: relative;
    }
    .nav-item:hover {
      color: var(--sb-text-hover);
      background: rgba(255, 255, 255, 0.05);
    }
    /* Active Server Button - Electric Lime Highlight from Dribbble */
    .nav-item.active {
      background: var(--sb-active-bg);
      color: var(--sb-active-text);
      font-weight: 800;
      box-shadow: 0 4px 14px rgba(189, 252, 53, 0.3);
    }
    .nav-item.active svg {
      stroke: var(--sb-active-text);
    }
    .nav-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
    .nav-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .nav-badge-plus {
      font-size: 1rem;
      font-weight: 800;
      line-height: 1;
    }
    .nav-badge-count {
      background: #ef4444;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
    }

    /* Sidebar User Profile */
    .sidebar-profile {
      padding-top: 1.25rem;
      border-top: 1px solid var(--sb-border);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .profile-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #065f46);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.85rem;
      flex-shrink: 0;
      position: relative;
    }
    .profile-status-dot {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 9px;
      height: 9px;
      background: #10b981;
      border: 2px solid var(--sb-bg);
      border-radius: 50%;
    }
    .profile-info {
      flex: 1;
      overflow: hidden;
    }
    .profile-name {
      font-size: 0.82rem;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .profile-role {
      font-size: 0.7rem;
      color: var(--sb-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ==========================================================================
       MAIN CONTENT VIEWPORT & TOPBAR TABS
       ========================================================================== */
    .main-viewport {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow-y: auto;
    }

    /* Dashboard Header Navigation Bar */
    .viewport-topbar {
      background: var(--main-header-bg);
      border-bottom: 1px solid var(--card-border);
      padding: 0.85rem 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      position: sticky;
      top: 0;
      z-index: 30;
      transition: background-color 0.25s ease, border-color 0.25s ease;
    }
    .topbar-nav-tabs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .topbar-tab {
      padding: 0.45rem 1rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none;
      color: var(--text-muted);
      transition: all 0.18s ease;
      cursor: pointer;
      border: none;
      background: transparent;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .topbar-tab:hover {
      color: var(--text-heading);
      background: rgba(0, 0, 0, 0.04);
    }
    [data-theme="obsidian"] .topbar-tab:hover {
      background: rgba(255, 255, 255, 0.06);
    }
    .topbar-tab.active {
      background: var(--pill-active-bg);
      color: var(--pill-active-text);
    }

    /* Theme Switcher Toggle */
    .theme-manager {
      display: inline-flex;
      align-items: center;
      background: rgba(0, 0, 0, 0.05);
      border: 1px solid var(--card-border);
      padding: 3px;
      border-radius: 10px;
      gap: 2px;
    }
    [data-theme="obsidian"] .theme-manager {
      background: rgba(255, 255, 255, 0.04);
    }
    .theme-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      border-radius: 7px;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      border: none;
      background: transparent;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .theme-toggle-btn:hover {
      color: var(--text-heading);
    }
    .theme-toggle-btn.active {
      background: var(--card-bg);
      color: var(--text-heading);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.5rem 1rem;
      border-radius: 9px;
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.18s ease;
      border: none;
      font-family: inherit;
    }
    .btn-lime {
      background: var(--accent-lime);
      color: #090e15;
      font-weight: 800;
      box-shadow: 0 4px 12px rgba(189, 252, 53, 0.25);
    }
    .btn-lime:hover {
      background: #cbfb4c;
      transform: translateY(-1px);
    }
    .btn-dark {
      background: var(--pill-active-bg);
      color: #ffffff;
    }
    .btn-dark:hover {
      opacity: 0.92;
    }
    .btn-outline {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text-heading);
    }
    .btn-outline:hover {
      border-color: var(--card-hover-border);
      background: rgba(0,0,0,0.02);
    }
    .btn-sm {
      padding: 0.35rem 0.7rem;
      font-size: 0.75rem;
      border-radius: 7px;
    }

    /* ==========================================================================
       DASHBOARD 2-PANEL LAYOUT (Middle Servers List + Right Telemetry Grid)
       ========================================================================== */
    .dashboard-layout {
      display: flex;
      flex: 1;
      width: 100%;
      min-height: calc(100vh - 42px - 58px);
    }

    /* Middle Servers Column (from Dribbble screenshot) */
    .servers-column {
      width: 320px;
      min-width: 320px;
      background: var(--main-header-bg);
      border-right: 1px solid var(--card-border);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.5rem 1.25rem 1.25rem;
      transition: background-color 0.25s ease, border-color 0.25s ease;
    }
    .servers-section-title {
      font-size: 0.88rem;
      font-weight: 800;
      color: var(--text-heading);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.85rem;
    }
    .count-subtle {
      font-weight: 500;
      color: var(--text-subtle);
    }
    .servers-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.75rem;
    }
    .server-card {
      padding: 0.85rem 1rem;
      border-radius: 12px;
      background: transparent;
      border: 1px solid transparent;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      transition: all 0.15s ease;
    }
    .server-card:hover {
      background: rgba(0, 0, 0, 0.025);
      border-color: var(--card-border);
    }
    [data-theme="obsidian"] .server-card:hover {
      background: rgba(255, 255, 255, 0.03);
    }
    /* Highlighted / Selected Server Card from Dribbble */
    .server-card.selected {
      background: var(--pill-active-bg);
      color: #ffffff;
      border-color: var(--pill-active-bg);
      box-shadow: 0 6px 18px rgba(20, 42, 34, 0.18);
    }
    .server-card.selected .server-name {
      color: #ffffff;
      font-weight: 800;
    }
    .server-card.selected .server-ip {
      color: #94a3b8;
    }
    .server-card.selected .server-specs {
      color: #bbf7d0;
    }
    .server-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-heading);
    }
    .server-ip {
      font-size: 0.72rem;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }
    .server-specs {
      font-size: 0.72rem;
      color: var(--text-subtle);
      font-weight: 600;
      text-align: right;
    }

    .btn-add-server {
      width: 100%;
      background: var(--accent-lime);
      color: #090e15;
      font-weight: 800;
      font-size: 0.82rem;
      padding: 0.85rem;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      box-shadow: 0 4px 14px rgba(189, 252, 53, 0.25);
      transition: all 0.18s ease;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .btn-add-server:hover {
      background: #cbfb4c;
      transform: translateY(-1px);
    }

    /* Right Telemetry Pane */
    .telemetry-pane {
      flex: 1;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      min-width: 0;
    }

    /* Grid Rows */
    .telemetry-top-grid {
      display: grid;
      grid-template-columns: 1.25fr 1fr 1fr;
      gap: 1.25rem;
    }
    .telemetry-mid-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.25rem;
    }
    .telemetry-bottom-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }

    /* Cards */
    .panel-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.25rem 1.4rem;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .panel-card:hover {
      border-color: var(--card-hover-border);
      box-shadow: var(--shadow-sm);
    }
    .panel-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 0.85rem;
    }
    .panel-title {
      font-size: 0.88rem;
      font-weight: 800;
      color: var(--text-heading);
    }
    .panel-metric {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }

    /* Info Panel Details List */
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      font-size: 0.8rem;
      margin-bottom: 1.25rem;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.2rem 0;
    }
    .info-label {
      color: var(--text-muted);
      font-weight: 600;
    }
    .info-val {
      color: var(--text-heading);
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
    }
    .info-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    /* SVG Sparkline Graphs */
    .sparkline-svg {
      width: 100%;
      height: 75px;
      overflow: visible;
    }
    .sparkline-path {
      fill: none;
      stroke: var(--graph-line);
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .sparkline-fill {
      fill: var(--graph-fill);
    }

    /* Bandwidth Frequency Wave Graph */
    .bandwidth-meta {
      display: flex;
      gap: 1.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .bandwidth-meta span.active-speed {
      color: var(--text-heading);
      font-family: 'JetBrains Mono', monospace;
    }

    /* Traffic Gauge Circular */
    .gauge-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      height: 120px;
    }
    .gauge-svg {
      transform: rotate(-90deg);
      width: 110px;
      height: 110px;
    }
    .gauge-bg {
      fill: none;
      stroke: var(--card-border);
      stroke-width: 10;
    }
    .gauge-val {
      fill: none;
      stroke: var(--accent-emerald);
      stroke-width: 10;
      stroke-linecap: round;
      stroke-dasharray: 283;
      stroke-dashoffset: 75;
      transition: stroke-dashoffset 0.6s ease;
    }
    .gauge-center-text {
      position: absolute;
      text-align: center;
    }
    .gauge-center-val {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text-heading);
      font-family: 'JetBrains Mono', monospace;
    }
    .gauge-center-sub {
      font-size: 0.65rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
    }

    /* Docker Container / Services Cards */
    .container-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 1rem 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: all 0.15s ease;
    }
    .container-card:hover {
      border-color: var(--card-hover-border);
      box-shadow: var(--shadow-sm);
    }
    .container-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .container-name {
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--text-heading);
      font-family: 'JetBrains Mono', monospace;
    }
    .container-id {
      font-size: 0.68rem;
      color: var(--text-subtle);
      font-family: 'JetBrains Mono', monospace;
    }
    .container-metrics {
      display: flex;
      gap: 1.25rem;
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .container-metrics strong {
      color: var(--text-heading);
    }

    /* Tables, Forms & Content for Subpages */
    .content-container {
      max-width: 1320px;
      width: 100%;
      margin: 0 auto;
      padding: 1.75rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.75rem;
      transition: all 0.2s ease;
    }
    .table-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 2rem;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
    th {
      background: var(--main-bg);
      color: var(--text-muted);
      padding: 0.85rem 1.2rem;
      font-weight: 700;
      border-bottom: 1px solid var(--card-border);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    td {
      padding: 0.85rem 1.2rem;
      border-bottom: 1px solid var(--card-border);
      color: var(--text-body);
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(0, 0, 0, 0.02); }
    [data-theme="obsidian"] tr:hover td { background: rgba(255, 255, 255, 0.03); }

    .badge-pill {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    /* Modal Styling */
    .modal-backdrop {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(6px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .modal-backdrop.open { display: flex; }
    .modal-box {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 18px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 1.75rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
      position: relative;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid var(--card-border);
    }
    .modal-header h3 { font-size: 1.15rem; font-weight: 800; color: var(--text-heading); }
    .close-btn {
      background: none; border: none; color: var(--text-muted); font-size: 1.4rem; cursor: pointer;
    }
    .close-btn:hover { color: var(--text-heading); }

    /* Toast Container */
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
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      animation: slideIn 0.25s ease;
    }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .toast-success { background: #064e3b; color: #a7f3d0; border: 1px solid #059669; }
    .toast-error { background: #7f1d1d; color: #fecaca; border: 1px solid #dc2626; }

    /* Responsive */
    @media (max-width: 1080px) {
      .telemetry-top-grid { grid-template-columns: 1fr; }
      .telemetry-mid-grid { grid-template-columns: 1fr; }
      .servers-column { width: 280px; min-width: 280px; }
    }
    @media (max-width: 860px) {
      .dashboard-layout { flex-direction: column; }
      .servers-column { width: 100%; min-width: 100%; border-right: none; border-bottom: 1px solid var(--card-border); }
      .sidebar { width: 100%; min-width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--sb-border); }
      .app-shell { flex-direction: column; }
    }

    ${extraHead}
  </style>
</head>
<body>
  <!-- macOS Top Window Frame -->
  <header class="app-frame-topbar">
    <div class="window-controls">
      <span class="dot dot-red"></span>
      <span class="dot dot-yellow"></span>
      <span class="dot dot-green"></span>
    </div>

    <div class="browser-url-pill">
      <span class="locked">🔒</span>
      <span>https://</span>
      <strong>zaraz-server30.vercel.app</strong>
    </div>

    <div class="frame-right-actions">
      <!-- Theme Switcher -->
      <div class="theme-manager">
        <button type="button" class="theme-toggle-btn active" id="btnThemeStudio" onclick="setServerTheme('studio')" title="Studio Clean Theme (Dribbble)">
          ☀️ Studio
        </button>
        <button type="button" class="theme-toggle-btn" id="btnThemeObsidian" onclick="setServerTheme('obsidian')" title="Obsidian Cyber Theme">
          🌙 Obsidian
        </button>
      </div>

      <a href="${jsonUrl}" class="btn btn-outline btn-sm" title="View Raw JSON payload">
        📄 JSON
      </a>
      <a href="${process.env.CLIENT_URL || 'https://zaraz-shopping.vercel.app'}" target="_blank" class="btn btn-lime btn-sm" title="Open Storefront">
        🛍️ Storefront ↗
      </a>
    </div>
  </header>

  <!-- App Shell with Dark Sidebar -->
  <div class="app-shell">
    <aside class="sidebar">
      <div>
        <a href="/" class="sidebar-brand">
          <span class="sidebar-brand-dot"></span>
          <span>zaraz.host</span>
        </a>

        <nav class="sidebar-nav">
          <a href="/" class="nav-item ${activeNav === 'dashboard' ? 'active' : ''}">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </span>
            <span class="nav-label">Servers</span>
            <span class="nav-badge-plus">+</span>
          </a>

          <a href="/health" class="nav-item ${activeNav === 'health' ? 'active' : ''}">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </span>
            <span class="nav-label">Reports</span>
          </a>

          <a href="/products" class="nav-item ${activeNav === 'products' ? 'active' : ''}">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </span>
            <span class="nav-label">Backups (Catalog)</span>
          </a>

          <a href="javascript:void(0)" onclick="openModal('notificationsModal')" class="nav-item">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </span>
            <span class="nav-label">Notifications</span>
            <span class="nav-badge-count">3</span>
          </a>

          <a href="/orders" class="nav-item ${activeNav === 'orders' ? 'active' : ''}">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </span>
            <span class="nav-label">Finances</span>
          </a>

          <a href="/auth" class="nav-item ${activeNav === 'auth' ? 'active' : ''}">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </span>
            <span class="nav-label">Settings</span>
          </a>

          <a href="/categories" class="nav-item ${activeNav === 'categories' ? 'active' : ''}">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </span>
            <span class="nav-label">Categories</span>
          </a>

          <a href="/banners" class="nav-item ${activeNav === 'banners' ? 'active' : ''}">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </span>
            <span class="nav-label">Banners</span>
          </a>

          <a href="/#endpoints-section" class="nav-item">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </span>
            <span class="nav-label">Help</span>
          </a>
        </nav>
      </div>

      <!-- User Profile at Bottom -->
      <div class="sidebar-profile">
        <div class="profile-avatar">
          JA
          <span class="profile-status-dot"></span>
        </div>
        <div class="profile-info">
          <div class="profile-name">Jonathan Avibis</div>
          <div class="profile-role">@zaraz.admin &bull; Master</div>
        </div>
      </div>
    </aside>

    <!-- Main Viewport -->
    <main class="main-viewport">
      ${isDashboard ? content : `
        <!-- Subpage Top Bar -->
        <div class="viewport-topbar">
          <div class="topbar-nav-tabs">
            <a href="/" class="topbar-tab">← Back to Overview</a>
            <span class="topbar-tab active">${title}</span>
          </div>
          <div class="topbar-actions">
            <a href="${jsonUrl}" class="btn btn-outline btn-sm">📄 Raw JSON</a>
          </div>
        </div>
        <div class="content-container">
          ${content}
        </div>
      `}
    </main>
  </div>

  <!-- Notifications Modal -->
  <div id="notificationsModal" class="modal-backdrop">
    <div class="modal-box">
      <div class="modal-header">
        <h3>🔔 System Notifications (3 Unread)</h3>
        <button class="close-btn" onclick="closeModal('notificationsModal')">&times;</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.85rem;">
        <div style="padding: 0.75rem 1rem; border-radius: 10px; background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981;">
          <strong>Deployment Successful:</strong> Zaraz Serverless Engine is running on Vercel Node v26 with MongoDB Atlas cluster.
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">2 minutes ago</div>
        </div>
        <div style="padding: 0.75rem 1rem; border-radius: 10px; background: rgba(56, 189, 248, 0.1); border-left: 4px solid #38bdf8;">
          <strong>Isolated Database:</strong> Credentials securely authenticated via <code>zaraz_auth_db</code> with bcrypt hashing.
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">15 minutes ago</div>
        </div>
        <div style="padding: 0.75rem 1rem; border-radius: 10px; background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b;">
          <strong>Automatic Backup:</strong> MongoDB Atlas snapshot completed for <code>zaraz_db</code> product catalog.
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">1 hour ago</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Server / Seed Modal -->
  <div id="addServerModal" class="modal-backdrop">
    <div class="modal-box">
      <div class="modal-header">
        <h3>⚡ Manage Server & Catalog Services</h3>
        <button class="close-btn" onclick="closeModal('addServerModal')">&times;</button>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
        Deploy new microservice nodes or run database seed operations on MongoDB Atlas.
      </p>
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <a href="/seed" class="btn btn-lime" style="justify-content: flex-start; padding: 0.85rem 1.25rem;">
          🌱 Run MongoDB Catalog Seeder (Fresh Products, Categories & Banners)
        </a>
        <a href="/products" class="btn btn-outline" style="justify-content: flex-start; padding: 0.85rem 1.25rem;">
          🛍️ Add New Product to Storefront Catalog
        </a>
        <a href="/auth" class="btn btn-outline" style="justify-content: flex-start; padding: 0.85rem 1.25rem;">
          🔐 Manage User Accounts in zaraz_auth_db
        </a>
      </div>
    </div>
  </div>

  <!-- Toast Notifications -->
  <div id="toastContainer"></div>

  <script>
    // Theme Management functions
    function setServerTheme(themeName) {
      document.documentElement.setAttribute('data-theme', themeName);
      try {
        localStorage.setItem('zaraz_server_theme', themeName);
      } catch(e) {}

      var btnStudio = document.getElementById('btnThemeStudio');
      var btnObsidian = document.getElementById('btnThemeObsidian');
      if (btnStudio && btnObsidian) {
        if (themeName === 'obsidian') {
          btnObsidian.classList.add('active');
          btnStudio.classList.remove('active');
        } else {
          btnStudio.classList.add('active');
          btnObsidian.classList.remove('active');
        }
      }
      showToast('Switched to ' + (themeName === 'obsidian' ? '🌙 Obsidian Cyber' : '☀️ Studio Clean') + ' theme');
    }

    // Modal controls
    function openModal(id) {
      var modal = document.getElementById(id);
      if (modal) modal.classList.add('open');
    }

    function closeModal(id) {
      var modal = document.getElementById(id);
      if (modal) modal.classList.remove('open');
    }

    // Toast alert
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
      }, 3500);
    }

    // Sync theme buttons on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
      var activeTheme = document.documentElement.getAttribute('data-theme') || 'studio';
      var btnStudio = document.getElementById('btnThemeStudio');
      var btnObsidian = document.getElementById('btnThemeObsidian');
      if (btnStudio && btnObsidian) {
        if (activeTheme === 'obsidian') {
          btnObsidian.classList.add('active');
          btnStudio.classList.remove('active');
        } else {
          btnStudio.classList.add('active');
          btnObsidian.classList.remove('active');
        }
      }
    });
  </script>
  ${extraScripts}
</body>
</html>`;
};
