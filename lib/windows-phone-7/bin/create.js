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
 * create a cordova/wp7 project
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
    FRAMEWORK_PATH = '\\framework',
    TOOLING_PATH = '\\tooling',
    TEMPLATES_PATH = '\\templates',
    // sub folder for standalone project
    STANDALONE_PATH = TEMPLATES_PATH + '\\standalone',
    // default template to use when creating the project
    CREATE_TEMPLATE = STANDALONE_PATH,
    USE_DLL = false,
    PROJECT_PATH, 
    PACKAGE, 
    NAME;

    // get version number
var VERSION=read(ROOT+'\\VERSION').replace(/\r\n/,'').replace(/\n/,'');
var BASE_VERSION = VERSION.split('rc', 1) + ".0";

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
function Log(msg, error) {
    if (error) {
        WScript.StdErr.WriteLine(msg);
    }
    else {
        WScript.StdOut.WriteLine(msg);
    }
}

var ForReading = 1, ForWriting = 2, ForAppending = 8;
var TristateUseDefault = -2, TristateTrue = -1, TristateFalse = 0;

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

// builds the new cordova dll from the framework
function build_dll(path) {
    if (fso.FolderExists(path + FRAMEWORK_PATH + '\\Bin')) {
        fso.DeleteFolder(path + FRAMEWORK_PATH + '\\Bin');
    }
    if (fso.FolderExists(path + FRAMEWORK_PATH + '\\obj')) {
        fso.DeleteFolder(path + FRAMEWORK_PATH + '\\obj');
    }
    // move to framework directory
    wscript_shell.CurrentDirectory = path + FRAMEWORK_PATH;
    // build .dll in Release
    exec_verbose('msbuild /clp:NoSummary;NoItemAndPropertyList;Verbosity=minimal /nologo /p:Configuration=Release;VersionNumber=' + VERSION + ';BaseVersionNumber=' + BASE_VERSION);
    //Check if file dll was created
    if (!fso.FileExists(path + FRAMEWORK_PATH + '\\Bin\\Release\\WPCordovaClassLib.dll')) {
        Log('ERROR: MSBuild failed to create .dll when building WPCordovaClassLib.dll', true);
        WScript.Quit(1);
    }
    Log("SUCCESS BUILDING DLL");
}

// creates new project in path, with the given package and app name
function create(path, namespace, name) {
    Log("Creating Cordova-WP7 Project:");
    Log("\tApp Name : " + name);
    Log("\tNamespace : " + namespace);
    Log("\tPath : " + path);

    // Copy the template source files to the new destination
    fso.CopyFolder(ROOT + CREATE_TEMPLATE, path);

    var newProjGuid = genGuid();
    // replace the guid in the AppManifest
    replaceInFile(path + "\\Properties\\WMAppManifest.xml","$guid1$",newProjGuid);
    // replace safe-project-name in AppManifest
    replaceInFile(path + "\\Properties\\WMAppManifest.xml",/\$safeprojectname\$/g,name);
    replaceInFile(path + "\\Properties\\WMAppManifest.xml",/\$projectname\$/g,name);


    replaceInFile(path + "\\App.xaml",/\$safeprojectname\$/g,namespace);
    replaceInFile(path + "\\App.xaml.cs",/\$safeprojectname\$/g,namespace);

    replaceInFile(path + "\\MainPage.xaml",/\$safeprojectname\$/g,namespace);
    replaceInFile(path + "\\MainPage.xaml.cs",/\$safeprojectname\$/g,namespace);
    replaceInFile(path + "\\CordovaAppProj.csproj",/\$safeprojectname\$/g,namespace);
    if (NAME != "CordovaAppProj") {
        replaceInFile(path + "\\CordovaSolution.sln",/CordovaAppProj/g,NAME);
        // rename project and solution
        exec('%comspec% /c ren ' + path + "\\CordovaSolution.sln " + NAME + '.sln');
        exec('%comspec% /c ren ' + path + "\\CordovaAppProj.csproj " + NAME + '.csproj');
    }

    //copy .dll if necessary
    if (USE_DLL) {
        var dllPath = ROOT + FRAMEWORK_PATH + '\\Bin\\Release\\WPCordovaClassLib.dll';
        if (fso.FileExists(dllPath)) {
            Log("WPCordovaClassLib.dll Found,  creating project");
        }
        else {
            Log("WPCordovaClassLib.dll was not Found in " + dllPath);
            Log('BUILDING: WPCordovaClassLib.dll');
            build_dll(ROOT);
        }

        if (!fso.FolderExists(path + '\\CordovaLib')) {
            fso.CreateFolder(path + '\\CordovaLib');
        }
        exec('%comspec% /c xcopy ' + ROOT + FRAMEWORK_PATH + '\\Bin\\Release\\WPCordovaClassLib.dll ' + path + '\\CordovaLib');
        if (!fso.FileExists(path + '\\CordovaLib\\WPCordovaClassLib.dll')) {
            Log('ERROR: Failed to copy WPCordovaClassLib.dll to project from', true);
            Log('\t' + ROOT + FRAMEWORK_PATH + '\\Bin\\Release\\WPCordovaClassLib.dll', true);
            Log('\tto', true);
            Log('\t' + path + '\\CordovaLib', true)
            WScript.Quit(1);
        }
    }

    Log("CREATE SUCCESS : " + path);

    // TODO: Name the project according to the arguments
    // update the solution to include the new project by name
    // version BS
    // index.html title set to project name ?

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

    create(PROJECT_PATH, PACKAGE, NAME);
}
else {
    Usage();
    WScript.Quit(1);
}

