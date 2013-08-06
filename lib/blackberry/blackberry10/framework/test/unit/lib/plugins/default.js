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
var ROOT = "../../../../";

describe("default plugin", function () {

    var defaultPlugin = require(ROOT + 'lib/plugins/default'),
        testExtension,
        utils,
        mockController,
        mockApplication;

    describe("when handling requests", function () {
        var req, res, succ, fail, args;

        beforeEach(function () {
            req = {
                origin: "http://www.origin.com",
                params: {}
            };
            res = {
                send: jasmine.createSpy()
            };
            succ = jasmine.createSpy("lib/plugin/default success");
            fail = jasmine.createSpy("lib/plugin/default fail");
            args = {};

            GLOBAL.frameworkModules = ["plugin/blackberry.app/index.js"];

            //All of this mocking is required for modules to load, DO NOT REMOVE
            mockController = {
                dispatchEvent: jasmine.createSpy()
            };
            mockApplication = {
            };
            GLOBAL.window = {
                qnx: {
                    webplatform: {
                        getController: jasmine.createSpy().andReturn(mockController),
                        getApplication: jasmine.createSpy().andReturn(mockApplication)
                    }
                }
            };

            testExtension = {
                getReadOnlyFields: function () {}
            };

            delete require.cache[require.resolve(ROOT + "lib/utils")];
            utils = require(ROOT + "lib/utils");
            spyOn(utils, "loadModule").andCallFake(function (module) {
                // on device, "plugin/blackberry.app/index.js" would exist since packager would
                // name the extension folder with feature id in compilation time
                if (module.indexOf("/plugin") !== -1) {
                    return testExtension;
                } else {
                    return undefined;
                }
            });
        });

        afterEach(function () {
            delete GLOBAL.frameworkModules;
            delete GLOBAL.window;
        });

        it("returns 404 if the extension is not found", function () {
            var ext = "NotAnExt",
                errMsg = "Extension " + ext + " not found";

            req.params.ext = ext;
            spyOn(console, "warn");

            defaultPlugin.exec(req, succ, fail, args);

            expect(fail).toHaveBeenCalledWith(-1, errMsg, 404);
            expect(console.warn).toHaveBeenCalledWith(errMsg);
        });

        it("returns 404 if the method is not found", function () {
            req.params.ext = "blackberry.app";
            req.params.method = "NotAMethod";
            spyOn(console, "warn");

            defaultPlugin.exec(req, succ, fail, args);

            expect(fail).toHaveBeenCalledWith(-1, jasmine.any(String), 404);
            expect(console.warn).toHaveBeenCalledWith("Method " + req.params.method + " for " + req.params.ext + " not found");
        });

        it("calls the method of the extension", function () {
            var env = {"request": req, "response": res};

            spyOn(testExtension, "getReadOnlyFields");

            req.params.ext = "blackberry.app";
            req.params.method = "getReadOnlyFields";

            defaultPlugin.exec(req, succ, fail, args, env);

            expect(testExtension.getReadOnlyFields).toHaveBeenCalledWith(succ, fail, args, env);
        });

        it("calls a multi-level method of the extension", function () {
            var env = {"request": req, "response": res};

            spyOn(testExtension, "getReadOnlyFields");
            testExtension.getReadOnlyFields.a = {
                b : {
                    c : jasmine.createSpy()
                }
            };

            req.params.ext = "blackberry.app";
            req.params.method = "getReadOnlyFields/a/b/c";

            defaultPlugin.exec(req, succ, fail, args, env);

            expect(fail).wasNotCalled();
            expect(testExtension.getReadOnlyFields.a.b.c).toHaveBeenCalledWith(succ, fail, args, env);
        });

        it("throws a 404 is a multi-level method is not found", function () {
            var env = {"request": req, "response": res};

            spyOn(console, "warn");
            spyOn(testExtension, "getReadOnlyFields");
            testExtension.getReadOnlyFields.a = {
            };

            req.params.ext = "blackberry.app";
            req.params.method = "getReadOnlyFields/a/b/c";

            defaultPlugin.exec(req, succ, fail, args, env);

            expect(fail).toHaveBeenCalledWith(-1, jasmine.any(String), 404);
            expect(console.warn).toHaveBeenCalledWith("Method " + req.params.method + " for " + req.params.ext + " not found");
        });
    });

});
