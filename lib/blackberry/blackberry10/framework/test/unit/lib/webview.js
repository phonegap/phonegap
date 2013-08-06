var path = require('path');

describe("webview", function () {
    var libPath = path.join(__dirname, "../../../lib/"),
        networkResourceRequested = require(path.join(libPath, "webkitHandlers/networkResourceRequested")),
        webkitOriginAccess,
        webview,
        mockedController,
        mockedWebview,
        mockedQnx,
        globalCreate;

    beforeEach(function () {
        require.cache = {};
        mockedController = {
            enableWebInspector: undefined,
            enableCrossSiteXHR: undefined,
            visible: undefined,
            active: undefined,
            setGeometry: jasmine.createSpy(),
            dispatchEvent : jasmine.createSpy(),
            addEventListener : jasmine.createSpy()
        };
        mockedWebview = {
            id: 42,
            enableCrossSiteXHR: undefined,
            visible: undefined,
            active: undefined,
            zOrder: undefined,
            url: undefined,
            reload: jasmine.createSpy(),
            extraHttpHeaders: undefined,
            setFileSystemSandbox: undefined,
            addOriginAccessWhitelistEntry: jasmine.createSpy(),
            setGeometry: jasmine.createSpy(),
            setApplicationOrientation: jasmine.createSpy(),
            setExtraPluginDirectory: jasmine.createSpy(),
            setEnablePlugins: jasmine.createSpy(),
            getEnablePlugins: jasmine.createSpy(),
            notifyApplicationOrientationDone: jasmine.createSpy(),
            onContextMenuRequestEvent: undefined,
            onContextMenuCancelEvent: undefined,
            onNetworkResourceRequested: undefined,
            destroy: jasmine.createSpy(),
            executeJavaScript: jasmine.createSpy(),
            windowGroup: undefined,
            addEventListener: jasmine.createSpy(),
            enableWebEventRedirect: jasmine.createSpy(),
            addKnownSSLCertificate: jasmine.createSpy(),
            continueSSLHandshaking: jasmine.createSpy(),
            setSensitivity: jasmine.createSpy(),
            getSensitivity: jasmine.createSpy(),
            setBackgroundColor: jasmine.createSpy(),
            getBackgroundColor: jasmine.createSpy(),
            allowWebEvent: jasmine.createSpy(),
            allowUserMedia: jasmine.createSpy(),
            disallowUserMedia: jasmine.createSpy()
        };
        mockedQnx = {
            callExtensionMethod: jasmine.createSpy(),
            webplatform: {
                getController: function () {
                    return mockedController;
                },
                createWebView: function (options, createFunction) {
                    //process.nextTick(createFunction);
                    //setTimeout(createFunction,0);
                    if (typeof options === 'function') {
                        runs(options);
                        globalCreate = options;
                    }
                    else {
                        runs(createFunction);
                        globalCreate = createFunction;
                    }
                    return mockedWebview;
                },
                getApplication: jasmine.createSpy().andReturn({windowVisible: false})
            }
        };
        GLOBAL.qnx = mockedQnx;
        GLOBAL.window = {
            qnx: mockedQnx
        };
        GLOBAL.screen = {
            width : 1024,
            height: 768
        };
        webview = require(path.join(libPath, "webview"));
        webkitOriginAccess = require(path.join(libPath, "policy/webkitOriginAccess"));
    });

    afterEach(function () {
        require.cache = {};
    });

    describe("create", function () {
        it("sets up the visible webview", function () {
            var mockNetworkHandler = { networkResourceRequestedHandler: function onNetworkResourceRequested() {} };

            spyOn(networkResourceRequested, "createHandler").andReturn(mockNetworkHandler);
            spyOn(webkitOriginAccess, "addWebView");
            webview.create();
            waits(1);
            runs(function () {
                expect(mockedWebview.visible).toEqual(true);
                expect(mockedWebview.active).toEqual(true);
                expect(mockedWebview.zOrder).toEqual(0);
                expect(mockedWebview.setGeometry).toHaveBeenCalledWith(0, 0, screen.width, screen.height);
                expect(Object.getOwnPropertyDescriptor(webview, 'onContextMenuRequestEvent')).toEqual(jasmine.any(Object));
                expect(Object.getOwnPropertyDescriptor(webview, 'onContextMenuCancelEvent')).toEqual(jasmine.any(Object));
                expect(Object.getOwnPropertyDescriptor(webview, 'onGeolocationPermissionRequest')).toEqual(jasmine.any(Object));


                expect(networkResourceRequested.createHandler).toHaveBeenCalledWith(mockedWebview);
                expect(mockedWebview.onNetworkResourceRequested).toEqual(mockNetworkHandler.networkResourceRequestedHandler);

                expect(mockedWebview.allowWebEvent).toHaveBeenCalledWith("DialogRequested");
                expect(mockedController.dispatchEvent).toHaveBeenCalledWith("webview.initialized", jasmine.any(Array));
                //The default config.xml only has access to WIDGET_LOCAL
                //and has permission for two apis
                expect(webkitOriginAccess.addWebView).toHaveBeenCalledWith(mockedWebview);
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

    describe("file system sandbox", function () {
        it("setSandbox", function () {
            webview.create();
            webview.setSandbox(false);
            expect(mockedWebview.setFileSystemSandbox).toBeFalsy();
        });

        it("getSandbox", function () {
            webview.create();
            webview.setSandbox(false);
            expect(webview.getSandbox()).toBeFalsy();
        });
    });

    describe("id", function () {
        it("can get the id for the webiew", function () {
            webview.create();
            expect(webview.id).toEqual(mockedWebview.id);
        });
    });

    describe("enableCrossSiteXHR", function () {
        it("can set enableCrossSiteXHR", function () {
            webview.create();
            webview.enableCrossSiteXHR = true;
            expect(mockedWebview.enableCrossSiteXHR).toBe(true);
            webview.enableCrossSiteXHR = false;
            expect(mockedWebview.enableCrossSiteXHR).toBe(false);
        });
    });

    describe("geometry", function () {
        it("can set geometry", function () {
            webview.create();
            webview.setGeometry(0, 0, 100, 200);
            expect(mockedWebview.setGeometry).toHaveBeenCalledWith(0, 0, 100, 200);
        });

        it("can get geometry", function () {
            webview.create();
            webview.setGeometry(0, 0, 100, 100);
            expect(webview.getGeometry()).toEqual({x: 0, y: 0, w: 100, h: 100});
        });
    });

    describe("application orientation", function () {
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
    });

    describe("plugins", function () {
        it("can set an extra plugin directory", function () {
            webview.create();
            webview.setExtraPluginDirectory('/usr/lib/browser/plugins');
            expect(mockedWebview.setExtraPluginDirectory).toHaveBeenCalledWith('/usr/lib/browser/plugins');
        });

        it("can enable plugins for the webview", function () {
            webview.create();
            webview.setEnablePlugins(true);
            expect(mockedWebview.pluginsEnabled).toBeTruthy();
        });

        it("can retrieve whether plugins are enabled", function () {
            webview.create();
            webview.setEnablePlugins(true);
            expect(webview.getEnablePlugins()).toBeTruthy();
        });
    });

    describe("SSL Exception Methods", function () {
        it("addKnownSSLException", function () {
            var url = 'https://bojaps.com',
                certificateInfo = {
                    test : 'test'
                };
            webview.create();
            webview.addKnownSSLCertificate(url, certificateInfo);
            expect(mockedWebview.addKnownSSLCertificate).toHaveBeenCalledWith(url, certificateInfo);
        });

        it("continue SSL Hanshaking", function () {
            var streamId = 8,
                SSLAction = 'SSLActionReject';
            webview.create();
            webview.continueSSLHandshaking(streamId, SSLAction);
            expect(mockedWebview.continueSSLHandshaking).toHaveBeenCalledWith(streamId, SSLAction);
        });
    });

    describe("User Media", function () {
        it("has allowUserMedia defined", function () {
            webview.create();
            expect(webview.allowUserMedia).toBeDefined();
        });

        it("has disallowUserMedia defined", function () {
            webview.create();
            expect(webview.disallowUserMedia).toBeDefined();
        });

        it("calls allowUserMedia on WebView", function () {
            var evtId = 10,
                cameraName = "CAMERA_UNIT_FRONT";

            webview.create();
            webview.allowUserMedia(evtId, cameraName);
            expect(mockedWebview.allowUserMedia).toHaveBeenCalledWith(evtId, cameraName);
        });

        it("calls disallowUserMedia on WebView", function () {
            var evtId = 10;

            webview.create();
            webview.disallowUserMedia(evtId);
            expect(mockedWebview.disallowUserMedia).toHaveBeenCalledWith(evtId);
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

        it("calls the underlying executeJavaScript", function () {
            var js = "var awesome='Jasmine BDD'";
            webview.create(mockedWebview);
            webview.executeJavascript(js);
            expect(mockedWebview.executeJavaScript).toHaveBeenCalledWith(js);
        });
        it("calls the underlying windowGroup property", function () {
            webview.create(mockedWebview);
            expect(webview.windowGroup()).toEqual(mockedWebview.windowGroup);
        });

        it("expect the config to set the extraHttpHeader", function () {
            webview.create();
            waits(1);
            runs(function () {
                expect(mockedWebview.extraHttpHeaders).toEqual({"rim-header": "RIM-Widget:rim/widget"});
            });
        });

        it("expect the config to set the user agent", function () {
            webview.create();
            waits(1);
            runs(function () {
                expect(mockedWebview.userAgent).toEqual("Some extremely long user agent (with) spe/cial, characters");
            });
        });

        it("expect reload to be defined", function () {
            webview.create();
            waits(1);
            expect(webview.reload).toBeDefined();
            webview.reload();
            expect(mockedWebview.reload).toHaveBeenCalled();
        });
    });

    describe("methods for sensitivity", function () {

        it("setter getter for sensitivity", function () {
            webview.create(mockedWebview);
            webview.setSensitivity("Something");
            expect(mockedWebview.setSensitivity).toHaveBeenCalled();
            webview.getSensitivity();
            expect(mockedWebview.getSensitivity).toHaveBeenCalled();
        });

        it("setter getter for background", function () {
            webview.create(mockedWebview);
            webview.setBackgroundColor("Something");
            expect(mockedWebview.setBackgroundColor).toHaveBeenCalled();
            webview.getBackgroundColor();
            expect(mockedWebview.getBackgroundColor).toHaveBeenCalled();
        });

    });

});
