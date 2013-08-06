@ECHO OFF
SET full_path=%~dp0
IF EXIST %full_path%lib\clean.js (
    cscript "%full_path%lib\clean.js" %* //nologo
) ELSE (
    ECHO.
    ECHO ERROR: Could not find 'clean.js' in cordova/lib, aborting...>&2
    EXIT /B 1
)