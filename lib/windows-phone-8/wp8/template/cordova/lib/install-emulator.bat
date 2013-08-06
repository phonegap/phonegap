@ECHO OFF
SET full_path=%~dp0
IF EXIST %full_path%deploy.js (
    cscript "%full_path%deploy.js" %* --emulator --nobuild //nologo
) ELSE (
    ECHO. 
    ECHO ERROR: Could not find 'deploy.js' in cordova/lib, aborting...>&2
    EXIT /B 1
)