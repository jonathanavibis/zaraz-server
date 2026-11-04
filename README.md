# 🚀 Zaraz-Server — REST API Backend

[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21-lightgrey?logo=express)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-8.10-red?logo=mongoose)](https://mongoosejs.com/)
[![JWT Auth](https://img.shields.io/badge/Auth-JWT%20Bearer-black?logo=jsonwebtokens)](https://jwt.io/)

> **zaraz-server** is the standalone Express.js + MongoDB REST API backend for the **Zaraz.app** (Daraz-inspired) e-commerce platform. It provides endpoints for catalog management, categories, banners, orders, delivery logistics, multi-channel payment processing, and user authentication.

---

## 🛠️ Architecture & Technology Stack

- **Framework:** Express.js 4 (ES Modules `import/export`)
- **Database & ODM:** MongoDB Atlas with Mongoose 8
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs password hashing
- **Security & Cross-Origin:** CORS enabled for localhost:3000 and production frontend
- **Serverless Ready:** Pre-configured `vercel.json` for zero-configuration serverless deployment

---

## 📋 Complete API Endpoints Reference

### 1. Products (`/products`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/products` | Get products list (Supports `?category=`, `?search=`, `?flashSale=true`, `?sort=`, `?brand=`, `?minPrice=`, `?maxPrice=`, `?page=`, `?limit=`) |
| `GET` | `/products/:id` | Get single product by Mongo ID or URL slug |
| `POST` | `/products` | Create new product |
| `PUT` | `/products/:id` | Update product information or inventory |
| `DELETE` | `/products/:id` | Delete product from database |

### 2. Categories (`/categories`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/categories` | Get all department categories |
| `GET` | `/categories/:slug` | Get single category by slug |
| `POST` | `/categories` | Add a new department |

### 3. Promotional Banners (`/banners`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/banners` | Get active carousel and promotional banners |
| `POST` | `/banners` | Create a new promotion banner |

### 4. Orders & Delivery (`/orders`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/orders` | Place new customer order with delivery address & payment |
| `GET` | `/orders` | List customer orders (Filterable by `?email=`) |
| `GET` | `/orders/:id` | Get order tracking details, delivery status & timeline |
| `PATCH` | `/orders/:id/status` | Update order state (Processing, Shipped, Delivered) |

### 5. Payment Gateway (`/payment`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/payment/process` | Simulate bKash, Nagad, Rocket, Card, or COD transaction |

### 6. Authentication (`/auth`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/auth/register` | Register customer with email, phone, address, and password |
| `POST` | `/auth/login` | Sign in with email & password (Returns JWT Token) |
| `GET` | `/auth/profile` | Get authenticated user info (`Authorization: Bearer <token>`) |
| `PUT` | `/auth/profile` | Update profile information |

### 7. Database Seeding (`/seed`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` / `POST` | `/seed` | Reset & seed MongoDB with initial Daraz sample data |

---

## 🏃 Getting Started

### 1. Configure Environment (`.env`):
Edit `D:\Project\zaraz-server\.env`:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:3000
```

### 2. Run the Development Server:
```bash
cd D:\Project\zaraz-server
npm run dev
```
The server will start at: **http://localhost:5000**
Health check endpoint: **http://localhost:5000/health**
