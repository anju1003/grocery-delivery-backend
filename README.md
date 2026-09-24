# P19 — Online Grocery Delivery Platform (Backend)

CIA-3 Project — 5th Semester, Christ University

## Team Details
| Name | Roll No | Department | Section |
|------|---------|------------|---------|
| _fill in_ | _fill in_ | _fill in_ | _fill in_ |

## Problem Statement
Quick-commerce grocery platforms need a backend that lets customers order daily essentials for
home delivery while dark-store staff pick and pack orders and delivery partners handle last-mile
delivery — all tracked through a single, auditable order pipeline. This project implements that
pipeline: stock-aware order placement, a pick → pack → assign → deliver workflow, and manager-facing
performance reporting, with role-based access for every actor in the system.

## Tech Stack
- **Runtime:** Node.js + Express.js
- **Database:** MongoDB + Mongoose ODM
- **Auth:** JWT (jsonwebtoken) + bcrypt password hashing
- **Validation:** express-validator
- **Docs/Testing:** Postman collection (`postman_collection.json`)
- Optional demo frontend: plain HTML/CSS/JS (`frontend/`)

## Setup Instructions
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/grocery-delivery
   JWT_SECRET=<a long random string>
   JWT_EXPIRES_IN=7d
   ```
3. Start MongoDB locally (or point `MONGO_URI` at Atlas).
4. Run the server:
   ```bash
   npm run dev     # with nodemon
   # or
   npm start
   ```
5. Server runs at `http://localhost:5000`. Health check: `GET /`.
6. Import `postman_collection.json` into Postman. Register a user, copy the returned `token`,
   and set it as the collection's `{{token}}` variable (or paste into the Bearer Auth tab) to hit
   protected routes.

## List of Implemented Modules
| # | Module | Where |
|---|--------|-------|
| 1 | User Registration & Authentication | `authController.js`, `authRoutes.js` |
| 2 | Dark-Store Management | `darkStoreController.js`, `darkStoreRoutes.js` |
| 3 | Product Catalog & Store-Wise Stock | `productController.js` (`getProducts`, `upsertStock`) |
| 4 | Order Placement with Nearest-Store Check | `orderController.js` (`placeOrder`) |
| 5 | Order Picking & Packing Workflow | `orderController.js` (`startPicking`, `markPacked`) |
| 6 | Delivery Partner Assignment | `orderController.js` (`assignDeliveryPartner`), `deliveryController.js` |
| 7 | Delivery Status Tracking | `orderController.js` (`updateDeliveryStatus`) |
| 8 | Real-Time Order Status for Customer | `orderController.js` (`getOrderById`) |
| 9 | Stock Replenishment Alerts | `productController.js` (`getLowStockAlerts`) |
| 10 | Delivery Time Slot Selection | `Order.deliverySlot` field, set at placement |
| 11 | Customer Order History & Reorder | `orderController.js` (`getMyOrders`, `reorder`) |
| 12 | Store & Delivery Performance Reports | `reportController.js` (`getPerformanceReport`) |
| 13 | Role-Based Access Control | `middleware/role.js` (`authorize(...)`), applied on every route |

## API Endpoint Reference

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register customer/staff/partner/admin |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Any authenticated user | Get current user profile |

### Dark Stores
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/darkstores` | Authenticated | List active stores (filter by `?area=`) |
| GET | `/api/darkstores/:id` | Authenticated | Get one store |
| POST | `/api/darkstores` | Admin | Create a store |
| PUT | `/api/darkstores/:id` | Admin | Update a store |
| DELETE | `/api/darkstores/:id` | Admin | Deactivate a store |

### Products & Stock
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/products` | Authenticated | Browse products (`?storeId=` merges store stock) |
| GET | `/api/products/low-stock` | Admin, Staff | Items at/below reorder point |
| POST | `/api/products` | Admin | Create a product |
| PUT | `/api/products/:id` | Admin | Update a product |
| POST | `/api/products/stock` | Admin, Staff | Set/update store-wise stock quantity |

### Orders
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/orders` | Customer | Place order (validates nearest-store stock) |
| GET | `/api/orders/my` | Customer | Order history |
| GET | `/api/orders/store` | Admin, Staff | Orders for a store (`?storeId=&status=`) |
| GET | `/api/orders/:id` | Owner / Admin / Staff | Real-time order status |
| PUT | `/api/orders/:id/pick` | Staff, Admin | Start picking |
| PUT | `/api/orders/:id/pack` | Staff, Admin | Mark packed |
| PUT | `/api/orders/:id/assign` | Staff, Admin | Assign delivery partner |
| PUT | `/api/orders/:id/status` | Delivery Partner, Admin | Update delivery status |
| POST | `/api/orders/:id/reorder` | Customer | Reorder a past order |

### Delivery Partners
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/delivery-partners/available` | Admin, Staff | List available partners |
| GET | `/api/delivery-partners/me` | Delivery Partner | Own profile + current order |

### Reports
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/admin/reports/performance` | Admin | Store/delivery performance (`?storeId=`) |

Full request/response samples are in `postman_collection.json`.

## Database Schema Summary
- **users** — `name, email, passwordHash, phone, role, assignedStore, serviceableArea`
- **darkStores** — `name, area, location{lat,lng}, isActive`
- **products** — `name, category, price, unit, description, isActive`
- **storeStock** — `storeId (ref), productId (ref), quantity, reorderPoint` — unique per (store, product)
- **orders** — `customerId (ref), storeId (ref), items[] (embedded), totalAmount, status, statusHistory[] (embedded), deliveryPartnerId (ref), deliveryAddress, deliverySlot, timestamps`
- **deliveryPartners** — `userId (ref, unique), isAvailable, currentOrderId (ref), serviceableArea`

**Reference vs. embed reasoning:** `items[]` and `statusHistory[]` are embedded inside `orders`
because they are always read and written together with their parent order and never queried on
their own. `customerId`, `storeId`, `productId`, and `deliveryPartnerId` are referenced (ObjectId)
because those documents are large, shared across many orders, and updated independently of any
single order.

```
users ──1:N── orders ──N:1── darkStores
users ──1:1── deliveryPartners ──1:N── orders (via deliveryPartnerId)
darkStores ──1:N── storeStock ──N:1── products
```

## Known Limitations
- Payment gateway, SMS/email notifications, and map/geolocation providers are stubbed/out of scope
  per project boundaries — `serviceableArea` is a simple string match, not real geolocation.
- Single currency/locale/timezone assumed.
- Social login not implemented (self-built JWT auth only).
- Frontend (`frontend/`) is a minimal demo UI, not a production client.

## Seed / Demo Flow
1. Register an `admin`, then a `storeStaff`, a `deliveryPartner`, and a `customer` (same `serviceableArea`, e.g. `"Indiranagar"`).
2. As admin: create a dark store with `area: "Indiranagar"`, create a few products, then `POST /api/products/stock` to stock them at that store.
3. As customer: `POST /api/orders` with those product IDs.
4. As staff: `PUT /orders/:id/pick`, then `/pack`, then `/assign` with the delivery partner's `_id` from `GET /api/delivery-partners/available`.
5. As delivery partner: `PUT /orders/:id/status` → `out_for_delivery` → `delivered`.
6. As customer: `GET /api/orders/:id` to see live status; `GET /api/orders/my` for history.
7. As admin: `GET /api/admin/reports/performance` to see the aggregated numbers.
