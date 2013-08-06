# Apache Cordova for BlackBerry 10

Apache Cordova is an application development platform which allows mobile applications to be written with web technology: HTML, CSS and JavaScript. Access to device APIs is provided by native plugins.

This implementation for BlackBerry 10 packages web assets into a BAR file which may be deployed to devices and simulators.

## Pre-requisites

Install the latest BlackBerry 10 NDK:

[https://developer.blackberry.com/native/download/](https://developer.blackberry.com/native/download)

Setup environment variables:
- [Linux/Mac] `source [BBNDK directory]/bbndk-env.sh`
- [Windows] `[BBNDK directory]\bbndk-env.bat`

Install code signing keys:

[https://developer.blackberry.com/html5/documentation/signing_setup_bb10_apps_2008396_11.html](https://developer.blackberry.com/html5/documentation/signing_setup_bb10_apps_2008396_11.html)

Install node.js:

[http://nodejs.org/](http://nodejs.org/)

Ensure npm is installed:

More recent versions of Nodejs will come with npm included.

## Getting Started

Create a new project:

`bin/create <path to project>`

## Managing Targets

A target is a device or simulator which will run the app.

This command will add a new target:

`<path to project>/cordova/target add <name> <ip> <device | simulator> [-p | --password <password>] [--pin <devicepin>]`

To remove a target:

`<path to project>/cordova/target remove <name>`

To set a target as default:

`<path to project>/cordova/target default <name>`

## Building

`<path to project>/cordova/build`

A project can be built in debug or release mode.

To run an application in debug mode, a debug token must first be installed on the device. The build script will automatically attempt to generate a token and install it. This requires code signing keys to be installed on the development machine. Debug mode will also enable WebInspector. A prompt will appear with the URL to access WebInspector from a remote machine.

If building in release mode, a unique buildId must be provided, either via command line or by setting it in config.xml.

Here is the build script syntax:

`build command [<target>] [-k | --keystorepass] [-b | --buildId <number>] [-p | --params <json>] [-ll | --loglevel <level>]`

Commands:

    release [options]
        Build in release mode. This will sign the resulting bar.

    debug [options]
        Build in debug mode.

  Options:

    -h, --help                       output usage information
    -k, --keystorepass <password>    Signing key password
    -b, --buildId <num>              Specifies the build number for signing (typically incremented from previous signing).
    -p, --params <params JSON file>  Specifies additional parameters to pass to downstream tools.
    -ll, --loglevel <loglevel>       set the logging level (error, warn, verbose)`

## Deploying

To deploy the project to a target, use the run command:

`<path to project>/cordova/run <target>`

## Plugin Management

To add a plugin from a local path, you will first need to run fetch:

`<path to project>/cordova/plugin fetch <path to plugin>`

Now the plugin can be installed by name:

`<path to project>/cordova/plugin install <name>`

Plugins hosted remotely can be installed by name without using fetch. To see a list of available remote plugins use:

`<path to project>/cordova/plugin ls`

