var socket = io.connect('http://' + location.hostname + ':8388');

function renderRoom(roomName, black, white) {
    if (black) {
        $.get('/do_getUserInfo?username=' + black, function(data) {
            $('#' + roomName+'>.panel-body>.spDesk>.left>img').attr({
                src: data.icon
            });
        });
    } else {
        $('#' + roomName+'>.panel-body>.spDesk>.left>img').attr({
                src: '/img/unknow.png'
            });
    }
    if (white) {
        $.get('/do_getUserInfo?username=' + white, function(data) {
            $('#' + roomName+'>.panel-body>.spDesk>.right>img').attr({
                src: data.icon
            });
        });
    } else {
        $('#' + roomName+'>.panel-body>.spDesk>.right>img').attr({
                src: '/img/unknow.png'
            });
    }
}

function renderRoomList(roomData) {
    for (var i = 0; i < roomData.length; i++) {
        var baseSelector = '#' + roomData[i].roomName;
        $(baseSelector).removeClass('panel-success').removeClass('panel-info');
        if (roomData[i].black != null && roomData[i].white != null) {
            $(baseSelector + '>.panel-heading').html('游戏中');
            $(baseSelector).addClass('panel-info');
        } else {
            $(baseSelector + '>.panel-heading').html('等待中');
            $(baseSelector).addClass('panel-success');
        }
        $(baseSelector + 'blackPlayer').html(roomData[i].black);
        $(baseSelector + 'whitePlayer').html(roomData[i].white);
        renderRoom(roomData[i].roomName, roomData[i].black, roomData[i].white)
    }
}

socket.on('roomInfoUpdate', function(data) {
    console.log(data);
    renderRoomList(data);
});

socket.emit('enterRoom', JSON.stringify({
    room: 'roomList',
    user: 'tttttt'
}));

window.setInterval(function() {
    socket.emit('requestUpdateRoomStatus');
}, 300);
//socket.emit('requestUpdateRoomStatus');