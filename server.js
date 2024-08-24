const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./scratch');

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

server.lastPlayerID = 0;

const asteroids = asteroidsSetup();

server.listen(process.env.PORT || 8081,function(){
    console.log('Listening on '+server.address().port);
});

const connectedUsers = new Map(); 

io.on('connection',function(socket){

    socket.emit('asteroidsSetup', asteroids);

    socket.on('newplayer',function(data){
        socket.player = {
            x: data.x,
            y: data.y,
            id: server.lastPlayerID++
        }
        console.log('-> New player joined! ID [' + socket.player.id + ']');
        
        var allPlayers = getAllPlayers();
        socket.emit('newplayer', socket.player.id);
        io.emit('allplayers',allPlayers);
        
        console.log('-----------------------------------------------');
        console.log('-- Players:');
        for(let i = 0; i<allPlayers.length; i++) {
            console.log('  > ID [' + allPlayers[i].id + ']');
            
        }
        console.log('-----------------------------------------------');
    });

    socket.on('move-player', function(data) {
        socket.broadcast.emit('move-player-broadcast', data);
    });

    socket.on('shot-fired', function(data) {
        console.log('player [' + data.shotData.playerId + '] shot X: ' + data.shotData.x + ' Y: ' + data.shotData.y);
        
        socket.broadcast.emit('shot-fired-broadcast', data.shotData);
    });

    socket.on('signup', function(userCredentials) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        const userExists = users.some(user => user.username === userCredentials.username || user.email === userCredentials.email);

        if (userExists) {
            socket.emit('signup-response', JSON.stringify({
                type: 'signUpResponse',
                success: false,
                message: 'Username or email already exists'
            }));
        } else {
            users.push(userCredentials);
            localStorage.setItem('users', JSON.stringify(users));

            socket.emit('signup-response', JSON.stringify({
                type: 'signUpResponse',
                success: true,
                message: 'Sign-up successful'
            }));
        }
        
    });

    socket.on('login', function(loginCredentials) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(user => user.username === loginCredentials.username && user.password === loginCredentials.password);

        if (user) {
            socket.emit('login-response', JSON.stringify({
                type: 'loginResponse',
                success: true,
                message: 'Login successful'
            }));

            connectedUsers.set(loginCredentials.username, socket);
            broadcastUserList();
        } else {
            socket.emit('login-response', JSON.stringify({
                type: 'loginResponse',
                success: false,
                message: 'Invalid username or password'
            }));
        }    
    });

    socket.on('request-users-list', function(message) {
        broadcastUserList();
    });

    socket.on('sent-message', function(message) {
        const username = message.username;
        const chatMessage = message.chatMessage;

        // Broadcast chat message to all clients
        io.emit('new-message', JSON.stringify({
            type: 'chatMessage',
            username,
            message: chatMessage
        }));
    });

    function broadcastUserList() {
        const userList = [...connectedUsers.keys()];
    
        io.emit('new-message', JSON.stringify({
            type: 'userListUpdate',
            users: userList
        }));
    }

    //socket.on('disconnect',function(){
    //    io.emit('remove',socket.player.id);
    //});
});



let contador = 0;

function getAllPlayers(){
    var players = [];
    Object.keys(io.sockets.connected).forEach(function(socketID){
        var player = io.sockets.connected[socketID].player;
        if(player) players.push(player);
    });
    return players;
}

function asteroidsSetup() {
    const ASTEROID_VELOCITIES = {
        large: { min: .5, max: 1 },
        medium: { min: 1, max: 1.5 },
        small: { min: 1.5, max: 2 }
    };

    let asteroidsArray = [];

    for (let i = 0; i < 8; i++) {

        const x = getRandomInt(0, 800);
        const y = getRandomInt(0, 600);

        let randomAngle, velocityMagnitude, velocityX, velocityY;
        do {
            randomAngle = getRandomInt(0, 360);
            velocityMagnitude = getRandomInt(
                ASTEROID_VELOCITIES.large.min,
                ASTEROID_VELOCITIES.large.max
            );
            velocityX = velocityMagnitude * Math.cos(degreesToRadians(randomAngle));
            velocityY = velocityMagnitude * Math.sin(degreesToRadians(randomAngle));
        } while (velocityX === 0 && velocityY === 0);

        let asteroid = {
            pos_x: x,
            pos_y: y,
            vel_x: velocityX,
            vel_y: velocityY
        }
        asteroidsArray.push(asteroid)
    }

    return asteroidsArray;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;  
  
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}