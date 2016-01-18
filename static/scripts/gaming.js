$(document).on('ready', function () {
    
    var qpSize = 15;
    
    var toMove = false,
        userToMove = null,
        blackuser = null,
        whiteuser = null,
        blackLevel = null,
        whiteLevel = null,
        maxTime = 30,
        timeLeft = null,
        downClock = null,
        gameState = null;
    
    function nl2br(str, is_xhtml) {
        var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br ' + '/>' : '<br>';
        return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2').replace(/[\n]/g, '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    
    function updateLevel(selector, level) {
        var num = level - parseInt(level);
        console.log(num);
        $(selector).css('width', (num * 100) + '%');
    }
    
    function timePass() {
        var tRes = 0;
        timeLeft = timeLeft - 1;
        console.log('passing' + timeLeft);
        $('#tLeft').css('width', (timeLeft / maxTime * 100) + '%');
        if (timeLeft == 0) {
            console.log('t:'+timeLeft);
            if (toMove == 'black') {
                tRes = -1;
            } else {
                tRes = 1;
            }
        }
        if (tRes != 0) {
            gameEnd(tRes);
        }
    }
    
    function loadUserInfo(user, type) {
        var selector, selectorLevel, selectorIcon, selectorProgress;
        if (type == 'black') {
            selector = '#usernameBlack';
            selectorLevel = '#stBlack';
            selectorIcon = '#iconBlack';
            selectorProgress = '#pBlack';
        } else {
            selector = '#usernameWhite';
            selectorLevel = '#stWhite';
            selectorIcon = '#iconWhite';
            selectorProgress = '#pWhite';
        }
        if (!user) {
            $(selector).html('等待中');
            $(selectorLevel).html('......');
            $(selectorIcon).attr({'src' : '/img/iconnobody.png'})
            return ;
        }
        $.get('/do_getUserInfo?username=' + user, function (data) {
            if (currentUser == data.username) {
                $(selector).html(data.username + ' (你)');
            } else {
                $(selector).html(data.username);
            }
            $(selectorLevel).html('等级：' + parseInt(data.level));
            $(selectorIcon).attr({'src' : data.icon});
            updateLevel(selectorProgress, data.level);
            if (type == 'black') {
                blackLevel = data.level;
            } else {
                whiteLevel = data.level;
            }
        });
    }
    
    function check5line(str) {
        if (str.indexOf('11111') > -1) {
            var t = str.indexOf('11111');
            if (str[t - 1] !== '-') {
                return 1;
            } else if (str.indexOf('111111') > -1) {
                return 1;
            }
        } else if (str.indexOf('-1-1-1-1-1') > -1) {
            return -1;
        }
        return 0;
    }
    
    function renderGamePad(gameState) {
        var toModify;
        var t;
        for (var i = 0; i < qpSize; i++) {
            for (var j = 0; j < qpSize; j++) {
                toModify = '#' + i.toString() + '-' + j.toString();
                t = gameState[i][j];
                switch(t) {
                    case 1:
                        $(toModify).addClass('blackChess').removeClass('whiteChess');
                        break;
                    case -1:
                        $(toModify).addClass('whiteChess').removeClass('blackChess');
                        break;
                    default:
                        $(toModify).removeClass('whiteChess').removeClass('blackChess');
                }
            }
        }
    }
    
    function mapCheck(arr) {
        for (var i = 0; i < arr.length; i++) {
            if (check5line(arr[i]) != 0) {
                return check5line(arr[i]);
                console.log(i);
                console.log(arr[i]);
            }
        }
        console.log('no t');
        return 0;
    }
    
    function checkPad() {
        var arr = [];
        for (var i = 0; i < qpSize; i++) {
            var pa = '';
            var pb = '';
            for (var j = 0; j < qpSize; j++) {
                pa = pa + gameState[i][j].toString();
                pb = pb + gameState[j][i].toString();
            }
            arr.push(pa);
            arr.push(pb);
        }
        var x = 0,
            y = 0;
        for (var x = 0; x < qpSize-4; x++) {
            var pa = '';
            var pb = '';
            var pc = '';
            var pd = '';
            for (var y = x; y < qpSize; y++) {
                pa = pa + gameState[y][y - x].toString();
                pb = pb + gameState[y - x][y].toString();
                pc = pc + gameState[qpSize - 1 - y][y - x].toString();
                pd = pd + gameState[qpSize - 1 - y + x][y].toString();
            }
            arr.push(pa);
            arr.push(pb);
            arr.push(pc);
            arr.push(pd);
        }
        console.log(arr);
        return mapCheck(arr);
    }
    
    function isGameStart() {
        for (var i = 0; i < qpSize; i++) {
            for (var j = 0; j < qpSize; j++) {
                if (gameState[i][j] != 0) {
                    return false;
                }
            }
        }
        if (!blackuser || !whiteuser) {
            return false;
        }
        return true;
    }
    
    var socket = io.connect('http://'+location.hostname+':8388');
    
    var roomMessage = {
        user: currentUser,
        room: roomId
    };
    
    socket.emit('enterRoom', JSON.stringify(roomMessage));
    
    var sendMessage = function () {
        if ($('#content').val() == '') {
            return ;
        }
        var msg = {
            user: currentUser,
            message: nl2br($('#content').val())
        };
        socket.emit('chat', JSON.stringify(msg));
        $('#content').val('');
    };
    
    $('#send').on('click', sendMessage);
    $('body').keypress(function (e) {
        if (e.which == 13) {
            sendMessage();
        }
    });
    
    socket.on('ping', function (obj) {
        console.log(obj);
    });
    
    function toCn(x) {
        if (x == 'black') {
            return '黑子';
        } else if (x == 'white') {
            return '白子';
        }
        return 'ERROR';
    }
    
    function gmSpeak(message) {
        var ids = '<span class="green">[GM]:</span>';
        $('#chatContent').append(ids + message + '<br />');
        $('#chatContent').scrollTop($('#chatContent')[0].scrollHeight);
    }
    
    function gameEnd(result) {
        gmSpeak('游戏结束');
        if (result == 1) {
            msg = '黑方[' + blackuser + ']获得胜利';
            blackLevel = blackLevel + 0.2;
            //blackLevel = blackLevel + 0.2 * whiteLevel + 0.5;
            //whiteLevel = whiteLevel + 0.1;
        } else {
            msg = '白方[' + whiteuser + ']获得胜利';
            whiteLevel = whiteLevel + 0.2;
            //whiteLevel = whiteLevel + 0.2 * blackLevel + 0.5;
            //blackLevel = blackLevel + 0.1;
        }
        gmSpeak(msg);
        updateLevel('#pBlack', blackLevel);
        updateLevel('#pWhite', whiteLevel);
        $('#winner').html(msg);
        userToMove = null;
        toMove = null;
        $('.det').html('游戏结束');
        $('#endgameBox').removeClass('hidden');
        $.post('/gameEnd', {
            'blackName': blackuser,
            'whiteName': whiteuser,
            'blackScore': blackLevel,
            'whiteScore': whiteLevel
        }, function (data) {
            if (data == 'ok') {
                $('#stBlack').html('等级：' + parseInt(blackLevel));
                $('#stWhite').html('等级：' + parseInt(whiteLevel));
            }
        });
        window.clearInterval(downClock);
    }
    
    socket.on('updateGame', function (data) {
        console.log('Updating game status');
        console.log(data);
        timeLeft = maxTime + 1;
        console.log('Timeleft:' + timeLeft);
        if (blackuser != data.black || whiteuser != data.white) {
            blackuser = data.black;
            whiteuser = data.white;
            loadUserInfo(blackuser, 'black');
            loadUserInfo(whiteuser, 'white');
            if (currentUser != blackuser && currentUser != whiteuser) {
                $('.requestRestart').addClass('hidden');
            }
        }
        if (data.message) {
            gmSpeak(data.message);
            if (data.start == false && data.message.indexOf('离开') > -1) {
                var leaver = data.disconnector;
                var tResult = 0;
                if (leaver == blackuser) {
                    tResult = -1;
                } else if (leaver == whiteuser) {
                    tResult = 1;
                }
                if (tResult != 0) {
                    gameEnd(tResult);
                }
            }
        }
        gameState = data.gameState;
        renderGamePad(data.gameState);
        if (isGameStart()) {
            gmSpeak('游戏开始！');
            $('#endgameBox').addClass('hidden');
            $('#confirmRestart').addClass('hidden');
            $('.requestRestart').removeAttr('disabled');
            timeLeft = maxTime + 1;
            downClock = window.setInterval(timePass, 1000);
        }
        var result = checkPad();
        var msg = '';
        console.log(result);
        if (result != 0) {
            gameEnd(result);
            return ;
        }
        toMove = data.start;
        if (toMove == 'black') {
            userToMove = data.black;
            $('#uBlack').addClass('activePlayer');
            $('#uWhite').removeClass('activePlayer');
        } else if (toMove == 'white') {
            userToMove = data.white;
            $('#uBlack').removeClass('activePlayer');
            $('#uWhite').addClass('activePlayer');
        } else {
            userToMove = toMove;
            $('#uBlack').removeClass('activePlayer');
            $('#uWhite').removeClass('activePlayer');
        }
        if (userToMove) {
            $('.det').html('轮到使用' + toCn(toMove) + '的：' + userToMove);
        }
        $('.vs').html(data.black + ' VS ' + data.white);
    });
    
    socket.on('gm', function (data) {
        if (!data.all) {
            if (data.user != currentUser) {
                return ;
            }
        }
        var ids = '<span class="green">[GM]:</span>';
        $('#chatContent').append(ids + data.message + '<br />');
        $('#chatContent').scrollTop($('#chatContent')[0].scrollHeight);
    });
    
    socket.on('chatMsg', function (data) {
        console.log('Message arrive');
        var ids;
        var user = data.user;
        console.log(data);
        if (data.user == currentUser) {
            ids = '<span class="red">[' + user + ']:</span>';
        } else {
            ids = '<span class="blue">[' + user + ']:</span>';
        }
        $('#chatContent').append(ids + data.message + '<br />');
        $('#chatContent').scrollTop($('#chatContent')[0].scrollHeight);
    });
    
    socket.on('requestRestart', function (data) {
        gmSpeak('用户[' + data.user + ']请求重新开始');
        var isPlayer = (currentUser == blackuser || currentUser == whiteuser);
        if (data.user != currentUser && isPlayer) {
            // $('#endgameBox').addClass('hidden');
            $('#confirmRestart').removeClass('hidden');
        }
    });
    
    socket.on('refused', function () {
        gmSpeak('请求被拒绝');
        $('.requestRestart').removeAttr('disabled');
    });
    
    $('.game-cell').on('click', function () {
        var id = $(this).attr('id');
        id = id.split('-');
        var x = id[0];
        var y = id[1];
        console.log('clicked');
        if (userToMove == currentUser && gameState[x][y] == 0) {
            var toSend = {
                position: {
                    x: x,
                    y: y
                },
                player: toMove
            };
            console.log(toSend);
            socket.emit('depoly', JSON.stringify(toSend));
            console.log('depolyed');
        }
    });
    
    $('#start').on('click', function () {
        console.log('start clicked');
        socket.emit('requestUpdate', JSON.stringify({
            user: currentUser
        }));
    });
    
    $('#reset').on('click', function () {
        socket.emit('clear');
    });
    
    $('.requestRestart').on('click', function () {
        var toSend = {
            user: currentUser
        };
        socket.emit('clear', JSON.stringify(toSend));
        $('.requestRestart').attr({
            'disabled': 'disabled'
        });
    });
    
    $('#agree').on('click', function () {
        var toSend = {
            user: currentUser
        };
        socket.emit('clear', JSON.stringify(toSend));
        $('#confirmRestart').addClass('hidden');
    });
    
    $('#disagree').on('click', function () {
        socket.emit('disagree');
        $('#confirmRestart').addClass('hidden');
    });
    
    socket.emit('requestUpdate', JSON.stringify({
        user: currentUser
    }));
});