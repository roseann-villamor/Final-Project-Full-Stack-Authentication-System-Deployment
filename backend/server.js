require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./src/middleware/error-handler');

const app = express();

// ─── Middleware ───────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS — configurable origin from .env
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true
}));

// ─── Swagger Docs ────────────────────────────────────────
const swaggerSetup = require('./src/_helpers/swagger');
swaggerSetup(app);

// ─── Health Check ────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── API Routes ──────────────────────────────────────────
app.use('/api/accounts', require('./src/routes/auth.routes'));
app.use('/api/accounts', require('./src/routes/users.routes'));

// ─── Global Error Handler ────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────
const port = process.env.PORT || 4000;

// Initialize database and start listening
const db = require('./src/_helpers/db');
db.initialize().then(() => {
    app.listen(port, () => {
        console.log(`\n✅ Server running on http://localhost:${port}`);
        console.log(`📚 Swagger docs at http://localhost:${port}/api-docs\n`);
    });
}).catch(err => {
    console.error('❌ Failed to initialize database:', err.message);
    process.exit(1);
});
