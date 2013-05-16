:: Licensed to the Apache Software Foundation (ASF) under one
:: or more contributor license agreements.  See the NOTICE file
:: distributed with this work for additional information
:: regarding copyright ownership.  The ASF licenses this file
:: to you under the Apache License, Version 2.0 (the
:: "License"); you may not use this file except in compliance
:: with the License.  You may obtain a copy of the License at
:: 
:: http://www.apache.org/licenses/LICENSE-2.0
:: 
:: Unless required by applicable law or agreed to in writing,
:: software distributed under the License is distributed on an
:: "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
:: KIND, either express or implied.  See the License for the
:: specific language governing permissions and limitations
:: under the License.

@ECHO OFF
IF NOT DEFINED JAVA_HOME GOTO MISSING_JAVA_HOME

FOR %%X in (java.exe javac.exe ant.bat android.bat) do (
    IF [%%~$PATH:X]==[] (
      ECHO Cannot locate %%X using the PATH environment variable.
      ECHO Retry after adding directory containing %%X to the PATH variable.
      ECHO Remember to open a new command window after updating the PATH variable.
      IF "%%X"=="java.exe" GOTO GET_JAVA
      IF "%%X"=="javac.exe" GOTO GET_JAVA
      IF "%%X"=="ant.bat" GOTO GET_ANT
      IF "%%X"=="android.bat" GOTO GET_ANDROID
      GOTO ERROR
    )
)
cscript "%~dp0\create.js" %*
GOTO END
:MISSING_JAVA_HOME
        ECHO The JAVA_HOME environment variable is not set.
        ECHO Set JAVA_HOME to an existing JRE directory.
        ECHO Remember to also add JAVA_HOME to the PATH variable.
        ECHO After updating system variables, open a new command window and retry.
        GOTO ERROR
:GET_JAVA
        ECHO Visit http://java.oracle.com if you need to install Java (JDK).
        GOTO ERROR
:GET_ANT
        ECHO Visit http://ant.apache.org if you need to install Apache Ant.
        GOTO ERROR
:GET_ANDROID
        ECHO Visit http://developer.android.com if you need to install the Android SDK.
        GOTO ERROR
:ERROR
EXIT /B 1
:END
