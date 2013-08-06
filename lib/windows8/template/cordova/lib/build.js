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


var fso = WScript.CreateObject('Scripting.FileSystemObject');
var wscript_shell = WScript.CreateObject("WScript.Shell");

var args = WScript.Arguments;

// working dir
var ROOT = WScript.ScriptFullName.split('\\cordova\\lib\\build.js').join('');

// help/usage function
function Usage() {
    Log("");
    Log("Usage: build [ --debug | --release ]");
    Log("    --help    : Displays this dialog.");
    Log("    --debug   : builds project in debug mode. (Default)");
    Log("    --release : builds project in release mode.");
    Log("    -r        : shortcut :: builds project in release mode.");
    Log("examples:");
    Log("    build ");
    Log("    build --debug");
    Log("    build --release");
    Log("");
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
        WScript.Quit(2);
    }
}

// checks to see if a .jsproj file exists in the project root
function is_cordova_project(path) {
    if (fso.FolderExists(path)) {
        var proj_folder = fso.GetFolder(path);
        var proj_files = new Enumerator(proj_folder.Files);
        for (;!proj_files.atEnd(); proj_files.moveNext()) {
            if (fso.GetExtensionName(proj_files.item()) == 'jsproj') {
                return true;  
            }
        }
    }
    return false;
}

// builds the project and .xap in debug mode
function build_appx(path,isRelease) {

    var mode = (isRelease ? "Release" : "Debug");
    Log("Building Cordova Windows 8 Project:");
    Log("\tConfiguration : " + mode);
    Log("\tDirectory : " + path);
    
    wscript_shell.CurrentDirectory = path;
    exec_verbose('msbuild /clp:NoSummary;NoItemAndPropertyList;Verbosity=minimal /nologo /p:Configuration=' + mode);

    // TODO: there could be multiple AppPackages
    // check if AppPackages created
    if (fso.FolderExists(path + '\\AppPackages')) {
        var out_folder = fso.GetFolder(path + '\\AppPackages');
        var subFolders = new Enumerator(out_folder.SubFolders);
        for(;!subFolders.atEnd();subFolders.moveNext())
        {
            var subFolder = subFolders.item();
            var files = new Enumerator(subFolder.Files);
            for(;!files.atEnd();files.moveNext())
            {
                if(fso.GetExtensionName(files.item()) == "ps1")
                {
                    var command = "PowerShell " + files.item();
                    Log("\nRunning Command :: " + command);
                    // run it and wait for the result
                    var retCode = wscript_shell.Run(command, 1, true);
                    return retCode == 0 ? "Success" : "Error running PowerShell script : " + retCode;
                }

            }
        }

    }
    return "Error : AppPackages were not built";

}


Log("");

var result;
var isRelease = false;

if (args.Count() > 0) {
    // support help flags
    if (args(0) == "--help" || args(0) == "/?" ||
            args(0) == "help" || args(0) == "-help" || args(0) == "/help") {
        Usage();
        WScript.Quit(2);
    }
    else if (!fso.FolderExists(ROOT) || !is_cordova_project(ROOT)) {
        Log("Error: could not find project at " + ROOT, true);
        WScript.Quit(2);
    }
     
    isRelease = (args(0) == "--release" || args(0) == "-r");   
}

Log(build_appx(ROOT,isRelease));
