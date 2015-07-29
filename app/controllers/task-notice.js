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
client.on("error", function (err) {
    console.log("Error " + err);
});
var MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID;

var EventProxy = require('eventproxy');
    

var wxcfg = {
    token: config.notice.token,
    encodingAESKey: config.notice.aesKey,
    corpId: config.qyh.corpId,
    secret: config.qyh.secret,
    agentId: config.notice.agentId
};



    


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


var initUserList = function () {
	client.set('user:qyhid:2', 'na57');
}



var EventHandlers = {
    /* 获取我创建的任务 */
	'created_by_me': function (msg, req, res, next) {
        
        var ep = new EventProxy();
        
        // 统一的出错处理
        ep.fail(function(err){
            res.reply(JSON.stringify(err));
        });
        ep.all('taks', 'wxapi', function(tasks, wxapi){
            res.reply('tasks, wxapi');
            // wxapi.send({touser: 'na57'}, {
            //     msgtype: 'text',
            //     text:{
            //         content: 'test msg'
            //     }
            // }
        });      
        
        // 获取上次处理的任务的最大id，并获取所有未通知处理的任务数据
        client.get('wss.notice.min_tid', function(err, min_tid){
            if(err) ep.throw(err);
            else {
                if(!min_tid) min_tid = 0;
                else {
                    var conn = mysql.createConnection(config.wss_db);
                    conn.connect();
                    conn.query('SELECT * FROM tk_task where tid >' + min_tid, ep.done('tasks'));
                    conn.end();
                }
            }
        });
        
        // 连接Mongo数据库，并准备wxapi
        MongoClient.connect(config.db, function (err, db) {
            if(err) ep.throw(err);
            else {
                wxcfg.db = db;
                var wxapi = require('../models/wxapi')(wxcfg);
                ep.emit('wxapi', wxapi);
            }
        });
	}
};

var TextProcessHandlers = {
};

module.exports = function (app, cfg) {
    // app.use(express.query());
    app.use('/task-notice', router);

    initUserList();

    router.use('/', wxent(wxcfg, wxent.event(handleEvent(EventHandlers))));
};