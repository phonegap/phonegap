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
    debugTokenHelper = require("../../templates/project/cordova/lib/debugtoken-helper"),
    wrench = require('wrench'),
    fs = require('fs'),
    properties,
    flag;

function testCreateDebugtoken(target) {
    debugTokenHelper.createToken(properties, target, function (code) {
        if (code === 0) {
            console.log("Debug token is created successfully!");
        } else {
            console.log("Debug token is not created successfully!");
        }

        flag = true;
    });
}

function testDeployDebugtoken() {
    debugTokenHelper.deployToken(properties, "", function () {
        console.log("Deploy callback is invoked!");
        flag = true;
    });
}

function testDeployDebugtokenAll() {
    debugTokenHelper.deployToken(properties, "all", function () {
        console.log("Deploy callback is invoked!");
        flag = true;
    });
}

function testDeployDebugtokenSingle() {
    debugTokenHelper.deployToken(properties, "d1", function () {
        console.log("Deploy callback is invoked!");
        flag = true;
    });
}

describe("cordova/lib/debugtoken-helper tests", function () {
    beforeEach(function () {
        flag = false;
    });

    it("should create a debugtoken for target all", function () {
        testCreateDebugtoken("all");

        beforeEach(function () {
            properties = {
                "barName": "cordova-BB10-app",
                "keystorepass": "qaqa1234",
                "defaultTarget": "d1",
                "targets": {
                    "d1": {
                        "ip": "169.254.0.1",
                        "type": "device",
                        "pin": "2A54F454",
                        "password" : "qaqa123"
                    }
                }
            };

            fs.unlinkSync("debugtoken.bar");
        });

        waitsFor(function () {
            return flag;
        });

        runs(function () {
            expect(fs.existsSync("debugtoken.bar"));
        });
    });

    it("should create a debugtoken for single target", function () {
        testCreateDebugtoken("d1");

        beforeEach(function () {
            properties = {
                "barName": "cordova-BB10-app",
                "keystorepass": "qaqa1234",
                "defaultTarget": "d1",
                "targets": {
                    "d1": {
                        "ip": "169.254.0.1",
                        "type": "device",
                        "pin": "2A54F454",
                        "password" : "qaqa123"
                    }
                }
            };

            fs.unlinkSync("debugtoken.bar");
        });

        waitsFor(function () {
            return flag;
        });

        runs(function () {
            expect(fs.existsSync("debugtoken.bar"));
        });
    });

    it("should create a debugtoken for default target", function () {
        testCreateDebugtoken("");

        beforeEach(function () {
            properties = {
                "barName": "cordova-BB10-app",
                "keystorepass": "qaqa1234",
                "defaultTarget": "d1",
                "targets": {
                    "d1": {
                        "ip": "169.254.0.1",
                        "type": "device",
                        "pin": "2A54F454",
                        "password" : "qaqa123"
                    }
                }
            };

            fs.unlinkSync("debugtoken.bar");
        });

        waitsFor(function () {
            return flag;
        });

        runs(function () {
            expect(fs.existsSync("debugtoken.bar"));
        });
    });

    it("cannot create a debugtoken without keystorepass", function () {
        testCreateDebugtoken("all");

        beforeEach(function () {
            properties = {
                "barName": "cordova-BB10-app",
                //"keystorepass": "qaqa1234",
                "defaultTarget": "d1",
                "targets": {
                    "d1": {
                        "ip": "169.254.0.1",
                        "type": "device",
                        "pin": "2A54F454",
                        "password" : "qaqa123"
                    }
                }
            };

            fs.unlinkSync("debugtoken.bar");
        });

        waitsFor(function () {
            return flag;
        });

        runs(function () {
            expect(!fs.existsSync("debugtoken.bar"));
        });
    });

    it("cannot create a debugtoken without any device PINs", function () {
        testCreateDebugtoken("all");

        beforeEach(function () {
            properties = {
                "barName": "cordova-BB10-app",
                "keystorepass": "qaqa1234",
                "defaultTarget": "d1",
                "targets": {
                    "d1": {
                        "ip": "169.254.0.1",
                        "type": "device",
                        //"pin": "2A54F454",
                        "password" : "qaqa123"
                    }
                }
            };

            fs.unlinkSync("debugtoken.bar");
        });

        waitsFor(function () {
            return flag;
        });

        runs(function () {
            expect(!fs.existsSync("debugtoken.bar"));
        });
    });

    it("should deploy a debugtoken to default target", function () {
        debugTokenHelper.createToken(properties, "", testDeployDebugtoken);

        beforeEach(function () {
            properties = {
                "barName": "cordova-BB10-app",
                "keystorepass": "qaqa1234",
                "defaultTarget": "d1",
                "targets": {
                    "d1": {
                        "ip": "169.254.0.1",
                        "type": "device",
                        "pin": "2A54F454",
                        "password" : "qaqa123"
                    }
                }
            };

            fs.unlinkSync("debugtoken.bar");

            window.alert("Make sure you connect the device " + "2A54F454" + " to " + "169.254.0.1");
        });

        waitsFor(function () {
            return flag;
        });

        runs(function () {
            var confirm = window.confirm("Was the debug token deployed to device?");
            expect(confirm).toEqual(true);
        });
    });

    it("should deploy a debugtoken to all targets", function () {
        debugTokenHelper.createToken(properties, "all", testDeployDebugtokenAll);

        beforeEach(function () {
            properties = {
                "barName": "cordova-BB10-app",
                "keystorepass": "qaqa1234",
                "defaultTarget": "d1",
                "targets": {
                    "d1": {
                        "ip": "169.254.0.1",
                        "type": "device",
                        "pin": "2A54F454",
                        "password" : "qaqa123"
                    }
                }
            };

            fs.unlinkSync("debugtoken.bar");

            window.alert("Make sure you connect the device " + "2A54F454" + " to " + "169.254.0.1");
        });

        waitsFor(function () {
            return flag;
        });

        runs(function () {
            var confirm = window.confirm("Was the debug token deployed to device?");
            expect(confirm).toEqual(true);
        });
    });

    it("should deploy a debugtoken to a single target", function () {
        debugTokenHelper.createToken(properties, "d1", testDeployDebugtokenSingle);

        beforeEach(function () {
            properties = {
                "barName": "cordova-BB10-app",
                "keystorepass": "qaqa1234",
                "defaultTarget": "d1",
                "targets": {
                    "d1": {
                        "ip": "169.254.0.1",
                        "type": "device",
                        "pin": "2A54F454",
                        "password" : "qaqa123"
                    }
                }
            };

            fs.unlinkSync("debugtoken.bar");

            window.alert("Make sure you connect the device " + "2A54F454" + " to " + "169.254.0.1");
        });

        waitsFor(function () {
            return flag;
        });

        runs(function () {
            var confirm = window.confirm("Was the debug token deployed to device?");
            expect(confirm).toEqual(true);
        });
    });

    it("cannot deploy a debugtoken when the target is not connected", function () {
        debugTokenHelper.createToken(properties, "all", testDeployDebugtoken);

        beforeEach(function () {
            properties = {
                "barName": "cordova-BB10-app",
                "keystorepass": "qaqa1234",
                "defaultTarget": "d1",
                "targets": {
                    "d1": {
                        "ip": "169.254.0.1",
                        "type": "device",
                        "pin": "2A54F454",
                        "password" : "qaqa123"
                    }
                }
            };

            fs.unlinkSync("debugtoken.bar");

            window.alert("Disconnect the target from 169.254.0.1");
        });

        waitsFor(function () {
            return flag;
        });

        runs(function () {
            var confirm = window.confirm("Was the debug token deployed to device?");
            expect(confirm).toEqual(false);
        });
    });

    it("cannot deploy a debugtoken if no debugtoken", function () {
        testDeployDebugtoken();

        beforeEach(function () {
            properties = {
                "barName": "cordova-BB10-app",
                "keystorepass": "qaqa1234",
                "defaultTarget": "d1",
                "targets": {
                    "d1": {
                        "ip": "169.254.0.1",
                        "type": "device",
                        "pin": "2A54F454",
                        "password" : "qaqa123"
                    }
                }
            };

            fs.unlinkSync("debugtoken.bar");
        });

        waitsFor(function () {
            return flag;
        });

        runs(function () {
            var confirm = window.confirm("Was the debug token deployed to device?");
            expect(confirm).toEqual(false);
        });
    });
});
