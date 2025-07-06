const { Pool } = require('pg');
require('dotenv').config();

// Use the same database configuration as the main app
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const socketIO = require('socket.io');

let io;

module.exports = (server) => {
    io = socketIO(server, {
        cors: {
            origin: ["http://localhost:3000", "http://localhost:5173"],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Handle message sending
        socket.on('sendMessage', async (message) => {
            try {
                // Save message to the database using pg
                const insertQuery = `
                    INSERT INTO message (content, "imageUrl", "senderId", "receiverId")
                    VALUES ($1, $2, $3, $4)
                    RETURNING *
                `;
                const values = [
                    message.content || null,
                    message.imageUrl || null,
                    message.senderId,
                    message.receiverId
                ];
                const { rows } = await pool.query(insertQuery, values);
                const savedMessage = rows[0];
                // Emit the message to the receiver's room
                io.to(message.receiverId).emit('receiveMessage', savedMessage);
            } catch (error) {
                console.error('Error saving message:', error);
                socket.emit('error', 'Failed to send message');
            }
        });

        // Handle joining a user's room for real-time updates
        socket.on('joinRoom', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined room ${userId}`);
        });

        // Handle notifications
        socket.on('subscribeToNotifications', (userId) => {
            socket.join(`notifications_${userId}`);
            console.log(`User ${userId} subscribed to notifications`);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

module.exports.getIO = () => io; // Export a getter function for the io instance