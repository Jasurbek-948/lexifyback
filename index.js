const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progress');
const quizRoutes = require('./routes/quiz');
const bannerRoutes = require('./routes/banner');
const questionRoutes = require('./routes/questions');
const path = require('path');
const WebSocket = require('ws');

// Atrof-muhit o'zgaruvchilarini yuklash
dotenv.config();

// Express ilovasini yaratish
const app = express();

// MongoDB ulanish
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api', questionRoutes);

// WebSocket serverini yaratish
const server = app.listen(process.env.PORT || 5000, () => {
    console.log(`Server ${process.env.PORT || 5000}-portda ishlamoqda`);
});

const wss = new WebSocket.Server({ server });

// Foydalanuvchilar sonini saqlash
let connectedUsers = 0;

// WebSocket ulanishlarini boshqarish
wss.on('connection', (ws) => {
    // Yangi ulanish bo'lganda foydalanuvchilar sonini oshirish
    connectedUsers++;
    console.log(`Yangi foydalanuvchi ulandi. Jami: ${connectedUsers}`);

    // Barcha ulangan mijozlarga yangi foydalanuvchilar sonini yuborish
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ userCount: connectedUsers }));
        }
    });

    // Ulanish uzilganda foydalanuvchilar sonini kamaytirish
    ws.on('close', () => {
        connectedUsers--;
        console.log(`Foydalanuvchi uzildi. Jami: ${connectedUsers}`);
        // Barcha ulangan mijozlarga yangi foydalanuvchilar sonini yuborish
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ userCount: connectedUsers }));
            }
        });
    });
});

// API endpoint foydalanuvchilar sonini olish uchun
app.get('/api/user-count', (req, res) => {
    res.json({ userCount: connectedUsers });
});