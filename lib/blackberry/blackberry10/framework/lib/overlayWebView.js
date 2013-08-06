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

var CHROME_HEIGHT = 0,
    webview,
    _webviewObj;

webview =
    {

    create: function (ready, configSettings) {
        _webviewObj = window.qnx.webplatform.createUIWebView(function () {

            _webviewObj.visible = true;
            _webviewObj.active = true;
            _webviewObj.zOrder = 2;
            _webviewObj.enableCrossSiteXHR = true;
            _webviewObj.setGeometry(0, 0, screen.width, screen.height);
            _webviewObj.addEventListener("DocumentLoadFinished", function () {
                _webviewObj.default.setDefaultFont();
                _webviewObj.visible = true;
            });

            _webviewObj.allowRpc = true;
            _webviewObj.backgroundColor = 0x00FFFFFF;
            _webviewObj.sensitivity = "SensitivityTest";
            _webviewObj.devicePixelRatio = 1;
            _webviewObj.allowQnxObject = true;

            if (ready && typeof ready === 'function') {
                ready();
            }

            window.qnx.webplatform.getController().dispatchEvent("overlayWebView.initialized", [_webviewObj]);

        });
    },

    destroy: function () {
        _webviewObj.destroy();
    },

    setURL: function (url) {
        _webviewObj.url = url;
    },

    setGeometry: function (x, y, width, height) {
        _webviewObj.setGeometry(x, y, width, height);
    },

    setSensitivity : function (sensitivity) {
        _webviewObj.sensitivity = sensitivity;
    },

    setApplicationOrientation: function (angle) {
        _webviewObj.setApplicationOrientation(angle);
    },

    notifyApplicationOrientationDone: function () {
        _webviewObj.notifyApplicationOrientationDone();
    },

    executeJavascript: function (js) {
        _webviewObj.executeJavaScript(js);
    },

    windowGroup: function () {
        return _webviewObj.windowGroup;
    },

    notifyContextMenuCancelled: function () {
        _webviewObj.notifyContextMenuCancelled();
    },

    bindAppWebViewToChildWebViewControls: function (appWebView) {
        if (_webviewObj && _webviewObj.childwebviewcontrols) {
            _webviewObj.childwebviewcontrols.subscribeTo(appWebView);
        }
    },

    renderContextMenuFor: function (targetWebView) {
        return _webviewObj.contextMenu.subscribeTo(targetWebView);
    },

    handleDialogFor: function (targetWebView) {
        return _webviewObj.dialog.subscribeTo(targetWebView);
    },

    showDialog: function (description, callback) {
        return _webviewObj.dialog.show(description, callback);
    },

    getWebViewObj: function (webview) {
        return _webviewObj;
    },

    addEventListener: function (eventName, callback) {
        _webviewObj.addEventListener(eventName, callback);
    },

    removeEventListener: function (eventName, callback) {
        _webviewObj.removeEventListener(eventName, callback);
    },

    showToast : function (message, options) {
        return _webviewObj.toast.show(message, options);
    },

    showInvocationList: function (request, title, success, error) {
        _webviewObj.invocationlist.show(request, title, success, error);
    }
};

webview.__defineGetter__('id', function () {
    if (_webviewObj) {
        return _webviewObj.id;
    }
});

webview.__defineGetter__('zOrder', function () {
    return _webviewObj.zOrder;
});

webview.__defineGetter__('contextMenu', function () {
    if (_webviewObj) {
        return _webviewObj.contextMenu;
    }
});

module.exports = webview;
