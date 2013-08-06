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
describe("Camera", function () {
    var _apiDir = __dirname + "./../../../../plugins/Camera/src/blackberry10/",
        index,
        mockDone,
        mockCancel,
        mockError,
        mockedEnv = {
            response: {
                send: jasmine.createSpy()
            },
            webview: {
                executeJavaScript: jasmine.createSpy()
            }
        },
        PictureSourceType = {
            PHOTOLIBRARY : 0,    // Choose image from picture library (same as SAVEDPHOTOALBUM for Android)
            CAMERA : 1,          // Take picture from camera
            SAVEDPHOTOALBUM : 2  // Choose image from picture library (same as PHOTOLIBRARY for Android)
        },
        DestinationType = {
            DATA_URL: 0,         // Return base64 encoded string
            FILE_URI: 1,         // Return file uri (content://media/external/images/media/2 for Android)
            NATIVE_URI: 2        // Return native uri (eg. asset-library://... for iOS)
        },
        readFail,
        mockBase64Data = "/9j/4QHRw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";

    function mockOpen(options, done, cancel, invoked) {
        if (!mockError) {
            invoked();
        }

        if (mockDone) {
            done(mockDone.path);
        } else if (mockCancel) {
            cancel(mockCancel.reason);
        } else if (mockError) {
            invoked(mockError.error);
        }
    }

    beforeEach(function () {
        index = require(_apiDir + "index");
        mockedEnv.response.send.reset();
        mockedEnv.webview.executeJavaScript.reset();
    });

    afterEach(function () {
        index = null;
        mockDone = null;
        mockCancel = null;
        mockError = null;
        readFail = false;
    });

    describe("takePicture", function () {
        beforeEach(function () {
            GLOBAL.window = {
                qnx: {
                    webplatform: {
                        getApplication: function () {
                            return {
                                cards: {
                                    camera: {
                                        open: jasmine.createSpy().andCallFake(mockOpen)
                                    },
                                    filePicker: {
                                        open: jasmine.createSpy().andCallFake(mockOpen)
                                    }
                                }
                            };
                        },
                        getController: function () {
                            return {
                                setFileSystemSandbox: true
                            };
                        }
                    }
                },
                webkitRequestFileSystem: jasmine.createSpy().andCallFake(function (type, size, success, error) {
                    success({
                        root: {
                            getFile: jasmine.createSpy().andCallFake(function (path, options, success, error) {
                                if (readFail) {
                                    error({
                                        code: -1
                                    });
                                } else {
                                    success({
                                        file: jasmine.createSpy().andCallFake(function (cb) {
                                            cb();
                                        })
                                    });
                                }
                            })
                        }
                    });
                })
            };

            GLOBAL.FileReader = function () {
                return {
                    onloadend: jasmine.createSpy(),
                    readAsDataURL: jasmine.createSpy().andCallFake(function (file) {
                        this.onloadend.apply({
                            result: "data:image/jpeg;base64," + mockBase64Data
                        });
                    })
                };
            };

            GLOBAL.FileError = {
                NOT_FOUND_ERR: 1,
                NOT_READABLE_ERR: 4,
                PATH_EXISTS_ERR: 12,
                TYPE_MISMATCH_ERR: 11
            };

            GLOBAL.PluginResult = function (args, env) {};
            GLOBAL.PluginResult.prototype.callbackOk = jasmine.createSpy();
            GLOBAL.PluginResult.prototype.callbackError = jasmine.createSpy();
            GLOBAL.PluginResult.prototype.noResult = jasmine.createSpy();
        });

        afterEach(function () {
            delete GLOBAL.window;
            delete GLOBAL.FileReader;
            delete GLOBAL.PluginResult;
        });

        it("calls PluginResult.callbackOk if invoke camera is successful and image doesn't need encoding", function () {
            mockDone = {
                path: "/foo/bar/abc.jpg"
            };

            index.takePicture(undefined, undefined, {
                "1": DestinationType.FILE_URI.toString(),
                "2": PictureSourceType.CAMERA.toString(),
                callbackId: "123"
            }, mockedEnv);

            expect(PluginResult.prototype.noResult).toHaveBeenCalledWith(true);
            expect(PluginResult.prototype.callbackOk).toHaveBeenCalledWith("file://" + mockDone.path, false);
        });

        it("calls PluginResult.callbackOk if invoke camera and base64 encode image is successful", function () {
            mockDone = {
                path: "/foo/bar/abc.jpg"
            };

            index.takePicture(undefined, undefined, {
                "1": DestinationType.DATA_URL.toString(),
                "2": PictureSourceType.CAMERA.toString(),
                callbackId: "123"
            }, mockedEnv);

            expect(PluginResult.prototype.noResult).toHaveBeenCalledWith(true);
            expect(PluginResult.prototype.callbackOk).toHaveBeenCalledWith(mockBase64Data, false);
        });

        it("calls PluginResult.callbackError if invoke camera is successful but base64 encode image failed", function () {
            mockDone = {
                path: "/foo/bar/abc.jpg"
            };
            readFail = true;

            index.takePicture(undefined, undefined, {
                "1": DestinationType.DATA_URL.toString(),
                "2": PictureSourceType.CAMERA.toString(),
                callbackId: "123"
            }, mockedEnv);

            expect(PluginResult.prototype.noResult).toHaveBeenCalledWith(true);
            expect(PluginResult.prototype.callbackError).toHaveBeenCalledWith("An error occured: Unknown Error", false);
        });

        it("calls PluginResult.callbackError if invoke camera is cancelled by user", function () {
            mockCancel = {
                reason: "done"
            };

            index.takePicture(undefined, undefined, {
                "1": DestinationType.FILE_URI.toString(),
                "2": PictureSourceType.CAMERA.toString(),
                callbackId: "123"
            }, mockedEnv);

            expect(PluginResult.prototype.noResult).toHaveBeenCalledWith(true);
            expect(PluginResult.prototype.callbackError).toHaveBeenCalledWith(mockCancel.reason, false);
        });

        it("calls PluginResult.callbackError if invoke camera encounters error", function () {
            mockError = {
                error: "Camera error"
            };

            index.takePicture(undefined, undefined, {
                "1": DestinationType.FILE_URI.toString(),
                "2": PictureSourceType.CAMERA.toString(),
                callbackId: "123"
            }, mockedEnv);

            expect(PluginResult.prototype.noResult).toHaveBeenCalledWith(true);
            expect(PluginResult.prototype.callbackError).toHaveBeenCalledWith(mockError.error, false);
        });

        it("calls PluginResult.callbackOk if invoke file picker is successful and image doesn't need encoding", function () {
            mockDone = {
                path: "/foo/bar/abc.jpg"
            };

            index.takePicture(undefined, undefined, {
                "1": DestinationType.FILE_URI.toString(),
                "2": PictureSourceType.PHOTOLIBRARY.toString(),
                callbackId: "123"
            }, mockedEnv);

            expect(PluginResult.prototype.noResult).toHaveBeenCalledWith(true);
            expect(PluginResult.prototype.callbackOk).toHaveBeenCalledWith("file://" + mockDone.path, false);
        });

        it("calls PluginResult.callbackOk if invoke file picker and base64 encode image is successful", function () {
            mockDone = {
                path: "/foo/bar/abc.jpg"
            };

            index.takePicture(undefined, undefined, {
                "1": DestinationType.DATA_URL.toString(),
                "2": PictureSourceType.PHOTOLIBRARY.toString(),
                callbackId: "123"
            }, mockedEnv);

            expect(PluginResult.prototype.noResult).toHaveBeenCalledWith(true);
            expect(PluginResult.prototype.callbackOk).toHaveBeenCalledWith(mockBase64Data, false);
        });

        it("calls PluginResult.callbackError if invoke file picker is successful but base64 encode image failed", function () {
            mockDone = {
                path: "/foo/bar/abc.jpg"
            };
            readFail = true;

            index.takePicture(undefined, undefined, {
                "1": DestinationType.DATA_URL.toString(),
                "2": PictureSourceType.PHOTOLIBRARY.toString(),
                callbackId: "123"
            }, mockedEnv);

            expect(PluginResult.prototype.noResult).toHaveBeenCalledWith(true);
            expect(PluginResult.prototype.callbackError).toHaveBeenCalledWith("An error occured: Unknown Error", false);
        });

        it("calls PluginResult.callbackError if invoke file picker is cancelled by user", function () {
            mockCancel = {
                reason: "cancel"
            };

            index.takePicture(undefined, undefined, {
                "1": DestinationType.DATA_URL.toString(),
                "2": PictureSourceType.PHOTOLIBRARY.toString(),
                callbackId: "123"
            }, mockedEnv);

            expect(PluginResult.prototype.noResult).toHaveBeenCalledWith(true);
            expect(PluginResult.prototype.callbackError).toHaveBeenCalledWith(mockCancel.reason, false);
        });

        it("calls PluginResult.callbackError if invoke file picker encounters error", function () {
            mockError = {
                error: "File picker error"
            };

            index.takePicture(undefined, undefined, {
                "1": DestinationType.DATA_URL.toString(),
                "2": PictureSourceType.PHOTOLIBRARY.toString(),
                callbackId: "123"
            }, mockedEnv);

            expect(PluginResult.prototype.noResult).toHaveBeenCalledWith(true);
            expect(PluginResult.prototype.callbackError).toHaveBeenCalledWith(mockError.error, false);
        });
    });
});
