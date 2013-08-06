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
    Log("    --debug   : Cleans and builds project in debug mode.");
    Log("    --release : Cleans and builds project in release mode.");
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

// checks to see if a .csproj file exists in the project root
function is_cordova_project(path) {
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

function get_solution_name(path) {
    if (fso.FolderExists(path)) {
        var proj_folder = fso.GetFolder(path);
        var proj_files = new Enumerator(proj_folder.Files);
        for (;!proj_files.atEnd(); proj_files.moveNext()) {
            if (fso.GetExtensionName(proj_files.item()) == 'sln') {
                return proj_files.item();
            }
        }
    }
    return null;
}

// builds the project and .xap in release mode
function build_xap_release(path) {
    Log("Building Cordova-WP7 Project:");
    Log("\tConfiguration : Release");
    Log("\tDirectory : " + path);
    
    wscript_shell.CurrentDirectory = path;
    exec_verbose('msbuild ' + get_solution_name(path) + ' /clp:NoSummary;NoItemAndPropertyList;Verbosity=minimal /nologo /p:Configuration=Release');
    
    // check if file xap was created
    if (fso.FolderExists(path + '\\Bin\\Release')) {
        var out_folder = fso.GetFolder(path + '\\Bin\\Release');
        var out_files = new Enumerator(out_folder.Files);
        for (;!out_files.atEnd(); out_files.moveNext()) {
            if (fso.GetExtensionName(out_files.item()) == 'xap') {
                Log("BUILD SUCCESS.");
                return;  
            }
        }
    }
    Log('ERROR: MSBuild failed to create .xap when building cordova-wp7 for release.', true);
    WScript.Quit(2);
}

// builds the project and .xap in debug mode
function build_xap_debug(path) {
    Log("Building Cordova-WP7 Project:");
    Log("\tConfiguration : Debug");
    Log("\tDirectory : " + path);
    
    wscript_shell.CurrentDirectory = path;
    exec_verbose('msbuild ' + get_solution_name(path) + ' /clp:NoSummary;NoItemAndPropertyList;Verbosity=minimal /nologo /p:Configuration=Debug');
    
    // check if file xap was created
    if (fso.FolderExists(path + '\\Bin\\Debug')) {
        var out_folder = fso.GetFolder(path + '\\Bin\\Debug');
        var out_files = new Enumerator(out_folder.Files);
        for (;!out_files.atEnd(); out_files.moveNext()) {
            if (fso.GetExtensionName(out_files.item()) == 'xap') {
                Log("BUILD SUCCESS.");
                return;  
            }
        }
    }
    Log('ERROR: MSBuild failed to create .xap when building cordova-wp7 for debugging.', true);
    WScript.Quit(2);
}


Log("");

if (args.Count() > 0) {
    // support help flags
    if (args(0) == "--help" || args(0) == "/?" ||
            args(0) == "help" || args(0) == "-help" || args(0) == "/help") {
        Usage();
        WScript.Quit(2);
    }
    else if (args.Count() > 1) {
        Log("Error: Too many arguments.", true);
        Usage();
        WScript.Quit(2);
    }
    else if (fso.FolderExists(ROOT)) {
        if (!is_cordova_project(ROOT)) {
            Log('Error: .csproj file not found in ' + ROOT, true);
            Log('could not build project.', true);
            WScript.Quit(2);
        }

        if (args(0) == "--debug" || args(0) == "-d") {
            exec_verbose('%comspec% /c ' + ROOT + '\\cordova\\clean');
            build_xap_debug(ROOT);
        }
        else if (args(0) == "--release" || args(0) == "-r") {
            exec_verbose('%comspec% /c ' + ROOT + '\\cordova\\clean');
            build_xap_release(ROOT);
        }
        else {
            Log("Error: \"" + args(0) + "\" is not recognized as a build option", true);
            Usage();
            WScript.Quit(2);
        }
    }
    else {
        Log("Error: Project directory not found,", true);
        Usage();
        WScript.Quit(2);
    }
}
else {
    Log("WARNING: [ --debug | --release ] not specified, defaulting to debug...");
    build_xap_debug(ROOT);
}
