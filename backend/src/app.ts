import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import apiRoutes from './routes/api';
import { initDB } from './utils/database';

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

// WebSocket for real-time updates
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('join-room', (doctorId) => {
        socket.join(`doctor-${doctorId}`);
        console.log(`Socket ${socket.id} joined room: doctor-${doctorId}`);
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Make io available globally for emitting updates
(global as any).io = io;

console.log('Initializing database...');
initDB().then(() => {
    server.listen(PORT, () => {
        console.log(`✅ MediQueueAI Backend running on port ${PORT}`);
        console.log(`   API: http://localhost:${PORT}/api`);
    });
}).catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
});