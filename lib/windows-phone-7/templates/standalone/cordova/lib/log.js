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
var ROOT = WScript.ScriptFullName.split('\\cordova\\lib\\log.js').join('');


// help function
function Usage() {
    Log("");
    Log("Usage: log");
    Log("examples:");
    Log("    log");
    Log("         - logs output from running application  *NOT IMPLIMENTED*");
    Log("");
}

//  logs to stdout or stderr
function Log(msg, error) {
    if (error) {
        WScript.StdErr.WriteLine(msg);
    }
    else {
        WScript.StdOut.WriteLine(msg);
    }
}

// log output from running projects *NOT IMPLEMENTED*
function log_output(path) {
    Log("ERROR: Logging is not supported on Windows Phone", true);
    WScript.Quit(1);
}


if (args.Count() > 0) {
    // support help flags
    if (args(0) == "--help" || args(0) == "/?" ||
            args(0) == "help" || args(0) == "-help" || args(0) == "/help") {
        Usage();
        WScript.Quit(2);
    }
    else {
        Log("Error: \"" + args(0) + "\" is not recognized as a log option.", true);
        Usage();
        WScript.Quit(2);
    }
}
else {
   if (fso.FolderExists(ROOT)) {
        log_output(ROOT);
    }
    else {
        Log("Error: Project directory not found,", true);
        Usage();
        WScript.Quit(2);
    }
}