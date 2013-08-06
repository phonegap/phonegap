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

describe("Battery", function () {

    var _apiDir = __dirname + "./../../../../plugins/Battery/src/blackberry10/",
        index,
        callback,
        mockPluginResult = {
            ok: jasmine.createSpy(),
            error: jasmine.createSpy(),
            noResult: jasmine.createSpy(),
            callbackOk: jasmine.createSpy()
        },
        noop = function () {},
        args,
        env = {
            webview: {
                id: 42
            }
        };


    beforeEach(function () {
        GLOBAL.navigator = {
            webkitBattery: {
                onlevelchange: jasmine.createSpy("navigator.webkitBattery.onlevelchange"),
                onchargingchange: jasmine.createSpy("navigator.webkitBattery.onchargingchange")
            }
        };
        GLOBAL.PluginResult = function () {
            return mockPluginResult;
        };
        index = require(_apiDir + "index");
    });

    afterEach(function () {
        delete GLOBAL.navigator;
        delete GLOBAL.PluginResult;
        delete require.cache[require.resolve(_apiDir + "index")];
    });

    describe("start", function () {

        it("calls noResult and keeps callbacks", function () {
            index.start(noop, noop, args, env);
            expect(navigator.webkitBattery.onlevelchange).not.toEqual(null);
            expect(navigator.webkitBattery.onchargingchange).not.toEqual(null);
            expect(mockPluginResult.noResult).toHaveBeenCalledWith(true);
            expect(mockPluginResult.error).not.toHaveBeenCalled();
        });

        it("does not call error if already started", function () {
            index.start(noop, noop, args, env);
            mockPluginResult.noResult.reset();
            index.start(noop, noop, args, env);
            expect(navigator.webkitBattery.onlevelchange).not.toEqual(null);
            expect(navigator.webkitBattery.onchargingchange).not.toEqual(null);
            expect(mockPluginResult.error).not.toHaveBeenCalled();
            expect(mockPluginResult.noResult).toHaveBeenCalledWith(true);
        });

    });

    describe("stop", function () {

        it("calls noResult and does not keep callbacks", function () {
            index.start(noop, noop, args, env);
            index.stop(noop, noop, args, env);
            expect(navigator.webkitBattery.onlevelchange).toEqual(null);
            expect(navigator.webkitBattery.onchargingchange).toEqual(null);
            expect(mockPluginResult.noResult).toHaveBeenCalledWith(false);
        });

    });
});
