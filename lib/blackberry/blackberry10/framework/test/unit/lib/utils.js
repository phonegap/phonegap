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

var srcPath = __dirname + '/../../../lib/';

describe("Utils", function () {
    var utils = require(srcPath + 'utils.js');

    describe("endsWith", function () {
        it("returns true when a string ends with another", function () {
            expect(utils.endsWith("www.smoketest9-vmyyz.labyyz.testnet.rim.net:8080", ".smoketest9-vmyyz.labyyz.testnet.rim.net:8080")).toEqual(true);
        });
    });

    it("Verify that the filenameToImageMIME is defined", function () {
        expect(utils.fileNameToImageMIME).toBeDefined();
    });

    it("Verify that the proper PNG MIME types are returned", function () {
        expect(utils.fileNameToImageMIME("test.png")).toEqual("image/png");
    });

    it("Verify that the proper period MIME types are returned", function () {
        expect(utils.fileNameToImageMIME("test.t.png")).toEqual("image/png");
    });

    it("Verify that the proper JPG types are returned", function () {
        expect(utils.fileNameToImageMIME("test.jpg")).toEqual("image/jpeg");
    });

    it("Verify that the proper GIF types are returned", function () {
        expect(utils.fileNameToImageMIME("test.gif")).toEqual("image/gif");
    });

    it("Verify that the proper TIFF types are returned", function () {
        expect(utils.fileNameToImageMIME("test_test_.tif")).toEqual("image/tiff");
    });

    it("Verify that the proper TIFF types are returned", function () {
        expect(utils.fileNameToImageMIME("test_test_.tiff")).toEqual("image/tiff");
    });

    it("Verify that the proper JPE MIME types are returned", function () {
        expect(utils.fileNameToImageMIME("test.jpe")).toEqual("image/jpeg");
    });

    it("Verify that the proper BMP MIME types are returned", function () {
        expect(utils.fileNameToImageMIME("test.bmp")).toEqual("image/bmp");
    });

    it("Verify that the proper JPEG MIME types are returned", function () {
        expect(utils.fileNameToImageMIME("test.jpeg")).toEqual("image/jpeg");
    });

    it("Verify that the proper SVG MIME types are returned", function () {
        expect(utils.fileNameToImageMIME("test.svg")).toEqual("image/svg+xml");
    });

    it("has an invokeInBrowser function", function () {
        var url = "http://www.webworks.com",
            mockApplication = {
                invocation: {
                    invoke: jasmine.createSpy("invocation.invoke")
                }
            },
            mockWindow = {
                qnx: {
                    webplatform: {
                        getApplication: function () {
                            return mockApplication;
                        }
                    }
                }
            };

        GLOBAL.window = mockWindow;

        this.after(function () {
            delete GLOBAL.window;
        });

        expect(utils.invokeInBrowser).toBeDefined();

        utils.invokeInBrowser(url);

        expect(mockApplication.invocation.invoke).toHaveBeenCalledWith({
            uri: url,
            target: "sys.browser"
        });
    });

    // A cascading method invoker, kinda like jWorkflow
    describe("series", function () {
        var tasks,
            callbackObj,
            seriesComplete,
            callbackInvocations,
            invocationCounter,
            task;

        beforeEach(function () {
            tasks = [];
            callbackInvocations = [];
            invocationCounter = 0;
            seriesComplete = false;
            callbackObj = {
                func: function (args) {
                    callbackInvocations.push('done');
                    seriesComplete = true;
                },
                args: []
            };
            task = {
                func: function (callback) {
                    callbackInvocations.push(invocationCounter++);
                    callback();
                },
                args: []
            };
        });

        afterEach(function () {
            tasks = null;
            callbackObj = null;
            seriesComplete = null;
            callbackInvocations = null;
            invocationCounter = null;
            task = null;
        });

        it('should call callback right away when there are no tasks to execute', function () {
            spyOn(callbackObj, 'func');
            utils.series(tasks, callbackObj);
            expect(callbackObj.func).toHaveBeenCalled();
        });

        it('should invoke the task method before the callback', function () {
            tasks.push(task);
            utils.series(tasks, callbackObj);
            waitsFor(function () {
                return seriesComplete;
            });

            expect(callbackInvocations.length).toEqual(2);
            expect(callbackInvocations[0]).toEqual(0);
            expect(callbackInvocations[1]).toEqual('done');
        });

        it('should invocation the tasks in order with the callback being the last invocation', function () {
            var i;

            tasks.push(task);
            tasks.push(task);
            tasks.push(task);
            tasks.push(task);

            utils.series(tasks, callbackObj);

            waitsFor(function () {
                return seriesComplete;
            });

            expect(callbackInvocations.length).toEqual(5);

            for (i = 0; i < 4; i++) {
                expect(callbackInvocations[i]).toEqual(i);
            }

            expect(callbackInvocations[4]).toEqual('done');
        });
    });

    describe("utils translate path", function () {
        beforeEach(function () {
            GLOBAL.window = {
                qnx: {
                    webplatform: {
                        getApplication: function () {
                            return {
                                getEnv: function (path) {
                                    if (path === "HOME")
                                        return "/accounts/home";
                                }
                            };
                        }
                    }
                }
            };
        });

        afterEach(function () {
            delete GLOBAL.window;
        });

        it("Expect translate path to be defined", function () {
            expect(utils.translatePath).toBeDefined();
        });
        it("translate path successfully returns the original path when passed non local value", function () {
            var path = "http://google.com";
            path = utils.translatePath(path);
            expect(path).toEqual("http://google.com");
        });
        it("translate path successfully returns the original path when passed a telephone uri", function () {
            var path = "tel://250-654-34243";
            path = utils.translatePath(path);
            expect(path).toEqual("tel://250-654-34243");
        });
        it("translate path successfully retuns an updated string for a local path", function () {
            var path = "local:///this-is-a-local/img/path.jpg";
            path = utils.translatePath(path);
            expect(path).toEqual("file:///accounts/home/../app/native/this-is-a-local/img/path.jpg");
        });
    });

    describe("deepclone", function () {
        it("passes through null", function () {
            expect(utils.deepclone(null)).toBe(null);
        });

        it("passes through undefined", function () {
            expect(utils.deepclone(undefined)).toBe(undefined);
        });

        it("passes through a Number", function () {
            expect(utils.deepclone(1)).toBe(1);
        });

        it("passes through a String", function () {
            var str = "hello world";
            expect(utils.deepclone(str)).toBe(str);
        });

        it("passes through a Boolean", function () {
            expect(utils.deepclone(true)).toBe(true);
            expect(utils.deepclone(false)).toBe(false);
        });

        it("returns a new Date", function () {
            var date = new Date(),
                dateCopy = utils.deepclone(date);

            expect(dateCopy instanceof Date).toBe(true, "Not a Date");
            expect(date).not.toBe(dateCopy);
            expect(date.getTime()).toBe(dateCopy.getTime());
        });

        it("returns a new RegExp", function () {
            var regex = /a/,
                regexCopy = utils.deepclone(regex);

            expect(regexCopy instanceof RegExp).toBe(true, "Not a RegExp");
            expect(regexCopy).not.toBe(regex);
            expect(regexCopy.toString()).toBe(regex.toString());
        });

        it("copies nested Object properties", function () {
            var obj = {
                    a: "hello world",
                    b: "hello again"
                },
                objCopy = utils.deepclone(obj);

            expect(obj).not.toBe(objCopy);
            expect(obj).toEqual(objCopy);
        });
    });
});
