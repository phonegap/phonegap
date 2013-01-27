Cordova BlackBerry Distribution
===============================

Cordova BlackBerry is a framework that allows for Cordova based projects to be built for the [BlackBerry WebWorks Platform](https://bdsc.webapps.blackberry.com/html5/). Cordova based applications are, at the core, an application written with web technology: HTML, CSS and JavaScript.  The Cordova BlackBerry project allows web developers to develop applications targeting BlackBerry OS 5.0+ and PlayBook devices using the common [Cordova API](http://docs.phonegap.com).

Apache Cordova is an effort undergoing incubation at The Apache Software Foundation (ASF), sponsored by the Apache Incubator project. Incubation is required of all newly accepted projects until a further review indicates that the infrastructure, communications, and decision making process have stabilized in a manner consistent with other successful ASF projects. While incubation status is not necessarily a reflection of the completeness or stability of the code, it does indicate that the project has yet to be fully endorsed by the ASF.

Pre-requisites
--------------

- Windows XP (32-bit) or Windows 7 (32-bit and 64-bit) or Mac OSX 10.6.4+
- Java JDK 1.5
- Apache ANT
- [BlackBerry WebWorks SDK](https://bdsc.webapps.blackberry.com/html5/download/sdk)
- PlayBook development requires [Adobe Air SDK](http://www.adobe.com/devnet/air/air-sdk-download.html)

Directory Structure
-------------------

    sample/ ... Ready-to-run sample project
    www/ ...... Barebones project assets

### Ready-to-Run Sample Project

The quickest way to get started with Cordova BlackBerry is to make a copy of the `sample` folder. The `sample` folder is a complete Cordova BlackBerry project including build scripts. Copy the `sample` folder to a desired location to create a new Cordova BlackBerry project.

#### Building and Deploying a Project

The build scripts included in the `sample` folder automate common tasks, such as compiling your project, and deploying it to simulators or devices.  To see what options are available, use:

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

### Barebones Project Assets

The `www` folder contains the Cordova specific assets that must be available in a BlackBerry WebWorks project.  If you have an existing BlackBerry WebWorks project, copy/merge these files into your project to enable the project for Cordova.

    ext/cordova.jar     - Native Cordova API implementations for smartphones.
    ext-air/            - PlayBook Adobe Air extensions for Cordova API.
    playbook/cordova.js - PlayBook Cordova JavaScript API.
    cordova.js          - Smartphone Cordova JavaScript API.
    config.xml          - BlackBerry WebWorks configuration file.
    plugins.xml         - Cordova plugin configuration file.

`config.xml` is a sample that you are free to alter or merge with an existing BlackBerry WebWorks configuration file. The necessary Cordova sections are contained in the `<feature>` and `<access>` sections:

    <!-- Cordova API -->
    <feature ... />
    <feature ... />
    
    <!-- Cordova API -->
    <access ... />
    <access ... />

Frequently Asked Questions
--------------------------

__Q: My simulator screen is not refreshing and I see blocks on a clicked position.__

__A:__ Windows 7 and the simulator's graphics acceleration do not mix. On the simulator, set View -> Graphics Acceleration to Off.

__Q: When I use the Cordova [Camera.getPicture API](http://docs.phonegap.com/phonegap_camera_camera.md.html#camera.getPicture) on my device, the camera never returns to my application.  Why does this happen?__

__A:__ Cordova uses a JavaScript Extension to invoke the native camera application so the user can take a picture.  When the picture is taken, Cordova will close the native camera application by emulating a key injection (pressing the back/escape button).  On a physical device, users will have to set permissions to allow the application to simulate key injections.  Setting application permissions is device-specific.  On a Storm2 (9550), for example, select the BlackBerry button from the Home screen to get to All Applications screen, then Options > Applications > Your Application.  Then select Edit Default Permissions > Interactions > Input Simulation and set it to 'Allow'.  Save your changes.

__Q: None of the Cordova APIs are working, why is that?__

__A:__ You probably need to update your plugins.xml file in the root of your application.

Additional Information
----------------------
- [Cordova home](http://incubator.apache.org/cordova/)
- [Cordova Documentation](http://docs.phonegap.com)
- [Cordova Issue Tracker](https://issues.apache.org/jira/browse/CB)
- [BlackBerry WebWorks Framework](https://bdsc.webapps.blackberry.com/html5/)
