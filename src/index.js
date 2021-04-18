const express = require('express');
const port = process.env.PORT || 3000;
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessages, generatedLocationMessage } = require('../src/utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));


io.on('connection', (socket) => {
    console.log('new websocket connection!');

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessages('Welcome!', 'Admin'));
        socket.broadcast.to(user.room).emit('message', generateMessages(`${user.username} has joined!`, 'Admin'));
        callback();

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
    })

    socket.on('sendMessage', (value, callback) => {
        const user = getUser(socket.id);

        const filter = new Filter();
        if (filter.isProfane(value)) {
            return callback('profane language is not allowed!');
        }

        io.to(user.room).emit('message', generateMessages(value, user.username))
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', generateMessages(`${user.username} has Left!`, 'Admin'));
            
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation', (coordinates, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('LocationMessage', generatedLocationMessage(`https://google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`, user.username));
        callback();
    })

})

app.get('/', (req, res) => {
    res.render('index');
})

server.listen(port, () => {
    console.log(`server is on at ${port}`)
})