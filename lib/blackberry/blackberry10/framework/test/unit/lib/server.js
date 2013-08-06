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
var ROOT = "../../../";

describe("server", function () {

    var server = require(ROOT + "lib/server"),
        plugin = require(ROOT + "lib/plugins/default"),
        applicationAPIServer,
        utils,
        DEFAULT_SERVICE = "default",
        DEFAULT_ACTION = "exec",
        config = {};

    beforeEach(function () {
        applicationAPIServer = {
            getReadOnlyFields: function () {}
        };
        delete require.cache[require.resolve(ROOT + "lib/utils")];
        utils = require("../../../lib/utils");
        spyOn(utils, "loadModule").andCallFake(function (module) {
            if (module.indexOf("plugin/") >= 0) {
                // on device, "plugin/blackberry.app/index.js" would exist
                return applicationAPIServer;
            } else {
                return require("../../../lib/" + module);
            }
        });
    });

    describe("when handling requests", function () {
        var req, res;

        beforeEach(function () {
            req = {
                params: {
                    service: "",
                    action: ""
                },
                body: "",
                origin: ""
            };
            res = {
                send: jasmine.createSpy()
            };
            GLOBAL.frameworkModules = ['plugin/blackberry.app/index.js', 'lib/plugins/default.js'];
        });

        afterEach(function () {
            delete GLOBAL.frameworkModules;
        });

        it("calls the default plugin if the service doesn't exist", function () {
            var rebuiltRequest = {
                    params: {
                        service: DEFAULT_SERVICE,
                        action: DEFAULT_ACTION,
                        ext: "not",
                        method: "here",
                        args: null
                    },
                    body: "",
                    origin: ""
                },
                webview = {};

            spyOn(plugin, DEFAULT_ACTION);
            req.params.service = "not";
            req.params.action = "here";

            server.handle(req, res, webview, config);

            expect(plugin[DEFAULT_ACTION]).toHaveBeenCalledWith(
                rebuiltRequest, jasmine.any(Function),
                jasmine.any(Function),
                rebuiltRequest.params.args,
                {
                    request: rebuiltRequest,
                    response: res,
                    webview: webview,
                    config: config
                }
            );
        });

        it("returns 404 if the action doesn't exist", function () {
            req.params.service = "default";
            req.params.action = "ThisActionDoesNotExist";

            spyOn(console, "error");

            server.handle(req, res);
            expect(res.send).toHaveBeenCalledWith(404, jasmine.any(String));
            expect(console.error).toHaveBeenCalled();
        });

        it("calls the action method on the plugin", function () {
            var webview = "BLAHBLAHBLAH";

            spyOn(plugin, "exec");

            req.params.service = "default";
            req.params.action = "exec";

            expect(function () {
                return server.handle(req, res, webview, config);
            }).not.toThrow();
            expect(plugin.exec).toHaveBeenCalledWith(
                req,
                jasmine.any(Function),
                jasmine.any(Function),
                req.params.args,
                {
                    request: req,
                    response: res,
                    webview: webview,
                    config: config
                });
        });

        it("parses url encoded args", function () {
            var webview = "BLAHBLAHBLAH";

            spyOn(plugin, "exec");

            expect(function () {
                req.params.service = "default";
                req.params.action = "exec";
                req.params.args = "a=1&b=2&c=3";

                return server.handle(req, res, webview);
            }).not.toThrow();
            expect(plugin.exec).toHaveBeenCalledWith(
                jasmine.any(Object),
                jasmine.any(Function),
                jasmine.any(Function),
                {
                    a: '1',
                    b: '2',
                    c: '3'
                },
                jasmine.any(Object)
            );
        });

        it("parses url encoded args", function () {
            var webview = "BLAHBLAHBLAH";

            spyOn(plugin, "exec");

            expect(function () {
                req.params.service = "default";
                req.params.action = "exec";
                req.body = JSON.stringify({a: '1', b: '2', c: '3'});

                return server.handle(req, res, webview);
            }).not.toThrow();
            expect(plugin.exec).toHaveBeenCalledWith(
                jasmine.any(Object),
                jasmine.any(Function),
                jasmine.any(Function),
                {
                    a: '1',
                    b: '2',
                    c: '3'
                },
                jasmine.any(Object)
            );
        });

        it("returns the result and code 42 when success callback called", function () {
            spyOn(plugin, "exec").andCallFake(function (request, succ, fail, body) {
                succ(["MyFeatureId"]);
            });

            req.params.service = "default";
            req.params.action = "exec";

            server.handle(req, res);
            expect(res.send).toHaveBeenCalledWith(200, encodeURIComponent(JSON.stringify({
                code: 42,
                data: ["MyFeatureId"]
            })));
        });

        it("returns the result and code -1 when fail callback called", function () {
            spyOn(plugin, "exec").andCallFake(function (request, succ, fail, body) {
                fail(-1, "ErrorMessage");
            });

            req.params.service = "default";
            req.params.action = "exec";

            server.handle(req, res);
            expect(res.send).toHaveBeenCalledWith(200, encodeURIComponent(JSON.stringify({
                code: -1,
                data: null,
                msg: "ErrorMessage"
            })));
        });
    });

    describe("when handling feature requests", function () {
        var req, res;

        beforeEach(function () {
            req = {
                params: {
                    service: "default",
                    action: "exec",
                    ext: "blackberry.app",
                    method: "getReadOnlyFields",
                    args: null
                },
                headers: {
                    host: ""
                },
                url: "",
                body: "",
                origin: ""
            };
            res = {
                send: jasmine.createSpy()
            };
            GLOBAL.frameworkModules = ['plugin/blackberry.app/index.js', 'lib/plugins/default.js'];
        });

        afterEach(function () {
            delete GLOBAL.frameworkModules;
        });

        it("calls the action method on the feature", function () {
            var webview = {};
            spyOn(applicationAPIServer, "getReadOnlyFields");
            server.handle(req, res, webview, config);
            expect(applicationAPIServer.getReadOnlyFields).toHaveBeenCalledWith(
                jasmine.any(Function),
                jasmine.any(Function),
                req.params.args,
                {
                    request: req,
                    response: res,
                    webview: webview,
                    config: config
                }
            );
        });

        it("returns the result and code 42 when success callback called", function () {
            var expectedResult = {"getReadOnlyFields": "Yogi bear"};

            spyOn(applicationAPIServer, "getReadOnlyFields").andCallFake(function (success, fail) {
                success(expectedResult);
            });

            server.handle(req, res);

            expect(res.send).toHaveBeenCalledWith(200, encodeURIComponent(JSON.stringify({
                code: 42,
                data: expectedResult
            })));
        });

        it("returns the result and code -1 when fail callback called", function () {
            var expectedResult = "omg";

            spyOn(applicationAPIServer, "getReadOnlyFields").andCallFake(function (success, fail) {
                fail(-1, expectedResult);
            });

            server.handle(req, res);

            expect(res.send).toHaveBeenCalledWith(200, encodeURIComponent(JSON.stringify({
                code: -1,
                data: null,
                msg: expectedResult
            })));
        });
    });
});
