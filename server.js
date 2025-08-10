// Emit a random integer from 1 to 50 to each room individually every 3 seconds
setInterval(() => {
    const randomInt = Math.floor(Math.random() * 50) + 1;
    io.emit('numberCalled', randomInt);
}, 5000);
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));


// rooms
const rooms = {};

function createRoom(roomCode, isPublic, maxPlayers) {
    rooms[roomCode] = { users: [], isPublic, maxPlayers, data: {}, started: false };
}
createRoom('TEST01', true, 4); // for testing

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}


// manage websockets
function syncRoom(roomName) {
    if (!rooms[roomName]) return;
    io.to(roomName).emit('roomDataUpdated', rooms[roomName]);
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    let roomName = null;

    socket.on('joinGame', (gameCode) => {
        if (!rooms[gameCode]) return;
        if (rooms[gameCode].users.length >= rooms[gameCode].maxPlayers) {
            socket.emit('roomFull', gameCode);
            return;
        }

        // join room
        socket.join(gameCode);
        roomName = gameCode;
        rooms[roomName].users.push(socket.id);
        rooms[roomName].data[socket.id] = {voted: false}; // initialize user data

        console.log(`Socket ${socket.id} joined room: ${roomName}`);
        syncRoom(roomName);
    });

    socket.on('updateRoomData', (data) => {
        if (!roomName) return;

        rooms[roomName].data[socket.id] = data;


        if (!rooms[roomName].started) {
            const voteCount = Object.values(rooms[roomName].data).filter(user => user.voted).length;

            if (voteCount == rooms[roomName].users.length && rooms[roomName].users.length > 0) {
                // If all users have voted, we can start the game
                rooms[roomName].started = true;
            }
        }

        syncRoom(roomName);
    });

    socket.on('win', ()=>{
        rooms[roomName].started = false;
        io.to(roomName).emit('win', socket.id)
    })

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (roomName) {
            // Remove the user from the room
            rooms[roomName].users = rooms[roomName].users.filter(id => id !== socket.id);
            delete rooms[roomName].data[socket.id];

            // If the room is empty, delete it
            if (rooms[roomName].users.length === 0 && false) { // TODO: change false to true to enable room deletion
                delete rooms[roomName];
                console.log(`Room ${roomName} deleted as it became empty.`);
            }
        }
    });
});


// routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/home/index.html');
});


// create room
app.get('/createRoom', (req, res) => {
    res.sendFile(__dirname + '/public/createRoom/index.html');
});

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/createRoom', (req, res) => {
    const { isPublic, maxPlayers } = req.body;

    const roomCode = generateRoomCode();
    createRoom(roomCode, isPublic === 'on', parseInt(maxPlayers) || 4);

    console.log(rooms[roomCode]);
    res.redirect('/game/' + roomCode);
});


// join game room
const validGameCode = /^[a-zA-Z0-9]*$/;
app.get('/game/:roomCode', (req, res) => {
    const roomCode = req.params.roomCode;

    if (validGameCode.test(roomCode) && roomCode.length === 6 && rooms[roomCode] != undefined) {
        res.sendFile(__dirname + '/public/game/index.html');
    } else {
        res.status(400).sendFile(__dirname + '/public/invalid-code.html');
    }
});

// attempt to join game room but with no code
app.get('/game', (req, res) => {
    res.status(400).sendFile(__dirname + '/public/invalid-code.html');
});



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});