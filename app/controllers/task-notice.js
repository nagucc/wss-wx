/*
微信企业号标签管理
*/

var express = require('express'),
    router = express.Router();
var wxent = require('wechat-enterprise');
var mysql = require('mysql');
var config = require('../../config/config');
var redis = require('redis'),
	client = redis.createClient(6379, 'redis', {});


var wxcfg = {
    token: config.notice.token,
    encodingAESKey: config.notice.aesKey,
    corpId: config.qyh.corpId,
    secret: config.qyh.secret,
    agentId: config.notice.agentId
};


client.on("error", function (err) {
    console.log("Error " + err);
});

var MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID;
    
MongoClient.connect(config.db, function (err, db) {
    ep.emit('mongo', db);
    console.log('mongodb success');
});

/*
 微信事件消息处理程序。
    - 返回 function(msg, req, res, next)
        - 接收到正确消息时，返回消息处理结果；
        - 接收到不能处理的消息时，返回“正在建设中”提示
        - 出错时返回错误提示
    - 参数 eventHandlers
    {
        key: function (msg, req, res, next) {
            // 消息处理代码
        }
    }

*/
var handleEvent = function (eventHandlers) {
    return function (msg, req, res, next) {
        try {
            if (eventHandlers[msg.EventKey]) {
                eventHandlers[msg.EventKey](msg, req, res, next);
            } else {
                res.reply('正在建设中：' + msg.EventKey);
            }
        } catch(err){
            res.reply('出现错误，请截图并与管理员联系。\n错误信息：' + err.toString());
        }
    }
};

var handleText = function (textHandlers, sessionName) {
    return function (msg, req, res, next) {
        try {
            if (req.wxsession[sessionName]) {
                textHandlers[req.wxsession[sessionName]](msg, req, res, next);
            } else {
                res.reply('正在建设中~');
            }
        } catch(err){
            res.reply('出现错误，请截图并与管理员联系。\n错误信息：' + err.toString());
        }
    };
};

var EventProxy = require('eventproxy');
var ep = new EventProxy();
var initUserList = function () {
	client.set('user:qyhid:2', 'na57');
}


/*
 查询新任务，并将新任务推送到用户微信端
*/
// var noticeNewTask = function(){
//     ep.all('min_tid', function(min_tid){
//         var conn = mysql.createConnection(config.wss_db);
//         conn.connect();
//         conn.query('SELECT * FROM tk_task where tid > ' + min_tid, function (err, rows, fields) {
        	
//         });
//         conn.end();
//     });
// }
var EventHandlers = {
    /* 获取我创建的任务 */
	'created_by_me': function (msg, req, res, next) {
        ep.all('min_tid', 'mongo', function(min_tid,db){
            // res.reply(config.wss_db);
            var conn = mysql.createConnection(config.wss_db);
            conn.connect();
            conn.query('SELECT * FROM tk_task where tid >' + min_tid, function (err, rows, fields) {
            	if(err) res.reply(JSON.stringify(err));
                // else res.reply(JSON.stringify(rows.length));
                else {
                    console.log('ready send msg');
                    wxcfg.db = db;
                    var wxapi = require('../models/wxapi')(wxcfg);
                    wxapi.send({touser: 'na57'}, {
                        msgtype: 'text',
                        text:{
                            content: 'test msg'
                        }
                    }, function(err, result){
                        res.reply('send done');
                    });
                }
            });
            conn.end();
        });
        
        // 获取上次处理的任务id
        client.get('min_tid', function (err, tid) {
            if(err || !tid) tid = 0;
        	ep.emit('min_tid', tid);
            console.log('min_tid done: ' + tid);
        });
	}
};

var TextProcessHandlers = {
};



module.exports = function (app, cfg) {
    app.use(express.query());
    app.use('/task-notice', router);

    initUserList();

    

    router.use('/', wxent(wxcfg, wxent.event(handleEvent(EventHandlers))));
};