import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import Message from './models/Message.js';
import User from './models/User.js';
import { createAuditLog } from './utils/logger.js';

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/matchy';
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));


app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecretmatchykey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    }
}));


import path from 'path';
import { fileURLToPath } from 'url';
import { socketManager } from './socketManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);


app.get('/', (req, res) => {
    res.send('Matchy API running');
});


socketManager.init(io);

io.on('connection', (socket) => {
    console.log('User connected via Socket.io:', socket.id);


    socket.on('register', (userId) => {
        socketManager.registerUser(userId, socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
    });


    socket.on('send_message', async (data) => {
        try {
            const { senderId, receiverId, content, type } = data;


            const newMessage = new Message({ sender: senderId, receiver: receiverId, content, type: type || 'text' });
            await newMessage.save();


            await createAuditLog('SEND_MESSAGE', senderId, { type: type || 'text' }, receiverId);


            const receiverSocketId = socketManager.getSocketId(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receive_message', newMessage);
            }

            socket.emit('message_sent', newMessage);

        } catch (error) {
            console.error('Error saving message:', error);
        }
    });


    socket.on('call_user', async (data) => {
        const { userToCall, signalData, from, name, callType } = data;


        await createAuditLog('CALL_START', from, { callType }, userToCall);

        const receiverSocketId = socketManager.getSocketId(userToCall);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('call_user', { signal: signalData, from, name, callType });
        }
    });

    socket.on('answer_call', (data) => {
        const { to, signal } = data;
        const callerSocketId = socketManager.getSocketId(to);
        if (callerSocketId) {
            io.to(callerSocketId).emit('call_accepted', signal);
        }
    });

    socket.on('ice_candidate', (data) => {
        const { to, candidate } = data;
        const receiverSocketId = socketManager.getSocketId(to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('ice_candidate', candidate);
        }
    });

    socket.on('mark_read', async ({ senderId, receiverId }) => {
        try {
            await Message.updateMany(
                { sender: senderId, receiver: receiverId, read: false },
                { $set: { read: true } }
            );
            const senderSocketId = socketManager.getSocketId(senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit('messages_read', { readBy: receiverId });
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    });

    socket.on('end_call', (data) => {
        const { to } = data;
        const receiverSocketId = socketManager.getSocketId(to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('call_ended');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        socketManager.removeSocket(socket.id);
    });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
