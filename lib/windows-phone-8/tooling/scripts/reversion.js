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


/************ Globals ********/

var fso = WScript.CreateObject('Scripting.FileSystemObject'),
    shell = WScript.CreateObject("shell.application"),
    wscript_shell = WScript.CreateObject("WScript.Shell");

//Get new version from git or build off this version?
var GET_NEW = false;

//Set up directory structure of current release
    //arguments passed in
var args = WScript.Arguments,
    //Root folder of cordova-wp8 (i.e C:\Cordova\cordova-wp8)
    ROOT = WScript.ScriptFullName.split('\\tooling\\', 1),
    //Sub folder containing templates
    TEMPLATES_PATH = '\\templates',
    //Sub folder for standalone project
    STANDALONE_PATH = TEMPLATES_PATH + '\\standalone',
    //Sub folder containing framework
    FRAMEWORK_PATH = '\\framework',
    //Subfolder containing example project
    EXAMPLE_PATH = '\\example',
    //Path to cordovalib folder, containing source for .dll
    CORDOVA_LIB = STANDALONE_PATH + '\\cordovalib',
    //Get version number
    VERSION='',
    BASE_VERSION = '';

//Destination to build to
var BUILD_DESTINATION;

// help function
function Usage()
{
    WScript.StdOut.WriteLine("");
    WScript.StdOut.WriteLine("Usage: reversion [ Version PathTOCordovaWP8 ]");
    WScript.StdOut.WriteLine("    Version : The new version for codova-wp8");
    WScript.StdOut.WriteLine("    PathTOCordovaWP8 : The path to the cordova directory being reversioned.");
    WScript.StdOut.WriteLine("examples:");
    WScript.StdOut.WriteLine("    reversion 2.5.0rc1  //Reversions the current working directory");
    WScript.StdOut.WriteLine("    reversion 2.5.0 C :\\Users\\anonymous\\Desktop\\cordova-wp8");
    WScript.StdOut.WriteLine("");
}

var ForReading = 1, ForWriting = 2, ForAppending = 8;
var TristateUseDefault = -2, TristateTrue = -1, TristateFalse = 0;

// returns the contents of a file
function read(filename) {
    //WScript.Echo('Reading in ' + filename);
    if(fso.FileExists(filename))
    {
        var f=fso.OpenTextFile(filename, 1,2);
        var s=f.ReadAll();
        f.Close();
        return s;
    }
    else
    {
        WScript.StdErr.WriteLine('Cannot read non-existant file : ' + filename);
        WScript.Quit(1);
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
    //WScript.Echo("Replaceing with "+replacement+ " in:");
    var text = read(filename).replace(regexp,replacement);
    //WScript.Echo(text);
    write(filename,text);
}

// executes a commmand in the shell
function exec(command) {
    var oShell=wscript_shell.Exec(command);
    while (oShell.Status === 0) {
        WScript.sleep(100);
    }
}

// executes a commmand in the shell
function exec_verbose(command) {
    //WScript.StdOut.WriteLine("Command: " + command);
    var oShell=wscript_shell.Exec(command);
    while (oShell.Status === 0) {
        //Wait a little bit so we're not super looping
        WScript.sleep(100);
        //Print any stdout output from the script
        if(!oShell.StdOut.AtEndOfStream) {
            var line = oShell.StdOut.ReadLine();
            WScript.StdOut.WriteLine(line);
        }
    }
    //Check to make sure our scripts did not encounter an error
    if(!oShell.StdErr.AtEndOfStream)
    {
        var err_line = oShell.StdErr.ReadAll();
        WScript.StdErr.WriteLine(err_line);
        WScript.Quit(1);
    }
}

function updateVersionNumbers() {
    WScript.StdOut.WriteLine("Updating version numbers....");
    var version_regex = /(\d+)[.](\d+)[.](\d+)(rc\d)?/;
    replaceInFile(BUILD_DESTINATION + '\\VERSION', version_regex,  VERSION);
    // replace assembaly versions in framework
    var framework_regex = /Description\(\"(\d+)[.](\d+)[.](\d+)(rc\d)?\"\)\]/; //Will match ("x.x.x[rcx]")]
    replaceInFile(BUILD_DESTINATION + FRAMEWORK_PATH + "\\Properties\\AssemblyInfo.cs", framework_regex, "Description(\"" + VERSION + "\")]");
    framework_regex = /Version\(\"(\d+)[.](\d+)[.](\d+)[.](\d+)\"\)\]/g;
    replaceInFile(BUILD_DESTINATION + FRAMEWORK_PATH + "\\Properties\\AssemblyInfo.cs", framework_regex, "Version(\"" + BASE_VERSION + "\")]");

    // update standalone project
    exec('%comspec% /c copy /Y /V ' + BUILD_DESTINATION + "\\VERSION " + BUILD_DESTINATION + STANDALONE_PATH + "\\VERSION");
    var cordova_regex = /cordova-(\d+)[.](\d+)[.](\d+)(rc\d)?/g; //Matches *first* cordova-x.x.x[rcx] (just ad g at end to make global)
    replaceInFile(BUILD_DESTINATION + STANDALONE_PATH + '\\CordovaAppProj.csproj', cordova_regex,  "cordova-" + VERSION);
    replaceInFile(BUILD_DESTINATION + STANDALONE_PATH + '\\www\\index.html', cordova_regex,  "cordova-" + VERSION);
    version_regex = /return\s*\"(\d+)[.](\d+)[.](\d+)(rc\d)?/; //Matches return "x.x.x[rcx]

    WScript.StdOut.WriteLine("path = " + BUILD_DESTINATION + CORDOVA_LIB + '\\Plugins\\Device.cs');
    replaceInFile(BUILD_DESTINATION + CORDOVA_LIB + '\\..\\Plugins\\Device.cs', version_regex,  "return \"" + VERSION);

    // update example proj
    replaceInFile(BUILD_DESTINATION + EXAMPLE_PATH + '\\CordovaExample.csproj', cordova_regex,  "cordova-" + VERSION);
    version_regex = /VERSION\s*\=\s*\'(\d+)[.](\d+)[.](\d+)(rc\d)?/;  //Matches VERSION = x.x.x[rcx]
    replaceInFile(BUILD_DESTINATION + EXAMPLE_PATH + '\\www\\cordova-current.js', version_regex,  "VERSION = \'" + VERSION);

    // update template discription
    version_regex = /Cordova\s*(\d+)[.](\d+)[.](\d+)(rc\d)?\s*Windows/g; //Matches version: x.x.x[rcx]
    replaceInFile(BUILD_DESTINATION + TEMPLATES_PATH + '\\vs\\description.txt', version_regex,  "Cordova " + VERSION + " Windows");

    // update .vstemplate files for the template zips.
    var name_regex = /CordovaWP8[_](\d+)[_](\d+)[_](\d+)(rc\d)?/g;
    var discript_regex = /Cordova\s*(\d+)[.](\d+)[.](\d+)(rc\d)?/;

    replaceInFile(BUILD_DESTINATION + TEMPLATES_PATH + '\\vs\\MyTemplateStandAlone.vstemplate', name_regex,  'CordovaWP8_' + VERSION.replace(/\./g, '_'));
    replaceInFile(BUILD_DESTINATION + TEMPLATES_PATH + '\\vs\\MyTemplateStandAlone.vstemplate', discript_regex,  "Cordova " + VERSION);
    replaceInFile(BUILD_DESTINATION + TEMPLATES_PATH + '\\vs\\MyTemplateStandAlone.vstemplate', cordova_regex,  "cordova-" + VERSION);
}

// delete all cordova.js and generated files (templates) from old version numbers
function cleanup()
{
    WScript.StdOut.WriteLine("Cleanup");
    // remove old template .zip files
    if(fso.FileExists(BUILD_DESTINATION + '\\*.zip'))
    {
        fso.DeleteFile(BUILD_DESTINATION + '\\*.zip');
    }
    // remove any generated framework files
    if(fso.FolderExists(BUILD_DESTINATION + FRAMEWORK_PATH + '\\Bin'))
    {
        fso.DeleteFolder(BUILD_DESTINATION + FRAMEWORK_PATH + '\\Bin');
    }
    if(fso.FolderExists(BUILD_DESTINATION + FRAMEWORK_PATH + '\\obj'))
    {
        fso.DeleteFolder(BUILD_DESTINATION + FRAMEWORK_PATH + '\\obj');
    }
    // remove any generated CordovaDeploy
    if(fso.FolderExists(BUILD_DESTINATION + '\\tooling\\CordovaDeploy\\CordovaDeploy\\bin'))
    {
        fso.DeleteFolder(BUILD_DESTINATION + '\\tooling\\CordovaDeploy\\CordovaDeploy\\bin');
    }
    if(fso.FolderExists(BUILD_DESTINATION + '\\tooling\\CordovaDeploy\\CordovaDeploy\\obj'))
    {
        fso.DeleteFolder(BUILD_DESTINATION + '\\tooling\\CordovaDeploy\\CordovaDeploy\\obj');
    }
    //remove old template .zip files
    WScript.Echo(BUILD_DESTINATION);
    var root_folder = shell.NameSpace(BUILD_DESTINATION + '\\').Items();
    for(var i = 0; i < root_folder.Count; i++)
    {
        if(root_folder.Item(i).Name.match(/CordovaWP8[_](\d+)[_](\d+)[_](\d+)(rc\d)?/))
        {
            fso.DeleteFile(BUILD_DESTINATION + '\\' + root_folder.Item(i).Name);
        }
    }
    // remove old cordova.js
    var example_www = shell.NameSpace(BUILD_DESTINATION + EXAMPLE_PATH + '\\www').Items();
    for(i = 0; i < example_www.Count; i++)
    {
        if(example_www.Item(i).Name.match(/cordova\-(\d+)[.](\d+)[.](\d+)(rc\d)?[.]js/))
        {
            fso.DeleteFile(BUILD_DESTINATION + EXAMPLE_PATH + '\\www\\' + example_www.Item(i).Name);
        }
    }

    var standalone_www = shell.NameSpace(BUILD_DESTINATION + STANDALONE_PATH + '\\www').Items();
    for(i = 0; i < standalone_www.Count; i++)
    {
        if(standalone_www.Item(i).Name.match(/cordova\-(\d+)[.](\d+)[.](\d+)(rc\d)?[.]js/))
        {
            fso.DeleteFile(BUILD_DESTINATION + STANDALONE_PATH + '\\www\\' + standalone_www.Item(i).Name);
        }
    }
}


WScript.StdOut.WriteLine("");

if(args.Count() > 1)
{
    if(fso.FolderExists(args(1)) && fso.FolderExists(args(1) + '\\tooling'))
    {
        BUILD_DESTINATION = args(1);
    }
    else
    {
        WScript.StdErr.WriteLine("The given path is not a cordova-wp8 repo, if");
        WScript.StdErr.WriteLine(" your trying to reversion a cordova-wp8 repo");
        WScript.StdErr.WriteLine(" other then this one, please provide its path.");
        Usage();
        WScript.Quit(1);
    }
}

if(args.Count() > 0)
{
    //Support help flags
    if(args(0).indexOf("--help") > -1 ||
         args(0).indexOf("/?") > -1 )
    {
        Usage();
        WScript.Quit(1);
    }

    if(args(0).match(/(\d+)[.](\d+)[.](\d+)(rc\d)?/))
    {
        VERSION = args(0);
        BASE_VERSION = VERSION.split('rc', 1) + ".0";
        if(args.Count() < 2)
        {
          BUILD_DESTINATION = ROOT;
        }
        // remove old cordova.js files and any generated files
        cleanup();
        // update version numbers
        updateVersionNumbers();
    }
    else
    {
        WScript.StdOut.WriteLine("The  version number is invalid, please provide");
        WScript.StdOut.WriteLine(" a version number in the format Major.Minor.Fix[rc#]");
        Usage();
        WScript.Quit(1);
    }
}
else
{
    Usage();
    WScript.Quit(1);
}