@ECHO OFF
SET full_path=%~dp0
IF EXIST %full_path%lib\build.js (
    cscript "%full_path%lib\build.js" %* //nologo
) ELSE (
    ECHO.
    ECHO ERROR: Could not find 'build.js' in cordova/lib, aborting...>&2
    EXIT /B 1
)