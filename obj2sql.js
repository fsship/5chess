'use strict';

var obj2sql = function (data, objType) {
    var keyList = Object.keys(data),
        total = [],
        valList = [];
    keyList.map(function (s) {
        if (objType === 'condition' || objType === 'update') {
            total.push(s + '=' + JSON.stringify(data[s]));
        } else {
            valList.push(JSON.stringify(data[s]));
        }
    });
    if (objType === 'condition') {
        return total.join(' AND ');
    } else if (objType === 'update') {
        return total.join(',');
    } else {
        return '(' + keyList.join(',') + ') VALUES (' + valList.join(',') + ')';
    }
};

module.exports = obj2sql;