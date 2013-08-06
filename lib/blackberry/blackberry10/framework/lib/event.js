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

var _handlers = {},
    _webview = require("./webview");

module.exports = {
    trigger: function (actionEvent) {
        var args = Array.prototype.slice.call(arguments),
            executeString = "webworks.event.trigger('" + actionEvent + "', '" + escape(encodeURIComponent(JSON.stringify(args.slice(1)))) + "')";

        if (_handlers.hasOwnProperty(actionEvent)) {
            _handlers[actionEvent].forEach(function (webview) {
                webview.executeJavaScript(executeString);
            });
        } else {
            //Just dump it in the content webview for consistency
            _webview.executeJavascript(executeString);
        }
    },

    add: function (action, webview) {
        var triggerEvent;

        if (action) {
            //Use action.event for old extensions that may not have triggerEvent defined
            triggerEvent = action.triggerEvent || action.event;

            if (!action.once) {
                action.context.addEventListener(action.event, action.trigger || this.trigger);
            }

            //If there are no registered listeners for this event, create an array to hold them
            if (!_handlers.hasOwnProperty(triggerEvent)) {
                _handlers[triggerEvent] = [];
            }
            //If the webview is not in the list of webviews listening to this action then add it
            if (!_handlers[triggerEvent].some(function (handlerWebView) {
                    return handlerWebView.id === webview.id;
                })) {
                _handlers[triggerEvent].push(webview);
            }

        } else {
            throw "Action is null or undefined";
        }
    },

    remove: function (action, webview) {
        if (action) {
            action.context.removeEventListener(action.event, action.trigger || this.trigger);

            //Remove the webview from the _handlers
            if (_handlers.hasOwnProperty(action.event)) {

                _handlers[action.event] = _handlers[action.event].filter(function (sourceWebview) {
                    return sourceWebview.id !== webview.id;
                });

                //If the array is empty delete it
                if (_handlers[action.event].length === 0) {
                    delete _handlers[action.event];
                }
            }

        } else {
            throw "Action is null or undefined";
        }

    }
};
