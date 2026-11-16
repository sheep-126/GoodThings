@echo off
chcp 936 >nul
setlocal enabledelayedexpansion
title GoodThings 一键启动

net session >nul 2>&1
if not "%errorlevel%"=="0" (
    echo [提示] 正在申请管理员权限，请在弹出的窗口中点"是"...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo ============================================
echo  GoodThings 季节穿搭系统  一键启动
echo ============================================
echo.

echo [1/4] 检查 MySQL95 服务...
sc query MySQL95 | findstr /i "RUNNING" >nul
if errorlevel 1 (
    echo       MySQL95 未运行，正在启动...
    net start MySQL95 >nul 2>&1
    if errorlevel 1 (
        echo       [失败] MySQL95 启动失败，请检查 D:\mysql\my.ini
        pause
        exit /b 1
    )
    echo       MySQL95 已启动
) else (
    echo       MySQL95 已在运行
)

echo [2/4] 等待 3306 端口就绪...
set /a _t=0
:waitdb
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 3306 -State Listen -EA SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
    set /a _t+=1
    if !_t! geq 20 (
        echo       [失败] 3306 端口 20 秒内未就绪
        pause
        exit /b 1
    )
    timeout /t 1 >nul
    goto waitdb
)
echo       3306 已就绪

echo [3/4] 启动 Flask 后端...
set "OLDPID="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do set "OLDPID=%%a"
if defined OLDPID (
    echo       检测到 5000 端口被进程 !OLDPID! 占用，先结束旧进程...
    taskkill /f /pid !OLDPID! >nul 2>&1
    timeout /t 1 >nul
)
start "GoodThings Flask" "%~dp0backend\run.bat"

echo [4/4] 等待服务响应并打开浏览器...
set /a _n=0
:waitweb
timeout /t 1 >nul
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://127.0.0.1:5000' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
    set /a _n+=1
    if !_n! geq 20 (
        echo       [提示] 后端未在 20 秒内响应，请查看 Flask 窗口报错信息
        pause
        exit /b 1
    )
    goto waitweb
)
start "" "http://127.0.0.1:5000"
echo.
echo 启动完成：http://127.0.0.1:5000
echo 停止服务：在 Flask 窗口按 Ctrl+C，或关闭该窗口。
timeout /t 5 >nul
exit
