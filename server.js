const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index/index.html');
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', (roomName) => {
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
        // Optionally, emit a confirmation back to the client or other clients in the room
        // socket.emit('roomJoined', roomName);
        // io.to(roomName).emit('message', `${socket.id} has joined ${roomName}`);
      });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});