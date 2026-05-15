import express from 'express';
import { createServer } from 'http';

// ── Env validation ─────────────────────────────────────────────────────────────

function validateEnv(): void {
  const missing = ['DATABASE_URL'].filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`\n  ✗ Missing required env vars: ${missing.join(', ')}`);
    console.error('  Add them to apps/server/.env and restart.\n');
    process.exit(1);
  }
  if (!process.env.MINIMAX_API_KEY) {
    console.warn('  ⚠  MINIMAX_API_KEY not set — AI generation will return 503\n');
  }
}

validateEnv();
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import projectRoutes from './routes/projects';
import aiRoutes      from './routes/ai';
import { registerCursorHandlers } from './socket/cursors';

const PORT          = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';

// ── Express ───────────────────────────────────────────────────────────────────

const app        = express();
const httpServer = createServer(app);

app.use(cors({ origin: CLIENT_ORIGIN, methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(express.json({ limit: '4mb' })); // accommodate large node arrays

// Routes
app.use('/api', projectRoutes);
app.use('/api', aiRoutes);

// Health check — useful for load-balancer / docker health probes
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Socket.IO ─────────────────────────────────────────────────────────────────

const io = new SocketIOServer(httpServer, {
  cors: {
    origin:  CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

registerCursorHandlers(io);

// ── Boot ──────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`\n  ✦ Aether server  →  http://localhost:${PORT}`);
  console.log(`  ✦ CORS origin    →  ${CLIENT_ORIGIN}\n`);
});
