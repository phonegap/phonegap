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
Cordova Android
===

Cordova Android is an Android application library that allows for Cordova-based
projects to be built for the Android Platform. Cordova based applications are,
at the core, applications written with web technology: HTML, CSS and JavaScript. 

[Apache Cordova](http://cordova.io) is a project at The Apache Software Foundation (ASF).


Requires
---

- Java JDK 1.5 or greater
- Apache ANT 1.8.0 or greater
- Android SDK [http://developer.android.com](http://developer.android.com)

 
Cordova Android Developer Tools
---

The Cordova developer tooling is split between general tooling and project level tooling. 

To enable the command-line tools available in the ./bin directory, make
sure you have all of the dependencies installed. You will need
[NodeJS](http://nodejs.org) (which should come with `npm`). To install
the dependencies:

    $ cd bin
    $ npm install

General Commands

    ./bin/create [path package activity] ... create the ./example app or a cordova android project
    ./bin/autotest ......................... test the cli tools
    ./bin/test ............................. run mobile-spec

Project Commands

These commands live in a generated Cordova Android project.

    ./cordova/debug [path] ..................... install to first device
    ./cordova/emulate .......................... start avd (emulator) named default
    ./cordova/log .............................. starts logcat

Running the Example Project
---

Start avd (emulator) named `default`:

    ./bin/emulate

Create the example project and build it to the first device:

    ./bin/create
    cd example
    ./cordova/debug

Start adb logcat (console.log calls output here):

    ./cordova/log

Creating a new Cordova Android Project
---

    ./bin/create ~/Desktop/myapp com.myapp.special MyApp

Importing a Cordova Android Project into Eclipse
----

1. File > New > Project...
2. Android > Android Project
3. Create project from existing source (point to the generated app found in tmp/android)
4. Right click on libs/cordova.jar and add to build path
5. Right click on the project root: Run as > Run Configurations
6. Click on the Target tab and select Manual (this way you can choose the emulator or device to build to)

Building without the Tooling
---
Note: The Developer Tools handle this.  This is only to be done if the tooling fails, or if 
you are developing directly against the framework.


To create your `cordova.jar` file, run in the framework directory:

    android update project -p . -t android-17
    ant jar


Running Tests
----
Please see details under test/README.md.

Further Reading
---

- [http://developer.android.com](http://developer.android.com)
- [http://cordova.apache.org/](http://cordova.apache.org)
- [http://wiki.apache.org/cordova/](http://wiki.apache.org/cordova/)
