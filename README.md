# WSS任务推送微信接口
当WSS系统分派任务后，自动将任务通过微信推送给指定用户。

## 如何使用

### 1. 在docker中使用

#### 1.1 编译Docker镜像

1. 下载程序代码
	`git clone https://github.com/nagucc/wss-wx.git`
	
2. 执行`build`命令：
	`docker build -t ynuae/wss-wx .`
	
#### 1.2 运行Docker容器

由于此镜像已发布到DockerHub上，因此，最终用户可以不用`build`镜像，直接运行容器即可。

1. 打开程序中的`docker/docker-compose.yml`文件
2. 填入必要的参数
    - `QYH_CORPID=corpId` 微信企业号`corpId`
    - `QYH_SECRET=secret` 应用所在组的`secret`
    - `NOTICE_TOKEN=token` 用于推送通知的应用的`token`
    - `NOTICE_AESKEY=aeskey` 用于推送通知的应用的`AESKey`
    - `NOTICE_AGENTID=4` 推送通知的应用的`Id`
    - `USER_TOKEN=token` 用于设置用户关联的应用的`token`
    - `USER_AESKEY=aeskey` 
    - `USER_AGENTID=26`
    - `WSS_DB_URI=mysql://user:pass@host/tankdb` WSS系统数据库的连接字符
3. 保存并关闭文件
4. 使用`docker-compose`运行容器：`docker-compose up`

### 2. 在微信企业号端的设置

#### 2.1 任务通知推送
按要求设置`token`和`AESKEY`，URL的地方填写`http://yourdomain/task-notice` 

#### 2.2 用户关联
TODO