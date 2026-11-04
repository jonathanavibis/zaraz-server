# 🚀 Zaraz-Server — REST API & Authentication Engine

[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21-lightgrey?logo=express)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-8.10-red?logo=mongoose)](https://mongoosejs.com/)
[![JWT Auth](https://img.shields.io/badge/Auth-JWT%2030D-black?logo=jsonwebtokens)](https://jwt.io/)
[![Theme](https://img.shields.io/badge/Theme-Permanent%20Green%20%26%20Black-10b981)](#)

> **zaraz-server** is the standalone Express.js + MongoDB REST API backend for the **Zaraz.app** (Daraz-inspired) e-commerce platform. It features an integrated **Green & Black HTML Dashboard** for browser visitors, live real-time API request testing, and an isolated **dual-database architecture** (`zaraz_auth_db` for credentials and user profiles; `zaraz_db` for products, orders, categories, and promotional banners).

---

## 🎨 Green & Black Server Dashboard (`GET /`)

When opening `http://localhost:5000` in any web browser, the server returns an interactive **Green & Black styled dashboard** featuring:
- **Live System Metrics:** Real-time counts of products, categories, registered users, orders, and banners.
- **Dual-Database Architecture Indicator:** `zaraz_auth_db` (Auth) & `zaraz_db` (Catalog & Logistics).
- **Built-in Live API Console:** Test any endpoint (`/health`, `/products`, `/categories`, `/banners`, `/auth/stats`, `/orders`) directly in the browser with 1 click.
- **Complete REST API Directory:** Detailed matrix of HTTP methods, paths, JWT Bearer requirements, and descriptions.
- **JSON API Fallback:** When queried with `Accept: application/json` or `?format=json`, returns structured machine-readable JSON.

---

## 🔒 Dual-Database Architecture on MongoDB Atlas

To maintain optimal isolation and security:
1. **`zaraz_auth_db` (Authentication Database):**
   - User collection: names, emails, bcrypt-hashed passwords, avatars, phone numbers, delivery addresses, and user roles (`customer`, `seller`, `admin`).
   - Strict password security validation: minimum 6 characters, at least 1 uppercase letter (`[A-Z]`), and at least 1 lowercase letter (`[a-z]`).
2. **`zaraz_db` (Store Catalog & Logistics Database):**
   - Products (inventory, ratings, flash deals, specifications, seller details).
   - Categories (departments with images and slugs).
   - Banners (Daraz-style hero promotions).
   - Orders & Fulfillment (customer delivery details, ordered items, courier tracking timeline, payment transaction IDs).

---

## 📋 Complete API Endpoints Reference

### 1. Authentication & Security (`/auth` & `/jwt`)
| Method | Endpoint | Access | Database & Description |
|:---|:---|:---|:---|
| `POST` | `/auth/register` | Public | Register new customer or seller with password policy in **zaraz_auth_db** |
| `POST` | `/auth/login` | Public | Verify bcrypt password against **zaraz_auth_db** and issue 30-day JWT |
| `POST` | `/auth/social` | Public | Sync Google & GitHub OAuth profiles in **zaraz_auth_db** |
| `POST` | `/jwt` or `/auth/jwt` | Public | Direct token issuance endpoint for active user session payload |
| `GET` | `/auth/me` | Bearer JWT | Retrieve current authenticated user profile from **zaraz_auth_db** |
| `GET` | `/auth/profile` | Bearer JWT | Fetch user profile details |
| `PUT` | `/auth/profile` | Bearer JWT | Update user name, phone, shipping address and avatar in **zaraz_auth_db** |
| `GET` | `/auth/stats` | Public | Breakdown of registered users, customers, sellers, and admins |
| `GET` | `/auth/users` | Admin JWT | List all registered user records (Admin only) |

### 2. Products Catalog (`/products`)
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/products` | Public | Filterable catalog (`?category=`, `?search=`, `?flashSale=true`, `?sort=`, `?brand=`, `?minPrice=`, `?maxPrice=`, `?page=`, `?limit=`) |
| `GET` | `/products/:id` | Public | Fetch product by MongoDB ObjectId or URL slug |
| `POST` | `/products` | Seller/Admin | Add new product with specifications and pricing |
| `PUT` | `/products/:id` | Seller/Admin | Update product attributes or stock |
| `DELETE` | `/products/:id` | Admin | Remove product from inventory |

### 3. Categories & Banners (`/categories`, `/banners`)
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/categories` | Public | All department categories with images and count |
| `GET` | `/categories/:slug` | Public | Get single category by slug |
| `POST` | `/categories` | Admin | Create new category |
| `GET` | `/banners` | Public | Get promotional banners for homepage carousel |
| `POST` | `/banners` | Admin | Create promotion banner |

### 4. Orders & Delivery Logistics (`/orders`)
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `POST` | `/orders` | Public | Place order with cart items, delivery method, and payment choice |
| `GET` | `/orders` | Public / Query | Get orders (Filterable by `?email=user@zaraz.com`) |
| `GET` | `/orders/:id` | Public | Live courier tracking timeline: Placed &rarr; Processing &rarr; Transit &rarr; Delivered |
| `PATCH` | `/orders/:id/status`| Admin | Update order state and tracking milestones |

### 5. Multi-Channel Payment Processing (`/payment`)
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `POST` | `/payment/process` | Public | Authorize transaction for bKash, Nagad, Rocket, Credit/Debit Card or COD |

### 6. System Diagnostics & Seeding (`/health`, `/seed`)
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/health` | Public | Server uptime, memory consumption, Node.js version, and database statuses |
| `GET` / `POST` | `/seed` | Public | Seed default Daraz-inspired catalog and demo accounts into MongoDB Atlas |

---

## 🏃 Quick Start

### 1. Environment Configuration (`.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://zaraz-admin:6681CptbyrN76kua@cluster0.qlpxs02.mongodb.net/zaraz_db?retryWrites=true&w=majority
AUTH_DB_NAME=zaraz_auth_db
AUTH_MONGODB_URI=mongodb+srv://zaraz-admin:6681CptbyrN76kua@cluster0.qlpxs02.mongodb.net/zaraz_auth_db?retryWrites=true&w=majority
JWT_SECRET=EQIm8GWsjGHQY0jf0Ixf7Djjh6CRxFCZ
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### 2. Start the Server
```bash
cd D:\Project\zaraz-server
npm run dev
```

Visit the dashboard in your browser: **http://localhost:5000**
