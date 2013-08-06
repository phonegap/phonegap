Cordova BlackBerry WebWorks
============================

[Cordova framework](http://incubator.apache.org/cordova/) for __BlackBerry Tablet OS, Smartphones and BlackBerry 10 devices__. The framework is implemented using the [BlackBerry WebWorks SDK](http://us.blackberry.com/developers/tablet/webworks.jsp).

Directory Structure
-------------------

    framework/ ... BlackBerry WebWorks JavaScript Extension (Cordova native code)
    javascript/ .. Cordova JavaScript (concatenated, non-minified)
    bin/ ......... Scripts for project creation

Introduction
------------

BlackBerry WebWorks is a framework for developing web-based applications for BlackBerry SmartPhones (BlackBerry OS 5.0 and higher) and the TabletOS.  Creating a web application is one of the easiest ways to have an application that runs on both platforms.

The WebWorks framework allows developers to create applications using web content and resources (HTML/CSS/JavaScript) that are able to access device features through the [BlackBerry WebWorks API](http://www.blackberry.com/developers/docs/widgetapi/).  In addition, the framework allows developers to create their own WebWorks JavaScript Extensions to expose additional device capabilities through JavaScript APIs.  These extensions are written using either the BlackBerry Java API for SmartPhones, or Adobe AIR for the Tablet OS.

The cordova-blackberry-webworks platform allows web developers to develop applications targeting BlackBerry 5.0 and higher devices using the common [Cordova API](http://docs.cordova.io).  When possible, Cordova makes use of the WebWorks JavaScript API; however, most Cordova features are implemented in the native Java or AIR environment as a WebWorks JavaScript Extension.


Getting Started
===============

Several guides are available on the [Cordova Documentation site](http://docs.cordova.io/) (Getting Started Guides - on the left side near the bottom) to help you get started developing for the cordova-blackberry-webworks platform.  This guide will help you install and configure the BlackBerry WebWorks development environment, and the cordova-blackberry-webworks platform.  It will also step you through the process of creating a Cordova project.

[Getting Started with Cordova BlackBerry WebWorks](http://docs.cordova.io/guide_getting-started_blackberry_index.md.html)

This guide is for advanced developers who wish to develop their own cordova-blackberry-webworks plugin.

[How To Create a Cordova Plugin for Cordova BlackBerry WebWorks](http://docs.cordova.io/guide_plugin-development_blackberry_index.md.html)


Installing the cordova-blackberry-webworks Framework
=====================================================

Cloning the cordova-blackberry-webworks repository always provides you with the latest (EDGE) version of the Cordova code.  To clone the repository, do the following:

    $ cd C:\some\path\
    $ git clone git://git-wip-us.apache.org/repos/asf/incubator-cordova-blackberry-webworks.git

Cordova BlackBerry Developer Tools
---

The Cordova developer tooling is split between general tooling and project level tooling. If you are on Windows, please run the equivalent .bat files instead of the shell scripts :)

### General Commands

    ./bin/create [path appname packagename] ............ creates a sample app with the specified application name, to the specified path

Please note that once you `create` a Cordova BlackBerry project, you
will need to edit the `project.properties` file that resides inside your
generated application directory to set up your environment properly. You
will need to specify things like the location of the BlackBerry Widget
Packager(s), device and signing key passwords, simulator executables,
and device IPs (if applicable).

The ./bin/create command is also required to be called in order to automatically download
the bin/template/project/lib/ant-contrib.jar file. Please be aware that without running
this command first, your project will not have this important file! Once that ant-contrib.jar
file is downloaded, there is no need to update that file or download again.

#### Running the Example Project

Create the example project and build it to the first device:

    ./bin/create
    cd example
    ./cordova/run blackberry

#### Creating a new Cordova BlackBerry Project

    ./bin/create ~/Desktop/myapp MyAppName MyAppPackageName

### Project Commands

These commands live in a generated Cordova BlackBerry project. As per
the note above, please make sure you edit the `project.properties` file
inside your application directory appropriately otherwise these commands
will not work!

    ./cordova/run ............................ install to a connected device or simulator
    ./cordova/build .......................... build project, but do not deploy to simulator or device


(Legacy) Creating a New Cordova Project
-------------------------------

The (legacy) Cordova ant build scripts enable you to create multiple, independent Cordova projects.

(Note: The Cordova build script requires Apache ANT 1.8 or higher. Also, these scripts won't work without
the bin/template/project/lib/ant-contrib.jar file so please run the ./bin/create command to automatically
download that file or manually download it and place it in the bin/template/lib/ directory.

The build script packages the Cordova source code and resources into each project you create.  This allows you to easily distribute the project to other BlackBerry WebWorks developers.  To create a Cordova project:

    $ cd cordova-blackberry-webworks
    $ ant help

    $ ant create -Dproject.path="C:\development\my_new_project"

    $ cd C:\development\my_new_project
    $ ant help

For each project, you need to tell ANT where you installed the BlackBerry WebWorks SDK, which packages and compiles your code into a deployable application.  You can specify the location of the BlackBerry WebWorks Packager (BBWP) by editing __project.properties__ in the project directory.

    [edit project.properties]

Building and Deploying a Project
--------------------------------

The Cordova build scripts automate common tasks, such as compiling your project, and deploying it to simulators or devices.  To see what options are available, use:

    $ cd C:\development\my_new_project
    $ ant help

Every command is in the form `ant TARGET COMMAND [options]`, where
target is either `blackberry` or `playbook`.

To build your project into a deployable application (.cod/.jad) file:

    $ ant TARGET build

To build your project and load it in a BlackBerry simulator:

    $ ant TARGET load-simulator

To build your project and load it onto a USB-attached device:

    $ ant TARGET load-device

Updating the Cordova Framework
-------------------------------

As you develop your application, there may be updates made to the Cordova source code.  To incorporate Cordova changes into your project, use the build script as follows:

    $ cd cordova-blackberry-webworks
    $ git pull origin master

    $ ant update -Dproject.path="C:\development\my_new_project"

Customizing Cordova
--------------------

By default, Cordova gives access to all the core Cordova APIs as detailed at docs.cordova.io.
If you want to remove some of those APIs you can do so by editing the plugins.xml document in your
application root. You need to edit the plugins.xml file to add third-party plugins to your application
as well.

Creating a Distribution
-----------------------

### Update Version

    $ ant version -Dvalue="1.0.0"

    $ git diff
    $ git commit -am "Update to version 1.0.0"
    $ git tag 1.0.0

### Create distribution

    $ ant dist

Troubleshooting
===============

__Q: I uploaded my application to the BlackBerry device, but it will not open or run.__

__A:__ Try hard resetting the device by pressing and hold ALT + CAPS LOCK + DEL. You must press and hold each key in sequence and not all at once.  Some devices require _either_ the right or left CAPS LOCK key to be pressed.  Some devices also require this combination to be pressed twice.

__Q: My simulator screen is not refreshing and I see blocks on a clicked position.__

__A:__ Windows 7 and the simulator's graphics acceleration do not mix. On the simulator, set View -> Graphics Acceleration to Off.

__Q: When I use the Cordova [Camera.getPicture API](http://docs.cordova.io/cordova_camera_camera.md.html#camera.getPicture) on my device, the camera never returns to my application.  Why does this happen?__

__A:__ Cordova uses a JavaScript Extension to invoke the native camera application so the user can take a picture.  When the picture is taken, Cordova will close the native camera application by emulating a key injection (pressing the back/escape button).  On a physical device, users will have to set permissions to allow the application to simulate key injections.  Setting application permissions is device-specific.  On a Storm2 (9550), for example, select the BlackBerry button from the Home screen to get to All Applications screen, then Options > Applications > Your Application.  Then select Edit Default Permissions > Interactions > Input Simulation and set it to 'Allow'.  Save your changes.

__Q: None of the Cordova APIs are working, why is that?__

__A:__ You probably need to update your plugins.xml file in the root of your application.
