下次自己打开的完整步骤
第 1 步：确认 MySQL 已启动
当前已启动，但电脑重启后需要重做这一步。

图形方式：Win + R → 输入 services.msc → 找到 MySQL95 → 右键「启动」。

命令行方式（管理员 PowerShell）：

powershell
复制
Start-Service MySQL95
验证监听：

powershell
复制
netstat -ano | findstr :3306
看到 LISTENING 就说明 MySQL 已就绪。注意本机 MySQL 与 MySQL95 两个服务共用 3306 端口，只能启动其中一个，要启动的是 MySQL95。

第 2 步：启动 Flask 后端
打开 CMD（不要用 VSCode 的 Run Flask 按钮，原因见下方说明），依次执行：

bat
复制
cd /d "D:\C作业\互联网web作业报告\大作业\FinalWork\backend"
set PYTHONPATH=D:\lib\site-packages
"D:\Python\python.exe" app.py
窗口出现 Running on http://127.0.0.1:5000 即成功，这个窗口不能关，关掉服务就停。

关键点：D:\Python 是便携式安装，flask 和 pymysql 实际位于 D:\lib\site-packages，所以必须设置 PYTHONPATH，否则会报 ModuleNotFoundError: No module named 'flask'。

第 3 步：浏览器访问
打开 Edge 或 Chrome，访问 http://127.0.0.1:5000/ 。

第 4 步：停止服务
在 Flask 窗口按 Ctrl + C；若窗口已关但端口仍被占用：

bat
复制
taskkill /PID 20388 /T /F
cd /d "D:\C作业\互联网web作业报告\大作业\FinalWork\backend"
taskkill /PID 20388 /T /F