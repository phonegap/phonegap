@ECHO OFF
SET full_path=%~dp0
IF EXIST %full_path%target-list.js (
    cscript "%full_path%target-list.js" %* --emulators //nologo
) ELSE (
    ECHO. 
    ECHO ERROR: Could not find 'target-list.js' in cordova/lib, aborting...>&2
    EXIT /B 1
)