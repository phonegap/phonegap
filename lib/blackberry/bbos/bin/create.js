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
 * create a cordova/blackberry project
 *
 * USAGE
 *  ./create [path package appname]
 */

var fso = WScript.CreateObject('Scripting.FileSystemObject');

function read(filename) {
    var fso=WScript.CreateObject("Scripting.FileSystemObject");
    var f=fso.OpenTextFile(filename, 1);
    var s=f.ReadAll();
    f.Close();
    return s;
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
function downloadAntContrib(){
    if (!fso.FileExists(ROOT + '\\bin\\templates\\project\\lib\\ant-contrib\\ant-contrib-1.0b3.jar')) {
      // We need the .jar
      var url = 'http://central.maven.org/maven2/ant-contrib/ant-contrib/1.0b3/ant-contrib-1.0b3.jar';
      var libsPath = ROOT + '\\bin\\templates\\project\\lib\\ant-contrib';
      var savePath = libsPath + '\\ant-contrib-1.0b3.jar';
      if (!fso.FileExists(savePath)) {
        if(!fso.FolderExists(libsPath)) {
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
          WScript.Echo('Could not retrieve the antcontrib. Please download it yourself and put into the bin/templates/project/lib directory. This process may fail now. Sorry.');
        }
      }
      var app = WScript.CreateObject('Shell.Application');
      var source = app.NameSpace(savePath).Items();
      var target = app.NameSpace(libsPath);
      target.CopyHere(source, 256);
    }
}
function exec(s, output) {
    var o=shell.Exec(s);
    while (o.Status == 0) {
        WScript.Sleep(100);
    }
    //WScript.Echo("Command exited with code " + o.Status);
}

function cleanup() {
    // Cleanup
    if(fso.FolderExists(ROOT + '\\dist')) {
        fso.DeleteFolder(ROOT + '\\dist', true);
    }
    if(fso.FolderExists(ROOT + '\\build')) {
        fso.DeleteFolder(ROOT + '\\build');
    }
}

var args = WScript.Arguments, PROJECT_PATH="example", 
    PACKAGE="org.apache.cordova.example",
    NAME="cordovaExample",
    shell=WScript.CreateObject("WScript.Shell");
    
// working dir
var ROOT = WScript.ScriptFullName.split('\\bin\\create.js').join('');

if (args.Count() == 3) {
    PROJECT_PATH=args(0);
    PACKAGE=args(1);
    NAME=args(2);
}

if(fso.FolderExists(PROJECT_PATH)) {
    WScript.Echo("Project directory already exists! Please remove it first.");
    WScript.Quit(1);
}

var MANIFEST_PATH=PROJECT_PATH+'\\www\\config.xml';
var VERSION=read(ROOT+'\\VERSION').replace(/\r\n/,'').replace(/\n/,'');

if(fso.FolderExists(ROOT+'\\framework')){
    downloadAntContrib();
    exec('ant.bat -f '+ ROOT +'\\build.xml create -Dproject.path="' + PROJECT_PATH + '"');
    replaceInFile(MANIFEST_PATH, /__PACKAGE__/, PACKAGE);
    replaceInFile(MANIFEST_PATH, /__ACTIVITY__/, NAME);
}else{
    // copy in the project template
    exec('cmd /c xcopy '+ ROOT + '\\sample\\* '+PROJECT_PATH+' /I /S /Y');    
    replaceInFile(MANIFEST_PATH, /org.apache.cordova.example/, PACKAGE);
    replaceInFile(MANIFEST_PATH, /cordovaExample/, NAME);
}

cleanup();
