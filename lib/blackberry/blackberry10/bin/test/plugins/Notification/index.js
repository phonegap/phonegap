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

function mockAndTestDialog(htmlmessage, title, dialogType, buttonLabel) {
    GLOBAL.qnx = {
        webplatform: {
            getWebViews: function () {
                var webviews = [{}, {},
                    {//overlayWebview
                        dialog: {
                            show: function(messageObj, callback) {
                                expect(messageObj.title).toEqual(title);
                                expect(messageObj.htmlmessage).toEqual(htmlmessage);
                                expect(messageObj.dialogType).toEqual(dialogType);
                                expect(messageObj.optionalButtons).toEqual(buttonLabel);
                                expect(typeof callback).toEqual("function");
                            }
                        }
                    }];
                return webviews;
            }
        }
    };

}

describe("Notification", function () {
    var _apiDir = __dirname + "./../../../../plugins/Notification/src/blackberry10/",
    index,
    success = function() {},
    fail = function() {},
    result = {
        error: jasmine.createSpy(),
        noResult: jasmine.createSpy()
    },
    args = {
        0: "%22Dialog%20message.%22",
        1: "%22Dialog%20Title%22",
        2: "%22Continue%22"
    };

    beforeEach(function () {
        index = require(_apiDir + "index");

        GLOBAL.PluginResult = function () {
            return result;
        };
    });

    afterEach(function () {
        delete require.cache[require.resolve(_apiDir + "index")];
        delete GLOBAL.qnx;
        delete GLOBAL.PluginResult;
    });

    describe("alert", function () {
        it("fails with invalid number of args", function () {
            index.alert(success, fail, {}, {});
            expect(result.error).toHaveBeenCalledWith("Notification action - alert arguments not found.");
        });

        it("calls dialog.show with correct params", function () {
            mockAndTestDialog("Dialog message.", "Dialog Title", "CustomAsk", ["Continue"]);
            index.alert(success, fail, args, {});
            expect(result.noResult).toHaveBeenCalled();
        });
    });

    describe("confirm", function () {
        it("fails with invalid number of args", function () {
            index.confirm(success, fail, {}, {});
            expect(result.error).toHaveBeenCalledWith("Notification action - confirm arguments not found.");
        });

        it("calls dialog.show with correct params", function () {
            mockAndTestDialog("Dialog message.", "Dialog Title", "CustomAsk", ["Continue"]);
            index.confirm(success, fail, args, {});
            expect(result.noResult).toHaveBeenCalled();
        });

        it("calls dialog.show with correct params [deprecated buttonArg]", function () {
            var args = {
                0: "%22Dialog%20message.%22",
                1: "%22Dialog%20Title%22",
                2: "%22Continue,Cancel%22"
            };

            mockAndTestDialog("Dialog message.", "Dialog Title", "CustomAsk", ["Continue", "Cancel"]);
            index.confirm(success, fail, args, {});
            expect(result.noResult).toHaveBeenCalled();
        });
    });

    describe("prompt", function () {
        it("fails with invalid number of args", function () {
            index.prompt(success, fail, {}, {});
            expect(result.error).toHaveBeenCalledWith("Notification action - prompt arguments not found.");
        });

        it("calls dialog.show with correct params", function () {
            mockAndTestDialog("Dialog message.", "Dialog Title", "JavaScriptPrompt", ["Continue"]);
            index.prompt(success, fail, args, {});
            expect(result.noResult).toHaveBeenCalled();
        });
    });
});
