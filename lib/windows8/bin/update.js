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

var fso           = WScript.CreateObject("Scripting.FileSystemObject");
var wscript_shell = WScript.CreateObject("WScript.Shell");
var shell         = WScript.CreateObject("shell.application");
var args          = WScript.Arguments;
// working dir
var ROOT = WScript.ScriptFullName.split('\\bin\\update.js').join('');
//Get version number
var VERSION = read(ROOT+'\\VERSION').replace(/\r\n/,'').replace(/\n/,'');
var plugins_folder = "\\Plugins";
var template_folder = "\\templates\\standalone";
// anything thats missing to the project
var overwrite = false;
var replace = false;

// usage function
function Usage() {
    Log("WARNING : Make sure to back up your project before updating!")
    Log("Usage: update Path-To-Project ");//[ -f | -r ] ");
    Log("    Path-To-Old-Project : The path the project you would like to update.");
    //Log("                     -f : Will forcefully overwrite and add all core components of the application.");
    //Log("                     -r : Will create an updated project, only keeping the www assets. *NOTE: no native code will be preserved*");
    Log("examples:");
    Log("    update C:\\Users\\anonymous\\Desktop\\MyProject");
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

// executes a commmand in the shell
function exec(command) {
    Log("Command : " + command);
    var oShell=wscript_shell.Exec(command);
    while (oShell.Status === 0) {
        WScript.sleep(100);
    }
}

// executes a commmand in the shell
function exec_verbose(command) {
    Log("Command: " + command);
    var oShell=wscript_shell.Exec(command);
    while (oShell.Status == 0) {
        //Wait a little bit so we're not super looping
        WScript.sleep(100);
        //Print any stdout output from the script
        if (!oShell.StdOut.AtEndOfStream) {
            var line = oShell.StdOut.ReadAll();
            Log(line);
        }
    }
    //Check to make sure our scripts did not encounter an error
    if (!oShell.StdErr.AtEndOfStream) {
        var line = oShell.StdErr.ReadAll();
        Log(line, true);
        WScript.Quit(2);
    }
}

var ForReading = 1, ForWriting = 2, ForAppending = 8;
var TristateUseDefault = -2, TristateTrue = -1, TristateFalse = 0;

// returns the contents of a file
function read(filename) {
    if (fso.FileExists(filename)) {
        var f=fso.OpenTextFile(filename, 1, 2);
        var s=f.ReadAll();
        f.Close();
        return s;
    }
    else {
        Log('Cannot read non-existant file : ' + filename, true);
        WScript.Quit(2);
    }
    return null;
}

// writes the contents to the specified file
function write(filename, contents) {
    var f=fso.OpenTextFile(filename, ForWriting, TristateTrue);
    f.Write(contents);
    f.Close();
}

// replaces the matches of regexp with replacement
function replaceInFile(filename, regexp, replacement) {
    var text = read(filename).replace(regexp,replacement);
    write(filename,text);
}

// returns true if the given path is the root of a cordova windows phone project
// currently returns true if the folder contains a .csproj file.
function is_windows_phone_project(path) {
    if (fso.FolderExists(path)) {
        var proj_folder = fso.GetFolder(path);
        var proj_files = new Enumerator(proj_folder.Files);
        for (;!proj_files.atEnd(); proj_files.moveNext()) {
            if (fso.GetExtensionName(proj_files.item()) == 'csproj') {
                return true;  
            }
        }
    }
    return false;
}

// returns the name of the application
function get_app_name(path) {
    var WMAppManifest = read(path + '\\Properties\\WMAppManifest.xml').split('\n');
    for (line in WMAppManifest) {
        if (WMAppManifest[line].match(/Title\=\"/)) {
            return WMAppManifest[line].split('Title="')[1].split('"')[0];
        }
    }
    Log("Error : unable to find applicaiton name in the project.", true);
    Log(" Path : " + path, true);
    WScript.Quit(2);
}

// returns the name of the application package
function get_package_name(path) {
    var WMAppManifest = read(path + '\\Properties\\WMAppManifest.xml').split('\n');
    for (line in WMAppManifest) {
        if (WMAppManifest[line].match(/Title\=\"/)) {
            return WMAppManifest[line].split('Title="')[1].split('"')[0];
        }
    }
    Log("Error : unable to find applicaiton name in the project.", true);
    Log(" Path : " + path, true);
    WScript.Quit(2);
}

// returns the GUID ame of the application
function get_app_GUID(path) {
    var AppXAML = read(path + '\\App.xaml').split('\n');
    for (line in AppXAML) {
        if (AppXAML[line].match(/x\:Class\=\"/)) {
            return AppXAML[line].split('Class="')[1].split('"')[0];
        }
    }
    Log("Error : unable to find package name in the project.", true);
    Log(" Path : " + path, true);
    WScript.Quit(2);
}

// updates the cordova.js and all references in the given project with this repositories version
function update_cordova_js(path) {
    // remove old cordova.js
    var www_contents = shell.NameSpace(path + '\\www').Items();
    for(i = 0; i < www_contents.Count; i++)
    {
        if(www_contents.Item(i).Name.match(/cordova\-(\d+)[.](\d+)[.](\d+)(rc\d)?[.]js/))
        {
            fso.DeleteFile(path + '\\www\\' + www_contents.Item(i).Name);
        }
    }
    // update version file
    copy_to(ROOT + "\\VERSION",  path + "\\VERSION");
    // copy over new cordova.js
    copy_to(ROOT + template_folder + "\\www\\cordova.js", path + "\\www\\cordova.js");

    // update corodva references
    var cordova_regex = /cordova-(\d+)[.](\d+)[.](\d+)(rc\d)?/g; //Matches *first* cordova-x.x.x[rcx] (just ad g at end to make global)
    // update references in index.html
    replaceInFile(path + '\\www\\index.html', cordova_regex,  "cordova");
    version_regex = /return\s*\"(\d+)[.](\d+)[.](\d+)(rc\d)?/; //Matches return "x.x.x[rcx]
    // update references in Device.cs
    replaceInFile(path + '\\Plugins\\Device.cs', version_regex,  "return \"" + VERSION);
}

// Copies assets that need to be saved from source to desination.
// TODO : Add all critical assets here
function save_restore(source, destination) {
    fso.CreateFolder(destination + '\\www');
    copy_to(source + '\\www', destination + '\\www');
    copy_to(source + '\\SplashScreenImage.jpg', destination + '\\SplashScreenImage.jpg');
    copy_to(source + '\\Background.png', destination + '\\Background.png');
    copy_to(source + '\\ApplicationIcon.png', destination + '\\ApplicationIcon.png');
    copy_to(source + '\\config.xml', destination + '\\config.xml');
}

// deletes the path element if it exists
function delete_if_exists(path) {
    if (fso.FolderExists(path)) {
        fso.DeleteFolder(path);
    }
    else if (fso.FileExists(path)) {
        fso.DeleteFile(path);
    }
}

// copies a folder or file from source to destination
function copy_to(source, destination) {
    // check that source exists
    if (!fso.FolderExists(source)) {
        if (!fso.FileExists(source)) {
            Log("Error : Could not copy file/folder because it doesn't exist.", true);
            Log("      File/Folder : " + source, true);
            WScript.Quit(2);
        }
    }
    // if source is a folder, then copy all folder contents
    if (fso.FolderExists(source)) {
        fso.CopyFolder(source, destination, true);
    } 
    // if it's a file, just copy it.
    else { 
        exec('%comspec% /c copy /Y /V ' + source + ' ' + destination);
    }
}

// updates the cordova.js in project along with the cordova tooling.
function update_project(path) {
    // update cordova folder
    delete_if_exists(path + '\\cordova');
    fso.CreateFolder(path + '\\cordova');
    copy_to(ROOT + template_folder + '\\cordova', path + '\\cordova');
    // clean project (all generated files)
    exec(path + '\\cordova\\clean.bat');

    // update core cordovalib
    delete_if_exists(path + '\\cordovalib');
    fso.CreateFolder(path + '\\cordovalib');
    copy_to(ROOT + template_folder + '\\cordovalib', path + '\\cordovalib');

    // update core plugins
    // TODO : Remove for 3.0.0
    delete_if_exists(path + '\\Plugins');
    fso.CreateFolder(path + '\\Plugins');
    copy_to(ROOT + template_folder + '\\Plugins', path + '\\Plugins');

    // update cordova.js
    update_cordova_js(path);
}

// Replaces the current project with a newly created project, keeping important assets to preserve the app.
// TODO: Things that need to be kept other then www
// - WMAppManifest (capabilities etc...)
// - GUID (for marketplace apps etc...)
// - Splashscreen and other images etc...
// - Find more things that should be kept
function replace_project(path) {
    //create new project and move www assets into it.
    Log("WARNING : Upgrading your app with the \'-r\' flag will delete all native and plugin");
    Log(" components of your application and replace them with the updated core components given");
    Log(" by this platforms \'bin\\create\' script.  It is *HIGHLY RECOMMENDED* to back up your app");
    Log(" before continuing. The name and package name along with all of the www assets will be");
    Log(" preserved. Are you sure you wish to continue? (Y/N)");
    var response;
    while (response != 'Y') {
        response = WScript.StdIn.ReadLine();
        if (response == 'N') {
            WScript.Quit(2);
        } else if (response != "Y") {
            Log("Error :  did not recognize '" + response + "'");
            Log("Are you sure you wish to continue? (Y/N)");
        }
    }
    // place all assets to be preserved in a temperary folder
    delete_if_exists(ROOT + '\\temp');
    fso.CreateFolder(ROOT + '\\temp');
    save_restore(path, ROOT + '\\temp');

    // get app name from WMAppManifest
    var app_name = get_app_name(path);
    // get package name from App.xaml
    var package_name = get_package_name(path);
    // get the GUID so that app stays the same
    var app_GUID = get_app_GUID(path);
    // delete previous project
    delete_if_exists(path);
    // create the new project from the current repository
    exec(ROOT + '\\bin\\create.bat ' + path + ' ' + app_name + ' ' + package_name);
    // remove default www assets
    delete_if_exists(path + '\\www');
    // move www assets back to project folder
    save_restore(ROOT + '\\temp', path);
    // cleanup temp folder
    delete_if_exists(ROOT + '\\temp');
}



if (args.Count() > 0) {
    if(args.Count() > 2) {
        Log("Error : too many arguments provided.", true);
        WScript.Quit(1);
    }

    if (args(0).indexOf("--help") > -1 ||
          args(0).indexOf("/?") > -1 ) {
        Usage();
        WScript.Quit(1);
    }
    else if (fso.FolderExists(args(0)) && is_windows_phone_project(args(0))) {
        if(args.Count() > 1) {
            /*if(args(1) == '-f' || args(1) == '--force') {
                //TODO: do something for this
                Log("ERROR : NOT IMPLEMENTED", true);
                WScript.Quit(2);
            }
            else if(args(1) == '-r' || args(1) == '--replace') {
                replace_project(args(0));
            }
            else {
                Log('Error : \'' + args(1) + '\' is not regognized as an update option', true);
            }*/
            Usage();
            Log('Error : too many arguments', true);
        } else if (args.Count() == 1) {
            update_project(args(0));
        }
    }
    else if (fso.FolderExists(args(0))) {
        Log("The path provided is not a path to a cordova windows phone project.", true);
        Log(" Please provide the path to the root folder of your cordova windows phone project.", true);
        WScript.Quit(2);
    }
    else {
        Log("The given path to the project does not exist.", true);
        Log(" Please provide a path to the project you would like to update.", true);
        Usage();
        WScript.Quit(2);
    }
}
else {
    Usage();
    WScript.Quit(1);
}