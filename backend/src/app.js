const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sessionConfig = require('./config/session');

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter, loginLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const drugRoutes = require('./routes/drugRoutes');
const stockRoutes = require('./routes/stockRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL // Add your Vercel production URL here (e.g., https://your-app.vercel.app)
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(sessionConfig);

// Apply rate limiters & routes
app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy and running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;