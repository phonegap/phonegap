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
 * create a cordova/android project
 *
 * USAGE
 *  ./update [path]
 */

var fso = WScript.CreateObject('Scripting.FileSystemObject');

function read(filename) {
    var fso=WScript.CreateObject("Scripting.FileSystemObject");
    var f=fso.OpenTextFile(filename, 1);
    var s=f.ReadAll();
    f.Close();
    return s;
}

function checkTargets(targets) {
    if(!targets) {
        WScript.Echo("You do not have any android targets setup. Please create at least one target with the `android` command");
        WScript.Quit(69);
    }
}

function setTarget() {
    var targets = shell.Exec('android.bat list targets').StdOut.ReadAll().match(/id:\s\d+/g);
    checkTargets(targets);
    return targets[targets.length - 1].replace(/id: /, ""); // TODO: give users the option to set their target 
}

function setApiLevel() {
    var targets = shell.Exec('android.bat list targets').StdOut.ReadAll().match(/API level:\s\d+/g);
    checkTargets(targets);
    return targets[targets.length - 1].replace(/API level: /, "");
}

function write(filename, contents) {
    var fso=WScript.CreateObject("Scripting.FileSystemObject");
    var f=fso.OpenTextFile(filename, 2, true);
    f.Write(contents);
    f.Close();
}

function replaceInFile(filename, regexp, replacement) {
    write(filename, read(filename).replace(regexp, replacement));
}

function exec(command) {
    var oShell=shell.Exec(command);
    while (oShell.Status == 0) {
        if(!oShell.StdOut.AtEndOfStream) {
            var line = oShell.StdOut.ReadLine();
            // XXX: Change to verbose mode 
            // WScript.StdOut.WriteLine(line);
        }
        WScript.sleep(100);
    }
}

function createAppInfoJar() {
    if(!fso.FileExists(ROOT+"\\bin\\templates\\cordova\\appinfo.jar")) {
        WScript.Echo("Creating appinfo.jar...");
        var cur = shell.CurrentDirectory;
        shell.CurrentDirectory = ROOT+"\\bin\\templates\\cordova\\ApplicationInfo";
        exec("javac ApplicationInfo.java");
        exec("jar -cfe ..\\appinfo.jar ApplicationInfo ApplicationInfo.class");
        shell.CurrentDirectory = cur;
    }
}

function cleanup() {
    if(fso.FileExists(ROOT + '\\framework\\cordova-'+VERSION+'.jar')) {
        fso.DeleteFile(ROOT + '\\framework\\cordova-'+VERSION+'.jar');
    }
    if(fso.FileExists(ROOT + '\\framework\\assets\\www\\cordova-'+VERSION+'.js')) {
        fso.DeleteFile(ROOT + '\\framework\\assets\\www\\cordova-'+VERSION+'.js');
    }
}

function downloadCommonsCodec() {
    if (!fso.FileExists(ROOT + '\\framework\\libs\\commons-codec-1.7.jar')) {
      // We need the .jar
      var url = 'http://archive.apache.org/dist/commons/codec/binaries/commons-codec-1.7-bin.zip';
      var libsPath = ROOT + '\\framework\\libs';
      var savePath = libsPath + '\\commons-codec-1.7-bin.zip';
      if (!fso.FileExists(savePath)) {
        if(!fso.FolderExists(ROOT + '\\framework\\libs')) {
            fso.CreateFolder(libsPath);
        }
        // We need the zip to get the jar
        var xhr = WScript.CreateObject('MSXML2.XMLHTTP');
        xhr.open('GET', url, false);
        xhr.send();
        if (xhr.status == 200) {
          var stream = WScript.CreateObject('ADODB.Stream');
          stream.Open();
          stream.Type = 1;
          stream.Write(xhr.ResponseBody);
          stream.Position = 0;
          stream.SaveToFile(savePath);
          stream.Close();
        } else {
          WScript.Echo('Could not retrieve the commons-codec. Please download it yourself and put into the framework/libs directory. This process may fail now. Sorry.');
        }
      }
      var app = WScript.CreateObject('Shell.Application');
      var source = app.NameSpace(savePath).Items();
      var target = app.NameSpace(ROOT + '\\framework\\libs');
      target.CopyHere(source, 256);
      
      // Move the jar into libs
      fso.MoveFile(ROOT + '\\framework\\libs\\commons-codec-1.7\\commons-codec-1.7.jar', ROOT + '\\framework\\libs\\commons-codec-1.7.jar');
      
      // Clean up
      fso.DeleteFile(ROOT + '\\framework\\libs\\commons-codec-1.7-bin.zip');
      fso.DeleteFolder(ROOT + '\\framework\\libs\\commons-codec-1.7', true);
    }
}

var args = WScript.Arguments, PROJECT_PATH="example", 
    shell=WScript.CreateObject("WScript.Shell");
    
// working dir
var ROOT = WScript.ScriptFullName.split('\\bin\\update.js').join('');

if (args.Count() == 1) {
    PROJECT_PATH=args(0);
}

if(!fso.FolderExists(PROJECT_PATH)) {
    WScript.Echo("Project doesn't exist!");
    WScript.Quit(1);
}

var TARGET=setTarget();
var API_LEVEL=setApiLevel();
var VERSION=read(ROOT+'\\VERSION').replace(/\r\n/,'').replace(/\n/,'');

// build from source. distro should have these files
if (!fso.FileExists(ROOT+'\\cordova-'+VERSION+'.jar') &&
    !fso.FileExists(ROOT+'\\cordova-'+VERSION+'.js')) {
    WScript.Echo("Building jar and js files...");
    // update the cordova framework project to a target that exists on this machine
    exec('android.bat update project --target '+TARGET+' --path '+ROOT+'\\framework');
    // pull down commons codec if necessary
    downloadCommonsCodec();
    exec('ant.bat -f \"'+ ROOT +'\\framework\\build.xml\" jar');
}

// check if we have the source or the distro files
WScript.Echo("Copying js, jar & config.xml files...");
if(fso.FolderExists(ROOT + '\\framework')) {
    exec('%comspec% /c copy "'+ROOT+'"\\framework\\assets\\www\\cordova-'+VERSION+'.js '+PROJECT_PATH+'\\assets\\www\\cordova-'+VERSION+'.js /Y');
    exec('%comspec% /c copy "'+ROOT+'"\\framework\\cordova-'+VERSION+'.jar '+PROJECT_PATH+'\\libs\\cordova-'+VERSION+'.jar /Y');
} else {
    // copy in cordova.js
    exec('%comspec% /c copy "'+ROOT+'"\\cordova-'+VERSION+'.js '+PROJECT_PATH+'\\assets\\www\\cordova-'+VERSION+'.js /Y');
    // copy in cordova.jar
    exec('%comspec% /c copy "'+ROOT+'"\\cordova-'+VERSION+'.jar '+PROJECT_PATH+'\\libs\\cordova-'+VERSION+'.jar /Y');
    // copy in xml
}

// update cordova scripts
createAppInfoJar();
WScript.Echo("Copying cordova command tools...");
exec('%comspec% /c copy "'+ROOT+'"\\bin\\templates\\cordova\\appinfo.jar ' + PROJECT_PATH + '\\cordova\\appinfo.jar /Y');
exec('%comspec% /c copy "'+ROOT+'"\\bin\\templates\\cordova\\cordova.js ' + PROJECT_PATH + '\\cordova\\cordova.js /Y');
exec('%comspec% /c copy "'+ROOT+'"\\bin\\templates\\cordova\\cordova.bat ' + PROJECT_PATH + '\\cordova\\cordova.bat /Y');
exec('%comspec% /c copy "'+ROOT+'"\\bin\\templates\\cordova\\clean.bat ' + PROJECT_PATH + '\\cordova\\clean.bat /Y');
exec('%comspec% /c copy "'+ROOT+'"\\bin\\templates\\cordova\\build.bat ' + PROJECT_PATH + '\\cordova\\build.bat /Y');
exec('%comspec% /c copy "'+ROOT+'"\\bin\\templates\\cordova\\log.bat ' + PROJECT_PATH + '\\cordova\\log.bat /Y');
exec('%comspec% /c copy "'+ROOT+'"\\bin\\templates\\cordova\\run.bat ' + PROJECT_PATH + '\\cordova\\run.bat /Y');

cleanup();
