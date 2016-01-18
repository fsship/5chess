var io = require('socket.io')(8388);
var ChessRoom = require('./chessRoom');

var rooms = ['lia', 'tpf', 'ask', 'roomList'];
for (var i = 0; i < rooms.length; i++) {
    rooms[i] = new ChessRoom(rooms[i]);
}

function getRoom(roomName) {
    for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].roomName == roomName) {
            return rooms[i];
        }
    }
}

function validate(data) {
    if (data != null) {
        return true;
    }
    
    if (data != undefined) {
        return true;
    }
    
    return false;
}

io.on('connection', function (socket) {
    
    console.log('Connection detected');
    
    var updateRoomStatus = function() {
        io.sockets.in(socket.room).emit('roomInfoUpdate', rooms);
    };
    
    socket.on('requestUpdateRoomStatus', function() {
        updateRoomStatus();
    });
    
    socket.on('enterRoom', function (data) {
        var data = JSON.parse(data);
        socket.join(data.room);
        socket.room = data.room;
        socket.userName = data.user;
        console.log(data);
        io.sockets.in(socket.room).emit('gm', {
            all: true,
            message: '用户[' + data.user + ']已进入此房间'
        });
        var theRoom = getRoom(socket.room);
        if (!theRoom) return ;
        theRoom.humans += 1;
        io.sockets.in(socket.room).emit('gm', {
            all: false,
            to: data.user,
            message: '欢迎来到房间' + socket.room
        });
    });
    
    socket.on('chat', function (msg) {
        console.log(msg);
        var data = JSON.parse(msg);
        var user = data.user,
            message = data.message;
        console.log(socket.room);
        io.sockets.in(socket.room).emit('chatMsg', {
            user: user,
            message: message
        });
    });
    
    socket.on('requestUpdate', function (msg) {
        var data = JSON.parse(msg);
        var theRoom = getRoom(socket.room);
        if (!theRoom) return ;
        var toSend = {
            start: false,
            gameState: theRoom.gameState,
            black: null,
            white: null
        };
        console.log('black:'+theRoom.black);
        console.log('white:'+theRoom.white);
        if (!validate(theRoom.black)) {
            theRoom.black = data.user;
            toSend.black = data.user;
        } else if (!validate(theRoom.white)) {
            theRoom.white = data.user;
            toSend.white = data.user;
        }
        if (validate(theRoom.black) && validate(theRoom.white)) {
            toSend.start = theRoom.determine();
            toSend.black = theRoom.black;
            toSend.white = theRoom.white;
        }
        io.sockets.in(socket.room).emit('updateGame', toSend);
    });
    
    socket.on('depoly', function (msg) {
        console.log(msg);
        var msg = JSON.parse(msg);
        var theRoom = getRoom(socket.room);
        theRoom.deployChess(msg.position, msg.player);
        var toSend = {
            start: theRoom.determine(),
            gameState: theRoom.gameState,
            black: theRoom.black,
            white: theRoom.white
        };
        io.sockets.in(socket.room).emit('updateGame', toSend);
    });
    
    socket.on('clear', function (msg) {
        var theRoom = getRoom(socket.room);
        if (!theRoom) return ;
        var msg = JSON.parse(msg);
        if (theRoom.requestRestartCount != 1) {
            theRoom.requestRestartCount = 1;
            io.sockets.in(socket.room).emit('requestRestart', msg);
            return ;
        }
        theRoom.clear();
        theRoom.requestRestartCount = 0;
        var toSend = {
            start: theRoom.determine(),
            gameState: theRoom.gameState,
            black: theRoom.black,
            white: theRoom.white,
            message: '请求已通过'
        };
        console.log('restarting game');
        io.sockets.in(socket.room).emit('updateGame', toSend);
    });
    
    socket.on('disagree', function () {
        var theRoom = getRoom(socket.room);
        theRoom.requestRestartCount = 0;
        io.sockets.in(socket.room).emit('refused');
    });
    
    socket.emit('ping', 'hehe');
    
    socket.on('disconnect', function () {
        var disconnector = socket.userName;
        var theRoom = getRoom(socket.room);
        if (!theRoom) return ;
        theRoom.humans -= 1;
        if (disconnector == theRoom.black || disconnector == theRoom.white) {
            theRoom.clear();
            if (disconnector == theRoom.black) {
                theRoom.black = null;
            } else {
                theRoom.white = null;
            }
        }
        var toSend = {
            start: false,
            gameState: theRoom.gameState,
            black: theRoom.black,
            white: theRoom.white,
            message: '用户[' + disconnector + ']已离开房间',
            disconnector: disconnector
        };
        if (theRoom.humans > 0) {
            io.sockets.in(socket.room).emit('updateGame', toSend);
        }
    });
    
});

module.exports = io;