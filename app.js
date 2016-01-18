#!/usr/bin/env node

/*jslint node: true */
"use strict";


var express = require('express');
var io = require('./roomserver');
var sqlite3 = require('sqlite3').verbose();
var path = require('path');
var fs = require('fs');
var ejs = require('ejs');
var session = require('express-session');
var models = require('./models');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var Busboy = require('busboy');
var fs = require('fs');

var server = express();

server.use(express.static(__dirname + '/static'));
server.use(session({ secret: 'keyboard cat', cookie: { maxAge: 9600000 }}));
server.engine('.html', require('ejs').__express);
server.set('view engine', 'html');
server.set('views', __dirname + '/static/templates');
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

var isLogin = function (req) {
    return req.session.uid > 0;
};

function nl2br(str, is_xhtml) {
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br ' + '/>' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2').replace(/[\n]/g, '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

var md5 = function (str) {
    var hashObj = crypto.createHash('md5');
    hashObj.update(str);
    return hashObj.digest('hex');
}

// server.use(loginChecker);

// ------载入模型------

var users = models('users');
var posts = models('posts');
var postContents = models('postContents');

// 页面

server.get('/', function (req, res) {
    res.redirect('/index');
    res.end();
});

server.get('/login', function (req, res) {
    res.render('login', {
        'title' : '登陆',
        'user' : isLogin(req)
    });
    res.end();
});

server.get('/rooms', function (req, res) {
    res.render('rooms', {
        'title' : '房间列表',
        'user' : isLogin(req)
    });
    res.end();
});

server.get('/index', function (req, res) {
    res.render('index', {
        'title' : '首页',
        'user' : isLogin(req)
    });
});

server.get('/reg', function (req, res) {
    res.render('reg', {
        'title' : '注册',
        'user' : isLogin(req)
    });
});

server.get('/me', function (req, res) {
    if (!isLogin(req, res)) {
        res.redirect('/login');
        res.end();
        return ;
    }
    var condition = {
        'uid' : req.session.uid
    };
    users.getInfo(condition, function (data) {
        res.render('me', {
            'title' : '关于我',
            'user' : req.session.uid,
            'username' : data.username,
            'level' : data.level,
            'icon' : data.icon
        });
    }, function () {
        console.log('Error occured');
        res.redirect('/error');
        res.end();
    });
});

server.get('/error', function (req, res) {
    res.render('error', {
        'title' : '出错了',
        'user' : isLogin(req)
    });
});

// ------用户模块------
server.post('/do_reg', function (req, res) {
    var regInfo = {
        username: req.body.username,
        password: md5(req.body.password),
        'level' : 0,
        'icon' : '/img/icon.jpg'
    };
    users.add(regInfo, function () {
        res.write('OK');
        res.end();
    }, function (err) {
        console.error(err);
        res.write('fail');
        res.end();
    });
});

server.post('/do_login', function (req, res) {
    var regInfo = {
        'username' : req.body.username,
        'password' : md5(req.body.password)
    };
    users.login(regInfo, function (data) {
        req.session.uid = data.uid;
        res.write('OK');
        res.end();
    }, function () {
        res.write('fail');
        res.end();
    });
});

server.get('/do_logout', function (req, res) {
    req.session.uid = false;
    res.write('OK');
    res.end();
});

server.get('/do_getUserInfo', function (req, res) {
    var username = req.query.username;
    var condition = {
        username: username
    };
    users.getInfo(condition, function (data) {
        res.send(data);
        res.end();
    });
});

server.post('/do_uploadIcon', function (req, res) {
    var busboy = new Busboy({headers: req.headers});
    var imgPath = '';
    console.log('uploading');
    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        console.log('t1');
        var t = Number(new Date());
        var s = filename.split('.');
        var extName = s[s.length - 1];
        imgPath = '/upload/' + t + '.' + extName;
        var saveTo = './static' + imgPath;
        file.pipe(fs.createWriteStream(saveTo));
        console.log('uploading');
    });
    busboy.on('error', function (err) {
        console.error(err);
    });
    busboy.on('finish', function () {
        var condition = {
            'uid': req.session.uid
        };
        console.log('UPLOAD OK');
        users.updateInfo(condition, {
            'icon': imgPath
        }, function(){}, function(){});
        res.write('ok');
        res.end();
    });
    return req.pipe(busboy);
});

// ------讨论模块------
server.get('/discussion', function (req, res) {
    posts.list(null, function (err, data) {
        if (err) {
            res.redirect('/error');
            res.end();
            return ;
        }
        res.render('discussion', {
            'title' : '讨论区',
            'user' : isLogin(req),
            'postList' : data
        });
    }, function () {
        res.redirect('/error');
    });
});

server.post('/do_addPost', function (req, res) {
    if (!isLogin(req)) {
        res.write('login_required');
        res.end();
        return ;
    }
    var newPost = {
        'title' : {
            'uid' : req.session.uid,
            'title' : req.body.title
        },
        'content' : {
            'uid' : req.session.uid,
            'content' : nl2br(req.body.content)
        }
    };
    posts.addNewPost(newPost, function () {
        res.write('OK');
        res.end();
    }, function () {
        res.write('fail');
        res.end();
    });
});

server.get('/post', function (req, res) {
    var post = req.query.id;
    postContents.viewPost(post, function (data) {
        data.user = isLogin(req);
        data.nl2br = nl2br;
        res.render('post', data);
    }, function () {
        res.redirect('/error');
        res.end();
    });
});

server.post('/do_addReply', function (req, res) {
    if (!isLogin(req)) {
        res.write('login_required');
        res.end();
        return ;
    }
    var reply = {
        'pid' : req.body.pid,
        'uid' : req.session.uid,
        'content' : nl2br(req.body.content)
    };
    postContents.addNewReply(reply, function () {
        res.write('OK');
        res.end();
    }, function (err) {
        console.log(err);
        res.write('fail');
        res.end();
    });
});

//------roomPage------
server.get('/enterRoom', function (req, res) {
    if (!isLogin(req)) {
        res.write('login_required');
        res.end();
        return ;
    }
    var condition = {
        'uid' : req.session.uid
    };
    users.getInfo(condition, function (data) {
        res.render('enterRoom', {
            'title' : '房间',
            'user' : req.session.uid,
            'username' : data.username,
            'level' : data.level,
            'icon' : data.icon,
            'roomId' : req.query.roomId
        });
    }, function () {
        console.log('Error occured');
        res.redirect('/error');
        res.end();
    });
});

server.post('/gameEnd', function (req, res) {
    var blackName = req.body.blackName,
        whiteName = req.body.whiteName,
        blackScore = req.body.blackScore,
        whiteScore = req.body.whiteScore;
    var conditionBlack = {
        'username': blackName
    };
    var conditionWhite = {
        'username': whiteName        
    };
    users.updateInfo(conditionBlack, {
        'level': blackScore
    }, function() {}, function() {});
    users.updateInfo(conditionWhite, {
        'level': whiteScore
    }, function() {}, function() {});
    res.write('ok');
    res.end();
});

// ------统计API------
server.get('/hotpost', function (req, res) {
    posts.directSQL('SELECT * FROM (SELECT pid,count(*) AS pNum FROM postContents GROUP BY pid ORDER BY pNum DESC LIMIT 5) JOIN posts USING (pid)', function(err, data) {
        res.json(data);
        res.end();
    });
});

server.get('/hotuser', function (req, res) {
    users.directSQL('SELECT * FROM users ORDER BY level DESC limit 5', function(err, data) {
        res.render('hotuser', {
            data: data
        });
        res.end();
    });
});

server.listen(8888);
console.log('Server running at http://localhost:8888/');
