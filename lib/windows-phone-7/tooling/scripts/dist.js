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


/*************************************************/
/****************  REQUIREMENTS  *****************/
/*************************************************/
/*
Paths:
  - path to git.exe  -> C:\msysgit\bin
  - path to msbuild -> C:\Windows\Microsoft.NET\Framework\v4.0.30319
Famework
  - .NET 4.0
  - Windows phone SDKs


/************ Globals ********/

var fso = WScript.CreateObject('Scripting.FileSystemObject'),
    wscript_shell = WScript.CreateObject("WScript.Shell");

//Set up directory structure of current release
    //arguments passed in
var args = WScript.Arguments,
    //Root folder of cordova-wp7 (i.e C:\Cordova\cordova-wp7)
    ROOT = WScript.ScriptFullName.split('\\tooling\\', 1),
    // tooling scripts
    SCRIPTS = '\\tooling\\scripts';
    //Get version number
    VERSION=read(ROOT+'\\VERSION').replace(/\r\n/,'').replace(/\n/,'');

//Destination to build to
var BUILD_DESTINATION;
//current script that is running
var current_script = "dist";
// replace the directory
var replace = false;


/*************************************************/
/****************  FUNCTIONS  ********************/
/*************************************************/


// help function
function Usage() {
  Log("");
  Log("This is a command line tool for building new releases. It will package a new release");
  Log(" of a cordova-wp7 project, reversioning it to match the VERSION file in the root directory.");
  Log("Usage: dist [ <NEW_PATH_FOR_BUILD> | -f ] ");
  Log("                       -f : force tool to reversion the current repositoy.");
  Log("     <NEW_PATH_FOR_BUILD> : path to create the new reversioned repositoy in.");
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

// returns the contents of a file
function read(filename) {
    //Log('Reading in ' + filename);
    if(fso.FileExists(filename)) {
        var f=fso.OpenTextFile(filename, 1,2);
        var s=f.ReadAll();
        f.Close();
        return s;
    }
    else {
        Log('Cannot read non-existant file : ' + filename, true);
        WScript.Quit(1);
    }
    return null;
}

// executes a commmand in the shell
function exec(command) {
    Log("Command: " + command);
    var oShell=wscript_shell.Exec(command);
    while (oShell.Status === 0) {
        //Wait a little bit so we're not super looping
        WScript.sleep(100);
        //Print any stdout output from the script
        if(!oShell.StdOut.AtEndOfStream) {
            var line = oShell.StdOut.ReadLine();
            Log(line);
        }
    }
    //Check to make sure our scripts did not encounter an error
    if(!oShell.StdErr.AtEndOfStream) {
        var err_line = oShell.StdErr.ReadAll();
        Log(err_line, true);
        Log("ERROR: Could not complete distribution, failed while running: " + current_script, true);
        WScript.Quit(1);
    }
}

function space() {
    Log("");
    Log("*****************************************************");
    Log("");
}


/*************************************************/
/**************  MAIN SCRIPT  ********************/
/*************************************************/

if (args.Count() > 0) {
    if (args.Count() == 1) {
        // support help flags
        if (args(0).indexOf("--help") > -1 ||
              args(0).indexOf("/?") > -1 ) {
            Usage();
            WScript.Quit(1);
        }
        else if (args(0) == '-f') {
          BUILD_DESTINATION = ROOT;
          replace = true;
        }
        else {
          BUILD_DESTINATION = args(0);
        }

    }
    else if (args.Count() == 2) {
        if (args(0) == '-f') {
            replace = true;
            BUILD_DESTINATION = args(1);
        } else {
           BUILD_DESTINATION = args(0);
           if (args(1) == '-f') {
              replace = true;
           }
           else {
              Log('WARNING : "' + args(1) + '" is not regognized, attempting to continue distribution.');
           }
        }
    }
    else {
        Log("Error : too many arguments provided.", true);
        WScript.Quit(1);
    }
    
}
else {
    Usage();
    WScript.Quit(1);
}


/*************************************************/
/******************  Step 1  *********************/
/*************************************************/
/** - Copy source code to new directory         **/
/*************************************************/
if (!replace) {
  current_script = "new.js";
  exec('cscript ' + ROOT + SCRIPTS + '\\new.js ' + BUILD_DESTINATION + ' //nologo');
  space();
}

/*************************************************/
/******************  Step 2  *********************/
/*************************************************/
/** - Retag everything with new version numbers **/
/** - Delete any generated files and cordova.js **/
/** - Rebuild dll                               **/
/*************************************************/
current_script = "reversion.js";
exec('cscript ' + BUILD_DESTINATION + SCRIPTS + '\\reversion.js ' + VERSION + ' //nologo');
space();

/*************************************************/
/******************  Step 3  *********************/
/*************************************************/
/** - Download tagged version of cordova.js     **/
/** - build cordova.js                          **/
/** - windows.cordova.js -> templates + example **/
/*************************************************/
current_script = "buildjs.js";
exec('cscript ' + BUILD_DESTINATION + SCRIPTS + '\\buildjs.js //nologo');
space();

/*************************************************/
/******************  Step 5  *********************/
/*************************************************/
/** - Build templates                           **/
/** - Zip templates                             **/
/** - inject into Visual Studio                 **/
/*************************************************/
current_script = "package.js";
exec('cscript ' + BUILD_DESTINATION + SCRIPTS + '\\package.js //nologo');
space();
Log("Distribution Complete.");