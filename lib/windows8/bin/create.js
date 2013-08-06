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
 * create a cordova/windows8 project
 *
 * USAGE
 *  ./create [path package activity]

    ./bin/create.bat C:\Users\Me\MyTestProj "test.proj" "TestProject"
 */


var fso=WScript.CreateObject("Scripting.FileSystemObject");
var wscript_shell = WScript.CreateObject("WScript.Shell");
// working dir
var ROOT = WScript.ScriptFullName.split('\\bin\\create.js').join('');

var args = WScript.Arguments,
    TEMPLATES_PATH = '\\template',
    // default template to use when creating the project
    CREATE_TEMPLATE = TEMPLATES_PATH,
    PROJECT_PATH, 
    PACKAGE, 
    NAME,
    GUID;

// File System Object constants
var ForReading = 1, ForWriting = 2, ForAppending = 8;
var TristateUseDefault = -2, TristateTrue = -1, TristateFalse = 0;

function Usage() {
    Log("Usage: create PathTONewProject [ PackageName AppName ]");
    Log("    PathTONewProject : The path to where you wish to create the project");
    Log("    PackageName      : The namespace for the project (default is Cordova.Example)")
    Log("    AppName          : The name of the application (default is CordovaAppProj)");
    Log("examples:");
    Log("    create C:\\Users\\anonymous\\Desktop\\MyProject");
    Log("    create C:\\Users\\anonymous\\Desktop\\MyProject io.Cordova.Example AnApp");
}

// logs messaged to stdout and stderr
function Log(msg, isError) {
    if (isError) {
        WScript.StdErr.WriteLine(msg);
    }
    else {
        WScript.StdOut.WriteLine(msg);
    }
}

function read(filename) {
    var f=fso.OpenTextFile(filename, 1,2);
    var s=f.ReadAll();
    f.Close();
    return s;
}

function write(filename, contents) {
    var f=fso.OpenTextFile(filename, ForWriting, TristateTrue);
    f.Write(contents);
    f.Close();
}

function replaceInFile(filename, regexp, replacement) {
    write(filename,read(filename).replace(regexp,replacement));
}


// executes a commmand in the shell
function exec(command) {
    var oShell=wscript_shell.Exec(command);
    while (oShell.Status == 0) {
        WScript.sleep(100);
    }
}

// executes a commmand in the shell
function exec_verbose(command) {
    //Log("Command: " + command);
    var oShell=wscript_shell.Exec(command);
    while (oShell.Status == 0) {
        //Wait a little bit so we're not super looping
        WScript.sleep(100);
        //Print any stdout output from the script
        if (!oShell.StdOut.AtEndOfStream) {
            var line = oShell.StdOut.ReadLine();
            Log(line);
        }
    }
    //Check to make sure our scripts did not encounter an error
    if (!oShell.StdErr.AtEndOfStream) {
        var line = oShell.StdErr.ReadAll();
        Log(line, true);
        WScript.Quit(1);
    }
}

//generate guid for the project
function genGuid() {
    var TypeLib = WScript.CreateObject("Scriptlet.TypeLib");
    strGuid = TypeLib.Guid.split("}")[0]; // there is extra crap after the } that is causing file streams to break, probably an EOF ... 
    strGuid = strGuid.replace(/[\{\}]/g,""); 
    return strGuid;
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


// creates new project in path, with the given package and app name
function create(destPath, namespace, name, guid) {
    Log("Creating Cordova Windows 8 Project:");
    Log("\tApp Name : " + name);
    Log("\tNamespace : " + namespace);
    Log("\tPath : " + destPath);

    var safeProjectName = name.replace(/(\.\s|\s\.|\s+|\.+)/g, '_');

    var srcPath = ROOT + CREATE_TEMPLATE;

    // Copy the template source files to the new destination
    fso.CopyFolder(srcPath,destPath);
    var newProjGuid = guid || genGuid();

    // replace the guid in the AppManifest
    replaceInFile(destPath + "\\package.appxmanifest","$guid1$",newProjGuid);
    // replace safe-project-name in AppManifest

    replaceInFile(destPath + "\\package.appxmanifest",/\$safeprojectname\$/g,safeProjectName);
    replaceInFile(destPath + "\\package.appxmanifest",/\$projectname\$/g,name);

    replaceInFile(destPath + "\\cordova\\lib\\deploy.js","$guid1$",newProjGuid);

    // replaceInFile(srcPath + "\\App.xaml",/\$safeprojectname\$/g,namespace);
    // replaceInFile(srcPath + "\\App.xaml.cs",/\$safeprojectname\$/g,namespace);

    // replaceInFile(srcPath + "\\MainPage.xaml",/\$safeprojectname\$/g,namespace);
    // replaceInFile(srcPath + "\\MainPage.xaml.cs",/\$safeprojectname\$/g,namespace);
    // replaceInFile(srcPath + "\\CordovaAppProj.csproj",/\$safeprojectname\$/g,namespace);
    // if (NAME != "CordovaAppProj") {
    //     var valid_name = NAME.replace(/(\.\s|\s\.|\s+|\.+)/g, '_');
    //     replaceInFile(srcPath + "\\CordovaSolution.sln", /CordovaAppProj/g, valid_name);
    //     // rename project and solution
    //     exec('%comspec% /c ren ' + srcPath + "\\CordovaSolution.sln " + valid_name + '.sln');
    //     exec('%comspec% /c ren ' + srcPath + "\\CordovaAppProj.csproj " + valid_name + '.csproj');
    // }

    // cleanup

    // Delete bld forder and bin folder

    delete_if_exists(destPath + "\\bld");
    delete_if_exists(destPath + "\\bin");
    delete_if_exists(destPath + "\\*.user");
    delete_if_exists(destPath + "\\*.suo");
    delete_if_exists(destPath + "\\*.vstemplate");

    // TODO: Name the project according to the arguments
    // update the solution to include the new project by name
    // version BS
    // index.html title set to project name ?

    Log("Project created");
}

if (args.Count() > 0) {
    // support help flags
    if (args(0) == "--help" || args(0) == "/?" ||
            args(0) == "help" || args(0) == "-help" || args(0) == "/help" || args(0) == "-h") {
        Usage();
        WScript.Quit(1);
    }

    PROJECT_PATH = args(0);
    if (fso.FolderExists(PROJECT_PATH)) {
        Log("Project directory already exists:", true);
        Log("\t" + PROJECT_PATH, true);
        Log("CREATE FAILED.", true);
        WScript.Quit(1);
    }

    if (args.Count() > 1) {
        PACKAGE = args(1);
    }
    else {
        PACKAGE = "Cordova.Example";
    }

    if (args.Count() > 2) {
        NAME = args(2);
    }
    else {
        NAME = "CordovaAppProj";
    }

    if (args.Count() > 3) {
        var guid_regex = /\{{0,1}([0-9a-fA-F]){8}-([0-9a-fA-F]){4}-([0-9a-fA-F]){4}-([0-9a-fA-F]){4}-([0-9a-fA-F]){12}\}/;
        if (args(3).substr(0,7) == "--guid=" && args(3).match(guid_regex)) {
            GUID = args(3).split
        } else {
            Log("Did not recognize argument '" + args(3) + "'. If your trying to add a GUID make sure it's in the proper format.");
            WScript.Quit(2);
        }
    }

    create(PROJECT_PATH, PACKAGE, NAME, GUID);
}
else {
    Usage();
    WScript.Quit(1);
}

