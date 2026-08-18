import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes.js';
import { checkPgConnection } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

async function startServer() {
  await checkPgConnection();
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` 🛳️  Cruise Booking System API running on port ${PORT}`);
    console.log(` Base URL: http://localhost:${PORT}/api`);
    console.log(`====================================================`);
  });
}

startServer();
