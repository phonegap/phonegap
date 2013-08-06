@ECHO OFF
SET full_path=%~dp0
IF EXIST %full_path%create.js (
        cscript "%full_path%create.js" %* //nologo
) ELSE (
    ECHO.
    ECHO ERROR: Could not find 'create.js' in 'bin' folder, aborting...>&2
    EXIT /B 1
)