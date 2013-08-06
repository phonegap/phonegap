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
describe("Accelerometer", function () {
    var _apiDir = __dirname + "./../../../../plugins/Accelerometer/src/blackberry10/",
        index,
        callback,
        result = {
            ok: jasmine.createSpy(),
            error: jasmine.createSpy(),
            noResult: jasmine.createSpy(),
            callbackOk: jasmine.createSpy()
        },
        motion = {
            timestamp: 0,
            accelerationIncludingGravity: {
                x: 0,
                y: 0,
                z: 0
            }
        };

    beforeEach(function () {
        index = require(_apiDir + "index");
        GLOBAL.window = {
            removeEventListener: jasmine.createSpy("removeEventListener spy"),
            addEventListener: jasmine.createSpy("addEventListener spy").andCallFake(function (evt, cb) {
                callback = cb;
            })
        };
        GLOBAL.PluginResult = function () {
            return result;
        };
    });

    afterEach(function () {
        index = null;
        delete GLOBAL.window;
        delete GLOBAL.PluginResult;
    });

    describe("start", function () {
        it("calls noResult and keeps callbacks", function () {
            index.start();
            expect(window.addEventListener).toHaveBeenCalled();
            expect(result.noResult).toHaveBeenCalledWith(true);
        });

        it("callback calls ok and keeps callbacks", function () {
            callback(motion);
            expect(result.callbackOk).toHaveBeenCalled();
        });

        it("does not call error if already started", function () {
            index.start();
            expect(window.removeEventListener).toHaveBeenCalled();
            expect(window.addEventListener).toHaveBeenCalled();
            expect(result.error).not.toHaveBeenCalled();
        });
    });

    describe("stop", function () {
        it("calls result ok", function () {
            index.stop();
            expect(window.removeEventListener).toHaveBeenCalled();
            expect(result.ok).toHaveBeenCalledWith("removed");
        });
    });
});
