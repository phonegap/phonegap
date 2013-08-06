@ECHO OFF
goto comment
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
:comment

set FOUNDNODE=
for %%e in (%PATHEXT%) do (
  for %%X in (node%%e) do (
    if not defined FOUNDNODE (
      set FOUNDNODE=%%~$PATH:X
    )
  )
)

set FOUNDNPM=
for %%X in (npm) do (
  if not defined FOUNDNPM (
    set FOUNDNPM=%%~$PATH:X
  )
)

set FOUNDPACKAGER=
for %%X in (blackberry-nativepackager.bat) do (
  if not defined FOUNDPACKAGER (
    set FOUNDPACKAGER=%%~$PATH:X
  )
)

set FOUNDDEPLOYER=
for %%X in (blackberry-deploy.bat) do (
  if not defined FOUNDDEPLOYER (
    set FOUNDDEPLOYER=%%~$PATH:X
  )
)

set FOUNDSIGNER=
for %%X in (blackberry-signer.bat) do (
  if not defined FOUNDSIGNER (
    set FOUNDSIGNER=%%~$PATH:X
  )
)

set FOUNDJAVA=
for %%e in (%PATHEXT%) do (
  for %%X in (java%%e) do (
    if not defined FOUNDJAVA (
      set FOUNDJAVA=%%~$PATH:X
    )
  )
)


if not defined FOUNDNODE (
  echo npm cannot be found on the path. Aborting.
  exit /b 1
)
if not defined FOUNDNPM (
  echo node cannot be found on the path. Aborting.
  exit /b 1
)
if not defined FOUNDJAVA (
  echo java cannot be found on the path. Aborting.
  exit /b 1
)
if not defined FOUNDPACKAGER (
  echo blackberry-nativepackager cannot be found on the path. Aborting.
  exit /b 1
)
if not defined FOUNDDEPLOYER (
  echo blackberry-deploy cannot be found on the path. Aborting.
  exit /b 1
)
if not defined FOUNDSIGNER (
  echo blackberry-signer cannot be found on the path. Aborting.
  exit /b 1
)

@node.exe "%~dp0\check_reqs.js" %*
