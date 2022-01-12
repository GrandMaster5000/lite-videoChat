const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');

const ACTIONS = require('./src/socket/actions');
const { validate, version } = require('uuid');
const PORT = process.env.PORT || 3001;

const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

const sockets = io.sockets

const getClientRooms = () => {
    const {rooms} = sockets.adapter;

    return Array.from(rooms.keys()).filter(roomId => validate(roomId) && version(roomId) === 4);
}

const shareRoomsInfo = () => {
    io.emit(ACTIONS.SHARE_ROOMS, {
        rooms: getClientRooms()
    })
}

io.on('connection', socket => {
    shareRoomsInfo();

    socket.on(ACTIONS.JOIN, config => {
        const { room: roomId } = config;
        const { rooms: joinedRooms } = socket;

        if(Array.from(joinedRooms).includes(roomId)) {
            return console.warn(`Already joined to ${roomId}`)
        }
        const clients = Array.from(sockets.adapter.rooms.get(roomId) || []);

        clients.forEach(clientId => {
            socket.to(clientId).emit(ACTIONS.ADD_PEER, {
                peerId: socket.id,
                createOffer: false
            });

            socket.emit(ACTIONS.ADD_PEER, {
                peerId: clientId,
                createOffer: true
            });
        });

        socket.join(roomId);
        shareRoomsInfo();
    });

    const leaveRoom = () => {
        const {rooms} = socket;

        Array.from(rooms).forEach(roomId => {
            const clients = Array.from(sockets.adapter.room?.get(roomId) || [])

            clients.forEach(clientId => {
                socket.to(clientId).emit(ACTIONS.REMOVE_PEER, {
                    peerId: socket.id
                });

                socket.emit(ACTIONS.REMOVE_PEER, {
                    peerId: clientId
                });
            });

            socket.leave(roomId);
        });
        shareRoomsInfo();
    }

    socket.on(ACTIONS.LEAVE, leaveRoom);
    socket.on('disconnecting', leaveRoom);

    socket.on(ACTIONS.RELAY_SDP, ({peerId, sessionDescription}) => {
        io.to(peerId).emit(ACTIONS.SESSION_DESCRIPTION, {
            peerId: socket.id,
            sessionDescription
        })
    })

    socket.on(ACTIONS.RELAY_ICE, ({peerId, iceCandidate}) => {
        io.to(peerId).emit(ACTIONS.ICE_CANDIDATE, {
            peerId: socket.id,
            iceCandidate
        });
    });
});

server.listen(PORT, () => {
    console.log('Server');
})