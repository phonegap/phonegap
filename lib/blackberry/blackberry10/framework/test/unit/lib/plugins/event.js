/*
 * Copyright 2010-2011 Research In Motion Limited.
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

describe("event plugin", function () {

    var ROOT = "./../../../../",
        eventLib = require(ROOT + "lib/event"),
        eventPlugin;

    describe("once function", function () {
        var args = {
            eventName: encodeURIComponent(JSON.stringify("GRRRRR"))
        };

        it("calls success if no error", function () {
            var success = jasmine.createSpy(),
                fail = jasmine.createSpy(),
                webview = {};

            spyOn(eventLib, "add");
            delete require.cache[require.resolve(ROOT + "lib/plugins/event")];
            eventPlugin = require(ROOT + "lib/plugins/event");
            this.after(function () {
                delete require.cache[require.resolve(ROOT + "lib/plugins/event")];
            });

            eventPlugin.once(undefined, success, fail, args, {webview: webview});

            expect(eventLib.add).toHaveBeenCalledWith(
                {
                    event: "GRRRRR",
                    once: true
                },
                webview
            );
            expect(success).toHaveBeenCalled();
            expect(fail).not.toHaveBeenCalledWith(-1, jasmine.any(String));
        });

        it("calls fail if there is an error", function () {
            var success = jasmine.createSpy(),
                fail = jasmine.createSpy(),
                webview = {};

            spyOn(eventLib, "add").andThrow("ERRRORZ");
            delete require.cache[require.resolve(ROOT + "lib/plugins/event")];
            eventPlugin = require(ROOT + "lib/plugins/event");
            this.after(function () {
                delete require.cache[require.resolve(ROOT + "lib/plugins/event")];
            });

            eventPlugin.once(undefined, success, fail, args, {webview: webview});

            expect(eventLib.add).toHaveBeenCalledWith(
                {
                    event: "GRRRRR",
                    once: true
                },
                webview
            );
            expect(success).not.toHaveBeenCalled();
            expect(fail).toHaveBeenCalledWith(-1, jasmine.any(String));
        });
    });
});
