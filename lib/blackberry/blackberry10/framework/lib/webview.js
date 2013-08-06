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

var networkResourceRequested = require('./webkitHandlers/networkResourceRequested'),
    utils = require('./utils'),
    config = require('./config'),
    webkitOriginAccess = require("./policy/webkitOriginAccess"),
    CHROME_HEIGHT = 0,
    OUT_OF_PROCESS = 1,
    webview,
    _webviewObj;

webview =
    {
    create: function (ready) {
        _webviewObj = window.qnx.webplatform.createWebView({processId: OUT_OF_PROCESS, defaultSendEventHandlers: ['onChooseFile', 'onOpenWindow'], defaultWebEventHandlers: ['InvokeRequestEvent']}, function () {
            //Create webkit event handlers
            var requestObj =  networkResourceRequested.createHandler(_webviewObj);

            //Bind networkResourceRequested event so that everything works
            _webviewObj.onNetworkResourceRequested = requestObj.networkResourceRequestedHandler;

            webkitOriginAccess.addWebView(_webviewObj);

            _webviewObj.visible = true;
            _webviewObj.active = true;
            _webviewObj.zOrder = 0;
            _webviewObj.setGeometry(0, CHROME_HEIGHT, screen.width, screen.height - CHROME_HEIGHT);

            if (typeof config.backgroundColor !== 'undefined') {
                _webviewObj.backgroundColor = config.backgroundColor;
            }

            if (typeof config.customHeaders !== 'undefined') {
                _webviewObj.extraHttpHeaders = config.customHeaders;
            }

            if (typeof config.userAgent !== 'undefined') {
                _webviewObj.userAgent = config.userAgent;
            }

            _webviewObj.autoDeferNetworkingAndJavaScript = config.autoDeferNetworkingAndJavaScript;

            /* Catch and trigger our custom HTML dialog */
            _webviewObj.allowWebEvent("DialogRequested");

            _webviewObj.addEventListener("DocumentLoadFinished", function () {
                // show app window if auto hide splash screen is true, OR splash screen is not specified
                // if auto hide is set to false explicitly but no splash screen is specified, should still show app window
                // otherwise the app cannot be launched
                if (config.autoHideSplashScreen || !config["rim:splash"]) {
                    window.qnx.webplatform.getApplication().windowVisible = true;
                }
            });


            if (ready && typeof ready === 'function') {
                ready();
            }

            window.qnx.webplatform.getController().dispatchEvent("webview.initialized", [_webviewObj]);

            // If content is not loaded, too bad open the visibility up.
            setTimeout(function () {
                if (config.autoHideSplashScreen || !config["rim:splash"]) {
                    window.qnx.webplatform.getApplication().windowVisible = true;
                }
            }, 2500);
        });

    },

    destroy: function () {
        _webviewObj.destroy();
    },

    setURL: function (url) {
        _webviewObj.url = url;
    },

    reload: function () {
        _webviewObj.reload();
    },

    executeJavascript: function (js) {
        _webviewObj.executeJavaScript(js);
    },

    addEventListener: function (eventName, callback) {
        _webviewObj.addEventListener(eventName, callback);
    },

    removeEventListener: function (eventName, callback) {
        _webviewObj.removeEventListener(eventName, callback);
    },

    windowGroup: function () {
        return _webviewObj.windowGroup;
    },

    getGeometry: function () {
        return this.geometry;
    },

    setGeometry: function (x, y, width, height) {
        this.geometry = {x: x, y: y, w: width, h: height};
        _webviewObj.setGeometry(x, y, width, height);
    },

    setApplicationOrientation: function (angle) {
        _webviewObj.setApplicationOrientation(angle);
    },

    setExtraPluginDirectory: function (directory) {
        _webviewObj.setExtraPluginDirectory(directory);
    },

    setEnablePlugins: function (enablePlugins) {
        _webviewObj.pluginsEnabled = enablePlugins;
    },

    getEnablePlugins: function () {
        return _webviewObj.pluginsEnabled;
    },

    notifyApplicationOrientationDone: function () {
        _webviewObj.notifyApplicationOrientationDone();
    },

    setSandbox: function (sandbox) {
        _webviewObj.setFileSystemSandbox = sandbox;
    },

    getSandbox: function () {
        return _webviewObj.setFileSystemSandbox;
    },

    downloadURL: function (url) {
        _webviewObj.downloadURL(url);
    },

    handleContextMenuResponse: function (action) {
        _webviewObj.handleContextMenuResponse(action);
    },

    allowGeolocation : function (url) {
        _webviewObj.allowGeolocation(url);
    },

    disallowGeolocation : function (url) {
        _webviewObj.disallowGeolocation(url);

    },

    addKnownSSLCertificate: function (url, certificateInfo) {
        _webviewObj.addKnownSSLCertificate(url, certificateInfo);
    },

    continueSSLHandshaking: function (streamId, SSLAction) {
        _webviewObj.continueSSLHandshaking(streamId, SSLAction);
    },

    getSensitivity: function () {
        return _webviewObj.getSensitivity();
    },

    setSensitivity: function (sensitivity) {
        return _webviewObj.setSensitivity(sensitivity);
    },

    getBackgroundColor: function () {
        return _webviewObj.getBackgroundColor();
    },

    setBackgroundColor: function (backgroundColor) {
        return _webviewObj.setBackgroundColor(backgroundColor);
    },

    getWebViewObj: function (webview) {
        return _webviewObj;
    },

    setUIWebViewObj: function (webviewObj) {
        _webviewObj.uiWebView = webviewObj;
    },

    allowUserMedia: function (evtId, cameraName) {
        _webviewObj.allowUserMedia(evtId, cameraName);
    },

    disallowUserMedia: function (evtId) {
        _webviewObj.disallowUserMedia(evtId);
    }
};

webview.__defineGetter__('id', function () {
    if (_webviewObj) {
        return _webviewObj.id;
    }
});

webview.__defineGetter__('enableCrossSiteXHR', function () {
    return _webviewObj.enableCrossSiteXHR;
});

webview.__defineSetter__('enableCrossSiteXHR', function (shouldEnable) {
    _webviewObj.enableCrossSiteXHR = !!shouldEnable;
});

webview.__defineGetter__('processId', function () {
    return _webviewObj.processId;
});

webview.__defineSetter__('onOpenWindow', function (input) {
    _webviewObj.onOpenWindow = input;
});

webview.__defineSetter__('onCloseWindow', function (input) {
    _webviewObj.onCloseWindow = input;
});

webview.__defineSetter__('onDestroyWindow', function (input) {
    _webviewObj.onDestroyWindow = input;
});

webview.__defineSetter__('onDialogRequested', function (input) {
    _webviewObj.onDialogRequested = input;
});

webview.__defineSetter__('onGeolocationPermissionRequest', function (input) {
    _webviewObj.onGeolocationPermissionRequest = input;
});

webview.__defineSetter__('onSSLHandshakingFailed', function (input) {
    _webviewObj.onSSLHandshakingFailed = input;
});

webview.__defineSetter__('onPropertyCurrentContextEvent', function (input) {
    _webviewObj.onPropertyCurrentContextEvent = input;
});

webview.__defineSetter__('onContextMenuRequestEvent', function (input) {
    _webviewObj.onContextMenuRequestEvent = input;
});

webview.__defineSetter__('onContextMenuCancelEvent', function (input) {
    _webviewObj.onContextMenuCancelEvent = input;
});

webview.__defineSetter__('onUserMediaRequest', function (input) {
    _webviewObj.onUserMediaRequest = input;
});

webview.__defineSetter__('onChildWindowOpen', function (input) {
    _webviewObj.onChildWindowOpen = input;
});

module.exports = webview;
