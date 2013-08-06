/*
* Copyright 2013 Research In Motion Limited.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

describe("Device", function () {

    var _apiDir = __dirname + "./../../../../plugins/Device/src/blackberry10/",
        index,
        result = {
            ok: jasmine.createSpy()
        };

    beforeEach(function () {
        index = require(_apiDir + "index");
    });

    afterEach(function () {
        index = null;
    });

    describe("getDeviceInfo", function () {
        beforeEach(function () {
            GLOBAL.window = {
                qnx: {
                    webplatform: {
                        device: {
                        }
                    }
                }
            };
            GLOBAL.PluginResult = function () {
                return result;
            };
        });

        afterEach(function () {
            delete GLOBAL.window;
            delete GLOBAL.PluginResult;
        });

        it("calls ok with the Device info", function () {
            var mockedDevice = {
                scmBundle: "1.0.0.0",
                modelName: "q10",
                devicePin: (new Date()).getTime()
            };

            result.ok = jasmine.createSpy().andCallFake(function (deviceInfo) {
                expect(deviceInfo.platform).toEqual("blackberry10");
                expect(deviceInfo.version).toEqual(mockedDevice.scmBundle);
                expect(deviceInfo.model).toEqual(mockedDevice.modelName);
                expect(deviceInfo.name).toEqual(mockedDevice.modelName);
                expect(deviceInfo.uuid).toEqual(mockedDevice.devicePin);
                expect(deviceInfo.cordova).toBeDefined();
            });

            window.qnx.webplatform.device = mockedDevice;

            index.getDeviceInfo();

            expect(result.ok).toHaveBeenCalled();
        });
    });
});
