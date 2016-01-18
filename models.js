'use strict';

var BasicCURDModel = require('./curdModel');
var Promise = require('bluebird');
var obj2sql = require('./obj2sql');

var users = new BasicCURDModel('users');
var posts = new BasicCURDModel('posts');
var postContents = new BasicCURDModel('postContents');

//------user module------

users.reg = function (regInfo, onSuccess, onError) {
    regInfo.level = 0;
    regInfo.icon = '/img/icon.jpg';
    users.add(regInfo, onSuccess, onError);
};

users.login = function (loginInfo, onSuccess, onError) {
    users.find(loginInfo, null, function (rows) {
        if (rows.length > 0) {
            onSuccess(rows[0]);
        } else {
            onError();
        }
    }, function (err) {
        onError();
    });
};

users.getInfo = function (condition, onSuccess, onError) {
    users.find(condition, {
        a: 0,
        b: 1
    }, function (rows) {
        onSuccess(rows[0]);
    }, function (err) {
        onError(err);
    });
};

users.updateInfo = function (condition, data, onSuccess, onError) {
    users.update(condition, data, onSuccess, onError);
};

//------post module------
posts.addNewPost = function (post, onSuccess, onError) {
    var sql = 'INSERT INTO ' + this.tableName + obj2sql(post.title, 'insert'),
        sql2 = 'SELECT last_insert_rowid() AS rowid FROM ' + this.tableName;
    posts.directSQLAsync = Promise.promisify(posts.directSQL);
    posts.directSQLAsync(sql).then(function (data) {
        return posts.directSQLAsync(sql2);
    }).then(function (data) {
        var lzPostReply = post.content;
        lzPostReply.pid = data[0].rowid;
        return lzPostReply;
    }).then(function (lzPostReply) {
        postContents.addNewReply(lzPostReply, onSuccess, onError);
    }).error(onError);
};

posts.list = function (paging, onSuccess, onError) {
    var sql = 'SELECT * FROM (SELECT * FROM posts JOIN users USING (uid))'
    if (paging) {
        sql = sql + ' LIMIT' + paging.a + ',' + paging.b;
    }
    posts.directSQL(sql, onSuccess, onError);
};

//------post content------
postContents.addNewReply = function (reply, onSuccess, onError) {
    postContents.add(reply, onSuccess, onError);
};

postContents.viewPost = function (post, onSuccess, onError) {
    var pageData = {
        'title' : null,
        'pid' : post,
        'replyList' : []
    }, condition = {
        'pid' : post
    };
    posts.find(condition, null, function (data) {
        pageData.title = data[0].title;
        var sql = 'SELECT * FROM (SELECT * FROM postContents JOIN users USING (uid)) WHERE ' + obj2sql(condition, 'condition');
        posts.directSQL(sql, function (err, data) {
            if (err) {
                onError(err);
            } else {
                pageData.replyList = data;
                onSuccess(pageData);
            }
        });
    }, onError);
};

module.exports = function (name) {
    switch (name) {
    case 'users':
        return users;
    case 'posts':
        return posts;
    case 'postContents':
        return postContents;
    default:
        return 'fail';
    }
};
