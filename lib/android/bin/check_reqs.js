// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

var ROOT  = WScript.ScriptFullName.split('\\bin\\check_reqs.js').join(''),
    shell = WScript.CreateObject("WScript.Shell"),
    fso   = WScript.CreateObject('Scripting.FileSystemObject');


// executes a command in the shell, returns stdout or stderr if error
function exec_out(command) {
    var oExec=shell.Exec(command);
    var output = new String();
    while (oExec.Status == 0) {
        if (!oExec.StdOut.AtEndOfStream) {
            var line = oExec.StdOut.ReadAll();
            // XXX: Change to verbose mode 
            // WScript.StdOut.WriteLine(line);
            output += line;
        }
        WScript.sleep(100);
    }
    //Check to make sure our scripts did not encounter an error
    if (!oExec.StdErr.AtEndOfStream) {
        var line = oExec.StdErr.ReadAll();
        return {'error' : true, 'output' : line};
    } else if (!oExec.StdOut.AtEndOfStream) {
            var line = oExec.StdOut.ReadAll();
            // XXX: Change to verbose mode 
            // WScript.StdOut.WriteLine(line);
            output += line;
    }
    return {'error' : false, 'output' : output};
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

// checks that android requirements are met
function check_requirements() {
    var result = exec_out('%comspec% /c android list target');
    if(result.error) {
        Log('The command `android` failed. Make sure you have the latest Android SDK installed, and the `android` command (inside the tools/ folder) added to your path. Output: ' + result.output, true);
        WScript.Quit(2);
    }
    else if(!result.output.match(/android[-]17/)) {
        Log('Please install Android target 17 (the Android 4.2 SDK). Make sure you have the latest Android tools installed as well. Run `android` from your command-line to install/update any missing SDKs or tools.', true);
        Log('Output : ' + result.output);
        WScript.Quit(2);
    }
    else {
        var cmd = '%comspec% /c android update project -p ' + ROOT + '\\framework -t android-17';
        result = exec_out(cmd);
        if(result.error) {
            Log('Error updating the Cordova library to work with your Android environment. Command run: "' + cmd + '", output: ' + result.output, true);
            WScript.Quit(2);  
        }
    }
}

check_requirements();