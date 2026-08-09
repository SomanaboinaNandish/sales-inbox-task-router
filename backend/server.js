import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './router.js';
import db from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Enable CORS for all origins (or you can configure it for your specific Vercel frontend URL)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root Redirect/Status
app.get('/', (req, res) => {
  res.status(200).json({
    message: "Alumnx Sales Inbox Task Router API is running.",
    spec_endpoints: {
      tasks: "GET/POST/PATCH/DELETE /tasks",
      users: "GET /users"
    },
    app_endpoints: {
      ingest: "POST /ingest",
      stats: "GET /api/stats",
      tasks_extended: "GET /api/tasks",
      chat: "POST /api/chat"
    }
  });
});

// Mount routes
app.use(router);

// Start server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  console.log(`MongoDB Database initialized.`);
});
