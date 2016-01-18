
/*jslint node: true */
"use strict";

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data.db');
var obj2sql = require('./obj2sql');

db.run('CREATE TABLE IF NOT EXISTS users (uid INTEGER PRIMARY KEY ASC AUTOINCREMENT, username TEXT UNIQUE, password TEXT, level INTEGER, icon TEXT)');
db.run('CREATE TABLE IF NOT EXISTS posts (pid INTEGER PRIMARY KEY ASC AUTOINCREMENT, uid INTEGER, title TEXT)');
db.run('CREATE TABLE IF NOT EXISTS postContents (cid INTEGER PRIMARY KEY ASC AUTOINCREMENT, pid INTEGER, uid INTEGER, content TEXT)');

var BasicCURDModel = function (tableName) {
    
    this.tableName = tableName;
    
    // add
    BasicCURDModel.prototype.add = function (data, onSuccess, onError) {
        var sql = 'INSERT INTO ' + this.tableName + obj2sql(data, 'insert');
        db.run(sql, function (err) {
            if (err) {
                onError(err);
            } else {
                onSuccess(err);
            }
        });
    };
    
    // update
    BasicCURDModel.prototype.update = function (condition, data, onSuccess, onError) {
        var sql = 'UPDATE ' + this.tableName + ' SET ' + obj2sql(data, 'update') + ' WHERE ' + obj2sql(condition, 'condition');
        db.run(sql, function (err) {
            if (err) {
                onError(err);
            } else {
                onSuccess(err);
            }
        });
    };
    
    // find
    BasicCURDModel.prototype.find = function (condition, limit, onSuccess, onError) {
        var sql;
        if (condition) {
            sql = 'SELECT * FROM ' + this.tableName + ' WHERE ' + obj2sql(condition, 'condition');
        } else {
            sql = 'SELECT * FROM ' + this.tableName;
        }
        if (limit) {
            sql = sql + ' LIMIT ' + limit.a + ',' + limit.b;
        }
        db.all(sql, function (err, rows) {
            if (!err) {
                onSuccess(rows);
            } else {
                onError(err);
            }
        });
    };
    
    // delete
    BasicCURDModel.prototype.remove = function (condition, onSuccess, onError) {
        db.run('DELETE FROM ' + this.tableName + ' WHERE ' + obj2sql(condition, 'condition'), function (err) {
            if (err) {
                onError(err);
            } else {
                onSuccess(err);
            }
        });
    };
    
    // direct sql
    BasicCURDModel.prototype.directSQL = function (sql, callback) {
        db.all(sql, callback);
    };
    
};

module.exports = BasicCURDModel;