<!--
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
# 
# http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->
Cordova OSX
=============================================================
CordovaFramework is a framework that enables users to include Cordova in their OS X application projects easily, and also create new Cordova based OS X application projects.
<br />

Pre-requisites
-------------------------------------------------------------
Make sure you have installed the latest released OS X SDK which comes with Xcode 4. Download it at [http://developer.apple.com/downloads](http://developer.apple.com/downloads) or the [Mac App Store](http://itunes.apple.com/us/app/xcode/id497799835?mt=12).
<br />

Install CordovaFramework
-------------------------------------------------------------

1. Download the source
2. Extract to their final location
3. There is no step 3

<br />

Create a Cordova project
-------------------------------------------------------------

1. Launch **Terminal.app**
2. Go to the location where you installed Cordova, in the **bin** sub-folder
3. Follow the instructions in the [**Command-Line Usage** section](http://docs.cordova.io/en/edge/guide_command-line_index.md.html#Command-Line%20Usage) of [http://docs.cordova.io](http://docs.cordova.io)

The docs should also have been included in the distribution.

To use a **shared CordovaFramework**, add as the first parameter "**--shared**" to the **bin/create** command.

<br />

Updating a CordovaFramework subproject reference in your project
-------------------------------------------------------------

When you update to a new Cordova version, you may need to update the CordovaFramework reference in an existing project. Cordova comes with a script that will help you to do this. 

1. Launch **Terminal.app**
2. Go to the location where you installed Cordova, in the **bin** sub-folder
3. Run **"update_cordova_subproject [path/to/your/project/xcodeproj]"**  where the first parameter is the path to your project's .xcodeproj file

<br />

Unit Tests
--------------------------------------------------------------------
1. **Create** a new Cordova-based Application project
2. **Download** the code from the **[mobile-spec](https://github.com/apache/cordova-mobile-spec)** and put all of it in the root of your **www** folder
3. **Modify cordova.js** to point to your correct cordova-X.X.X.js version
4. **Run** the project

<br />


FAQ
---

None yet.


BUGS?
-----
File them at the [Cordova Issue Tracker](https://issues.apache.org/jira/browse/CB)      
<br />

MORE INFO
----------
* [http://cordova.apache.org/](http://cordova.apache.org/)

<br />
