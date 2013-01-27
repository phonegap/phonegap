package org.apache.cordova.api;

import org.json.JSONArray;

import android.util.Log;

import org.apache.cordova.CordovaWebView;
import org.json.JSONObject;

public class CallbackContext {
    private static final String LOG_TAG = "CordovaPlugin";

    private String callbackId;
    private CordovaWebView webView;
    private boolean finished;
    private int changingThreads;

    public CallbackContext(String callbackId, CordovaWebView webView) {
        this.callbackId = callbackId;
        this.webView = webView;
    }
    
    public boolean isFinished() {
        return finished;
    }
    
    public boolean isChangingThreads() {
        return changingThreads > 0;
    }
    
    public String getCallbackId() {
        return callbackId;
    }

    public void sendPluginResult(PluginResult pluginResult) {
        synchronized (this) {
            if (finished) {
                Log.w(LOG_TAG, "Attempted to send a second callback for ID: " + callbackId + "\nResult was: " + pluginResult.getMessage());
                return;
            } else {
                finished = !pluginResult.getKeepCallback();
            }
        }
        webView.sendPluginResult(pluginResult, callbackId);
    }

    /**
     * Helper for success callbacks that just returns the Status.OK by default
     *
     * @param message           The message to add to the success result.
     */
    public void success(JSONObject message) {
        sendPluginResult(new PluginResult(PluginResult.Status.OK, message));
    }

    /**
     * Helper for success callbacks that just returns the Status.OK by default
     *
     * @param message           The message to add to the success result.
     */
    public void success(String message) {
        sendPluginResult(new PluginResult(PluginResult.Status.OK, message));
    }

    /**
     * Helper for success callbacks that just returns the Status.OK by default
     *
     * @param message           The message to add to the success result.
     */
    public void success(JSONArray message) {
        sendPluginResult(new PluginResult(PluginResult.Status.OK, message));
    }

    /**
     * Helper for success callbacks that just returns the Status.OK by default
     *
     * @param message           The message to add to the success result.
     */
    public void success(byte[] message) {
        sendPluginResult(new PluginResult(PluginResult.Status.OK, message));
    }

    /**
     * Helper for success callbacks that just returns the Status.OK by default
     *
     * @param message           The message to add to the success result.
     */
    public void success() {
        sendPluginResult(new PluginResult(PluginResult.Status.OK));
    }

    /**
     * Helper for error callbacks that just returns the Status.ERROR by default
     *
     * @param message           The message to add to the error result.
     */
    public void error(JSONObject message) {
        sendPluginResult(new PluginResult(PluginResult.Status.ERROR, message));
    }

    /**
     * Helper for error callbacks that just returns the Status.ERROR by default
     *
     * @param message           The message to add to the error result.
     * @param callbackId        The callback id used when calling back into JavaScript.
     */
    public void error(String message) {
        sendPluginResult(new PluginResult(PluginResult.Status.ERROR, message));
    }

    /**
     * Helper for error callbacks that just returns the Status.ERROR by default
     *
     * @param message           The message to add to the error result.
     * @param callbackId        The callback id used when calling back into JavaScript.
     */
    public void error(int message) {
        sendPluginResult(new PluginResult(PluginResult.Status.ERROR, message));
    }
}
