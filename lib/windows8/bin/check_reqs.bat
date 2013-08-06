@ECHO OFF
SET full_path=%~dp0
IF EXIST %full_path%check_reqs.js (
        cscript "%full_path%check_reqs.js" %* //nologo
) ELSE (
    ECHO.
    ECHO ERROR: Could not find 'check_reqs.js' in 'bin' folder, aborting...>&2
    EXIT /B 1
)