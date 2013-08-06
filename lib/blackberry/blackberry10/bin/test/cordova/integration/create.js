/**
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

var childProcess = require('child_process'),
    tempFolder = '.tmp/',
    appFolder = tempFolder + 'tempCordovaApp/',
    projectFile = 'project.json',
    wrench = require('wrench'),
    fs = require('fs'),
    flag = false,
    _stdout = "",
    _stderr = "";

function executeScript(shellCommand, shouldError) {
    childProcess.exec(shellCommand, function (error, stdout, stderr) {
        if (error && !shouldError) {
            console.log("Error executing command: " + error);
        }
        _stdout = stdout.toString().trim();
        _stderr = stderr.toString().trim();
        flag = true;
    });
}

describe("create tests", function () {
    it("creates project", function () {
        var project,
            appIdRegExp = /id="default\.app\.id"/g;
        executeScript("bin/create " + appFolder);
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            project = JSON.parse(fs.readFileSync(appFolder + projectFile, "utf-8"));
            expect(appIdRegExp.test(fs.readFileSync(appFolder + "www/config.xml", "utf-8"))).toEqual(true);
            expect(fs.existsSync(appFolder)).toEqual(true);
            expect(fs.existsSync(appFolder + "/plugins")).toEqual(true);
            expect(fs.existsSync(appFolder + "/cordova")).toEqual(true);
            expect(fs.existsSync(appFolder + "/cordova/node_modules")).toEqual(true);
            expect(fs.existsSync(appFolder + "/cordova/lib")).toEqual(true);
            expect(fs.existsSync(appFolder + "/cordova/third_party")).toEqual(true);
            expect(fs.existsSync(appFolder + "/www")).toEqual(true);
            expect(project.barName).toEqual("cordova-BB10-app");
            expect(project.keystorepass).toEqual("password");
            expect(project.defaultTarget).toEqual("");
            expect(project.targets).toEqual({});
            expect(fs.existsSync("./build")).toEqual(false);
            expect(_stdout).toEqual("");
            expect(_stderr).toEqual("");
        });
        this.after(function () {
            wrench.rmdirSyncRecursive(tempFolder);
        });
    });

    it("sets appId", function () {
        var configEt,
            appIdRegExp = /id="com\.example\.bb10app"/g;
        executeScript("bin/create " + appFolder + " com.example.bb10app");
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            expect(appIdRegExp.test(fs.readFileSync(appFolder + "www/config.xml", "utf-8"))).toEqual(true);
            expect(_stdout).toEqual("");
            expect(_stderr).toEqual("");
        });
        this.after(function () {
            wrench.rmdirSyncRecursive(tempFolder);
        });
    });

    it("sets appId and barName", function () {
        var project,
            appIdRegExp = /id="com\.example\.bb10app"/g;
        executeScript("bin/create " + appFolder + " com.example.bb10app bb10appV1");
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            project = JSON.parse(fs.readFileSync(appFolder + projectFile, "utf-8"));
            expect(appIdRegExp.test(fs.readFileSync(appFolder + "www/config.xml", "utf-8"))).toEqual(true);
            expect(project.barName).toEqual("bb10appV1");
            expect(_stdout).toEqual("");
            expect(_stderr).toEqual("");
        });
        this.after(function () {
            wrench.rmdirSyncRecursive(tempFolder);
        });
    });

    it("No args", function () {
        executeScript("bin/create", true);
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            expect(_stdout).toEqual("Project creation failed!\nError: You must give a project PATH");
            expect(_stderr).toEqual("");
        });
    });

    it("Empty dir error", function () {
        executeScript("bin/create ./", true);
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            expect(_stdout).toEqual("Project creation failed!\nError: The project path must be an empty directory");
            expect(_stderr).toEqual("");
        });
    });

    it("Invalid appId error", function () {
        executeScript("bin/create " + appFolder + " 23.21#$", true);
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            expect(_stdout).toEqual("Project creation failed!\nError: App ID must be sequence of alpha-numeric (optionally seperated by '.') characters, no longer than 50 characters");
            expect(_stderr).toEqual("");
        });
    });

    it("Invalid barName error", function () {
        executeScript("bin/create " + appFolder + " com.example.app %bad@bar^name", true);
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            expect(_stdout).toEqual("Project creation failed!\nError: BAR filename can only contain alpha-numeric, '.', '-' and '_' characters");
            expect(_stderr).toEqual("");
        });
    });
});
