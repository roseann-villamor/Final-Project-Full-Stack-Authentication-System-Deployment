# 🔐 Full-Stack Authentication System

A production-ready JWT authentication system built with **Node.js + Express + MySQL** (backend) and **Angular 21 + Bootstrap 5** (frontend).

> **Phase 1 of 5** — Authentication foundation for future project phases.

---

## 🌐 Live URLs

| Service | URL |
|---------|-----|
| **Frontend** | [https://villamor-frontend.onrender.com](https://villamor-frontend.onrender.com) |
| **Backend API Docs** | [https://final-project-full-stack-authentication.onrender.com/api-docs](https://final-project-full-stack-authentication.onrender.com/api-docs) |
| **Health Check** | [https://final-project-full-stack-authentication.onrender.com/health](https://final-project-full-stack-authentication.onrender.com/health) |

> **Note:** The backend is hosted on Render's free tier and may take 30-60 seconds to wake up after inactivity. Please visit the Health Check URL first before testing the application.

---

## ✨ Features

- **JWT Authentication** — 15-minute access tokens (in-memory) + 7-day refresh tokens (httpOnly cookies)
- **Email Verification** — Registration requires email confirmation via Brevo
- **Forgot / Reset Password** — Token-based password reset flow with 24h expiry
- **Role-Based Access Control** — `Admin` and `User` roles with route guards
- **Admin Panel** — Full CRUD for user management (Admin only)
- **Swagger API Docs** — Interactive API documentation at `/api-docs`
- **Fake Backend** — Stage A testing without a real database
- **SPA Routing** — Deep-link support with proper rewrite rules

---

## 🧪 Test Credentials

### Stage A (Fake Backend)
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin123` |
| User | `user@example.com` | `user123` |

### Stage B (Real Backend)
Register a new account or have the instructor seed the database.

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js** v18+
- **MySQL** 8.0+ (for Stage B)
- **Angular CLI** (`npm install -g @angular/cli`)

### 1. Clone the repository
```bash
git clone https://github.com/roseann-villamor/Final-Project-Full-Stack-Authentication-System-Deployment.git
cd Final-Project-Full-Stack-Authentication-System-Deployment
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env from example
cp .env.example .env
# Edit .env with your MySQL credentials and SMTP settings
```

**Environment Variables (.env):**
| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `auth_system_db` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASS` | MySQL password | `yourpassword` |
| `JWT_SECRET` | JWT signing secret | `change-me-in-production` |
| `EMAIL_FROM` | Sender email | `noreply@authsystem.com` |
| `BREVO_API_KEY` | Brevo API key | _(from Brevo dashboard)_ |
| `CORS_ORIGIN` | Allowed frontend URL | `http://localhost:4200` |

```bash
# Create the MySQL database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS auth_system_db;"

# Start the backend
npm start
# → http://localhost:4000
# → Swagger: http://localhost:4000/api-docs
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start Angular dev server
ng serve
# → http://localhost:4200
```

### Stage A Testing (No Database Required)
To test without MySQL, enable the fake backend in `frontend/src/app/app.module.ts`:
```typescript
// Uncomment this line:
{ provide: HTTP_INTERCEPTORS, useClass: FakeBackendInterceptor, multi: true }
```

---

## 🚀 Deployment

### Backend → Render (Web Service)

| Setting | Value |
|---------|-------|
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/health` |
| **Environment** | Set all variables from `.env.example` |

A `render.yaml` blueprint is included for one-click deploy.

### Frontend → Render (Static Site)

| Setting | Value |
|---------|-------|
| **Root Directory** | `frontend` |
| **Build Command** | `npm ci && npm run build` |
| **Publish Directory** | `dist/auth-system-frontend/browser` |

**SPA Rewrite Rule** (fixes deep-link 404s):
- **Source:** `/*` → **Destination:** `/index.html` → **Action:** `Rewrite`

> **Important:** After deploying the backend, update `frontend/src/environments/environment.prod.ts` with the actual Render backend URL.

---

## 📁 Project Structure

├── backend/
│   ├── server.js                    # Express entry point + /health
│   ├── render.yaml                  # Render deployment blueprint
│   ├── swagger.yaml                 # OpenAPI 3.0 spec
│   ├── .env.example                 # Environment variable template
│   └── src/
│       ├── _helpers/                # DB, email, Swagger setup
│       ├── controllers/             # Auth + Users business logic
│       ├── middleware/              # JWT auth, validation, errors
│       ├── models/                  # Sequelize models
│       └── routes/                  # Express route definitions
│
├── frontend/
│   ├── angular.json                 # Angular workspace config
│   ├── public/_redirects            # Netlify SPA rewrite rule
│   └── src/
│       ├── environments/            # Dev + Prod API URLs
│       └── app/
│           ├── _models/             # TypeScript interfaces
│           ├── _services/           # HTTP + Alert services
│           ├── _helpers/            # Guards, interceptors, fake backend
│           ├── _components/         # Shared Nav + Alert
│           ├── account/             # Login, Register, Verify, Reset
│           ├── admin/               # User management (Admin)
│           └── home/                # Dashboard
│
└── README.md                        # ← You are here

---

## 📝 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/accounts/register` | — | Register new account |
| `POST` | `/api/accounts/verify-email` | — | Verify email with token |
| `POST` | `/api/accounts/authenticate` | — | Login → JWT + cookie |
| `POST` | `/api/accounts/refresh-token` | Cookie | Rotate refresh token |
| `POST` | `/api/accounts/revoke-token` | Bearer | Revoke refresh token |
| `POST` | `/api/accounts/forgot-password` | — | Send reset email |
| `POST` | `/api/accounts/reset-password` | — | Reset password |
| `GET`  | `/api/accounts` | Admin | List all accounts |
| `POST` | `/api/accounts` | Admin | Create account |
| `GET`  | `/api/accounts/:id` | Bearer | Get account |
| `PUT`  | `/api/accounts/:id` | Bearer | Update account |
| `DELETE` | `/api/accounts/:id` | Bearer | Delete account |
| `GET`  | `/health` | — | Health check |

---

## 📄 License

This project is for educational purposes — Final Project submission.