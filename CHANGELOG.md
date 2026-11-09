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

### [Commit #16] feat(catalog): implement product update controller with partial payload support
- **Timestamp:** `2026-11-09T19:21:56.164Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #17] feat(catalog): implement soft delete and hard delete operations for products
- **Timestamp:** `2026-11-09T19:21:56.840Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #18] feat(catalog): add discount percentage auto-calculation from original price
- **Timestamp:** `2026-11-09T19:21:57.422Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #19] feat(categories): implement getAllCategories endpoint with alphabetical sort
- **Timestamp:** `2026-11-09T19:21:58.031Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #20] feat(categories): add live product counter aggregation per category slug
- **Timestamp:** `2026-11-09T19:21:59.277Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #21] feat(categories): implement category creation controller with auto-slug generation
- **Timestamp:** `2026-11-09T19:22:00.566Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #22] feat(categories): add category image and display icon attribute support
- **Timestamp:** `2026-11-09T19:22:01.234Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #23] feat(banners): implement getAllBanners endpoint for storefront hero carousel
- **Timestamp:** `2026-11-09T19:22:01.769Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #24] feat(banners): add promotional campaign banner creation controller
- **Timestamp:** `2026-11-09T19:22:02.387Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #25] feat(banners): add banner tag, title, subtitle, and CTA link support
- **Timestamp:** `2026-11-09T19:22:03.304Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #26] feat(orders): implement order creation controller with customer address validation
- **Timestamp:** `2026-11-09T19:22:04.093Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #27] feat(orders): generate random 6-digit Zaraz order tracking numbers
- **Timestamp:** `2026-11-09T19:22:04.651Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #28] feat(orders): create 5-stage fulfillment delivery timeline pipeline
- **Timestamp:** `2026-11-09T19:22:05.536Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #29] feat(orders): add customer order history lookup filtered by email address
- **Timestamp:** `2026-11-09T19:22:06.406Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #30] feat(orders): implement single order tracking endpoint by tracking ID
- **Timestamp:** `2026-11-09T19:22:06.902Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #31] feat(orders): add patch order status endpoint with timeline completion update
- **Timestamp:** `2026-11-09T19:22:07.699Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #32] feat(orders): implement delivery method calculation for standard and express courier
- **Timestamp:** `2026-11-09T19:22:08.941Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #33] feat(orders): support multiple payment methods including COD, bKash, and Card
- **Timestamp:** `2026-11-09T19:22:09.638Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #34] feat(telemetry): add server diagnostics endpoint reporting CPU and memory usage
- **Timestamp:** `2026-11-09T19:22:10.482Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #35] feat(telemetry): compute V8 heap allocation and RSS footprint metrics
- **Timestamp:** `2026-11-09T19:22:11.087Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #36] feat(telemetry): add live MongoDB connection ping and cluster state checker
- **Timestamp:** `2026-11-09T19:22:11.639Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #37] feat(telemetry): implement two-way sync latency measurement between client and server
- **Timestamp:** `2026-11-09T19:22:12.365Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #38] feat(ui): create server view engine rendering HTML component views for browser agents
- **Timestamp:** `2026-11-09T19:22:13.596Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #39] feat(ui): implement Dribbble-inspired 3-column layout structure in viewRenderer
- **Timestamp:** `2026-11-09T19:22:14.346Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #40] feat(ui): theme server dashboard matching Zaraz website emerald green and obsidian
- **Timestamp:** `2026-11-09T19:22:15.126Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #41] feat(ui): add quick add product modal on dashboard with live Atlas persistence
- **Timestamp:** `2026-11-09T19:22:16.127Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #42] feat(ui): add real Zaraz microservices and container nodes replacing mock servers
- **Timestamp:** `2026-11-09T19:22:16.706Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #43] feat(ui): implement dynamic SVG sparklines for live CPU activity monitoring
- **Timestamp:** `2026-11-09T19:22:17.251Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #44] feat(ui): implement dynamic SVG sparklines for RAM allocation monitoring
- **Timestamp:** `2026-11-09T19:22:17.751Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #45] feat(ui): add bandwidth and two-way sync throughput chart with in-sync gauge
- **Timestamp:** `2026-11-09T19:22:18.440Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #46] feat(ui): add active containers panel for storefront, core api, and mongo clusters
- **Timestamp:** `2026-11-09T19:22:19.679Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #47] feat(ui): add live interactive API request console with JSON syntax formatting
- **Timestamp:** `2026-11-09T19:22:20.615Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #48] feat(ui): add endpoints directory table with direct component view navigation
- **Timestamp:** `2026-11-09T19:22:21.491Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #49] feat(ui): add tab switcher navigation for Overview, Processes, Sync, and Console
- **Timestamp:** `2026-11-09T19:22:21.988Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #50] feat(ui): add toast notification system for instant modal and action feedback
- **Timestamp:** `2026-11-09T19:22:22.474Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #51] fix(cors): permit all .vercel.app origin domains with credentials support
- **Timestamp:** `2026-11-09T19:22:22.951Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #52] fix(headers): add no-store and no-cache headers to eliminate stale catalog caching
- **Timestamp:** `2026-11-09T19:22:23.436Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #53] fix(routing): mount dual routes for both /products and /api/products compatibility
- **Timestamp:** `2026-11-09T19:22:23.915Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #54] fix(routing): mount dual routes for /health and /api/health endpoints
- **Timestamp:** `2026-11-09T19:22:24.393Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #55] fix(db): ensure serverless MongoDB connection middleware waits before routing
- **Timestamp:** `2026-11-09T19:22:24.872Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #56] fix(validation): handle empty image array fallback in product card rendering
- **Timestamp:** `2026-11-09T19:22:25.386Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #57] fix(validation): normalize customer email to lowercase before querying orders
- **Timestamp:** `2026-11-09T19:22:25.885Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #58] fix(validation): ensure telephone number field sanitization removes spaces
- **Timestamp:** `2026-11-09T19:22:26.362Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #59] fix(auth): return 409 conflict when email already exists in zaraz_auth_db
- **Timestamp:** `2026-11-09T19:22:27.004Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #60] fix(auth): verify JWT secret fallback key for production resilience
- **Timestamp:** `2026-11-09T19:22:27.522Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #61] fix(catalog): handle invalid 24-character hex ID gracefully in getProductById
- **Timestamp:** `2026-11-09T19:22:28.002Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #62] fix(catalog): ensure stock field defaults to positive integer value
- **Timestamp:** `2026-11-09T19:22:28.489Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #63] fix(order): initialize payment status as Settled for online payment channels
- **Timestamp:** `2026-11-09T19:22:28.989Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #64] fix(telemetry): guard against missing process.memoryUsage in constrained environments
- **Timestamp:** `2026-11-09T19:22:29.461Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #65] fix(ui): adjust modal z-index to overlay correctly on top of sticky header
- **Timestamp:** `2026-11-09T19:22:29.931Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #66] fix(ui): prevent horizontal scroll overflow on mobile viewport sizes
- **Timestamp:** `2026-11-09T19:22:30.503Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #67] fix(ui): ensure table rows wrap gracefully on narrow screen resolutions
- **Timestamp:** `2026-11-09T19:22:30.980Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #68] fix(ui): add missing danger button and card style classes to viewRenderer
- **Timestamp:** `2026-11-09T19:22:31.484Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #69] fix(ui): define --muted CSS variable to prevent fallback styling issues
- **Timestamp:** `2026-11-09T19:22:31.966Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #70] refactor(db): modularize database connection logic in config/db.js
- **Timestamp:** `2026-11-09T19:22:32.698Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #71] refactor(db): use separate mongoose connection instances for catalog and auth
- **Timestamp:** `2026-11-09T19:22:33.546Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #72] refactor(models): define explicit mongoose schema types and defaults for Product
- **Timestamp:** `2026-11-09T19:22:34.171Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #73] refactor(models): define explicit mongoose schema types and defaults for Order
- **Timestamp:** `2026-11-09T19:22:34.692Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #74] refactor(models): define explicit mongoose schema types and defaults for User
- **Timestamp:** `2026-11-09T19:22:35.176Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #75] refactor(models): define explicit mongoose schema types and defaults for Category
- **Timestamp:** `2026-11-09T19:22:35.674Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #76] refactor(models): define explicit mongoose schema types and defaults for Banner
- **Timestamp:** `2026-11-09T19:22:36.172Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #77] refactor(controllers): extract isHtmlRequest detection helper into viewRenderer
- **Timestamp:** `2026-11-09T19:22:36.685Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #78] refactor(controllers): clean up query parameter parsing in productController
- **Timestamp:** `2026-11-09T19:22:37.187Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #79] refactor(controllers): simplify order timeline update logic with map transform
- **Timestamp:** `2026-11-09T19:22:37.671Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #80] refactor(middleware): optimize express json body parser limit to 10mb for base64
- **Timestamp:** `2026-11-09T19:22:38.161Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #81] refactor(middleware): streamline serverless connection check with cached promise
- **Timestamp:** `2026-11-09T19:22:38.654Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #82] refactor(views): organize CSS tokens into custom properties in viewRenderer
- **Timestamp:** `2026-11-09T19:22:39.170Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #83] refactor(views): separate layout shell from page-specific component contents
- **Timestamp:** `2026-11-09T19:22:39.707Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #84] refactor(routes): modularize auth routes into dedicated Express Router
- **Timestamp:** `2026-11-09T19:22:40.252Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #85] refactor(routes): modularize product routes into dedicated Express Router
- **Timestamp:** `2026-11-09T19:22:40.852Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #86] refactor(routes): modularize category routes into dedicated Express Router
- **Timestamp:** `2026-11-09T19:22:41.356Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #87] refactor(routes): modularize banner routes into dedicated Express Router
- **Timestamp:** `2026-11-09T19:22:42.127Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #88] refactor(routes): modularize order routes into dedicated Express Router
- **Timestamp:** `2026-11-09T19:22:42.613Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #89] refactor(routes): modularize seed routes for database initialization
- **Timestamp:** `2026-11-09T19:22:43.092Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #90] perf(db): add compound index on categorySlug and createdAt for faster queries
- **Timestamp:** `2026-11-09T19:22:43.561Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #91] perf(db): add text index on product title and brand for search acceleration
- **Timestamp:** `2026-11-09T19:22:44.055Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #92] perf(db): add index on order tracking number for instantaneous lookup
- **Timestamp:** `2026-11-09T19:22:44.537Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #93] perf(db): add index on user email in zaraz_auth_db for O(1) auth queries
- **Timestamp:** `2026-11-09T19:22:45.029Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #94] perf(db): use lean queries where document mutation is not required
- **Timestamp:** `2026-11-09T19:22:45.505Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #95] perf(api): set max-age=0 and must-revalidate on all dynamic catalog responses
- **Timestamp:** `2026-11-09T19:22:45.981Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #96] perf(views): inline critical SVG sparkline definitions to avoid network latency
- **Timestamp:** `2026-11-09T19:22:46.455Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #97] perf(views): load Google Fonts asynchronously with preconnect resource hints
- **Timestamp:** `2026-11-09T19:22:46.939Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #98] perf(memory): minimize object allocations in high-frequency health ping handler
- **Timestamp:** `2026-11-09T19:22:47.418Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #99] perf(telemetry): throttle simulated CPU pulse interval to prevent event loop delay
- **Timestamp:** `2026-11-09T19:22:47.895Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #100] docs(api): document GET /products query parameters and filter options
- **Timestamp:** `2026-11-09T19:22:48.365Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #101] docs(api): document POST /products payload schema and validation rules
- **Timestamp:** `2026-11-09T19:22:48.843Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #102] docs(api): document GET /products/:id response format for single items
- **Timestamp:** `2026-11-09T19:22:49.493Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #103] docs(api): document POST /auth/register request payload and token response
- **Timestamp:** `2026-11-09T19:22:49.959Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #104] docs(api): document POST /auth/login credentials format and error codes
- **Timestamp:** `2026-11-09T19:22:50.674Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #105] docs(api): document GET /auth/me bearer token authorization header requirement
- **Timestamp:** `2026-11-09T19:22:51.154Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #106] docs(api): document POST /orders order creation structure and pricing object
- **Timestamp:** `2026-11-09T19:22:51.632Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #107] docs(api): document PATCH /orders/:id/status delivery state transitions
- **Timestamp:** `2026-11-09T19:22:52.112Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #108] docs(api): document GET /health server diagnostic metrics and uptime values
- **Timestamp:** `2026-11-09T19:22:52.593Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #109] docs(readme): update repository overview with microservice architectural diagram
- **Timestamp:** `2026-11-09T19:22:53.073Z`
- **Target:** `D:/Project/zaraz-server`

### [Commit #110] docs(readme): add MongoDB Atlas dual database connection instructions
- **Timestamp:** `2026-11-09T19:22:53.563Z`
- **Target:** `D:/Project/zaraz-server`
