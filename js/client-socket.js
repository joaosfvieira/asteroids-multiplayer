export let Client = {
    socket: io.connect(),
    id: '',
    players: [],
    asteroids: [],
    username: ''
};


Client.socket.on('newplayer', function(data) {
    Client.id = data;
    console.log('Your game id is: ' + Client.id);
});

Client.socket.on('asteroidsSetup', function(data) {
    
    for(var i = 0; i < data.length; i++){
        let asteroid = {
            pos_x: data[i].pos_x,
            pos_y: data[i].pos_y,
            vel_x: data[i].vel_x,
            vel_y: data[i].vel_x
        }

        Client.asteroids.push(asteroid);
        console.log('Asteroid ' + i + ' x: ' + data[i].pos_x + ' y: ' + data[i].pos_y);
    }
});

Client.askNewPlayer = function(x,y){
    Client.socket.emit('newplayer', {x:x,y:y});
};

Client.sendMovement = function(id, x, y, rotation){
    Client.socket.emit('move-player',{id:id,x:x,y:y,rotation:rotation});
};

Client.shotFired = function(shotData) {
    Client.socket.emit('shot-fired',{shotData:shotData});
}

Client.signup = function(userCredentials) {
    Client.socket.emit('signup', userCredentials)
}

Client.login = function(userCredentials) {
    Client.socket.emit('login', userCredentials)
}

Client.sendMessage = function(message) {
    Client.socket.emit('sent-message', message)
}

Client.requestUsersList = function(teste) {
    Client.socket.emit('request-users-list', teste)
}