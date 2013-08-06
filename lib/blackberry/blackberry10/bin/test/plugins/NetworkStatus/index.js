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


describe("NetworkStatus", function () {
    var _apiDir = __dirname + "./../../../../plugins/NetworkStatus/src/blackberry10/",
        index,
        result = {
            ok: jasmine.createSpy(),
            error: jasmine.createSpy()
        };

    beforeEach(function () {
        index = require(_apiDir + "index");
    });

    afterEach(function () {
        index = null;
    });

    describe("getConnectionInfo", function () {
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

        function testConnection(expectedResult, mockedType, mockedTechnology) {
            var mockedDevice = {
                activeConnection: {
                    type: mockedType,
                    technology: mockedTechnology
                }
            };

            if (mockedType) {
                window.qnx.webplatform.device = mockedDevice;
            }

            index.getConnectionInfo();

            expect(result.ok).toHaveBeenCalledWith(expectedResult);
            expect(result.error).not.toHaveBeenCalled();
        }

        it("calls success with a wired connection", function () {
            testConnection("ethernet", "wired");
        });

        it("calls success with a wifi connection", function () {
            testConnection("wifi", "wifi");
        });

        it("calls success with no connection", function () {
            testConnection("none", "none");
        });

        it("calls success with a cellular edge connection", function () {
            testConnection("2g", "cellular", "edge");
        });

        it("calls success with a cellular gsm connection", function () {
            testConnection("2g", "cellular", "gsm");
        });

        it("calls success with a cellular evdo connection", function () {
            testConnection("3g", "cellular", "evdo");
        });

        it("calls success with a cellular umts connection", function () {
            testConnection("3g", "cellular", "umts");
        });

        it("calls success with a lte connection", function () {
            testConnection("4g", "cellular", "lte");
        });

        it("calls success with a cellular connection", function () {
            testConnection("cellular", "cellular");
        });

        it("defaults to none if no connection is found", function () {
            testConnection("none");
        });

        it("defaults to unknown if connection type doesn't exist", function () {
            testConnection("unknown", "fakeConnectionType");
        });

    });

});
