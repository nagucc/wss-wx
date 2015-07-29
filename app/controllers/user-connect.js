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
    token: config.user.token,
    encodingAESKey: config.user.aesKey,
    corpId: config.qyh.corpId,
    secret: config.qyh.secret,
    agentId: config.user.agentId
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
	client.set('user.qyhid:2', 'na57');
	client.set('user.qyhid:3', 'thiswind');
    // 字凤芹
	client.set('user.qyhid:4', 'te8a0f7834bec4fa98f22c4e8a99e9b95');
	
    // 牛进
    client.set('user.qyhid:6', 't2dfdbebc7d3b40349a7a342c667f94f1');
	
    // 资月玲
    client.set('user.qyhid:7', 'ziyueling');
	
    // 李洋
    client.set('user.qyhid:8', 'liyang');
	
    // 刘东华
    client.set('user.qyhid:9', 'liudonghua');
	
    // 白扬
    client.set('user.qyhid:10', 'baiyang');
	
    // 周垚
    client.set('user.qyhid:11', 'jzg20130082');
    
}



var EventHandlers = {
    /* 获取我创建的任务 */
	'init': function (msg, req, res, next) {
        initUserList();
		res.reply('done');
	}
};

var TextProcessHandlers = {
};

module.exports = function (app, cfg) {
    app.use('/user-connect', router);

    router.use('/', wxent(wxcfg, wxent.event(handleEvent(EventHandlers))));
};