/*jslint node: true */
"use strict";

function ChessRoom(roomName) {
    this.humans = 0;
    this.roomName = roomName;
    this.size = 15;
    this.black = null;
    this.white = null;
    this.gameState = []; // 黑棋: 1 白棋: -1
    for (var i = 0; i < this.size; i++) {
        var p = new Array();
        for (var j = 0; j < this.size; j++) {
            p.push(0);
        }
        this.gameState.push(p);
    }
}

ChessRoom.prototype.determine = function () {
    // todo:
    // 谁赢了
    
    // 该谁下
    var sum = 0;
    var hasSpace = false;
    for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
            sum += this.gameState[i][j];
            if (this.gameState[i][j] === 0) {
                hasSpace = true;
            }
        }
    }
    if (!hasSpace) {
        return 'stop'; // 平局
    }
    if (sum === 0) {
        return 'black';
    } else {
        return 'white';
    }
};

// 落子
ChessRoom.prototype.deployChess = function (position, player) {
    if (player === 'black') {
        this.gameState[position.x][position.y] = 1;
    } else {
        this.gameState[position.x][position.y] = -1;
    }
};

// 清空
ChessRoom.prototype.clear = function () {
    this.gameState = []; // 黑棋: 1 白棋: -1
    for (var i = 0; i < this.size; i++) {
        var p = new Array();
        for (var j = 0; j < this.size; j++) {
            p.push(0);
        }
        this.gameState.push(p);
    }
};

module.exports = ChessRoom;