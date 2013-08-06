/*
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
*/

/*
 * create a cordova/android project
 *
 * USAGE
 *  ./create [path package activity]
 */

var args = WScript.Arguments, PROJECT_PATH="example", 
    PACKAGE="org.apache.cordova.example", ACTIVITY="cordovaExample",
    shell=WScript.CreateObject("WScript.Shell"),
    fso = WScript.CreateObject('Scripting.FileSystemObject');

function Usage() {
    Log("Usage: create PathTONewProject [ PackageName AppName ]");
    Log("    PathTONewProject : The path to where you wish to create the project");
    Log("    PackageName      : The package for the project (default is org.apache.cordova.example)")
    Log("    AppName          : The name of the application/activity (default is cordovaExample)");
    Log("examples:");
    Log("    create C:\\Users\\anonymous\\Desktop\\MyProject");
    Log("    create C:\\Users\\anonymous\\Desktop\\MyProject io.Cordova.Example AnApp");
}

// logs messaged to stdout and stderr
function Log(msg, error) {
    if (error) {
        WScript.StdErr.WriteLine(msg);
    }
    else {
        WScript.StdOut.WriteLine(msg);
    }
}

function read(filename) {
    var fso=WScript.CreateObject("Scripting.FileSystemObject");
    var f=fso.OpenTextFile(filename, 1);
    var s=f.ReadAll();
    f.Close();
    return s;
}

function checkTargets(targets) {
    if(!targets) {
        Log("You do not have any android targets setup. Please create at least one target with the `android` command", true);
        WScript.Quit(69);
    }
}

function setTarget() {
    var targets = shell.Exec('android.bat list targets').StdOut.ReadAll().match(/id:\s\d+/g);
    checkTargets(targets);
    return targets[targets.length - 1].replace(/id: /, ""); // TODO: give users the option to set their target 
}
function setApiLevel() {
    var targets = shell.Exec('android.bat list targets').StdOut.ReadAll().match(/API level:\s\d+/g);
    checkTargets(targets);
    return targets[targets.length - 1].replace(/API level: /, "");
}
function write(filename, contents) {
    var fso=WScript.CreateObject("Scripting.FileSystemObject");
    var f=fso.OpenTextFile(filename, 2, true);
    f.Write(contents);
    f.Close();
}
function replaceInFile(filename, regexp, replacement) {
    write(filename, read(filename).replace(regexp, replacement));
}
function exec(command) {
    var oShell=shell.Exec(command);
    while (oShell.Status == 0) {
        if(!oShell.StdOut.AtEndOfStream) {
            var line = oShell.StdOut.ReadLine();
            // XXX: Change to verbose mode 
            // WScript.StdOut.WriteLine(line);
        }
        WScript.sleep(100);
    }
}

function createAppInfoJar() {
    if(!fso.FileExists(ROOT+"\\bin\\templates\\cordova\\appinfo.jar")) {
        Log("Creating appinfo.jar...");
        var cur = shell.CurrentDirectory;
        shell.CurrentDirectory = ROOT+"\\bin\\templates\\cordova\\ApplicationInfo";
        exec("javac ApplicationInfo.java");
        exec("jar -cfe ..\\appinfo.jar ApplicationInfo ApplicationInfo.class");
        shell.CurrentDirectory = cur;
    }
}

// working dir
var ROOT = WScript.ScriptFullName.split('\\bin\\create.js').join('');
if (args.Count() > 0) {
    // support help flags
    if (args(0) == "--help" || args(0) == "/?" ||
            args(0) == "help" || args(0) == "-help" || args(0) == "/help" || args(0) == "-h") {
        Usage();
        WScript.Quit(2);
    }

    PROJECT_PATH=args(0);
    if (args.Count() > 1) {
        PACKAGE = args(1);
    }
    if (args.Count() > 2) {
        ACTIVITY = args(2);
    }
}
else {
    Log("Error : No project path provided.");
    Usage();
    WScript.Quit(2);
}

if(fso.FolderExists(PROJECT_PATH)) {
    Log("Project path already exists!", true);
    WScript.Quit(2);
}

var PACKAGE_AS_PATH=PACKAGE.replace(/\./g, '\\');
var ACTIVITY_DIR=PROJECT_PATH + '\\src\\' + PACKAGE_AS_PATH;
var ACTIVITY_PATH=ACTIVITY_DIR+'\\'+ACTIVITY+'.java';
var MANIFEST_PATH=PROJECT_PATH+'\\AndroidManifest.xml';
var TARGET=setTarget();
var API_LEVEL=setApiLevel();
var VERSION=read(ROOT+'\\VERSION').replace(/\r\n/,'').replace(/\n/,'');
// create the project
Log("Creating new android project...");
exec('android.bat create project --target "'+TARGET+'" --path "'+PROJECT_PATH+'" --package "'+PACKAGE+'" --activity "'+ACTIVITY+'"');

// build from source. distro should have these files
if (!fso.FileExists(ROOT+'\\cordova-'+VERSION+'.jar') &&
    !fso.FileExists(ROOT+'\\cordova.js')) {
    Log("Building jar and js files...");
    // update the cordova framework project to a target that exists on this machine
    exec('android.bat update project --target "'+TARGET+'" --path "'+ROOT+'\\framework"');
    exec('ant.bat -f "'+ ROOT +'\\framework\\build.xml" jar');
}

// copy in the project template
Log("Copying template files...");
exec('%comspec% /c xcopy "'+ ROOT + '\\bin\\templates\\project\\res" "'+PROJECT_PATH+'\\res\\" /E /Y');
exec('%comspec% /c xcopy "'+ ROOT + '\\bin\\templates\\project\\assets" "'+PROJECT_PATH+'\\assets\\" /E /Y');
exec('%comspec% /c copy "'+ROOT+'\\bin\\templates\\project\\AndroidManifest.xml" "' + PROJECT_PATH + '\\AndroidManifest.xml" /Y');
exec('%comspec% /c mkdir "' + ACTIVITY_DIR + '"');
exec('%comspec% /c copy "' + ROOT + '"\\bin\\templates\\project\\Activity.java "' + ACTIVITY_PATH + '" /Y');

// check if we have the source or the distro files
Log("Copying js, jar & config.xml files...");
if(fso.FolderExists(ROOT + '\\framework')) {
    exec('%comspec% /c copy "'+ROOT+'\\framework\\assets\\www\\cordova.js" "'+PROJECT_PATH+'\\assets\\www\\cordova.js" /Y');
    exec('%comspec% /c copy "'+ROOT+'\\framework\\cordova-'+VERSION+'.jar" "'+PROJECT_PATH+'\\libs\\cordova-'+VERSION+'.jar" /Y');
    fso.CreateFolder(PROJECT_PATH + '\\res\\xml');
    exec('%comspec% /c copy "'+ROOT+'\\framework\\res\\xml\\config.xml" "' + PROJECT_PATH + '\\res\\xml\\config.xml" /Y');
} else {
    // copy in cordova.js
    exec('%comspec% /c copy "'+ROOT+'\\cordova.js" "'+PROJECT_PATH+'\\assets\\www\\cordova.js" /Y');
    // copy in cordova.jar
    exec('%comspec% /c copy "'+ROOT+'\\cordova-'+VERSION+'.jar" "'+PROJECT_PATH+'\\libs\\cordova-'+VERSION+'.jar" /Y');
    // copy in xml
    fso.CreateFolder(PROJECT_PATH + '\\res\\xml');
    exec('%comspec% /c copy "'+ROOT+'\\xml\\config.xml" "' + PROJECT_PATH + '\\res\\xml\\config.xml" /Y');
}

// copy cordova scripts
fso.CreateFolder(PROJECT_PATH + '\\cordova');
fso.CreateFolder(PROJECT_PATH + '\\cordova\\lib');
createAppInfoJar();
Log("Copying cordova command tools...");
exec('%comspec% /c copy "'+ROOT+'\\bin\\templates\\cordova\\appinfo.jar" "' + PROJECT_PATH + '\\cordova\\appinfo.jar" /Y');
exec('%comspec% /c copy "'+ROOT+'\\bin\\templates\\cordova\\lib\\cordova.js" "' + PROJECT_PATH + '\\cordova\\lib\\cordova.js" /Y');
exec('%comspec% /c copy "'+ROOT+'\\bin\\templates\\cordova\\lib\\install-device.bat" "' + PROJECT_PATH + '\\cordova\\lib\\install-device.bat" /Y');
exec('%comspec% /c copy "'+ROOT+'\\bin\\templates\\cordova\\lib\\install-emulator.bat" "' + PROJECT_PATH + '\\cordova\\lib\\install-emulator.bat" /Y');
exec('%comspec% /c copy "'+ROOT+'\\bin\\templates\\cordova\\lib\\list-emulator-images.bat" "' + PROJECT_PATH + '\\cordova\\lib\\list-emulator-images.bat" /Y');
exec('%comspec% /c copy "'+ROOT+'\\bin\\templates\\cordova\\lib\\list-devices.bat" "' + PROJECT_PATH + '\\cordova\\lib\\list-devices.bat" /Y');
exec('%comspec% /c copy "'+ROOT+'\\bin\\templates\\cordova\\lib\\list-started-emulators.bat" "' + PROJECT_PATH + '\\cordova\\lib\\list-started-emulators.bat" /Y');
exec('%comspec% /c copy "'+ROOT+'\\bin\\templates\\cordova\\lib\\start-emulator.bat" "' + PROJECT_PATH + '\\cordova\\lib\\start-emulator.bat" /Y');
exec('%comspec% /c copy "'+ROOT+'\\bin\\templates\\cordova\\cordova.bat" "' + PROJECT_PATH + '\\cordova\\cordova.bat" /Y');
exec('%comspec% /c copy "'+ROOT+'\\bin\\templates\\cordova\\clean.bat" "' + PROJECT_PATH + '\\cordova\\clean.bat" /Y');
exec('%comspec% /c copy "'+ROOT+'\\bin\\templates\\cordova\\build.bat" "' + PROJECT_PATH + '\\cordova\\build.bat" /Y');
exec('%comspec% /c copy "'+ROOT+'\\bin\\templates\\cordova\\log.bat" "' + PROJECT_PATH + '\\cordova\\log.bat" /Y');
exec('%comspec% /c copy "'+ROOT+'\\bin\\templates\\cordova\\run.bat" "' + PROJECT_PATH + '\\cordova\\run.bat" /Y');
exec('%comspec% /c copy "'+ROOT+'\\bin\\templates\\cordova\\version.bat" "' + PROJECT_PATH + '\\cordova\\version.bat" /Y');

// interpolate the activity name and package
Log("Updating AndroidManifest.xml and Main Activity...");
replaceInFile(ACTIVITY_PATH, /__ACTIVITY__/, ACTIVITY);
replaceInFile(ACTIVITY_PATH, /__ID__/, PACKAGE);

replaceInFile(MANIFEST_PATH, /__ACTIVITY__/, ACTIVITY);
replaceInFile(MANIFEST_PATH, /__PACKAGE__/, PACKAGE);
replaceInFile(MANIFEST_PATH, /__APILEVEL__/, API_LEVEL);