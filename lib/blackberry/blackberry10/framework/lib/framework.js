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

var utils = require('./utils'),
    controllerWebView = require('./controllerWebView'),
    webview = require('./webview'),
    overlayWebView = require('./overlayWebView'),
    config = require("./config"),
    appEvents = require("./events/applicationEvents"),
    actionMap = {
        pause: {
            event: "inactive",
            trigger: function () {
                webview.executeJavascript("cordova.fireDocumentEvent('pause')");
            }
        },
        resume: {
            event: "active",
            trigger: function () {
                webview.executeJavascript("cordova.fireDocumentEvent('resume')");
            }
        }
    };

function addEvents() {
    for (var action in actionMap) {
        if (actionMap.hasOwnProperty(action)) {
            appEvents.addEventListener(actionMap[action].event, actionMap[action].trigger);
        }
    }
}

function removeEvents() {
    for (var action in actionMap) {
        if (actionMap.hasOwnProperty(action)) {
            appEvents.removeEventListener(actionMap[action].event, actionMap[action].trigger);
        }
    }
}

function showWebInspectorInfo() {
    var port = window.qnx.webplatform.getApplication().webInspectorPort,
        messageObj = {};

    qnx.webplatform.device.getNetworkInterfaces(function (networkInfo) {
        var connectedInterface;

        utils.forEach(networkInfo, function (info) {
            if (info && !connectedInterface) {
                connectedInterface = info;
            }
        }, this);

        messageObj.title = "Web Inspector Enabled";
        if (connectedInterface) {
            messageObj.htmlmessage =  "\n ip4:    " + connectedInterface.ipv4Address + ":" + port + "<br/> ip6:    " + connectedInterface.ipv6Address + ":" + port;
        } else {
            messageObj.message = "";
        }
        messageObj.dialogType = 'JavaScriptAlert';
        overlayWebView.showDialog(messageObj);
    });
}

var _self = {
    start: function (url) {
        var callback,
            showUrlCallback;

        // Set up the controller WebView
        controllerWebView.init(config);

        webview.create(function () {
            if (config.enableFlash) {
                //Set webview plugin directory [required for flash]
                webview.setExtraPluginDirectory('/usr/lib/browser/plugins');

                //Enable plugins for the webview [required for flash]
                webview.setEnablePlugins(true);

                //Enable flash for the childWebViews
                controllerWebView.onChildWebViewCreated = function (child) {
                    //Set webview plugin directory [required for flash]
                    child.setExtraPluginDirectory('/usr/lib/browser/plugins');

                    //Enable plugins for the webview [required for flash]
                    child.pluginsEnabled = true;
                };
            }

            if (!config.enableWebSecurity) {
                webview.enableCrossSiteXHR = true;
            }

            if (!config.enablePopupBlocker) {
                qnx.webplatform.nativeCall('webview.setBlockPopups', webview.id, false);
            }
            // Workaround for executeJavascript doing nothing for the first time

            webview.executeJavascript("1 + 1");

            url = url || config.content;

            showUrlCallback = function () {
                overlayWebView.removeEventListener("DocumentLoadFinished", showUrlCallback);
                showUrlCallback = null;

                // Start page
                if (url) {
                    webview.setURL(url);
                }
            };

            overlayWebView.create(function () {
                overlayWebView.addEventListener("DocumentLoadFinished", showUrlCallback);

                overlayWebView.setURL("local:///chrome/ui.html");
                overlayWebView.renderContextMenuFor(webview);
                overlayWebView.handleDialogFor(webview);
                controllerWebView.dispatchEvent('ui.init', null);
                webview.setUIWebViewObj(overlayWebView.getWebViewObj());
                if (config.enableChildWebView) {
                    overlayWebView.bindAppWebViewToChildWebViewControls(webview);
                } else {
                    webview.onChildWindowOpen = function (data) {
                        var parsedData = JSON.parse(data);
                        utils.invokeInBrowser(parsedData.url);
                    };
                }
                if (config.enableFormControl) {
                    overlayWebView.getWebViewObj().formcontrol.subscribeTo(webview);
                }
            });
        },
        {
            debugEnabled : config.debugEnabled
        });

        addEvents();

        //if debugging is enabled, show the IP and port for webinspector
        if (config.debugEnabled) {
            callback = function () {
                showWebInspectorInfo();

                //Remove listener. Alert should only be shown once.
                webview.removeEventListener("DocumentLoadFinished", callback);
            };

            webview.addEventListener("DocumentLoadFinished", callback);
        }
    },
    stop: function () {
        removeEvents();
        webview.destroy();
    }
};

module.exports = _self;
