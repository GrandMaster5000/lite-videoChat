const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3001;

const getClientRooms = () => {
    const {rooms} = io.sockets.adapter;

    return Array.from(rooms.keys());
}

const shareRoomsInfo = () => {
    io.emit('', {
        rooms: getClientRooms()
    })
}

io.on('connection', socket => {
    shareRoomsInfo();
})

server.listen(PORT, () => {
    console.log('Server');
})