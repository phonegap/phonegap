describe("NetworkResourceRequested event handler", function () {
    var LIB_PATH  = "./../../../../lib/",
        networkResourceRequested = require(LIB_PATH + "webkitHandlers/networkResourceRequested"),
        Whitelist = require(LIB_PATH + 'policy/whitelist').Whitelist,
        server = require(LIB_PATH + 'server'),
        utils = require(LIB_PATH + 'utils'),
        mockedWebview;

    beforeEach(function () {
        mockedWebview = {
            originalLocation : "http://www.origin.com",
            executeJavaScript : jasmine.createSpy(),
            id: 42,
            uiWebView: {
                childwebviewcontrols: {
                    open: jasmine.createSpy()
                }
            }
        };
    });

    afterEach(function () {
        mockedWebview = undefined;
    });

    it("creates a callback for yous", function () {
        var requestObj = networkResourceRequested.createHandler();
        expect(requestObj.networkResourceRequestedHandler).toBeDefined();
    });


    it("can access the whitelist", function () {
        spyOn(Whitelist.prototype, "isAccessAllowed").andReturn(true);
        var url = "http://www.google.com",
            requestObj = networkResourceRequested.createHandler(mockedWebview);
        requestObj.networkResourceRequestedHandler(JSON.stringify({url: url}));
        expect(Whitelist.prototype.isAccessAllowed).toHaveBeenCalled();
    });

    it("checks whether the request is for an iframe when accessing the whitelist", function () {
        spyOn(Whitelist.prototype, "isAccessAllowed").andReturn(true);
        var url = "http://www.google.com",
            requestObj = networkResourceRequested.createHandler(mockedWebview);
        requestObj.networkResourceRequestedHandler(JSON.stringify({url: url, targetType: "TargetIsXMLHTTPRequest"}));
        expect(Whitelist.prototype.isAccessAllowed).toHaveBeenCalledWith(url, true);
    });

    it("can apply whitelist rules and allow valid urls", function () {
        spyOn(Whitelist.prototype, "isAccessAllowed").andReturn(true);
        var url = "http://www.google.com",
            requestObj = networkResourceRequested.createHandler(mockedWebview),
            returnValue = requestObj.networkResourceRequestedHandler(JSON.stringify({url: url}));
        expect(Whitelist.prototype.isAccessAllowed).toHaveBeenCalled();
        expect(JSON.parse(returnValue).setAction).toEqual("ACCEPT");
    });

    it("can apply whitelist rules and deny blocked urls", function () {
        spyOn(Whitelist.prototype, "isAccessAllowed").andReturn(false);
        spyOn(utils, "invokeInBrowser");
        spyOn(console, "warn");

        var url = "http://www.google.com",
            requestObj = networkResourceRequested.createHandler(mockedWebview),
            returnValue = requestObj.networkResourceRequestedHandler(JSON.stringify({url: url})),
            deniedMsg = "Access to \"" + url + "\" not allowed";

        expect(Whitelist.prototype.isAccessAllowed).toHaveBeenCalled();
        expect(JSON.parse(returnValue).setAction).toEqual("DENY");
        expect(utils.invokeInBrowser).not.toHaveBeenCalledWith(url);
        expect(mockedWebview.uiWebView.childwebviewcontrols.open).not.toHaveBeenCalledWith(url);
        expect(mockedWebview.executeJavaScript).toHaveBeenCalledWith("alert('" + deniedMsg + "')");
        expect(console.warn).toHaveBeenCalledWith(deniedMsg);
    });

    it("can apply whitelist rules and deny blocked urls and route to a uiWebView when target is main frame", function () {
        spyOn(Whitelist.prototype, "isAccessAllowed").andReturn(false);
        spyOn(utils, "invokeInBrowser");
        spyOn(console, "warn");

        var url = "http://www.google.com",
            requestObj = networkResourceRequested.createHandler(mockedWebview),
            returnValue = requestObj.networkResourceRequestedHandler(JSON.stringify({url: url, targetType: "TargetIsMainFrame"})),
            deniedMsg = "Access to \"" + url + "\" not allowed";

        expect(Whitelist.prototype.isAccessAllowed).toHaveBeenCalled();
        expect(mockedWebview.uiWebView.childwebviewcontrols.open).toHaveBeenCalledWith(url);
        expect(mockedWebview.executeJavaScript).not.toHaveBeenCalledWith("alert('" + deniedMsg + "')");
        expect(console.warn).toHaveBeenCalledWith(deniedMsg);
        expect(utils.invokeInBrowser).not.toHaveBeenCalledWith(url);
        expect(JSON.parse(returnValue).setAction).toEqual("DENY");
    });

    it("can apply whitelist rules and deny blocked urls and route to the browser when target is main frame and childWebView is disabled", function () {
        var url = "http://www.google.com",
            config = require(LIB_PATH + "config"),
            deniedMsg = "Access to \"" + url + "\" not allowed",
            requestObj,
            returnValue;

        spyOn(Whitelist.prototype, "isAccessAllowed").andReturn(false);
        spyOn(utils, "invokeInBrowser");
        spyOn(console, "warn");

        config.enableChildWebView = false;

        this.after(function () {
            delete require.cache[require.resolve(LIB_PATH + "config")];
        });

        requestObj = networkResourceRequested.createHandler(mockedWebview);
        returnValue = requestObj.networkResourceRequestedHandler(JSON.stringify({url: url, targetType: "TargetIsMainFrame"}));

        expect(Whitelist.prototype.isAccessAllowed).toHaveBeenCalled();
        expect(mockedWebview.uiWebView.childwebviewcontrols.open).not.toHaveBeenCalledWith(url);
        expect(mockedWebview.executeJavaScript).not.toHaveBeenCalledWith("alert('" + deniedMsg + "')");
        expect(console.warn).toHaveBeenCalledWith(deniedMsg);
        expect(utils.invokeInBrowser).toHaveBeenCalledWith(url);
        expect(JSON.parse(returnValue).setAction).toEqual("DENY");
    });

    it("can call the server handler when certain urls are detected", function () {
        spyOn(server, "handle");
        var url = "http://localhost:8472/roomService/kungfuAction/customExt/crystalMethod?blargs=yes",
            requestObj = networkResourceRequested.createHandler(mockedWebview),
            returnValue = requestObj.networkResourceRequestedHandler(JSON.stringify({url: url, referrer: "http://www.origin.com"})),
            expectedRequest = {
                params: {
                    service: "roomService",
                    action: "kungfuAction",
                    ext: "customExt",
                    method: "crystalMethod",
                    args: "blargs=yes"
                },
                body: undefined,
                origin: "http://www.origin.com"
            },
            expectedResponse = {
                send: jasmine.any(Function)
            };
        expect(JSON.parse(returnValue).setAction).toEqual("SUBSTITUTE");
        expect(server.handle).toHaveBeenCalledWith(expectedRequest, expectedResponse, mockedWebview);
    });

    it("can call the server handler correctly with a multi-level method", function () {
        spyOn(server, "handle");
        var url = "http://localhost:8472/roomService/kungfuAction/customExt/crystal/Method?blargs=yes",
            requestObj = networkResourceRequested.createHandler(mockedWebview),
            returnValue = requestObj.networkResourceRequestedHandler(JSON.stringify({url: url, referrer: "http://www.origin.com"})),
            expectedRequest = {
                params: {
                    service: "roomService",
                    action: "kungfuAction",
                    ext: "customExt",
                    method: "crystal/Method",
                    args: "blargs=yes"
                },
                body: undefined,
                origin: "http://www.origin.com"
            },
            expectedResponse = {
                send: jasmine.any(Function)
            };
        expect(JSON.parse(returnValue).setAction).toEqual("SUBSTITUTE");
        expect(server.handle).toHaveBeenCalledWith(expectedRequest, expectedResponse, mockedWebview);
    });

});
