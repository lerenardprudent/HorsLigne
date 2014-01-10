@echo off
set http_port=6767
start %~dp0php -S localhost:%http_port% -t "%~dp0"
start http://localhost:%http_port%/index.html
REM start http://localhost/hors/
REM wscript C:\Users\LAP-PRO\Documents\GitHub\HorsLigne\invisible.vbs C:\Users\LAP-PRO\Documents\GitHub\HorsLigne\so.bat