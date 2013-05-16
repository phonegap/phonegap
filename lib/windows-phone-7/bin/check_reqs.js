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


var args = WScript.Arguments;
var wscript_shell = WScript.CreateObject("WScript.Shell");

var REQUIRE_GIT = false;

function Usage() {
    Log("Usage: [ check_reqs | cscript check_reqs.js ]");
    Log("examples:");
    Log("    cscript C:\\Users\\anonymous\\cordova-wp7\\bin\\check_reqs.js");
    Log("    CordovaWindowsPhone\\bin\\check_reqs");

}

// log to stdout or stderr
function Log(msg, error) {
    if (error) {
        WScript.StdErr.WriteLine(msg);
    }
    else {
        WScript.StdOut.WriteLine(msg);
    }
}

// gets the output from a command, failing with the given error message
function check_command(cmd, fail_msg) {
    var out = wscript_shell.Exec(cmd);
    while (out.Status == 0) {
        WScript.Sleep(100);
    }

    //Check that command executed 
    if (!out.StdErr.AtEndOfStream) {
        var line = out.StdErr.ReadLine();
        Log(fail_msg, true);
        Log('Output : ' + line, true);
        WScript.Quit(1);
    }

    if (!out.StdOut.AtEndOfStream) {
        var line = out.StdOut.ReadAll();
        return line;
    }
    else {
         Log('Unable to get output from command "' + cmd + '"', true);
         WScript.Quit(1);
    }
}

/* The tooling for cordova windows phone requires these commands
 *  in the environment PATH variable.
 * - msbuild (C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319)
 * - git? (for dynamic cli loading of projects?)
 */
function SystemRequiermentsMet() {
    var cmd = 'msbuild -version'
    var fail_msg = 'The command `msbuild` failed. Make sure you have the latest Windows Phone SDKs installed, and the `msbuild.exe` command (inside C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319) is added to your path.'
    var output = check_command(cmd, fail_msg);
    var msversion = output.match(/\.NET\sFramework\,\sversion\s4\.0/);
    if (!msversion) {
        Log('Please install the .NET Framwork v4.0.30319 (in the latest windows phone SDK\'s).', true);
        Log('Make sure the "msbuild" command in your path is pointing to  v4.0.30319 of msbuild as well (inside C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319).', true);
        WScript.Quit(1);
    }

    if(REQUIRE_GIT) {
        cmd = 'git --version';
        fail_msg = 'The command `git` failed. Make sure you have git installed as well ad in your PATH environment so the tool can use it';
        output = check_command(cmd, fail_msg);
        var gitVersion = output.match(/git\sversion\s1\./);
        if (!gitVersion) {
            Log('Please ensure you have at least git v1 installed and added to you PATH so this tool can use it to get the latest codova.');
        }
    }
}


if (args.Count() > 0) {
    // support help flags
    if (args(0) == "--help" || args(0) == "/?" ||
            args(0) == "help" || args(0) == "-help" || args(0) == "/help" || args(0) == "-h") {
        Usage();
        WScript.Quit(1);
    }
    else {
        Log('Error : Did not recognize argument ' + args(0), true)
        Usage();
        WScript.Quit(1);
    }
}

SystemRequiermentsMet();