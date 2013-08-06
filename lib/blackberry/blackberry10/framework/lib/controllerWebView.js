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

var controllerWebView,
    overlayWebView = require("./overlayWebView"),
    controller,
    invocation,
    utils;

controllerWebView = {
    init: function (config) {
        controller = window.qnx.webplatform.getController();
        invocation = window.qnx.webplatform.getApplication().invocation;
        utils = require('./utils');
        controller.enableWebInspector = config.debugEnabled;
        controller.enableCrossSiteXHR = true;
        controller.visible = false;
        controller.active = false;
        controller.setGeometry(0, 0, screen.width, screen.height);
        controller.setFileSystemSandbox = false;

        /* Remote functions that are published to allow communication with
         * the overlay webview, they are called via the RPC bridge
         */
        controller.publishRemoteFunction('webview.setSensitivity', function (args) {
            var sensitivityType = args[0];
            overlayWebView.setSensitivity(sensitivityType);
        });

        controller.publishRemoteFunction('webview.notifyContextMenuCancelled', function () {
            overlayWebView.notifyContextMenuCancelled();
        });
    },

    setGeometry: function (x, y, width, height) {
        controller.setGeometry(x, y, width, height);
    },

    setApplicationOrientation: function (angle) {
        controller.setApplicationOrientation(angle);
    },

    notifyApplicationOrientationDone: function () {
        controller.notifyApplicationOrientationDone();
    },

    dispatchEvent: function (eventType, args) {
        controller.dispatchEvent(eventType, args);
    }
};

controllerWebView.__defineGetter__('id', function () {
    return controller.id;
});

controllerWebView.__defineSetter__('onChildWebViewCreated', function (input) {
    controller.onChildWebViewCreated = input;
});
module.exports = controllerWebView;
