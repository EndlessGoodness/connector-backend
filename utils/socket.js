const { Pool } = require('pg');
require('dotenv').config();
const databaseUrl = process.env.NODE_ENV === 'test'
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;
const pool = new Pool({ connectionString: databaseUrl });
const socketIO = require('socket.io');

let io;

module.exports = (server) => {
    io = socketIO(server);

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