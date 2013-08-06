@ECHO OFF
SET full_path=%~dp0
IF EXIST "%full_path%..\VERSION" (
    type "%full_path%..\VERSION"
) ELSE (
    ECHO.
    ECHO ERROR: Could not find file VERSION in project folder
    EXIT /B 1
)