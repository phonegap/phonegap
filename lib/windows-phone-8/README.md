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


Apache Cordova for Windows Phone 8 ( and Windows Phone 7.1)
===

The Windows Phone 7 and Windows Phone 8 Cordova codebases are being merged to reduce redundancy.  This repo includes code to build Apache Cordova applications that target either Windows Phone SDK.

An Apache Cordova based applications is, at the core, an application written with web technology: HTML, CSS and JavaScript.

[Apache Cordova][] is a project at The Apache Software Foundation (ASF).

Requires
---

- [Windows Phone SDK 7.1][]
-- to target Windows Phone 7 devices. (WP7 apps will also run on WP8 devices, in compatibility mode) 

- [Windows Phone SDK 8][]
-- to target Windows Phone 8 devices
-- Windows Phone 8 development requires Windows 8 Professional, and Visual Studio 2012 ( express works )


Getting Started 
---

There are 2 ways to go about creating a new Apache Cordova WP7 or WP8 application.

### Run the batch file to create and install the templates.


- The root of the repo contains a file createTemplates.bat.  Double clicking this file will generate 2 .zip files. (CordovaWP7_x_x_x.zip + CordovaWP8_x_x_x.zip where x.x.x is the current version number)  To easily use these files in Visual Studio, copy them to 
"My Documents\Visual Studio 2012\Templates\ProjectTemplates\" You will then be able to create new Apache Cordova Windows Phone apps from the Visual Studio File->New Project menu.
- If you run the batch file from the command line, you can also call with a parameter to install automatically

Run the script :

    >createTemplates.bat -install

## Use the create scripts on the command line

Gettings Started from command line
---

    >.\wp7\bin\create PathToNewProject [ PackageName ] [ AppName ]
    >.\wp8\bin\create PathToNewProject [ PackageName ] [ AppName ]

    >PathToNewProject : The path to where you wish to create the project
    >PackageName      : The namespace for the project (default is Cordova.Example)
    >AppName          : The name of the application (default is CordovaWP8AppProj or CordovaWP7AppProj)

    >examples:
    >.\wp7\bin\create C:\Users\anonymous\Desktop\MyWP7Project
    >.\wp8\bin\create C:\Users\anonymous\Desktop\MyWP8Proj io.cordova.example CordovaWP8App

    Launch Visual Studio and open Solution file (.sln) in (C:\Users\anonymous\Desktop\MyWP7Project)

    Built and Run it

Important!!!
---

When you add or remove files/folders in the www folder you will need to do the following :

- ensure the new item is included in the project ( Content ) This includes ALL images/css/html/js/* and anything that you want available at runtime.
- For WP7 Projects, do not modify the CordovaSourceDictionary.xml file which is included in the project, it is auto-generated for you when you build.


Known Problem Areas
---

- Some of the Media APIs will not function as expected when debugging while connect to the device with the Zune software. To get around this, you need to use the Windows Phone Connect tool. For details, please check out this [MSDN blog article][Tips for debugging WP7 media apps with WPConnect].


BUGS?
-----

- File them at the [Apache Cordova Issue Tracker][]


Further Reading
---

- [Apache Cordova Documentation][]
- [Apache Cordova Wiki][]

[Windows Phone SDK 7.1]: http://www.microsoft.com/en-us/download/details.aspx?id=27570 "Download Windows Phone SDK 7"
[Windows Phone SDK 8]: http://www.microsoft.com/en-us/download/details.aspx?id=35471 "Download Windows Phone SDK 8"
[Tips for debugging WP7 media apps with WPConnect]: http://blogs.msdn.com/b/jaimer/archive/2010/11/03/tips-for-debugging-wp7-media-apps-with-wpconnect.aspx "Tips for debugging WP7 media apps with WPConnect"

[Apache Cordova]: http://cordova.io "Apache Cordova"
[Apache Cordova Issue Tracker]: https://issues.apache.org/jira/browse/CB "Apache Cordova Issue Tracker"
[Apache Cordova Documentation]: http://cordova.io/docs "Apache Cordova Documentation"
[Apache Cordova Wiki]: http://wiki.apache.org/cordova "Apache Cordova Wiki"

