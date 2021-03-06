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

// 检查是否有WSS任务，如有，则向相应用户发送通知。
var taskNotice = function(){
    
    var ep = new EventProxy();
        
    // 统一的出错处理
    ep.fail(function(err){
        console.log('something is wrong:' + err);
    });
    ep.all('tasks',  function(tasks){
        console.log('tasks & wxapi are ready, tasks.length=' + tasks.length);
        var max_tid = 0;
        tasks.forEach(function(task) {
            console.log('send msg to task.csa_to_user: ' + task.csa_to_user);
            max_tid = Math.max(max_tid, task.TID);
            client.get('user.qyhid:'+task.csa_to_user, function(err, user){
                if(err) {
                    ep.throw(err);
                    return;
                }
                var wxapi = require('../models/wxapi')(wxcfg);
                wxapi.send({touser: user}, {
                    msgtype: 'text',
                    text:{
                        content: 'WSS新任务: ' + task.csa_text
                    }
                }, function(){ console.log('send msg to user: ' + user); });
            });
        });
        if(tasks.length){                                   // 只有在有消息被发送的时候才修改min_tid的值。
            console.log('set max_tid = '+ max_tid);
            client.set('wss.notice.min_tid', max_tid);
        }
    });      
    
    // 获取上次处理的任务的最大id，并获取所有未通知处理的任务数据
    client.get('wss.notice.min_tid', function(err, min_tid){
        console.log('wss.notice.min_tid is ready');
        if(err) ep.throw(err);
        else {
            if(!min_tid) min_tid = 0;
            var conn = mysql.createConnection(config.wss_db);
            conn.connect();
            console.log('starting to query mysql and tid = ' + min_tid);
            conn.query('SELECT * FROM tk_task where tid >' + min_tid, ep.done('tasks'));
            conn.end();
        }
    });
}

var EventHandlers = {
    /* 获取我创建的任务 */
	'created_by_me': function (msg, req, res, next) {
	}
};

var TextProcessHandlers = {
};


var checkNewNotice = function(){
    taskNotice();
    setTimeout(checkNewNotice, 10000);
};

module.exports = function (app, cfg) {
    // app.use(express.query());
    app.use('/task-notice', router);

    router.use('/', wxent(wxcfg, wxent.event(handleEvent(EventHandlers))));
    
    checkNewNotice();
};