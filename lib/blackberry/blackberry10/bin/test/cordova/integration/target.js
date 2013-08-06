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

function executeScript(shellCommand) {
    childProcess.exec(shellCommand, function (error, stdout, stderr) {
        if (error) {
            //console.log("Error executing command: " + error);
        }
        _stdout = stdout.toString().trim();
        _stderr = stderr.toString().trim();
        flag = true;
    });
}

describe("cordova/target tests", function () {
    beforeEach(function () {
        executeScript("bin/create " + appFolder);
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
        });
    });

    afterEach(function () {
        wrench.rmdirSyncRecursive(tempFolder);
    });

    it("should add a target", function () {
        var project,
            target;
        executeScript(appFolder + "cordova/target add z10 169.254.0.1 device -p pass --pin DEADBEEF");
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            project = JSON.parse(fs.readFileSync(appFolder + projectFile, 'utf-8'));
            expect(project.defaultTarget).toEqual("z10");
            expect(Object.keys(project.targets).length).toEqual(1);
            target = project.targets.z10;
            expect(target.ip).toEqual("169.254.0.1");
            expect(target.type).toEqual("device");
            expect(target.password).toEqual("pass");
            expect(target.pin).toEqual("DEADBEEF");
            expect(_stdout).toEqual("");
            expect(_stderr).toEqual("");
        });
    });

    it("should remove a target", function () {
        var project;
        executeScript(appFolder + "cordova/target add z10 169.254.0.1 device -p pass --pin DEADBEEF");
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            executeScript(appFolder + "cordova/target remove z10");
            waitsFor(function () {
                return flag;
            });
            runs(function () {
                flag = false;
                project = JSON.parse(fs.readFileSync(appFolder + projectFile, 'utf-8'));
                expect(project.defaultTarget).toEqual("");
                expect(Object.keys(project.targets).length).toEqual(0);
                expect(_stdout).toEqual("Deleting default target, please set a new default target");
                expect(_stderr).toEqual("");
            });
        });
    });

    it("should set default target", function () {
        var project;
        executeScript(appFolder + "cordova/target add z10 169.254.0.1 device -p pass --pin DEADBEEF");
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            executeScript(appFolder + "cordova/target add q10 169.254.0.2 device -p p455w02D --pin FACEFACE");
            waitsFor(function () {
                return flag;
            });
            runs(function () {
                flag = false;
                executeScript(appFolder + "cordova/target default q10");
                waitsFor(function () {
                    return flag;
                });
                runs(function () {
                    flag = false;
                    project = JSON.parse(fs.readFileSync(appFolder + projectFile, 'utf-8'));
                    expect(project.defaultTarget).toEqual("q10");
                });
            });
        });
    });

    it("should list targets", function () {
        executeScript(appFolder + "cordova/target add z10 169.254.0.1 device -p pass --pin DEADBEEF");
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            executeScript(appFolder + "cordova/target add q10 169.254.0.2 device -p p455w02D --pin FACEFACE");
            waitsFor(function () {
                return flag;
            });
            runs(function () {
                flag = false;
                executeScript(appFolder + "cordova/target");
                waitsFor(function () {
                    return flag;
                });
                runs(function () {
                    flag = false;
                    expect(_stdout).toEqual("* z10\n  q10");
                    expect(_stderr).toEqual("");
                });
            });
        });
    });

    it("should require name for add/remove", function () {
        executeScript(appFolder + "cordova/target add");
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            expect(_stdout).toEqual("Target details not specified");
            expect(_stderr).toEqual("");
        });
    });

    it("should require ip for add", function () {
        executeScript(appFolder + "cordova/target add z10");
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            expect(_stdout).toEqual("IP is required");
            expect(_stderr).toEqual("");
        });
    });

    it("should warn unregonized command", function () {
        executeScript(appFolder + "cordova/target bleh");
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            expect(_stdout).toEqual("Unrecognized command");
            expect(_stderr).toEqual("");
        });
    });

    it("should warn invalid ip", function () {
        executeScript(appFolder + "cordova/target add z10 256.254.0.1");
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            expect(_stdout).toEqual("Invalid IP: 256.254.0.1");
            expect(_stderr).toEqual("");
        });
    });

    it("should warn invalid type", function () {
        executeScript(appFolder + "cordova/target add z10 169.254.0.1 -t bleh");
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            expect(_stdout).toEqual("Invalid target type: bleh");
            expect(_stderr).toEqual("");
        });
    });

    it("should warn invalid pin", function () {
        executeScript(appFolder + "cordova/target add z10 169.254.0.1 device --pin NOTAPIN!");
        waitsFor(function () {
            return flag;
        });
        runs(function () {
            flag = false;
            expect(_stdout).toEqual("Invalid PIN: NOTAPIN!");
            expect(_stderr).toEqual("");
        });
    });
});
