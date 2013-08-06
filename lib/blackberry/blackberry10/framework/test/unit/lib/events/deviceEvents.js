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

var _libDir = __dirname + "./../../../../lib/",
    deviceEventPrefix = "device.",
    deviceEvents;

describe("lib/events/deviceEvents", function () {
    beforeEach(function () {
        GLOBAL.window = {
            qnx: {
                webplatform: {
                    device: {
                        addEventListener: jasmine.createSpy(),
                        removeEventListener: jasmine.createSpy()
                    }
                }
            }
        };
        deviceEvents = require(_libDir + "events/deviceEvents");
    });

    afterEach(function () {
        delete GLOBAL.window;
        deviceEvents = null;
        delete require.cache[require.resolve(_libDir + "events/deviceEvents")];
    });

    describe("addEventListener", function () {
        it("adds event name with application prepended", function () {
            var eventName = "MostAwesomeEventEver",
                trigger = function () {};
            deviceEvents.addEventListener(eventName, trigger);
            expect(window.qnx.webplatform.device.addEventListener).toHaveBeenCalledWith(deviceEventPrefix + eventName, trigger);
        });

        it("warns in the console if the eventName is falsey", function () {
            var eventName = false,
                trigger = function () {};
            spyOn(console, "warn");
            deviceEvents.addEventListener(eventName, trigger);
            expect(window.qnx.webplatform.device.addEventListener).not.toHaveBeenCalledWith(deviceEventPrefix + eventName, trigger);
            expect(console.warn).toHaveBeenCalledWith(jasmine.any(String));
        });
    });

    describe("removeEventListener", function () {
        it("adds event name with application prepended", function () {
            var eventName = "MostAwesomeEventEver",
                trigger = function () {};
            deviceEvents.removeEventListener(eventName, trigger);
            expect(window.qnx.webplatform.device.removeEventListener).toHaveBeenCalledWith(deviceEventPrefix + eventName, trigger);
        });

        it("warns in the console if the eventName is falsey", function () {
            var eventName = false,
                trigger = function () {};
            spyOn(console, "warn");
            deviceEvents.removeEventListener(eventName, trigger);
            expect(window.qnx.webplatform.device.removeEventListener).not.toHaveBeenCalledWith(deviceEventPrefix + eventName, trigger);
            expect(console.warn).toHaveBeenCalledWith(jasmine.any(String));
        });
    });
});
