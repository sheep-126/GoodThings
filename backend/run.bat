@echo off
chcp 936 >nul
title GoodThings Flask
cd /d "%~dp0"
set "PYTHONPATH=D:\lib\site-packages"
echo ============================================
echo  Flask 后端启动中...  （关闭本窗口即停止服务）
echo ============================================
"D:\Python\python.exe" app.py
echo.
echo [服务已退出] 上方为报错信息，按任意键关闭窗口
pause >nul
