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

describe("Logger", function () {

    var _apiDir = __dirname + "./../../../../plugins/Logger/src/blackberry10/",
        index,
        result = {
            noResult: jasmine.createSpy("noResult")
        };

    beforeEach(function () {
        index = require(_apiDir + "index");
    });

    afterEach(function () {
        index = null;
    });

    describe("logLevel", function () {
        beforeEach(function () {
            spyOn(console, "log");
            GLOBAL.PluginResult = function () {
                return result;
            };
        });

        afterEach(function () {
            delete GLOBAL.PluginResult;
        });

        it("calls console.log", function () {
            index.logLevel(function () {}, function () {}, ["%22ERROR%22", "%22message%22"]);
            expect(console.log).toHaveBeenCalledWith("ERROR: message");
            expect(result.noResult).toHaveBeenCalledWith(false);
        });
    });
});
