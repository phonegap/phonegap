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
var objArgs = WScript.Arguments;
for (i = 0; i < objArgs.length; i++) {
    WScript.Echo("Arg :: " + objArgs(i));
}

var projectFilePath = null;
if (objArgs && objArgs.length > 0) {
    projectFilePath = objArgs(0);
}


var fso = WScript.CreateObject("Scripting.FileSystemObject");
var outFile = fso.CreateTextFile("..\\..\\CordovaSourceDictionary.xml", true);

outFile.WriteLine('<?xml version="1.0" encoding="utf-8"?>');
outFile.WriteLine('<!-- This file is auto-generated, do not edit! -jm -->');
outFile.WriteLine('<CordovaSourceDictionary>');


function getDirectoryListing(path) {
    var retList = [];
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var folder = fso.GetFolder(path);
    // iterate over the files in the folder
    for (var files = new Enumerator(folder.files) ; !files.atEnd() ; files.moveNext()) {
        retList.push(path + files.item().name);
    }
    // iterate over the child folders in the folder
    for (var subFlds = new Enumerator(folder.SubFolders) ; !subFlds.atEnd() ; subFlds.moveNext()) {
        var subDirList = getDirectoryListing(path + subFlds.item().name + "\\");
        retList = retList.concat(subDirList);
    }
    return retList;
}


// We need to get any Linked files from the project

WScript.Echo("Adding Source Files ...");
if (projectFilePath != null) {
    var projXml = WScript.CreateObject("Microsoft.XMLDOM");

    projXml.async = false;
    if (projXml.load(projectFilePath)) {

        // add linked content ( windows shortcuts )
        var nodes = projXml.selectNodes("/Project/ItemGroup/Content/Link");
        WScript.Echo("/Project/ItemGroup/Content/Link nodes.length" + nodes.length);
        for (var n = 0; n < nodes.length; n++) {
            outFile.WriteLine('    <FilePath Value="' + nodes[n].text + '"/>');
        }

        // add files of type Resource
        nodes = projXml.selectNodes("/Project/ItemGroup/Resource/Link");
        WScript.Echo("/Project/ItemGroup/Resource/Link nodes.length" + nodes.length);
        for (n = 0; n < nodes.length; n++) {
            outFile.WriteLine('    <FilePath Value="' + nodes[n].text + '"/>');
        }

        // add Content files from www folder
        nodes = projXml.selectNodes("/Project/ItemGroup/Content[@Include]");
        WScript.Echo("/Project/ItemGroup/Content nodes.length" + nodes.length);
        for (n = 0; n < nodes.length; n++) {
            for (var i = 0; i < nodes[n].attributes.length; i++) {

                if (nodes[n].attributes[i].name == "Include") {
                    var val = nodes[n].attributes[i].value;
                    if (val.indexOf("www\\**") == 0 ){
                        WScript.echo("adding wildcard files");
                        var fileList = getDirectoryListing("..\\..\\www\\");
                        for (var index = 0 ; index < fileList.length; index++)
                        {
                            outFile.WriteLine('    <FilePath Value="' + fileList[index].replace(/..\\..\\www/g,"www") + '"/>');
                        }
                    }
                    else if (val.indexOf("www") == 0) {
                        WScript.Echo("adding value :: " + val);
                        outFile.WriteLine('    <FilePath Value="' + val + '"/>');
                    }
                }
            }
            
        }
    }
}

outFile.WriteLine('</CordovaSourceDictionary>');

