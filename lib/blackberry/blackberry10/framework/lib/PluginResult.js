/*
 * Copyright 2013 Research In Motion Limited.
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

function PluginResult (args, env) {

    var CALLBACK_STATUS_NO_RESULT = 0,
        CALLBACK_STATUS_OK = 1,
        CALLBACK_STATUS_ERROR = 9,
        callbackId = JSON.parse(decodeURIComponent(args.callbackId)),
        send = function (data) {
            env.response.send(200, encodeURIComponent(JSON.stringify(data)));
        },
        callback = function (success, status, data, keepCallback) {
            var executeString = "cordova.callbackFromNative('" + callbackId  + "', " +
                !!success + ", " + status + ", [" + data + "], " + !!keepCallback + ");";
            env.webview.executeJavaScript(executeString);
        };

    Object.defineProperty(this, "callbackId", {enumerable: true, value: callbackId});

    this.noResult = function (keepCallback) {
        send({ code: CALLBACK_STATUS_NO_RESULT, keepCallback: !!keepCallback });
    };

    this.error = function (msg, keepCallback) {
        send({ code: CALLBACK_STATUS_ERROR, msg: msg, keepCallback: !!keepCallback });
    };

    this.ok = function (data, keepCallback) {
        send({ code: CALLBACK_STATUS_OK, data: data, keepCallback: !!keepCallback });
    };

    this.callbackOk = function (data, keepCallback) {
        callback(true, CALLBACK_STATUS_OK, JSON.stringify(data), keepCallback);
    };

    this.callbackError = function (msg, keepCallback) {
        callback(false, CALLBACK_STATUS_ERROR, JSON.stringify(msg), keepCallback);
    };
}

window.PluginResult = PluginResult;
