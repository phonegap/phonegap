/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/
package org.apache.cordova;

import android.webkit.JavascriptInterface;
import org.apache.cordova.api.PluginManager;
import org.apache.cordova.api.PluginResult;
import org.json.JSONException;

/**
 * Contains APIs that the JS can call. All functions in here should also have
 * an equivalent entry in CordovaChromeClient.java, and be added to
 * cordova-js/lib/android/plugin/android/promptbasednativeapi.js
 */
/* package */ class ExposedJsApi {
    
    private PluginManager pluginManager;
    private NativeToJsMessageQueue jsMessageQueue;
    
    public ExposedJsApi(PluginManager pluginManager, NativeToJsMessageQueue jsMessageQueue) {
        this.pluginManager = pluginManager;
        this.jsMessageQueue = jsMessageQueue;
    }

    @JavascriptInterface
    public String exec(String service, String action, String callbackId, String arguments) throws JSONException {
        jsMessageQueue.setPaused(true);
        try {
            boolean wasSync = pluginManager.exec(service, action, callbackId, arguments);
            String ret = "";
            if (!NativeToJsMessageQueue.DISABLE_EXEC_CHAINING || wasSync) {
                ret = jsMessageQueue.popAndEncode();
            }
            return ret;
        } finally {
            jsMessageQueue.setPaused(false);
        }
    }
    
    @JavascriptInterface
    public void setNativeToJsBridgeMode(int value) {
        jsMessageQueue.setBridgeMode(value);
    }
    
    @JavascriptInterface
    public String retrieveJsMessages() {
        return jsMessageQueue.popAndEncode();
    }
}
