/*
 *  Copyright 2012 Research In Motion Limited.
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
describe("Overlay Webview", function () {
    var webview,
        libPath = "./../../../",
        mockedController,
        mockedWebview,
        mockedApplication;

    beforeEach(function () {
        webview = require(libPath + "lib/overlayWebView");
        mockedWebview = {
            id: 42,
            enableCrossSiteXHR: undefined,
            visible: undefined,
            active: undefined,
            zOrder: undefined,
            url: undefined,
            setGeometry: jasmine.createSpy(),
            setApplicationOrientation: jasmine.createSpy(),
            notifyApplicationOrientationDone: jasmine.createSpy(),
            onContextMenuRequestEvent: undefined,
            onNetworkResourceRequested: undefined,
            destroy: jasmine.createSpy(),
            executeJavaScript: jasmine.createSpy(),
            windowGroup: undefined,
            addEventListener: jasmine.createSpy(),
            enableWebEventRedirect: jasmine.createSpy(),
            notifyContextMenuCancelled: jasmine.createSpy(),
            allowQnxObject: undefined,
            allowRpc: undefined,
            contextMenu: {
                subscribeTo: jasmine.createSpy()
            },
            invocationlist: {
                show: jasmine.createSpy()
            }
        };
        mockedController = {
            dispatchEvent : jasmine.createSpy(),
            addEventListener : jasmine.createSpy()
        };

        mockedApplication = {
            windowVisible: undefined
        };
        GLOBAL.qnx = {
            callExtensionMethod: jasmine.createSpy(),
            webplatform: {
                getController: function () {
                    return mockedController;
                },
                createUIWebView: function (createFunction) {
                    runs(createFunction);
                    return mockedWebview;
                },
                getApplication: function () {
                    return mockedApplication;
                }
            }
        };
        GLOBAL.window = {
            qnx: qnx
        };
        GLOBAL.screen = {
            width : 1024,
            height: 768
        };
    });

    describe("create", function () {
        it("sets up the visible webview", function () {
            webview.create();
            waits(1);
            runs(function () {
                expect(mockedWebview.visible).toEqual(true);
                expect(mockedWebview.active).toEqual(true);
                expect(mockedWebview.zOrder).toEqual(2);
                expect(mockedWebview.setGeometry).toHaveBeenCalledWith(0, 0, screen.width, screen.height);
                expect(mockedWebview.backgroundColor).toEqual(0x00FFFFFF);
                expect(mockedWebview.sensitivity).toEqual("SensitivityTest");
                expect(mockedWebview.allowQnxObject).toEqual(true);
                expect(mockedWebview.allowRpc).toEqual(true);
                expect(mockedController.dispatchEvent).toHaveBeenCalledWith("overlayWebView.initialized", jasmine.any(Array));
            });
        });

        it("calls the ready function", function () {
            var chuck = jasmine.createSpy();
            webview.create(chuck);
            waits(1);
            runs(function () {
                expect(chuck).toHaveBeenCalled();
            });
        });

    });

    describe("methods other than create", function () {

        it("calls the underlying destroy", function () {
            webview.create(mockedWebview);
            webview.destroy();
            expect(mockedWebview.destroy).toHaveBeenCalled();
        });

        it("sets the url property", function () {
            var url = "http://AWESOMESAUCE.com";
            webview.create(mockedWebview);
            webview.setURL(url);
            expect(mockedWebview.url).toEqual(url);
        });

        it("calls the underlying executeJavascript", function () {
            var js = "var awesome='Jasmine BDD'";
            webview.create(mockedWebview);
            webview.executeJavascript(js);
            expect(mockedWebview.executeJavaScript).toHaveBeenCalledWith(js);
        });
        it("calls the underlying windowGroup property", function () {
            webview.create(mockedWebview);
            expect(webview.windowGroup()).toEqual(mockedWebview.windowGroup);
        });

        it("can get the id for the webiew", function () {
            webview.create();
            expect(webview.id).toEqual(mockedWebview.id);
        });

        it("can set geometry", function () {
            webview.create();
            webview.setGeometry(0, 0, 100, 200);
            expect(mockedWebview.setGeometry).toHaveBeenCalledWith(0, 0, 100, 200);
        });

        it("can set application orientation", function () {
            webview.create();
            webview.setApplicationOrientation(90);
            expect(mockedWebview.setApplicationOrientation).toHaveBeenCalledWith(90);
        });

        it("can notifyApplicationOrientationDone", function () {
            webview.create();
            webview.notifyApplicationOrientationDone();
            expect(mockedWebview.notifyApplicationOrientationDone).toHaveBeenCalled();
        });

        it("can notifyContextMenuCancelled", function () {
            webview.create();
            webview.notifyContextMenuCancelled();
            expect(mockedWebview.notifyContextMenuCancelled).toHaveBeenCalled();
        });

        it("can render the ccm for another webview ", function () {
            webview.create();
            webview.renderContextMenuFor(webview);
            expect(mockedWebview.contextMenu.subscribeTo).toHaveBeenCalledWith(webview);
        });

        it("It has a zOrder propety ", function () {
            expect(webview.zOrder).toBeDefined();
        });

        it('proxies calls to invocationlist.show()', function () {
            var request = {},
                title = {},
                success = function () {},
                error = function () {};
            webview.create();
            webview.showInvocationList(request, title, success, error);
            expect(mockedWebview.invocationlist.show).toHaveBeenCalledWith(request, title, success, error);
        });
    });
});
