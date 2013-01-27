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
package org.apache.cordova.api;

import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Legacy Plugin class. This acts as a shim to support the old execute() signature.
 * New plugins should extend CordovaPlugin directly.
 */
@Deprecated
public abstract class Plugin extends CordovaPlugin {
    public LegacyContext    ctx;			        // LegacyContext object

    public abstract PluginResult execute(String action, JSONArray args, String callbackId);

    public boolean isSynch(String action) {
        return false;
    }
    
    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        this.setContext(cordova);
        this.setView(webView);
    }

    /**
     * Sets the context of the Plugin. This can then be used to do things like
     * get file paths associated with the Activity.
     *
     * @param ctx The context of the main Activity.
     */
    public void setContext(CordovaInterface ctx) {
        this.cordova = ctx;
        this.ctx = new LegacyContext(cordova);
    }

    /**
     * Sets the main View of the application, this is the WebView within which
     * a Cordova app runs.
     *
     * @param webView The Cordova WebView
     */
    public void setView(CordovaWebView webView) {
        this.webView = webView;
    }
    
    @Override
    public boolean execute(final String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        final String callbackId = callbackContext.getCallbackId();
        boolean runAsync = !isSynch(action);
        if (runAsync) {
            // Run this on a different thread so that this one can return back to JS
            cordova.getThreadPool().execute(new Runnable() {
                public void run() {
                    PluginResult cr;
                    try {
                        cr = execute(action, args, callbackId);
                    } catch (Throwable e) {
                        cr = new PluginResult(PluginResult.Status.ERROR, e.getMessage());
                    }
                    sendPluginResult(cr, callbackId);
                }
            });
        } else {
            PluginResult cr = execute(action, args, callbackId);
    
            // Interpret a null response as NO_RESULT, which *does* clear the callbacks on the JS side.
            if (cr == null) {
                cr = new PluginResult(PluginResult.Status.NO_RESULT);
            }
            
            callbackContext.sendPluginResult(cr);
        }
        return true;
    }

    /**
     * Send generic JavaScript statement back to JavaScript.
     * sendPluginResult() should be used instead where possible.
     */
    public void sendJavascript(String statement) {
        this.webView.sendJavascript(statement);
    }

    /**
     * Send generic JavaScript statement back to JavaScript.
     */
    public void sendPluginResult(PluginResult pluginResult, String callbackId) {
        this.webView.sendPluginResult(pluginResult, callbackId);
    }

    /**
     * Call the JavaScript success callback for this plugin.
     *
     * This can be used if the execute code for the plugin is asynchronous meaning
     * that execute should return null and the callback from the async operation can
     * call success(...) or error(...)
     *
     * @param pluginResult      The result to return.
     * @param callbackId        The callback id used when calling back into JavaScript.
     */
    public void success(PluginResult pluginResult, String callbackId) {
        this.webView.sendPluginResult(pluginResult, callbackId);
    }

    /**
     * Helper for success callbacks that just returns the Status.OK by default
     *
     * @param message           The message to add to the success result.
     * @param callbackId        The callback id used when calling back into JavaScript.
     */
    public void success(JSONObject message, String callbackId) {
        this.webView.sendPluginResult(new PluginResult(PluginResult.Status.OK, message), callbackId);
    }

    /**
     * Helper for success callbacks that just returns the Status.OK by default
     *
     * @param message           The message to add to the success result.
     * @param callbackId        The callback id used when calling back into JavaScript.
     */
    public void success(String message, String callbackId) {
        this.webView.sendPluginResult(new PluginResult(PluginResult.Status.OK, message), callbackId);
    }

    /**
     * Call the JavaScript error callback for this plugin.
     *
     * @param pluginResult      The result to return.
     * @param callbackId        The callback id used when calling back into JavaScript.
     */
    public void error(PluginResult pluginResult, String callbackId) {
        this.webView.sendPluginResult(pluginResult, callbackId);
    }

    /**
     * Helper for error callbacks that just returns the Status.ERROR by default
     *
     * @param message           The message to add to the error result.
     * @param callbackId        The callback id used when calling back into JavaScript.
     */
    public void error(JSONObject message, String callbackId) {
        this.webView.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, message), callbackId);
    }

    /**
     * Helper for error callbacks that just returns the Status.ERROR by default
     *
     * @param message           The message to add to the error result.
     * @param callbackId        The callback id used when calling back into JavaScript.
     */
    public void error(String message, String callbackId) {
        this.webView.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, message), callbackId);
    }

}
