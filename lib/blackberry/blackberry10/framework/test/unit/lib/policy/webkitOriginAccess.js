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

var LIB_PATH = __dirname + "/../../../../lib/",
    utils = require(LIB_PATH + 'utils'),
    webkitOriginAccess = require(LIB_PATH + "policy/webkitOriginAccess"),
    LOCAL_URI = "local://",
    FILE_URI = "file://",
    WW_URI = utils.getURIPrefix(),
    mockWebView;

describe("lib/policy/webkitOriginAccess", function () {
    beforeEach(function () {
        mockWebView = {
            addOriginAccessWhitelistEntry: jasmine.createSpy()
        };
        webkitOriginAccess = require(LIB_PATH + "policy/webkitOriginAccess");
    });

    afterEach(function () {
        mockWebView = undefined;
        delete require.cache[require.resolve(LIB_PATH + "config")];
        delete require.cache[require.resolve(LIB_PATH + "policy/webkitOriginAccess")];
    });

    function mockConfig(mockAccessList, hasMultiAccess) {
        delete require.cache[require.resolve(LIB_PATH + "config")];
        delete require.cache[require.resolve(LIB_PATH + "policy/webkitOriginAccess")];
        var config = require(LIB_PATH + "config");
        config.accessList = mockAccessList;
        config.hasMultiAccess = !!hasMultiAccess;
        webkitOriginAccess = require(LIB_PATH + "policy/webkitOriginAccess");
    }

    describe("addWebview function", function () {

        it("exists", function () {
            expect(webkitOriginAccess.addWebView).toBeDefined();
        });

        it("sets up one time whitelisting", function () {
            webkitOriginAccess.addWebView(mockWebView);

            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(LOCAL_URI, FILE_URI, true);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(FILE_URI, LOCAL_URI, true);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(LOCAL_URI, WW_URI, true);
        });

        it("initializes the webview with whitelisting based on the config", function () {
            var mockAccessList = [
                {
                    uri : "http://google.com",
                    allowSubDomain : true,
                    features : null
                }
            ];
            mockConfig(mockAccessList);

            webkitOriginAccess.addWebView(mockWebView);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(LOCAL_URI, "http://google.com", true);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith("http://google.com", LOCAL_URI, true);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith("http://google.com", WW_URI, true);
        });

        it("initializes the webview with whitelisting based on what domains have been added", function () {
            var mockAccessList = [{
                    uri : "http://google.com",
                    allowSubDomain : true,
                    features : null
                }],
                url = "http://www.rim.com";

            mockConfig(mockAccessList, true);

            webkitOriginAccess.addOriginAccess(url, true);

            webkitOriginAccess.addWebView(mockWebView);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(LOCAL_URI, url, true);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(url, LOCAL_URI, true);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(url, "http://google.com", true);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith("http://google.com", url, true);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(url, WW_URI, true);
        });

        it("will not initialize twice", function () {
            var origCallCount;

            webkitOriginAccess.addWebView(mockWebView);
            origCallCount = mockWebView.addOriginAccessWhitelistEntry.callCount;
            webkitOriginAccess.addWebView(mockWebView);

            expect(mockWebView.addOriginAccessWhitelistEntry.callCount).toEqual(origCallCount);
        });

    });

    describe("addOriginAccess function", function () {
        it("exists", function () {
            expect(webkitOriginAccess.addOriginAccess).toBeDefined();
        });

        it("Treats falsey values as false", function () {
            var url = "http://www.rim.com";

            webkitOriginAccess.addWebView(mockWebView);
            webkitOriginAccess.addOriginAccess(url);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(LOCAL_URI, url, false);
        });

        it("Adds access for any non-local and non-file url", function () {
            var url = "http://www.rim.com/grrr/arrg/blah.htm";

            webkitOriginAccess.addWebView(mockWebView);
            webkitOriginAccess.addOriginAccess(url);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(LOCAL_URI, url, false);
        });

        //Because local:// is already a domain, the spy should not have no new calls
        it("Local uris are treated as local://", function () {
            var url = "local:///buy/local/beef/mmmmmmmmmmmmm/Steak.yum",
                origCallCount;

            webkitOriginAccess.addWebView(mockWebView);
            webkitOriginAccess.addOriginAccess(url);
            origCallCount = mockWebView.addOriginAccessWhitelistEntry.callCount;
            webkitOriginAccess.addOriginAccess(url);
            expect(mockWebView.addOriginAccessWhitelistEntry.callCount).toEqual(origCallCount);
        });

        it("File uris are treated as file://", function () {
            var url = "file:///buy/local/beef/mmmmmmmmmmmmm/Steak.yum",
                authority = "file://";

            webkitOriginAccess.addWebView(mockWebView);
            webkitOriginAccess.addOriginAccess(url);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(LOCAL_URI, authority, false);
        });

        it("updates all managed webviews of the new domain access", function () {
            var mockWebView2 = {
                    addOriginAccessWhitelistEntry: jasmine.createSpy()
                },
                url = "http://www.rim.com";

            webkitOriginAccess.addWebView(mockWebView);
            webkitOriginAccess.addWebView(mockWebView2);

            webkitOriginAccess.addOriginAccess(url, true);

            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(LOCAL_URI, url, true);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(url, LOCAL_URI, true);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(url, WW_URI, true);
            expect(mockWebView2.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(LOCAL_URI, url, true);
            expect(mockWebView2.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(url, LOCAL_URI, true);
            expect(mockWebView2.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(url, WW_URI, true);
        });

        it("updates all managed webviews when a new domain is added", function () {
            var mockAccessList = [{
                    uri : "http://google.com",
                    allowSubDomain : true,
                    features : null
                }],
                url = "http://www.rim.com";

            mockConfig(mockAccessList, true);

            webkitOriginAccess.addWebView(mockWebView);

            expect(mockWebView.addOriginAccessWhitelistEntry).not.toHaveBeenCalledWith(url, "http://google.com", true);
            expect(mockWebView.addOriginAccessWhitelistEntry).not.toHaveBeenCalledWith("http://google.com", url, true);

            webkitOriginAccess.addOriginAccess(url, true);

            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith(url, "http://google.com", true);
            expect(mockWebView.addOriginAccessWhitelistEntry).toHaveBeenCalledWith("http://google.com", url, true);
        });

    });

});
