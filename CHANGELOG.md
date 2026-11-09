# Zaraz Server - Engineering Changelog


### docs(api): document GET /products query parameters and filter options
- Timestamp: 2026-11-10 01:20:28


### docs(api): document POST /products payload schema and validation rules
- Timestamp: 2026-11-10 01:20:28


### docs(api): document GET /products/:id response format for single items
- Timestamp: 2026-11-10 01:20:29


### docs(api): document POST /auth/register request payload and token response
- Timestamp: 2026-11-10 01:20:29


### docs(api): document POST /auth/login credentials format and error codes
- Timestamp: 2026-11-10 01:20:30



### [Commit #1] feat(auth): implement user registration controller with bcrypt password hashing
- **Timestamp:** `2026-11-09T19:21:48.737Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #2] feat(auth): add 30-day JWT signed bearer token generation helper
- **Timestamp:** `2026-11-09T19:21:49.273Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #3] feat(auth): create user profile retrieval and verification endpoint
- **Timestamp:** `2026-11-09T19:21:49.752Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #4] feat(auth): implement secure customer and seller role discrimination
- **Timestamp:** `2026-11-09T19:21:50.286Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #5] feat(auth): add social login OAuth exchange handler for Google and GitHub
- **Timestamp:** `2026-11-09T19:21:50.788Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #6] feat(auth): validate strong password requirements on registration payload
- **Timestamp:** `2026-11-09T19:21:51.283Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #7] feat(auth): add user analytics endpoint with count of customers and sellers
- **Timestamp:** `2026-11-09T19:21:51.760Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #8] feat(auth): add database isolation separating auth vault into zaraz_auth_db
- **Timestamp:** `2026-11-09T19:21:52.224Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #9] feat(catalog): implement getAllProducts with pagination and sorting options
- **Timestamp:** `2026-11-09T19:21:52.831Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #10] feat(catalog): add product search filter querying title, brand, and description
- **Timestamp:** `2026-11-09T19:21:53.296Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #11] feat(catalog): implement category filtering by slug with regex matching
- **Timestamp:** `2026-11-09T19:21:53.777Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #12] feat(catalog): add price range query parameters for catalog search
- **Timestamp:** `2026-11-09T19:21:54.245Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #13] feat(catalog): implement flash sale toggle filter in productController
- **Timestamp:** `2026-11-09T19:21:54.725Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #14] feat(catalog): add getProductById with support for both ObjectId and slug
- **Timestamp:** `2026-11-09T19:21:55.212Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #15] feat(catalog): create product creation endpoint with automatic slugify
- **Timestamp:** `2026-11-09T19:21:55.702Z`
- **Target:** `D:/Project/zaraz-server`
