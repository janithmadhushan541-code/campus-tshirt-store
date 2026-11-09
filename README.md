# Campus Tee Store — MERN Starter

A beginner-friendly starter for a campus T-shirt ordering platform built with MongoDB, Express, React, and Node.js.

## Included
- React + Vite storefront
- Product catalogue with category and search filtering
- Size and quantity selection
- Cart stored in browser localStorage
- Checkout form and order creation
- Express REST API
- MongoDB/Mongoose product and order models
- Seed script for sample products
- Basic health endpoint
- Docker Compose for MongoDB and the app API
- Example environment files
- Migration-ready folder and lightweight migration runner
- Production notes for load balancing and application monitoring

> This is a learning starter, not a production-ready payment or security system. It does not collect card details. Add a trusted payment provider and complete security hardening before real-world use.

## Requirements
- Node.js 20+ (or a current LTS version)
- npm
- MongoDB Community Server, OR Docker Desktop

## 1. Start MongoDB
### Option A — local MongoDB
Install and start MongoDB Community Server. The default URI in `server/.env.example` is:
`mongodb://127.0.0.1:27017/campus_tee_store`

Copy `server/.env.example` to `server/.env`.

### Option B — Docker
From the project root:
```bash
docker compose up -d mongo
```
Then copy `server/.env.example` to `server/.env`.

## 2. Install dependencies
Open a terminal in the project root:
```bash
npm install
npm run install:all
```

## 3. Configure environment
Copy `server/.env.example` to `server/.env`.
Copy `client/.env.example` to `client/.env`.

On Windows PowerShell:
```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

## 4. Add sample products
```bash
npm run seed
```

## 5. Run the website
```bash
npm run dev
```
- Frontend: http://localhost:5173
- API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

## Admin dashboard

1. Add a unique password of at least 16 characters as `ADMIN_PASSWORD` in `server/.env`.
2. Restart the server and open [Admin dashboard](http://localhost:5173/admin).
3. Sign in to see store totals and low-stock counts, search orders and update fulfilment status, or add and edit products.

Admin sessions expire after eight hours or when the API restarts. Refreshing the admin page requires signing in again. If you cancel an order, review the stock and adjust it in Products if the items are available for sale again.

## Main API endpoints
- `GET /api/health` — health status
- `GET /api/products` — product list (supports `?search=` and `?category=`)
- `GET /api/products/:id` — one product
- `POST /api/orders` — create an order
- `GET /api/orders/:id` — look up an order by ID

## Suggested development roadmap
1. Add registration/login with hashed passwords and secure sessions/JWT.
3. Add order tracking and email confirmations.
4. Integrate a trusted payment gateway (never store raw card details).
5. Add image uploads through Cloudinary or S3 rather than saving images on the server.
6. Add tests, CI/CD, automated database migrations, logging, and monitoring.
7. Deploy frontend and API separately; use a managed MongoDB deployment for production.

## Three-tier architecture
- **Presentation tier:** React UI in `client/`
- **Application tier:** Express REST API in `server/`
- **Data tier:** MongoDB through Mongoose models in `server/src/models/`

## DevOps extension ideas
- **Migrations:** migration files live in `server/src/migrations/`. Run `npm run migrate` from the project root. The sample runner records applied migrations in a MongoDB collection.
- **Load balancing:** run multiple API instances behind Nginx or a cloud load balancer. Keep API instances stateless; store shared state in MongoDB/Redis, not process memory.
- **Performance monitoring:** add OpenTelemetry or a hosted APM tool, structured logs, request duration metrics, and alerts.
- **CI/CD:** use GitHub Actions to run lint/tests and build on every push.
- **Traffic spikes:** cache catalogue data, add database indexes, rate-limit sensitive endpoints, and use a CDN for product images.

## Important before deployment
- Set a strong unique `MONGODB_URI` and `PORT` in environment variables.
- Add server-side validation and rate limiting.
- Restrict CORS to your real frontend domain.
- Add authentication/authorization for admin and private order data.
- Do not expose secrets in GitHub.
- Add payment verification on the server if accepting online payments.
