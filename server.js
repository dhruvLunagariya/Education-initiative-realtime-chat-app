const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');

const server = http.createServer(app); // in server we pass object app
const io = new Server(server);

app.use(express.static('build'));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const userSocketMap = {};    // Object to store socket IDs and associated usernames
function getAllConnectedClients(roomId) { // for gettingt the sockeid and username all connected client
  // Map over the array of socket IDs in the specified room, and return an array of objects with socketId and username properties
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {   // new socket connection established
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => { //listen for JOIN action by client
        userSocketMap[socket.id] = username; // if someone join the room then we show through usersocketmap or konisi socket id ka konsa user hai
        socket.join(roomId);     //add socket to specified room
        const clients = getAllConnectedClients(roomId);     
        clients.forEach(({ socketId }) => { // it is show to all connected clients that new client join
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on('disconnecting', () => { // Listen this event emitted by the client when the socket is about to disconnect
        const rooms = [...socket.rooms]; //get all rooms that socket is currently in 
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
