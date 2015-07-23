/*
微信企业号标签管理
*/

var express = require('express'),
    router = express.Router();
var wxent = require('wechat-enterprise');
var mysql = require('mysql');
var config = require('../../config/config');

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

var EventHandlers = {
    /* 获取我创建的任务 */
	'created_by_me': function (msg, req, res, next) {
        res.reply('ok'); // test case 1

        // test case 2
        var conn = mysql.createConnection(config.wss_db);
        conn.connect();
        conn.query('select ...', function (err, rows, fields) {
        	if(err) res.reply(JSON.stringify(err));
        	else {
        		res.reply('mysql conn success');
        	}
        });
        conn.end();

        // test case 3
	}
};

var TextProcessHandlers = {
};

var wxcfg = {
    token: config.notice.token,
    encodingAESKey: config.notice.aesKey,
    corpId: config.qyh.corpId,
    secret: config.qyh.secret,
    agentId: config.notice.agentId
};

module.exports = function (app, cfg) {
    app.use(express.query());
    app.use('/task-notice', router);

    router.use('/', wxent(wxcfg, wxent.event(handleEvent(EventHandlers))));
};