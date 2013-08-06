@ECHO OFF
SET full_path=%~dp0
IF EXIST %full_path%update.js (
        cscript "%full_path%update.js" %* //nologo
) ELSE (
    ECHO.
    ECHO ERROR: Could not find 'update.js' in 'bin' folder, aborting...>&2
    EXIT /B 1
)