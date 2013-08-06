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

var srcPath = __dirname + '/../../../lib/',
    config = require(srcPath + "config"),
    framework,
    webview,
    overlayWebView,
    overlayWebViewObj,
    controllerWebView,
    Whitelist = require(srcPath + 'policy/whitelist').Whitelist,
    mockedController,
    mockedApplicationWindow,
    mockedApplication,
    mockedDevice,
    mockedQnx,
    mock_request = {
        url: "http://www.dummy.com",
        allow: jasmine.createSpy(),
        deny: jasmine.createSpy()
    };

describe("framework", function () {
    beforeEach(function () {
        mockedController = {
            id: 42,
            enableCrossSiteXHR: undefined,
            visible: undefined,
            active: undefined,
            zOrder: undefined,
            url: undefined,
            setGeometry: jasmine.createSpy(),
            onNetworkResourceRequested: undefined,
            destroy: jasmine.createSpy(),
            executeJavaScript: jasmine.createSpy(),
            windowGroup: undefined,
            addEventListener: jasmine.createSpy(),
            uiWebView: undefined,
            onChildWindowOpen: undefined
        };
        mockedApplicationWindow = {
            visible: undefined
        };
        mockedApplication = {
            addEventListener: jasmine.createSpy(),
            removeEventListener: jasmine.createSpy(),
            webInspectorPort : "1337",
            invocation: {
                invoke: jasmine.createSpy()
            }
        };
        mockedDevice = {
            getNetworkInterfaces : jasmine.createSpy()
        };
        mockedQnx = {
            callExtensionMethod : function () {
                return 42;
            },
            webplatform : {
                getController : function () {
                    return mockedController;
                },
                getApplication : function () {
                    return mockedApplication;
                },
                getApplicationWindow : function () {
                    return mockedApplicationWindow;
                },
                device : mockedDevice,
                nativeCall: jasmine.createSpy("qnx.webplatform.nativeCall")
            }
        };
        GLOBAL.window = {
            qnx: mockedQnx
        };
        GLOBAL.qnx = mockedQnx;
        GLOBAL.NamedNodeMap = function () {};

        delete require.cache[require.resolve(srcPath + "webview")];
        webview = require(srcPath + "webview");
        delete require.cache[require.resolve(srcPath + "overlayWebView")];
        overlayWebView = require(srcPath + "overlayWebView");
        delete require.cache[require.resolve(srcPath + "controllerWebView")];
        controllerWebView = require(srcPath + "controllerWebView");

        spyOn(webview, "create").andCallFake(function (done) {
            done();
        });

        spyOn(overlayWebView, "getWebViewObj").andCallFake(function () {
            overlayWebViewObj = {
                formcontrol: {
                    subscribeTo: jasmine.createSpy()
                }
            };
            return overlayWebViewObj;
        });

        spyOn(overlayWebView, "create").andCallFake(function (done) {
            done();
        });

        spyOn(controllerWebView, "init");
        spyOn(controllerWebView, "dispatchEvent");
        spyOn(webview, "destroy");
        spyOn(webview, "executeJavascript");
        spyOn(webview, "setURL");
        spyOn(webview, "setUIWebViewObj");
        spyOn(webview, "addEventListener").andCallFake(function (eventName, callback) {
            callback();
        });
        spyOn(webview, "removeEventListener");

        spyOn(overlayWebView, "setURL");
        spyOn(overlayWebView, "renderContextMenuFor");
        spyOn(overlayWebView, "handleDialogFor");
        spyOn(overlayWebView, "addEventListener").andCallFake(function (eventName, callback) {
            callback();
        });
        spyOn(overlayWebView, "removeEventListener");
        spyOn(overlayWebView, "bindAppWebViewToChildWebViewControls");

        delete require.cache[require.resolve(srcPath + "framework")];
        framework = require(srcPath + 'framework');
    });

    afterEach(function () {
        delete GLOBAL.blackberry;
        delete GLOBAL.window;
        delete GLOBAL.qnx;
        delete GLOBAL.NamedNodeMap;
        delete require.cache[require.resolve(srcPath + "webview")];
        delete require.cache[require.resolve(srcPath + "overlayWebView")];
        delete require.cache[require.resolve(srcPath + "controllerWebView")];
        delete require.cache[require.resolve(srcPath + "framework")];
    });

    it("can start a webview instance", function () {
        framework.start();
        expect(controllerWebView.init).toHaveBeenCalled();
        expect(webview.create).toHaveBeenCalled();
    });

    it("on start passing callback and setting object parameters to create method of webview", function () {
        framework.start();
        expect(webview.create).toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Object));
    });

    it("setting object should have debugEnabled to be defined", function () {
        framework.start();
        expect((webview.create.mostRecentCall.args)[1].debugEnabled).toBeDefined();
    });

    it("can start a webview instance with a url", function () {
        var url = "http://www.google.com";
        framework.start(url);
        expect(webview.setURL).toHaveBeenCalledWith(url);
    });

    it("can stop a webview instance", function () {
        framework.start();
        framework.stop();
        expect(webview.destroy).toHaveBeenCalled();
    });

    describe('creating the overlay webview', function () {
        beforeEach(function () {
            framework.start();
        });
        it('calls overlayWebView.create', function () {
            expect(overlayWebView.create).toHaveBeenCalled();
        });

        it('sets the overlayWebView URL', function () {
            expect(overlayWebView.setURL).toHaveBeenCalledWith("local:///chrome/ui.html");
        });

        it('calls renderContextMenuFor passing the webview', function () {
            expect(overlayWebView.renderContextMenuFor).toHaveBeenCalledWith(webview);
        });

        it('calls handleDialogFor passing the webview', function () {
            expect(overlayWebView.handleDialogFor).toHaveBeenCalledWith(webview);
        });

        it('dispatches the ui.init event on the controllerWebView', function () {
            expect(controllerWebView.dispatchEvent).toHaveBeenCalledWith('ui.init', null);
        });
    });

    describe('configuring webSecurity', function () {
        var enableCrossSiteXHRSetter;

        beforeEach(function () {
            enableCrossSiteXHRSetter = jasmine.createSpy();
            Object.defineProperty(webview, "enableCrossSiteXHR", {set: enableCrossSiteXHRSetter, configurable: true});
        });

        afterEach(function () {
            delete webview.enableCrossSiteXHR;
            delete require.cache[require.resolve(srcPath + "webview")];
            webview = require(srcPath + "webview");
        });

        it('does not call enableCrossSiteXHR by default', function () {
            expect(config.enableWebSecurity).toBe(true);
            framework.start();

            expect(enableCrossSiteXHRSetter).not.toHaveBeenCalledWith(true);
        });

        it('does enable crossSiteXHR when the config says too', function () {
            delete require.cache[require.resolve(srcPath + "config")];
            config = require(srcPath + 'config');
            config.enableWebSecurity = false;

            //reload config in framework
            delete require.cache[require.resolve(srcPath + "framework")];
            framework = require(srcPath + 'framework');

            this.after(function () {
                delete require.cache[require.resolve(srcPath + "config")];
                config = require(srcPath + 'config');

                delete require.cache[require.resolve(srcPath + "framework")];
                framework = require(srcPath + 'framework');
            });

            expect(config.enableWebSecurity).toBe(false);
            framework.start();

            expect(enableCrossSiteXHRSetter).toHaveBeenCalledWith(true);
        });
    });

    describe('configuring OpenChildWindow events', function () {
        var onChildWindowOpenHandler;

        beforeEach(function () {
            Object.defineProperty(webview, "onChildWindowOpen", {set: function (input) {
                onChildWindowOpenHandler = input;
            }, configurable: true});
        });

        afterEach(function () {
            delete webview.onChildWindowOpen;
            delete require.cache[require.resolve(srcPath + "webview")];
            webview = require(srcPath + "webview");
        });

        it('delegates to childWebViewControls on the overlay webview', function () {
            config.enableChildWebView = true;

            //reload config in framework
            delete require.cache[require.resolve(srcPath + "framework")];
            framework = require(srcPath + 'framework');

            this.after(function () {
                delete require.cache[require.resolve(srcPath + "config")];
                config = require(srcPath + 'config');
            });

            framework.start();
            expect(overlayWebView.bindAppWebViewToChildWebViewControls).toHaveBeenCalledWith(webview);
            expect(webview.onChildWindowOpen).not.toBeDefined();
        });

        it('binds to OpenChildWindow and invokes the browser', function () {
            config.enableChildWebView = false;

            //reload config in framework
            delete require.cache[require.resolve(srcPath + "framework")];
            framework = require(srcPath + 'framework');

            this.after(function () {
                delete require.cache[require.resolve(srcPath + "config")];
                config = require(srcPath + 'config');
            });

            framework.start();
            expect(overlayWebView.bindAppWebViewToChildWebViewControls).not.toHaveBeenCalledWith(webview);
            expect(onChildWindowOpenHandler).toEqual(jasmine.any(Function));
            onChildWindowOpenHandler(JSON.stringify({url: 'http://www.google.com'}));
            expect(mockedApplication.invocation.invoke).toHaveBeenCalledWith(
                {uri: 'http://www.google.com', target: "sys.browser" }
            );
        });
    });

    describe('shows the webinspector dialog', function () {
        it('show the webinspector dialog', function () {
            var flag = false;
            spyOn(overlayWebView, "showDialog");

            window.qnx.webplatform.device.getNetworkInterfaces = function (callback) {
                callback();
                flag = true;
            };
            config.debugEnabled = true;
            framework.start();
            waitsFor(function () {
                return flag;
            });
            runs(function () {
                expect(overlayWebView.showDialog).toHaveBeenCalled();
            });
        });

        it('show the webinspector dialog with the correct IP address', function () {
            var flag = false,
            messageObj;
            spyOn(overlayWebView, "showDialog");

            window.qnx.webplatform.device.getNetworkInterfaces = function (callback) {
                var dummyData = {
                    asix0i : null,
                    bb0 : null,
                    bptp0 : null,
                    cellular0 : null,
                    cellular1 : null,
                    cellular2 : null,
                    cellular3 : null,
                    cellular4 : null,
                    ecm0 : {
                        connected : true,
                        ipv4Address : "169.254.0.1",
                        ipv6Address : "fe80::70aa:b2ff:fef9:b374",
                        type : "usb"
                    },
                    ipsec0 : null,
                    ipsec1 : null,
                    lo0 : null,
                    lo2 : null,
                    nap0 : null,
                    pan0 : null,
                    pflog0 : null,
                    ppp0 : null,
                    rndis0 : null,
                    smsc0 : null,
                    tiw_drv0 : null,
                    tiw_ibss0 : null,
                    tiw_p2pdev0 : null,
                    tiw_p2pgrp0 : null,
                    tiw_sta0 : {
                        connected : true,
                        ipv4Address : "192.168.2.2",
                        ipv6Address : "fe80::72aa:b2ff:fef9:b374",
                        type : "wifi"
                    },
                    vlan0 : null,
                    vpn0 : null
                };
                callback(dummyData);
                flag = true;
            };
            config.debugEnabled = true;
            framework.start();
            waitsFor(function () {
                return flag;
            });
            runs(function () {
                messageObj = {
                    title : "Web Inspector Enabled",
                    htmlmessage : "\n ip4:    169.254.0.1:1337<br/> ip6:    fe80::70aa:b2ff:fef9:b374:1337",
                    dialogType : "JavaScriptAlert"
                };
                expect(overlayWebView.showDialog).toHaveBeenCalledWith(messageObj);
            });
        });

    });

    describe('enabling form control', function () {
        var originalConfigVal;

        beforeEach(function () {
            originalConfigVal = config.enableFormControl;
        });

        afterEach(function () {
            config.enableFormControl = originalConfigVal;
        });

        it('subscribes webview to formcontrol', function () {
            config.enableFormControl = true;
            framework.start();
            expect(overlayWebViewObj.formcontrol.subscribeTo).toHaveBeenCalledWith(webview);
        });

        it('does not subscribe webview to formcontrol is enableFormControl is false', function () {
            config.enableFormControl = false;
            framework.start();
            expect(overlayWebViewObj.formcontrol.subscribeTo).not.toHaveBeenCalled();
        });
    });

    describe('enabling popup blocker', function () {
        var originalConfigVal;

        beforeEach(function () {
            originalConfigVal = config.enablePopupBlocker;
        });

        afterEach(function () {
            config.enablePopupBlocker = originalConfigVal;
        });

        it('does nothing when enablePopupBlocker is true', function () {
            config.enablePopupBlocker = true;
            framework.start();
            expect(mockedQnx.webplatform.nativeCall).not.toHaveBeenCalledWith('webview.setBlockPopups', webview.id, false);
        });

        it('Disables popupblocker when enablePopupBlocker is false', function () {
            config.enablePopupBlocker = false;
            framework.start();
            expect(mockedQnx.webplatform.nativeCall).toHaveBeenCalledWith('webview.setBlockPopups', webview.id, false);
        });
    });

});
